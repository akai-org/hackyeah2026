import { API_URL, readSessionCookie } from "@/lib/api";

// Strumień SSE z backendu: linie `data: {chunk}`, zdarzenia rozdzielone pustą linią, koniec `data: [DONE]`.
// EventSource nie umie POST, dlatego czytamy odpowiedź fetch ręcznie.

export async function* postSse(path: string, body: unknown, signal?: AbortSignal): AsyncGenerator<string> {
  const headers = new Headers({ "Content-Type": "application/json", Accept: "text/event-stream" });
  const token = readSessionCookie();
  if (token) headers.set("X-Session-Token", token);

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    credentials: "include",
    signal,
  });
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value.replace(/\r\n/g, "\n");

    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) >= 0) {
      const event = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(/^ /, ""))
        .join("\n");
      if (!data) continue;
      if (data === "[DONE]") return;
      yield data;
    }
  }
}

/** Fragment czatu: backend może wysłać goły tekst, string w JSON albo obiekt { content | delta | text }. */
export function chunkText(data: string): string {
  try {
    const parsed: unknown = JSON.parse(data);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const text = record.content ?? record.delta ?? record.text;
      if (typeof text === "string") return text;
    }
  } catch {
    // Zwykły tekst, nie JSON.
  }
  return data;
}

/** Udawany strumień: tekst pojawia się po słowie, jak odpowiedź modelu. */
export async function* fakeStream(text: string, signal?: AbortSignal, delayMs = 28): AsyncGenerator<string> {
  const parts = text.match(/\S+\s*/g) ?? [];
  for (const part of parts) {
    if (signal?.aborted) return;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    yield part;
  }
}
