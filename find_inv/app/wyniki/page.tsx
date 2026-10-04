"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { MessageCircle, Send, Tag } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { Button, buttonVariants } from "@/components/ui/button";
import { BackendInnovationCard, type BackendInnovation } from "@/components/backend-innovation-card";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { MiddlemanModal } from "@/components/middleman-modal";
import { apiPost, apiStream } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
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
  const t = useT();
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
    if (query) document.title = t.results.pageTitle(query.slice(0, 50));
    return () => { document.title = t.meta.title; };
  }, [query, t]);

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
        <p className="text-lg">{t.results.noQuery}</p>
        <Link href="/" className={buttonVariants({ variant: "secondary", className: "mt-6" })}>
          {t.results.backHome}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      {/* Zapytanie */}
      <div className="max-w-2xl">
        <p className="text-sm font-bold text-muted">{t.results.yourQuery}</p>
        <blockquote className="mt-2 rounded-ui border-(length:--bw) border-border bg-surface px-5 py-4 text-lg italic">
          {query}
        </blockquote>
        <Link href="/" className="mt-3 inline-flex text-sm text-muted underline underline-offset-4 hover:text-primary-hover">
          {t.results.otherProblem}
        </Link>
      </div>

      {/* Tagi */}
      {(tagsLoading || tagResult) && (
        <section aria-label={t.results.detectedTopics} className="mt-8">
          <p className="flex items-center gap-2 text-sm font-bold text-muted">
            <Tag className="size-4" aria-hidden="true" />
            {t.results.systemDetected}
          </p>
          {tagsLoading ? (
            <div className="mt-2 flex gap-2" aria-busy="true" aria-label={t.results.analysing}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-24 animate-pulse rounded-ui bg-secondary" />
              ))}
            </div>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2" aria-label={t.results.tagsLabel}>
              {tagResult?.tags.map((tag) => (
                <li key={tag} className="inline-flex items-center gap-1 rounded-ui border-(length:--bw) border-border bg-secondary/60 px-3 py-1 text-sm font-bold text-foreground">
                  {t.tags[tag] ?? tag}
                </li>
              ))}
              {tagResult?.tags.length === 0 && (
                <li className="text-sm text-muted">{t.results.generalSearch}</li>
              )}
            </ul>
          )}
          {tagResult && !tagResult.is_relevant && (
            <p role="alert" className="mt-3 rounded-ui border-2 border-destructive bg-surface px-4 py-3 text-sm font-bold text-destructive">
              {t.results.notRelevant}
            </p>
          )}
        </section>
      )}

      {/* Innowacje */}
      <section aria-label={t.results.matching} className="mt-10">
        {matchLoading ? (
          <>
            <p className="text-xl font-bold text-muted" aria-live="polite">{t.results.searching}</p>
            <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="h-64 animate-pulse rounded-ui border-(length:--bw) border-transparent bg-secondary" />
              ))}
            </ul>
          </>
        ) : innovations.length > 0 ? (
          <>
            <CutoutText as="h1" size="section" text={t.results.matching} />
            <p className="mt-2 text-muted">{t.results.found(innovations.length)}</p>
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
                {t.results.seeMore}
              </Link>
              <Button variant="secondary" onClick={() => setChatOpen((o) => !o)} className="gap-2">
                <MessageCircle className="size-4" aria-hidden="true" />
                {chatOpen ? t.results.closeChat : t.results.askAi}
              </Button>
            </div>
          </>
        ) : tagResult && !tagResult.is_relevant ? null : (
          <>
            <CutoutText as="h1" size="section" text={t.results.noResults} />
            <p className="mt-4 max-w-[60ch] text-lg">
              {t.results.noResultsLead}
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/biblioteka" className={buttonVariants({ variant: "secondary" })}>
                {t.results.browseLibrary}
              </Link>
              <Link
                href={`/kreator?prefill=${encodeURIComponent(query)}`}
                className={buttonVariants({ variant: "primary", className: "gap-2" })}
              >
                <Send className="size-4" aria-hidden="true" />
                {t.results.toCreator}
              </Link>
            </div>
            <p className="mt-3 text-sm text-muted">
              {t.results.creatorHint}
            </p>
          </>
        )}
      </section>

      {/* Chat RAG */}
      {chatOpen && innovations.length > 0 && (
        <section aria-label={t.results.chatTitle} className="mt-10 border-t-2 border-border/40 pt-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <MessageCircle className="size-5" aria-hidden="true" />
            {t.results.chatTitle}
          </h2>
          <p className="mt-1 text-sm text-muted">{t.results.chatLead}</p>
          <AiDisclaimer className="mt-3" />

          <div
            role="log"
            aria-label={t.results.chatLog}
            aria-live="polite"
            className="mt-4 max-h-80 overflow-y-auto space-y-3 rounded-ui border-(length:--bw) border-border/40 bg-background p-4"
          >
            {chatMessages.length === 0 && (
              <p className="text-sm text-muted">{t.results.chatEmpty}</p>
            )}
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={cn("rounded-ui p-3 text-sm", m.role === "assistant" ? "bg-secondary/60" : "bg-primary/10 ml-8")}
              >
                <span className="font-bold">{m.role === "assistant" ? "AI" : t.results.you}</span>
                <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {chatLoading && (
              <div className="rounded-ui bg-secondary/60 p-3 text-sm">
                <span className="inline-flex gap-1" aria-label={t.results.aiTyping}>
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse [animation-delay:150ms]">●</span>
                  <span className="animate-pulse [animation-delay:300ms]">●</span>
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <label htmlFor="chat-input" className="sr-only">{t.results.chatInputLabel}</label>
            <input
              id="chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder={t.results.chatPlaceholder}
              className="flex-1 rounded-ui border-(length:--bw) border-border bg-surface px-4 py-2"
            />
            <Button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
              <Send className="size-4" aria-hidden="true" />
              <span className="sr-only">{t.common.send}</span>
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

function Loading() {
  const t = useT();
  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <p className="text-lg text-muted">{t.common.loading}</p>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ResultsContent />
    </Suspense>
  );
}
