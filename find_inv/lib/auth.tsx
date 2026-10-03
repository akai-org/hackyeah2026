"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";

export type Role = "user" | "tester" | "consultant" | "admin";

export interface AuthUser {
  id: number;
  name: string;
  role: Role;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  openLogin: () => void;
  logout: () => void;
  setUser: (u: AuthUser | null) => void;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  openLogin: () => {},
  logout: () => {},
  setUser: () => {},
});

const ROLE_LABELS: Record<Role, string> = {
  user: "Mieszkaniec",
  tester: "Tester",
  consultant: "Konsultant",
  admin: "Administrator",
};

const DEFAULT_NAMES: Record<Role, string> = {
  user: "Mieszkaniec",
  tester: "Tester",
  consultant: "Konsultant",
  admin: "Admin",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/auth/me`, {
      credentials: "include",
    })
      .then((r) => r.ok ? r.json() : null)
      .then((j) => j?.data ? setUserState(j.data) : null)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (modalOpen) {
      d.showModal();
      setTimeout(() => nameRef.current?.focus(), 50);
    } else {
      d.close();
    }
  }, [modalOpen]);

  const setUser = useCallback((u: AuthUser | null) => setUserState(u), []);

  async function loginAs(role: Role) {
    try {
      const name = nameInput.trim() || DEFAULT_NAMES[role];
      const data = await apiPost<AuthUser & { session_token: string }>("/api/auth/session", {
        name,
        role,
      });
      document.cookie = `session=${data.session_token}; path=/; samesite=lax`;
      setUserState({ id: data.id, name: data.name, role: data.role });
      setModalOpen(false);
      setNameInput("");
    } catch {
      /* ignore */
    }
  }

  function logout() {
    document.cookie = "session=; max-age=0; path=/";
    setUserState(null);
  }

  return (
    <Ctx.Provider value={{ user, loading, openLogin: () => setModalOpen(true), logout, setUser }}>
      {children}

      {/* Login modal */}
      <dialog
        ref={dialogRef}
        onClose={() => setModalOpen(false)}
        className="w-full max-w-sm rounded-ui border-(length:--bw) border-deep bg-surface p-8 shadow-paper backdrop:bg-ink/40"
      >
        <div className="flex items-center justify-between">
          <h2 id="login-tytul" className="text-xl font-bold text-deep">Zaloguj się</h2>
          <button
            onClick={() => setModalOpen(false)}
            aria-label="Zamknij"
            className="inline-flex size-10 items-center justify-center rounded-ui hover:bg-sage"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">Tryb demo — wybierz rolę i wpisz swoje imię (opcjonalnie).</p>

        <div className="mt-5">
          <label htmlFor="login-imie" className="block text-sm font-bold text-deep">
            Imię (opcjonalne)
          </label>
          <input
            ref={nameRef}
            id="login-imie"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="np. Anna"
            className="mt-1 w-full rounded-ui border-(length:--bw) border-deep bg-paper px-4 py-2 text-base"
          />
        </div>

        <p className="mt-5 text-sm font-bold text-deep">Wybierz rolę</p>
        <ul className="mt-2 flex flex-col gap-2">
          {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([role, label]) => (
            <li key={role}>
              <Button
                variant={role === "admin" ? "primary" : "secondary"}
                className="w-full justify-start"
                onClick={() => loginAs(role)}
              >
                {label}
              </Button>
            </li>
          ))}
        </ul>
      </dialog>
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}

export const ROLE_BADGE: Record<Role, { label: string; className: string }> = {
  user: { label: "Mieszkaniec", className: "bg-sage text-deep" },
  tester: { label: "Tester", className: "bg-butter text-ink" },
  consultant: { label: "Konsultant", className: "bg-mint text-deep" },
  admin: { label: "Admin", className: "bg-deep text-surface" },
};
