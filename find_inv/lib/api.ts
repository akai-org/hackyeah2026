// Klient API backendu FastAPI. Odpowiedzi mają kształt { data, error }.

import { readLocaleCookie } from "@/lib/i18n/config";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Inna nazwa niż cookie "session" z backendu: tamto jest HttpOnly, a na tym samym hoście (localhost, deploy
// na jednej domenie) przeglądarka nie pozwala go nadpisać z JS — sesja znikała po odświeżeniu strony.
export const SESSION_COOKIE = "findinv_session";

export type ApiResponse<T> = { data: T; error: null } | { data: null; error: string };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function readSessionCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function writeSessionCookie(token: string | null) {
  if (token) {
    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
}

/**
 * Wywołanie API z tokenem sesji w nagłówku (cookie z localhost:3000 nie zawsze trafia do :8000).
 * Rzuca ApiError przy błędzie HTTP albo polu `error`, TypeError przy braku połączenia.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = readSessionCookie();
  const headers = new Headers(init.headers);
  if (token) headers.set("X-Session-Token", token);
  // Backend odpowiada (LLM) w języku interfejsu.
  headers.set("X-Lang", readLocaleCookie());
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !body || body.error) {
    throw new ApiError(body?.error ?? `HTTP ${response.status}`, response.status);
  }
  return body.data as T;
}

// ---------- zgodność z modułami A1 (panel pomysłów, Middleman modal) ----------

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

/** POST + strumień SSE (`data: ...\n\n`, koniec `data: [DONE]`). Zwraca funkcję przerywającą. */
export function apiStream(path: string, body: unknown, onChunk: (chunk: string) => void): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const token = readSessionCookie();
      const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Lang": readLocaleCookie(),
          ...(token ? { "X-Session-Token": token } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") return;
            onChunk(chunkText(data));
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error("stream error", e);
    }
  })();

  return () => controller.abort();
}

/** Matchmaking wysyła `{"content": "..."}` (nowe linie nie łamią SSE); goły tekst też przyjmujemy. */
function chunkText(data: string): string {
  try {
    const parsed: unknown = JSON.parse(data);
    if (parsed && typeof parsed === "object" && typeof (parsed as { content?: unknown }).content === "string") {
      return (parsed as { content: string }).content;
    }
  } catch {
    // Zwykły tekst, nie JSON.
  }
  return data;
}
