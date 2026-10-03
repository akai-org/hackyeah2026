// Zdarzenia analityczne → POST /api/events (statystyki w /admin/zaangazowanie).
// Fire-and-forget: keepalive pozwala wysłać klik w link tuż przed przejściem na inną stronę.

import { API_URL, readSessionCookie } from "@/lib/api";

export type CardSource = "wyniki" | "mapa" | "biblioteka" | "forum" | "inne";
export type CtaButton = "wdrozenie" | "zostan_testerem" | "zrodlo" | "materialy" | "film" | "forum" | "zobacz_karte";

type TrackEvent =
  | { type: "innovation_view"; innovationId: number; meta?: { source?: string } }
  | { type: "card_click"; innovationId: number; meta: { source: CardSource; position?: number } }
  | { type: "cta_click"; innovationId: number; meta: { button: CtaButton } };

const ANON_KEY = "hubmi-anon-id";

/** Losowy identyfikator przeglądarki — do liczenia unikalnych osób, bez danych osobowych. */
function anonId(): string | null {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function track(event: TrackEvent) {
  if (typeof window === "undefined") return;
  const token = readSessionCookie();
  fetch(`${API_URL}/api/events`, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json", ...(token ? { "X-Session-Token": token } : {}) },
    body: JSON.stringify({
      type: event.type,
      innovation_id: event.innovationId,
      anon_id: anonId(),
      meta: event.meta ?? {},
    }),
  }).catch(() => {
    // Statystyki nie mogą przeszkadzać użytkownikowi.
  });
}
