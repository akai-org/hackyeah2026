"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch, readSessionCookie, writeSessionCookie } from "@/lib/api";
import type { Role } from "@/data/mock";

// Logowanie bez hasła (CONTEXT.md): użytkownik wybiera rolę, backend wydaje token sesji,
// token żyje w cookie "findinv_session" i idzie do API w nagłówku X-Session-Token. Gdy backend nie odpowiada (np. auth jeszcze nie wdrożony),
// sesja działa lokalnie w przeglądarce, żeby demo nie stanęło.

export type User = {
  id: number | string;
  name: string;
  role: Role;
};

type AuthStatus = "loading" | "ready";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  /** true, gdy sesja jest tylko w przeglądarce, bo backend nie odpowiedział. */
  offline: boolean;
  login: (role: Role, name?: string) => Promise<User>;
  logout: () => void;
  setRole: (role: Role) => Promise<void>;
  loginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
};

const OFFLINE_PREFIX = "offline-";
const OFFLINE_STORAGE_KEY = "findinv-sesja-offline";
const DEFAULT_NAME = "Gość";

function readOfflineUser(): User | null {
  try {
    const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function saveOfflineUser(user: User | null) {
  try {
    if (user) localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(OFFLINE_STORAGE_KEY);
  } catch {
    // Brak pamięci przeglądarki: sesja przetrwa do odświeżenia strony.
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [offline, setOffline] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // Przy starcie: kto jest zalogowany (GET /api/auth/me).
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const token = readSessionCookie();
      if (!token) return null;
      if (token.startsWith(OFFLINE_PREFIX)) {
        setOffline(true);
        return readOfflineUser();
      }
      try {
        return await apiFetch<User>("/api/auth/me");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          writeSessionCookie(null);
          return null;
        }
        // Backend niedostępny: zostaje to, co wiemy z ostatniego logowania.
        setOffline(true);
        return readOfflineUser();
      }
    }

    restore().then((restored) => {
      if (cancelled) return;
      setUser(restored);
      setStatus("ready");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (role: Role, name?: string) => {
    const displayName = name?.trim() || DEFAULT_NAME;
    let next: User;

    try {
      const session = await apiFetch<{ session_token: string; role: Role }>("/api/auth/session", {
        method: "POST",
        body: JSON.stringify({ name: displayName, role }),
      });
      writeSessionCookie(session.session_token);
      next = await apiFetch<User>("/api/auth/me").catch(() => ({ id: "?", name: displayName, role: session.role }));
      setOffline(false);
    } catch {
      next = { id: OFFLINE_PREFIX + crypto.randomUUID(), name: displayName, role };
      writeSessionCookie(String(next.id));
      setOffline(true);
    }

    // Kopia w przeglądarce przydaje się, gdy backend zniknie w trakcie demo.
    saveOfflineUser(next);
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    writeSessionCookie(null);
    saveOfflineUser(null);
    setUser(null);
    setOffline(false);
  }, []);

  const setRole = useCallback(
    async (role: Role) => {
      if (!user) return;
      if (!offline) {
        await apiFetch<{ role: Role }>("/api/auth/set-role", { method: "POST", body: JSON.stringify({ role }) });
      }
      const next = { ...user, role };
      saveOfflineUser(next);
      setUser(next);
    },
    [user, offline],
  );

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);

  const value = useMemo(
    () => ({ user, status, offline, login, logout, setRole, loginOpen, openLogin, closeLogin }),
    [user, status, offline, login, logout, setRole, loginOpen, openLogin, closeLogin],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error("useAuth musi być użyty wewnątrz AuthProvider");
  return context;
}
