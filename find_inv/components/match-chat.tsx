"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bot, CircleAlert, Info, Send, Square, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { InnovationCard } from "@/data/innovations";
import { streamChat, type ChatMessage } from "@/lib/matchmaking";
import { cn } from "@/lib/utils";

// Czat RAG o znalezionych innowacjach. Historia żyje w stanie, backend dostaje pełne messages[] (CONTEXT.md).
// Odpowiedź „wpisuje się” na żywo; aria-busy wstrzymuje czytnik do końca, potem status ogłasza gotowość.

const SUGGESTIONS = ["Ile to kosztuje?", "Gdzie to już działa?", "Od czego zacząć w małej gminie?"];

type MatchChatProps = {
  innovations: InnovationCard[];
  tags: string[];
};

export function MatchChat({ innovations, tags }: MatchChatProps) {
  const ids = useId();
  const fieldId = `${ids}-pytanie`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Nowy fragment odpowiedzi: przewiń dziennik rozmowy na dół (bez przewijania całej strony).
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || streaming) return;

    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setFailed(false);
    setStreaming(true);
    setStatus("Asystent pisze odpowiedź…");

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      for await (const chunk of streamChat(history, tags, innovations, controller.signal)) {
        setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      }
      setStatus(controller.signal.aborted ? "Zatrzymano odpowiedź." : "Odpowiedź gotowa.");
    } catch {
      setFailed(true);
      setStatus("");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(draft);
  }

  return (
    <section aria-labelledby={`${ids}-tytul`} className="border-(length:--bw) border-deep bg-surface p-5 sm:p-6">
      <h2 id={`${ids}-tytul`} className="text-xl font-bold text-deep">
        Zapytaj o te rozwiązania
      </h2>
      <p className="mt-2 flex items-start gap-2 text-muted">
        <Info aria-hidden="true" className="mt-1 size-5 shrink-0" />
        Odpowiada AI na podstawie kart z Biblioteki. Ważne szczegóły sprawdź w karcie innowacji.
      </p>

      {messages.length > 0 && (
        // tabIndex: przewijany obszar musi być osiągalny klawiaturą.
        <div
          ref={logRef}
          role="log"
          aria-label="Rozmowa z asystentem"
          aria-busy={streaming}
          tabIndex={0}
          className="mt-5 max-h-[28rem] overflow-y-auto rounded-ui pr-1"
        >
          <ol className="grid gap-4">
            {messages.map((message, index) => {
              const mine = message.role === "user";
              const Icon = mine ? UserRound : Bot;
              return (
                <li key={index} className={cn("flex gap-3", mine && "flex-row-reverse")}>
                  <Icon aria-hidden="true" className="mt-2 size-6 shrink-0 text-leaf" />
                  <div
                    className={cn(
                      "max-w-[60ch] rounded-ui border-2 px-4 py-3 whitespace-pre-line",
                      mine ? "border-deep bg-mint" : "border-sage bg-paper",
                    )}
                  >
                    <p className="sr-only">{mine ? "Ty:" : "Asystent:"}</p>
                    {message.content ||
                      (streaming && index === messages.length - 1 ? <span className="text-muted">Piszę…</span> : null)}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      {failed && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Odpowiedź urwała się. Zadaj pytanie jeszcze raz.
        </p>
      )}

      {messages.length === 0 && (
        <ul aria-label="Przykładowe pytania" className="mt-5 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => ask(suggestion)}
                className="min-h-12 cursor-pointer rounded-ui border-(length:--bw) border-deep bg-surface px-4 py-2 text-left text-base hover:bg-mint"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-5">
        <label htmlFor={fieldId} className="block font-bold text-deep">
          Twoje pytanie
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
          <textarea
            id={fieldId}
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter wysyła, Shift+Enter robi nową linię.
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                ask(draft);
              }
            }}
            placeholder="Na przykład: które z tych rozwiązań da się zrobić bez nowego etatu?"
            className="min-h-12 w-full resize-y rounded-ui border-(length:--bw) border-deep bg-surface px-4 py-2.5 text-base text-ink placeholder:text-muted sm:flex-1"
          />
          {streaming ? (
            <Button type="button" variant="secondary" onClick={() => abortRef.current?.abort()}>
              <Square aria-hidden="true" className="fill-current" />
              Zatrzymaj
            </Button>
          ) : (
            <Button type="submit" disabled={!draft.trim()}>
              <Send aria-hidden="true" />
              Zapytaj
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
