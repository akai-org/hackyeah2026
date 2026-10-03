// Klient API backendu FastAPI. Odpowiedzi mają kształt { data, error }.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const SESSION_COOKIE = "session";

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
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !body || body.error) {
    throw new ApiError(body?.error ?? `HTTP ${response.status}`, response.status);
  }
  return body.data as T;
}
