// Klient API matchmakingu (FastAPI, find_inv_server/app/routers/matchmaking.py).
// Osobny plik od lib/api.ts (auth, A4), żeby moduły nie kolidowały.
// Odpowiedzi mają kształt { data, error }, czat przychodzi jako SSE zakończone "data: [DONE]".

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Zamknięta taksonomia: musi zgadzać się z TAXONOMY_TAGS w find_inv_server/app/utils.py.
export const TAXONOMY_TAGS = [
  "seniorzy",
  "wykluczenie_cyfrowe",
  "samotność",
  "zdrowie_psychiczne",
  "niepełnosprawność",
  "ubóstwo",
  "dzieci",
  "młodzież",
  "rodzina",
  "bezdomność",
  "uzależnienia",
  "migranci",
  "wolontariat",
  "edukacja",
  "rynek_pracy",
  "dostępność",
  "transport",
  "gmina_wiejska",
  "gmina_miejska",
  "NGO",
  "samorząd",
  "DPS",
  "OPS",
  "CUS",
  "inkubator",
] as const;

export function tagLabel(tag: string) {
  return tag.replaceAll("_", " ");
}

export type TagResult = {
  tags: string[];
  area: string | null;
  target_group: string | null;
  location: string | null;
  type: string | null;
  is_relevant: boolean;
};

export type CostLevel = "low" | "medium" | "high";

export type MatchedInnovation = {
  id: number;
  title: string;
  short_desc: string;
  full_desc: string;
  category: string | null;
  area: string | null;
  target_group: string | null;
  location: string | null;
  status: string;
  cost_level: CostLevel | null;
  implementation_time_months: number | null;
  testers_count: number | null;
  where_implemented: string | null;
  source_url: string | null;
  tags: string[];
  match_score: number;
  is_unmaintained: boolean;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

type Envelope<T> = { data: T | null; error: string | null };

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = (await response.json()) as Envelope<T>;
  if (json.error || json.data === null) throw new Error(json.error ?? "Pusta odpowiedź");
  return json.data;
}

export function tagProblem(text: string, signal?: AbortSignal) {
  return post<TagResult>("/api/tag", { text }, signal);
}

export function matchInnovations(text: string, tags: string[], signal?: AbortSignal) {
  return post<{ innovations: MatchedInnovation[]; total_found: number }>("/api/match", { text, tags }, signal);
}

/** Poprawia transkrypcję z dyktowania. Przy błędzie zwraca tekst bez zmian. */
export async function fixTranscript(transcript: string): Promise<string> {
  try {
    const data = await post<{ corrected: string; confidence: number }>("/api/voice-fix", { transcript });
    return data.corrected || transcript;
  } catch {
    return transcript;
  }
}

/** Zgłoszenie potrzeby do Zasobnika (POST /api/needs) — trafia do trendów admina jako luka. */
export async function reportNeed(description: string) {
  const response = await fetch(`${API_URL}/api/needs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: description.slice(0, 2000), reporter_type: "resident" }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

/** Strumieniuje odpowiedź czatu. `onChunk` dostaje kolejne kawałki tekstu. */
export async function streamChat(
  messages: ChatMessage[],
  innovationIds: number[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ messages, innovation_ids: innovationIds }),
    signal,
  });
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const event = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      // Wiele linii "data:" w jednym zdarzeniu skleja się znakiem nowej linii (specyfikacja SSE).
      const payload = event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(line.startsWith("data: ") ? 6 : 5))
        .join("\n");
      if (payload === "[DONE]") return;
      onChunk(chunkText(payload));
    }
  }
}

/** Backend wysyła `{"content": "..."}`; goły tekst też przyjmujemy. */
function chunkText(payload: string): string {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (parsed && typeof parsed === "object" && typeof (parsed as { content?: unknown }).content === "string") {
      return (parsed as { content: string }).content;
    }
  } catch {
    // Zwykły tekst, nie JSON.
  }
  return payload;
}
