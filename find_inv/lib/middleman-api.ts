// Middleman AI: /api/middleman/start (JSON) i /api/middleman/answer (SSE z obiektami JSON).

import { API_URL, apiFetch, readSessionCookie } from "@/lib/api";
import { readLocaleCookie } from "@/lib/i18n/config";

export type PlanPhase = { label: string; items: string[] };

export type MiddlemanPlan = {
  goal?: string;
  staff_needed: string;
  estimated_cost: string;
  location_suggestions: string;
  steps: string[];
  phases?: PlanPhase[];
  timeline: string;
  funding_hints: string;
  risks?: string[];
  missing?: string[];
  source?: { innovation_id?: number | string | null; title?: string; where_implemented?: string | null };
};

export type StartResult = {
  session_id: string;
  first_question: string;
  question_index: number;
  max_questions: number;
  innovation: { id: number | string | null; title: string; short_desc?: string };
  mode: "llm" | "local";
};

export type StartBody = {
  innovation_id?: number | string | null;
  innovation_title?: string;
  innovation_desc?: string;
  problem_desc: string;
  institution?: string;
};

export type MiddlemanEvent =
  | { type: "delta"; content: string }
  | { type: "question"; content: string; index: number; max_questions: number }
  | { type: "plan"; content: MiddlemanPlan }
  | { type: "error"; content: string };

export function startMiddleman(body: StartBody) {
  return apiFetch<StartResult>("/api/middleman/start", { method: "POST", body: JSON.stringify(body) });
}

/** Wysyła odpowiedź i przekazuje kolejne zdarzenia SSE do `onEvent`. */
export async function answerMiddleman(
  body: { session_id: string; answer?: string; finish?: boolean },
  onEvent: (event: MiddlemanEvent) => void,
  signal?: AbortSignal,
) {
  const headers = new Headers({ "Content-Type": "application/json", "X-Lang": readLocaleCookie() });
  const token = readSessionCookie();
  if (token) headers.set("X-Session-Token", token);

  const response = await fetch(`${API_URL}/api/middleman/answer`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    credentials: "include",
    signal,
  });
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    // Zdarzenia SSE rozdziela pusta linia; wieloliniowe `data:` sklejamy "\n".
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const raw = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = raw
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(/^ /, ""))
        .join("\n");
      if (data && data !== "[DONE]") {
        try {
          onEvent(JSON.parse(data) as MiddlemanEvent);
        } catch {
          onEvent({ type: "delta", content: data });
        }
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
}
