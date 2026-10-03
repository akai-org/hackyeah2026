"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronRight,
  CircleHelp,
  Hourglass,
  MapPin,
  MessageCircle,
  Send,
  Tag,
  TrendingUp,
  X,
} from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { Button, buttonVariants } from "@/components/ui/button";
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

interface BackendInnovation {
  id: number;
  title: string;
  short_desc: string;
  full_desc?: string;
  category?: string;
  area?: string;
  target_group?: string;
  location?: string;
  status: string;
  cost_level?: string;
  implementation_time_months?: number;
  testers_count?: number;
  where_implemented?: string;
  source_url?: string;
  tags: string[];
  match_score: number;
  is_unmaintained: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const COST_LABEL: Record<string, string> = {
  low: "Niski koszt",
  medium: "Średni koszt",
  high: "Wysoki koszt",
};

function InnovationResultCard({
  innovation,
  onMiddleman,
}: {
  innovation: BackendInnovation;
  onMiddleman: (id: number, title: string) => void;
}) {
  return (
    <article
      aria-label={innovation.title}
      className={cn(
        "relative flex flex-col border-(length:--bw) border-deep bg-surface p-6 shadow-paper",
        innovation.is_unmaintained && "opacity-80",
      )}
    >
      {innovation.is_unmaintained && (
        <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-ui border-2 border-muted bg-paper px-2 py-0.5 text-sm text-muted">
          <CircleHelp className="size-4" aria-hidden="true" />
          Nieaktualna
        </span>
      )}

      <h3 className="pr-4 text-xl font-bold text-deep">{innovation.title}</h3>
      <p className="mt-3">{innovation.short_desc}</p>

      <dl className="mt-4 space-y-2 text-sm">
        {innovation.target_group && (
          <div className="flex gap-2">
            <dt className="text-muted">Dla kogo:</dt>
            <dd className="font-bold">{innovation.target_group}</dd>
          </div>
        )}
        {innovation.where_implemented && (
          <div className="flex gap-2">
            <dt>
              <MapPin className="inline size-4 text-muted" aria-hidden="true" />
              <span className="sr-only">Gdzie wdrożono:</span>
            </dt>
            <dd>{innovation.where_implemented}</dd>
          </div>
        )}
        {innovation.cost_level && (
          <div className="flex gap-2">
            <dt className="text-muted">Koszt:</dt>
            <dd className="font-bold">{COST_LABEL[innovation.cost_level] ?? innovation.cost_level}</dd>
          </div>
        )}
      </dl>

      {innovation.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tagi">
          {innovation.tags.slice(0, 4).map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-leaf bg-paper px-2.5 py-0.5 text-sm text-leaf"
            >
              <Tag className="size-3" aria-hidden="true" />
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex gap-3 pt-6">
        <button
          onClick={() => onMiddleman(innovation.id, innovation.title)}
          className={buttonVariants({ variant: "primary", className: "flex-1 gap-2 text-sm" })}
        >
          <TrendingUp className="size-4" aria-hidden="true" />
          Jak to wdrożyć?
        </button>
        {innovation.source_url && (
          <Link
            href={innovation.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "secondary", className: "gap-2 text-sm" })}
          >
            Źródło
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}

function MiddlemanModal({
  innovationId,
  innovationTitle,
  onClose,
}: {
  innovationId: number;
  innovationTitle: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    apiPost<{ session_id: string; first_question: string }>("/api/middleman/start", {
      innovation_id: innovationId,
      problem_desc: "Chcę wdrożyć tę innowację w swojej instytucji.",
    })
      .then((data) => {
        setMessages([{ role: "assistant", content: data.first_question }]);
      })
      .finally(() => setLoading(false));
  }, [innovationId]);

  function sendAnswer() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    let buffer = "";
    stopRef.current = apiStream(
      "/api/middleman/answer",
      { messages: newMessages, answer: text },
      (chunk) => {
        buffer += chunk;
        try {
          const parsed = JSON.parse(buffer);
          if (parsed?.type === "plan") {
            setPlan(parsed.content);
            setLoading(false);
            return;
          }
        } catch {}
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return [...prev.slice(0, -1), { role: "assistant", content: buffer }];
          }
          return [...prev, { role: "assistant", content: buffer }];
        });
        setLoading(false);
      },
    );
  }

  const planContent = plan as Record<string, unknown> | null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="relative flex w-full max-w-lg flex-col rounded-ui border-(length:--bw) border-deep bg-surface p-6 shadow-paper">
        <button
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-ui hover:bg-sage"
        >
          <X className="size-5" />
        </button>

        <h2 className="pr-10 text-xl font-bold text-deep">
          Jak wdrożyć: {innovationTitle}
        </h2>

        {planContent ? (
          <div className="mt-4 space-y-3 overflow-y-auto text-sm">
            <p className="font-bold text-leaf">Plan wdrożenia gotowy</p>
            {[
              ["Potrzebny personel", planContent.staff_needed],
              ["Szacowany koszt", planContent.estimated_cost],
              ["Lokalizacja", planContent.location_suggestions],
              ["Harmonogram", planContent.timeline],
              ["Finansowanie", planContent.funding_hints],
            ].map(([label, value]) =>
              value ? (
                <div key={label as string}>
                  <p className="text-muted">{label as string}</p>
                  <p className="font-bold">{String(value)}</p>
                </div>
              ) : null,
            )}
            {Array.isArray(planContent.steps) && (
              <div>
                <p className="text-muted">Kroki</p>
                <ol className="mt-1 list-decimal pl-5 space-y-1">
                  {(planContent.steps as string[]).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className={cn("rounded-ui p-3 text-sm", m.role === "assistant" ? "bg-sage" : "bg-mint ml-8")}>
                  <span className="font-bold">{m.role === "assistant" ? "AI Ekspert" : "Ty"}</span>
                  <p className="mt-1">{m.content}</p>
                </div>
              ))}
              {loading && (
                <div className="rounded-ui bg-sage p-3 text-sm text-muted">
                  AI pisze…
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAnswer()}
                placeholder="Twoja odpowiedź…"
                className="flex-1 rounded-ui border-(length:--bw) border-deep bg-paper px-4 py-2 text-sm"
                aria-label="Odpowiedź dla AI"
              />
              <Button onClick={sendAnswer} disabled={loading || !input.trim()}>
                <Send className="size-4" />
                <span className="sr-only">Wyślij</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
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

  const [middleman, setMiddleman] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    if (!query) return;

    setTagsLoading(true);
    apiPost<TagResult>("/api/tag", { text: query })
      .then((result) => {
        setTagResult(result);
        setMatchLoading(true);
        return apiPost<{ innovations: BackendInnovation[]; total_found: number }>("/api/match", {
          text: query,
          tags: result.tags,
        });
      })
      .then((match) => setInnovations(match.innovations))
      .catch(() => {})
      .finally(() => {
        setTagsLoading(false);
        setMatchLoading(false);
      });
  }, [query]);

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
      {
        messages: newMessages,
        innovation_ids: innovations.map((i) => i.id),
      },
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
      {/* Query */}
      <div className="max-w-2xl">
        <p className="text-sm font-bold text-muted">Twój opis problemu</p>
        <blockquote className="mt-2 border-l-4 border-leaf bg-surface px-5 py-4 text-lg">
          {query}
        </blockquote>
      </div>

      {/* Tagi */}
      {(tagsLoading || tagResult) && (
        <div className="mt-8">
          <p className="flex items-center gap-2 text-sm font-bold text-muted">
            <Tag className="size-4" aria-hidden="true" />
            System rozpoznał tematy:
          </p>
          {tagsLoading ? (
            <div className="mt-2 flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-sage" />
              ))}
            </div>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2" aria-label="Rozpoznane tagi">
              {tagResult?.tags.map((tag) => (
                <li
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border-2 border-leaf bg-paper px-3 py-1 text-sm font-bold text-leaf"
                >
                  {tag}
                </li>
              ))}
              {tagResult?.tags.length === 0 && (
                <li className="text-sm text-muted">Brak konkretnych tagów — szukam ogólnie</li>
              )}
            </ul>
          )}
          {tagResult && !tagResult.is_relevant && (
            <p className="mt-3 rounded-ui border-2 border-alert bg-surface px-4 py-3 text-sm font-bold text-alert">
              Opis nie wygląda jak problem społeczny. Spróbuj opisać konkretną sytuację osoby lub grupy.
            </p>
          )}
        </div>
      )}

      {/* Wyniki */}
      <div className="mt-10">
        {matchLoading ? (
          <>
            <CutoutText as="h1" size="section" text="Szukam rozwiązań…" />
            <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  <InnovationResultCard
                    innovation={inn}
                    onMiddleman={(id, title) => setMiddleman({ id, title })}
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
              <Button
                variant="secondary"
                onClick={() => setChatOpen(true)}
                className="gap-2"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Zapytaj AI o te innowacje
              </Button>
            </div>
          </>
        ) : tagResult && !tagResult.is_relevant ? null : (
          <>
            <CutoutText as="h1" size="section" text="Brak wyników" />
            <p className="mt-4 max-w-[60ch] text-lg">
              Nie znaleziono pasujących innowacji. Spróbuj opisać problem inaczej lub{" "}
              <Link href="/biblioteka" className="underline">
                przeglądaj całą Bibliotekę
              </Link>
              .
            </p>
          </>
        )}
      </div>

      {/* Chat */}
      {chatOpen && (
        <div className="mt-10 border-t-2 border-sage pt-8">
          <h2 className="text-xl font-bold text-deep flex items-center gap-2">
            <MessageCircle className="size-5" aria-hidden="true" />
            Zapytaj AI o innowacje
          </h2>
          <p className="mt-1 text-sm text-muted">AI zna kontekst 5 pokazanych innowacji.</p>

          <div className="mt-4 max-h-80 overflow-y-auto space-y-3 rounded-ui border-(length:--bw) border-sage bg-paper p-4">
            {chatMessages.length === 0 && (
              <p className="text-sm text-muted">Zadaj pytanie o innowacje powyżej.</p>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={cn("rounded-ui p-3 text-sm", m.role === "assistant" ? "bg-sage" : "bg-mint ml-8")}>
                <span className="font-bold">{m.role === "assistant" ? "AI" : "Ty"}</span>
                <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {chatLoading && (
              <div className="rounded-ui bg-sage p-3 text-sm">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce [animation-delay:0.2s]">●</span>
                  <span className="animate-bounce [animation-delay:0.4s]">●</span>
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Np. Która z tych innowacji jest najtańsza?"
              className="flex-1 rounded-ui border-(length:--bw) border-deep bg-surface px-4 py-2"
              aria-label="Pytanie do AI"
            />
            <Button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
              <Send className="size-4" />
              <span className="sr-only">Wyślij</span>
            </Button>
          </div>
        </div>
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
