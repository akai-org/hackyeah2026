"use client";

import { useEffect, useRef, useState } from "react";
import { Clipboard, ClipboardCheck, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPost, apiStream } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  innovationId: number;
  innovationTitle: string;
  onClose: () => void;
}

export function MiddlemanModal({ innovationId, innovationTitle, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiPost<{ session_id: string; first_question: string }>("/api/middleman/start", {
      innovation_id: innovationId,
      problem_desc: "Chcę wdrożyć tę innowację w swojej instytucji.",
    })
      .then((data) => {
        sessionRef.current = data.session_id;
        setMessages([{ role: "assistant", content: data.first_question }]);
      })
      .catch(() => setMessages([{ role: "assistant", content: "Ile osób zatrudnia Wasza instytucja?" }]))
      .finally(() => {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      });
  }, [innovationId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !containerRef.current) return;
      const focusable = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          'button, input, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function sendAnswer() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    // Zdarzenia SSE Middlemana: {type: "delta"|"question"|"plan"|"error", content}.
    // Tekst, który nie jest JSON-em, traktujemy jak fragment odpowiedzi.
    let streamed = "";
    const showAssistant = (content: string) =>
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > newMessages.length) {
          return [...prev.slice(0, -1), { role: "assistant", content }];
        }
        return [...prev, { role: "assistant", content }];
      });

    stopRef.current?.();
    stopRef.current = apiStream(
      "/api/middleman/answer",
      { session_id: sessionRef.current, innovation_id: innovationId, messages: newMessages, answer: text },
      (chunk) => {
        let event: { type?: string; content?: unknown } | null = null;
        try {
          event = JSON.parse(chunk);
        } catch {}
        setLoading(false);
        if (event?.type === "plan" && event.content && typeof event.content === "object") {
          setPlan(event.content as Record<string, unknown>);
          return;
        }
        if (event?.type === "question" || event?.type === "error") {
          streamed = String(event.content ?? "");
        } else if (event?.type === "delta") {
          streamed += String(event.content ?? "");
        } else {
          streamed += chunk;
        }
        showAssistant(streamed);
      },
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="middleman-tytul"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
    >
      <div ref={containerRef} className="relative flex w-full max-w-lg flex-col rounded-ui border-(length:--bw) border-line bg-surface p-6 shadow-paper max-h-[90vh] overflow-y-auto">
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-ui hover:bg-sage"
        >
          <X className="size-5" />
        </button>

        <h2 id="middleman-tytul" className="pr-10 text-xl font-bold text-deep">
          Plan wdrożenia: {innovationTitle}
        </h2>
        <p className="mt-1 text-sm text-muted">AI dostosuje plan do Twojej instytucji.</p>

        {plan ? (
          <div className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-leaf">Plan wdrożenia gotowy</p>
              <button
                onClick={() => {
                  const lines = [
                    `Plan wdrożenia: ${innovationTitle}`,
                    "",
                    plan.staff_needed ? `Personel: ${plan.staff_needed}` : "",
                    plan.estimated_cost ? `Koszt: ${plan.estimated_cost}` : "",
                    plan.location_suggestions ? `Lokalizacja: ${plan.location_suggestions}` : "",
                    plan.timeline ? `Harmonogram: ${plan.timeline}` : "",
                    plan.funding_hints ? `Finansowanie: ${plan.funding_hints}` : "",
                    Array.isArray(plan.steps) ? `\nKroki:\n${(plan.steps as string[]).map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "",
                  ].filter(Boolean).join("\n");
                  navigator.clipboard?.writeText(lines).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }).catch(() => {});
                }}
                aria-label="Kopiuj plan do schowka"
                title="Kopiuj do schowka"
                className="inline-flex items-center gap-1.5 rounded-ui border-(length:--bw) border-line bg-paper px-3 py-1.5 text-xs font-bold hover:bg-sage"
              >
                {copied ? <ClipboardCheck className="size-3.5 text-leaf" aria-hidden="true" /> : <Clipboard className="size-3.5" aria-hidden="true" />}
                {copied ? "Skopiowano!" : "Kopiuj"}
              </button>
            </div>
            {([
              ["Cel", plan.goal],
              ["Potrzebny personel", plan.staff_needed],
              ["Szacowany koszt", plan.estimated_cost],
              ["Lokalizacja", plan.location_suggestions],
              ["Harmonogram", plan.timeline],
              ["Finansowanie", plan.funding_hints],
            ] as [string, unknown][]).map(([label, value]) =>
              value ? (
                <div key={label} className="">
                  <p className="font-bold text-muted">{label}</p>
                  <p>{String(value)}</p>
                </div>
              ) : null,
            )}
            {Array.isArray(plan.steps) && (
              <div className="">
                <p className="font-bold text-muted">Kroki wdrożenia</p>
                <ol className="mt-1 list-decimal pl-5 space-y-1">
                  {(plan.steps as string[]).map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}
            {([
              ["Ryzyka", plan.risks],
              ["Do uzupełnienia", plan.missing],
            ] as [string, unknown][]).map(([label, items]) =>
              Array.isArray(items) && items.length ? (
                <div key={label} className="">
                  <p className="font-bold text-muted">{label}</p>
                  <ul className="mt-1 list-disc pl-5 space-y-1">
                    {(items as string[]).map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              ) : null,
            )}
          </div>
        ) : (
          <>
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("rounded-ui p-3 text-sm", m.role === "assistant" ? "bg-sage" : "bg-mint ml-8")}
                >
                  <span className="font-bold">{m.role === "assistant" ? "AI Ekspert" : "Ty"}</span>
                  <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {loading && <div className="rounded-ui bg-sage p-3 text-sm text-muted">AI pisze…</div>}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAnswer()}
                placeholder="Twoja odpowiedź…"
                aria-label="Odpowiedź dla AI"
                className="flex-1 rounded-ui border-(length:--bw) border-field bg-paper px-4 py-2 text-sm"
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
