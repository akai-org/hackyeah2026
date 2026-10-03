"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { MessageCircle, Send, Tag } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { Button, buttonVariants } from "@/components/ui/button";
import { BackendInnovationCard, type BackendInnovation } from "@/components/backend-innovation-card";
import { MiddlemanModal } from "@/components/middleman-modal";
import { apiPost, apiStream } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TagResult {
  tags: string[];
  area: string;
  target_group: string;
  location: string | null;
  type: string;
  is_relevant: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const [tagResult, setTagResult] = useState<TagResult | null>(null);
  const [innovations, setInnovations] = useState<BackendInnovation[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const chatStopRef = useRef<(() => void) | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [middleman, setMiddleman] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    if (!query) return;
    setTagsLoading(true);
    setMatchLoading(false);
    setInnovations([]);
    setTagResult(null);

    apiPost<TagResult>("/api/tag", { text: query })
      .then((result) => {
        setTagResult(result);
        setTagsLoading(false);
        setMatchLoading(true);
        return apiPost<{ innovations: BackendInnovation[]; total_found: number }>("/api/match", {
          text: query,
          tags: result.tags,
        });
      })
      .then((match) => setInnovations(match.innovations))
      .catch(() => setTagsLoading(false))
      .finally(() => setMatchLoading(false));
  }, [query]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newMessages);
    setChatLoading(true);

    let assistantMsg = "";
    chatStopRef.current?.();
    chatStopRef.current = apiStream(
      "/api/chat",
      { messages: newMessages, innovation_ids: innovations.map((i) => i.id) },
      (chunk) => {
        assistantMsg += chunk;
        setChatMessages([...newMessages, { role: "assistant", content: assistantMsg }]);
        setChatLoading(false);
      },
    );
  }

  if (!query) {
    return (
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <p className="text-lg">Nie podano opisu problemu.</p>
        <Link href="/" className={buttonVariants({ variant: "secondary", className: "mt-6" })}>
          Wróć do strony głównej
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      {/* Zapytanie */}
      <div className="max-w-2xl">
        <p className="text-sm font-bold text-muted">Twój opis problemu</p>
        <blockquote className="mt-2 border-l-4 border-leaf bg-surface px-5 py-4 text-lg">
          {query}
        </blockquote>
      </div>

      {/* Tagi */}
      {(tagsLoading || tagResult) && (
        <section aria-label="Rozpoznane tematy" className="mt-8">
          <p className="flex items-center gap-2 text-sm font-bold text-muted">
            <Tag className="size-4" aria-hidden="true" />
            System rozpoznał tematy:
          </p>
          {tagsLoading ? (
            <div className="mt-2 flex gap-2" aria-busy="true" aria-label="Trwa analiza">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-sage" />
              ))}
            </div>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2" aria-label="Tagi">
              {tagResult?.tags.map((tag) => (
                <li key={tag} className="inline-flex items-center gap-1 rounded-full border-2 border-leaf bg-paper px-3 py-1 text-sm font-bold text-leaf">
                  {tag}
                </li>
              ))}
              {tagResult?.tags.length === 0 && (
                <li className="text-sm text-muted">Szukam ogólnie</li>
              )}
            </ul>
          )}
          {tagResult && !tagResult.is_relevant && (
            <p role="alert" className="mt-3 rounded-ui border-2 border-alert bg-surface px-4 py-3 text-sm font-bold text-alert">
              Opis nie wygląda jak problem społeczny. Spróbuj opisać konkretną sytuację osoby lub grupy w Polsce.
            </p>
          )}
        </section>
      )}

      {/* Innowacje */}
      <section aria-label="Pasujące innowacje" className="mt-10">
        {matchLoading ? (
          <>
            <p className="text-xl font-bold text-muted" aria-live="polite">Szukam pasujących innowacji…</p>
            <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="h-64 animate-pulse rounded-ui border-(length:--bw) border-sage bg-sage" />
              ))}
            </ul>
          </>
        ) : innovations.length > 0 ? (
          <>
            <CutoutText as="h1" size="section" text="Pasujące innowacje" />
            <p className="mt-2 text-muted">Znaleziono {innovations.length} rozwiązań z Biblioteki ROPS</p>
            <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {innovations.map((inn) => (
                <li key={inn.id} className="flex">
                  <BackendInnovationCard
                    innovation={inn}
                    onMiddleman={(id, title) => setMiddleman({ id, title })}
                    showScore
                  />
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/biblioteka?tags=${(tagResult?.tags ?? []).join(",")}`}
                className={buttonVariants({ variant: "secondary" })}
              >
                Zobacz więcej w Bibliotece
              </Link>
              <Button variant="secondary" onClick={() => setChatOpen((o) => !o)} className="gap-2">
                <MessageCircle className="size-4" aria-hidden="true" />
                {chatOpen ? "Zamknij chat" : "Zapytaj AI o te innowacje"}
              </Button>
            </div>
          </>
        ) : tagResult && !tagResult.is_relevant ? null : (
          <>
            <CutoutText as="h1" size="section" text="Brak wyników" />
            <p className="mt-4 max-w-[60ch] text-lg">
              Nie znaleziono pasujących innowacji. Spróbuj opisać problem inaczej lub{" "}
              <Link href="/biblioteka" className="underline">przeglądaj Bibliotekę</Link>.
            </p>
          </>
        )}
      </section>

      {/* Chat RAG */}
      {chatOpen && innovations.length > 0 && (
        <section aria-label="Chat AI" className="mt-10 border-t-2 border-sage pt-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-deep">
            <MessageCircle className="size-5" aria-hidden="true" />
            Zapytaj AI o innowacje
          </h2>
          <p className="mt-1 text-sm text-muted">AI zna kontekst pokazanych innowacji.</p>

          <div
            role="log"
            aria-label="Rozmowa z AI"
            aria-live="polite"
            className="mt-4 max-h-80 overflow-y-auto space-y-3 rounded-ui border-(length:--bw) border-sage bg-paper p-4"
          >
            {chatMessages.length === 0 && (
              <p className="text-sm text-muted">Zadaj pytanie o innowacje powyżej.</p>
            )}
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={cn("rounded-ui p-3 text-sm", m.role === "assistant" ? "bg-sage" : "bg-mint ml-8")}
              >
                <span className="font-bold">{m.role === "assistant" ? "AI" : "Ty"}</span>
                <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {chatLoading && (
              <div className="rounded-ui bg-sage p-3 text-sm">
                <span className="inline-flex gap-1" aria-label="AI pisze">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce [animation-delay:0.2s]">●</span>
                  <span className="animate-bounce [animation-delay:0.4s]">●</span>
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <label htmlFor="chat-input" className="sr-only">Pytanie do AI</label>
            <input
              id="chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Np. Która z tych innowacji jest najtańsza?"
              className="flex-1 rounded-ui border-(length:--bw) border-deep bg-surface px-4 py-2"
            />
            <Button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
              <Send className="size-4" aria-hidden="true" />
              <span className="sr-only">Wyślij</span>
            </Button>
          </div>
        </section>
      )}

      {/* Middleman modal */}
      {middleman && (
        <MiddlemanModal
          innovationId={middleman.id}
          innovationTitle={middleman.title}
          onClose={() => setMiddleman(null)}
        />
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <p className="text-lg text-muted">Wczytuję…</p>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
