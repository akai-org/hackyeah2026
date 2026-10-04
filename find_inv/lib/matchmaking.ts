import { API_URL, apiFetch } from "@/lib/api";
import { chunkText, fakeStream, postSse } from "@/lib/sse";
import { TAG_KEYWORDS, TAG_LABELS, TAXONOMY_TAGS, type Tag } from "@/data/mock";
import { COST_LABELS, MOCK_INNOVATIONS, type InnovationCard } from "@/data/innovations";

// Matchmaking (CONTEXT.md, moduł 1): /api/tag → /api/match → /api/chat.
// Każde wywołanie ma zapas w danych mock, żeby demo działało także bez backendu.

export type TagResult = {
  tags: Tag[];
  area?: string | null;
  target_group?: string | null;
  location?: string | null;
  type?: string;
  is_relevant?: boolean;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

const KNOWN_TAGS = new Set<string>(TAXONOMY_TAGS);

export function isTag(value: string): value is Tag {
  return KNOWN_TAGS.has(value);
}

/** Lokalny autotagger: słowa kluczowe → tagi z zamkniętej taksonomii. */
export function localTags(text: string): Tag[] {
  const lower = text.toLowerCase();
  return [...new Set(TAG_KEYWORDS.filter(([pattern]) => pattern.test(lower)).map(([, tag]) => tag))];
}

export async function tagProblem(text: string): Promise<TagResult> {
  try {
    const result = await apiFetch<TagResult>("/api/tag", { method: "POST", body: JSON.stringify({ text }) });
    return { ...result, tags: (result.tags ?? []).filter(isTag) };
  } catch {
    const tags = localTags(text);
    return { tags, is_relevant: tags.length > 0 || text.trim().split(/\s+/).length >= 4 };
  }
}

/** Ranking jak w backendzie: podobieństwo + 0,1 za każdy wspólny tag. Lokalnie podobieństwo = trafienia słów. */
function localMatch(text: string, tags: string[], limit: number): InnovationCard[] {
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 3);
  const query = new Set(tags);

  return MOCK_INNOVATIONS.map((innovation) => {
    const haystack =
      `${innovation.title} ${innovation.short_desc} ${innovation.full_desc} ${innovation.target_group}`.toLowerCase();
    const hits = words.filter((word) => haystack.includes(word.slice(0, Math.max(4, word.length - 2)))).length;
    const overlap = innovation.tags.filter((tag) => query.has(tag)).length;
    const score = Math.min(0.97, 0.45 + 0.06 * hits + 0.1 * overlap);
    return { ...innovation, match_score: Number(score.toFixed(2)) };
  })
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, limit);
}

export async function matchInnovations(
  text: string,
  tags: string[],
  limit = 5,
  /** `log: false` — podpowiedzi na żywo (kreator) nie trafiają do trendów wyszukiwań. */
  options: { log?: boolean } = {},
): Promise<{ innovations: InnovationCard[]; total_found: number }> {
  try {
    const result = await apiFetch<{ innovations: InnovationCard[]; total_found?: number }>("/api/match", {
      method: "POST",
      body: JSON.stringify({ text, tags, limit, log: options.log ?? true }),
    });
    return { innovations: result.innovations, total_found: result.total_found ?? result.innovations.length };
  } catch {
    const innovations = localMatch(text, tags, limit);
    return { innovations, total_found: MOCK_INNOVATIONS.length };
  }
}

export async function getInnovation(id: number): Promise<InnovationCard | null> {
  try {
    return await apiFetch<InnovationCard>(`/api/innovations/${id}`);
  } catch {
    return MOCK_INNOVATIONS.find((innovation) => innovation.id === id) ?? null;
  }
}

function localChatAnswer(question: string, innovations: InnovationCard[]): string {
  const lower = question.toLowerCase();
  const top = innovations[0];
  if (!top) return "Nie mam jeszcze wyników, o które można zapytać. Opisz problem i kliknij „Szukaj”.";

  if (/koszt|ile kosztuje|pieni|budżet|finans/.test(lower)) {
    const lines = innovations
      .slice(0, 3)
      .map(
        (item) =>
          `• ${item.title}: ${item.cost_level ? COST_LABELS[item.cost_level].toLowerCase() : "koszt do sprawdzenia"}`,
      );
    return `Najtańsze w starcie są rozwiązania oparte na wolontariacie.\n${lines.join("\n")}\nNa finansowanie warto sprawdzić FIO, PFRON i środki gminne.`;
  }
  if (/gdzie|kto|wdroż|działa/.test(lower)) {
    return `„${top.title}” działa już w: ${top.where_implemented ?? "kilku gminach Małopolski"}. Kliknij „Jak to wdrożyć?” przy karcie, a przygotuję szkic planu dla Twojej instytucji.`;
  }
  const tags = top.tags
    .filter(isTag)
    .slice(0, 3)
    .map((tag) => TAG_LABELS[tag].toLowerCase());
  return `Najlepiej pasuje „${top.title}”: ${top.short_desc.toLowerCase()}. Odpowiada na ${tags.join(", ")}. ${top.full_desc ?? ""} Zapytaj o koszty, czas wdrożenia albo o to, gdzie już działa.`;
}

/** Odpowiedź czatu RAG jako strumień fragmentów tekstu. */
export async function* streamChat(
  messages: ChatMessage[],
  tags: string[],
  innovations: InnovationCard[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  let received = false;
  try {
    for await (const data of postSse(
      "/api/chat",
      { messages, tags, context_innovation_ids: innovations.map((item) => item.id) },
      signal,
    )) {
      received = true;
      yield chunkText(data);
    }
    if (received) return;
  } catch (error) {
    if (signal?.aborted) return;
    // Przerwany w połowie strumień nie przechodzi na odpowiedź zapasową, żeby nie mieszać dwóch tekstów.
    if (received) throw error;
  }
  const last = [...messages].reverse().find((message) => message.role === "user");
  yield* fakeStream(localChatAnswer(last?.content ?? "", innovations), signal);
}

/** Poprawia transkrypcję z dyktowania (POST /api/voice-fix). Przy błędzie zwraca tekst bez zmian. */
export type TranscriptCorrection = { corrected: string; condensed: boolean };

/** Poprawka dyktowania z informacją, czy backend skrócił wypowiedź do sedna (`condense`). */
export async function correctTranscript(transcript: string, condense = false): Promise<TranscriptCorrection> {
  try {
    const result = await apiFetch<{ corrected: string; condensed?: boolean }>("/api/voice-fix", {
      method: "POST",
      body: JSON.stringify({ transcript, condense }),
    });
    return { corrected: result.corrected || transcript, condensed: Boolean(result.condensed) };
  } catch {
    return { corrected: transcript, condensed: false };
  }
}

export async function fixTranscript(transcript: string): Promise<string> {
  try {
    const result = await apiFetch<{ corrected: string; confidence: number }>("/api/voice-fix", {
      method: "POST",
      body: JSON.stringify({ transcript }),
    });
    return result.corrected || transcript;
  } catch {
    return transcript;
  }
}

/** Zgłoszenie potrzeby do Zasobnika (POST /api/needs) — admin widzi je jako lukę w ofercie innowacji. */
export async function reportNeed(description: string): Promise<void> {
  // /api/needs zwraca sam obiekt (bez koperty { data, error }), więc zwykły fetch zamiast apiFetch.
  const response = await fetch(`${API_URL}/api/needs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: description.slice(0, 2000), reporter_type: "resident" }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}
