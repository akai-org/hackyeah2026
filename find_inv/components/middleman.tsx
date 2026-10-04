"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  Banknote,
  Bot,
  CalendarRange,
  CircleAlert,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Copy,
  Download,
  HandCoins,
  Info,
  Loader2,
  MapPin,
  MessageSquareText,
  RotateCcw,
  Send,
  ShieldAlert,
  Target,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { CutoutText } from "@/components/cutout-text";
import { Button, buttonVariants } from "@/components/ui/button";
import { innovations as libraryInnovations } from "@/data/innovations.mock";
import { cn } from "@/lib/utils";
import { answerMiddleman, startMiddleman, type MiddlemanPlan, type StartResult } from "@/lib/middleman-api";
import { useI18n, useT } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { MiddlemanMessages } from "@/lib/i18n/ns/middleman";
import { useTranslatedTexts } from "@/lib/i18n/use-translated";

// Middleman AI wg DESIGN.md (sekcja 8, „Plan wdrożenia”): rozmowa (maks. 3 pytania) → szkic planu.
// Kolaż tylko w tytułach, cała reszta to zwykły, czytelny dokument.

const fieldClass =
  "mt-2 w-full rounded-ui border-(length:--bw) border-border bg-surface px-4 text-base text-foreground placeholder:text-muted";

type Message = { role: "ai" | "user"; text: string };
type Phase = "intro" | "chat" | "plan";

type MiddlemanProps = {
  innovationId?: string;
  /** Tytuł znany z karty, z której otwarto okno (wyniki, karta innowacji) — zanim odpowie backend. */
  innovationTitle?: string;
  problem?: string;
  /** „dialog”: w oknie „Jak to wdrożyć?” — bez nagłówka strony i marginesów (tytuł daje Dialog). */
  variant?: "page" | "dialog";
};

function Missing() {
  const label = useT().middleman.missing;
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <CircleHelp aria-hidden="true" className="size-5 shrink-0" />
      {label}
    </span>
  );
}

function PlanSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid border-t-2 border-border/40 pt-6">
      <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Icon aria-hidden="true" className="size-6 shrink-0 text-primary" />
        {title}
      </h3>
      <div className="mt-3 text-lg">{children}</div>
    </section>
  );
}

/** Plan jako zwykły tekst — do wklejenia w maila, notatkę czy wniosek. */
function planToText(plan: MiddlemanPlan, innovationTitle: string, institution: string, m: MiddlemanMessages): string {
  const x = m.text;
  const list = (items?: string[]) => (items?.length ? items.map((item) => `- ${item}`).join("\n") : `- ${m.missing}`);
  const lines = [
    x.header(innovationTitle),
    `${x.institution}: ${institution}`,
    "",
    `${x.goal}: ${plan.goal || m.missing}`,
    `${x.staff}: ${plan.staff_needed || m.missing}`,
    `${x.cost}: ${plan.estimated_cost || m.missing}`,
    `${x.where}: ${plan.location_suggestions || m.missing}`,
    `${x.time}: ${plan.timeline || m.missing}`,
    "",
    ...(plan.phases ?? []).flatMap((phase) => [`${phase.label}:`, list(phase.items)]),
    x.nextSteps,
    list(plan.steps),
    "",
    x.funding,
    list(plan.funding_hints ? plan.funding_hints.split(/;\s*/) : []),
    ...(plan.risks?.length ? ["", x.risks, list(plan.risks)] : []),
    ...(plan.missing?.length ? ["", x.toFill, list(plan.missing)] : []),
    "",
    x.footer,
  ];
  return lines.join("\n");
}

type PlanDocumentProps = { plan: MiddlemanPlan; innovationTitle: string; institution: string; onRestart: () => void };

function PlanDocument({ plan, innovationTitle, institution, onRestart }: PlanDocumentProps) {
  const { t, locale } = useI18n();
  const m = t.middleman;
  const p = m.plan;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState<"ok" | "error" | null>(null);
  useEffect(() => headingRef.current?.focus(), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(planToText(plan, innovationTitle, institution, m));
      setCopied("ok");
    } catch {
      setCopied("error");
    }
  }

  return (
    <article
      aria-labelledby="plan-tytul"
      className="appear border-(length:--bw) border-border bg-surface p-6 shadow-raised sm:p-10 print:border-0 print:p-0"
    >
      {/* Nagłówek wydruku: skąd jest dokument i kiedy powstał. */}
      <p className="mb-4 hidden border-b-2 border-border pb-2 text-base print:flex print:justify-between">
        <span className="font-bold">{p.printHeader}</span>
        <span>{formatDate(new Date().toISOString(), locale)}</span>
      </p>
      <h2 id="plan-tytul" ref={headingRef} tabIndex={-1} className="focus:outline-none">
        <CutoutText as="span" size="section" text={p.title} labelled={false} />
        <span className="sr-only">{p.title}</span>
      </h2>
      <p className="mt-3 text-lg">
        {p.innovation} <strong className="text-foreground">{innovationTitle}</strong>
        {plan.source?.where_implemented && <span className="text-muted"> · {p.alreadyIn} {plan.source.where_implemented}</span>}
      </p>
      <p className="mt-1 text-lg">
        {p.institution} <strong className="text-foreground">{institution}</strong>
      </p>

      <p className="mt-6 flex items-start gap-3 rounded-ui border-2 border-border bg-secondary/60 px-4 py-3">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-foreground" />
        {p.draft}
      </p>
      <AiDisclaimer className="mt-3" />

      <div className="mt-8 space-y-8">
        <PlanSection icon={Target} title={p.goal}>
          {plan.goal ? <p>{plan.goal}</p> : <Missing />}
        </PlanSection>

        <PlanSection icon={UsersRound} title={p.staff}>
          {plan.staff_needed ? <p>{plan.staff_needed}</p> : <Missing />}
        </PlanSection>

        <PlanSection icon={ClipboardList} title={p.needs}>
          <dl className="grid gap-4 md:grid-cols-2">
            <div className="rounded-ui border-2 border-border bg-background p-4">
              <dt className="flex items-center gap-2 font-bold text-foreground">
                <Banknote aria-hidden="true" className="size-5 text-primary" />
                {p.cost}
              </dt>
              <dd className="mt-1">{plan.estimated_cost || <Missing />}</dd>
            </div>
            <div className="rounded-ui border-2 border-border bg-background p-4">
              <dt className="flex items-center gap-2 font-bold text-foreground">
                <MapPin aria-hidden="true" className="size-5 text-primary" />
                {p.where}
              </dt>
              <dd className="mt-1">{plan.location_suggestions || <Missing />}</dd>
            </div>
          </dl>
        </PlanSection>

        <PlanSection icon={CalendarRange} title={plan.timeline ? `${p.phases} · ${plan.timeline}` : p.phases}>
          {plan.phases?.length ? (
            <ol className="grid gap-4 md:grid-cols-3">
              {plan.phases.map((phase) => (
                <li key={phase.label} className="rounded-ui border-2 border-border bg-background p-4">
                  <p className="font-bold text-foreground">{phase.label}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-base">
                    {phase.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          ) : null}
          {plan.steps?.length ? (
            <>
              <p className="mt-5 font-bold text-foreground">{p.nextSteps}</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-6">
                {plan.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          ) : null}
        </PlanSection>

        <PlanSection icon={HandCoins} title={p.funding}>
          {plan.funding_hints ? (
            <ul className="list-disc space-y-1.5 pl-6">
              {plan.funding_hints.split(/;\s*/).map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          ) : (
            <Missing />
          )}
        </PlanSection>

        {plan.risks?.length ? (
          <PlanSection icon={ShieldAlert} title={p.risks}>
            <ul className="list-disc space-y-1.5 pl-6">
              {plan.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </PlanSection>
        ) : null}

        <PlanSection icon={CircleHelp} title={p.toFill}>
          {plan.missing?.length ? (
            <ul className="space-y-2">
              {plan.missing.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CircleHelp aria-hidden="true" className="mt-1 size-5 shrink-0 text-muted" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p>{p.complete}</p>
          )}
        </PlanSection>
      </div>

      <div className="print-hidden mt-10 flex flex-wrap gap-3 border-t-2 border-border/40 pt-6">
        <Button type="button" onClick={() => window.print()} aria-describedby="plan-druk-podpowiedz">
          <Download aria-hidden="true" />
          {p.download}
        </Button>
        <Button type="button" variant="secondary" onClick={copy}>
          {copied === "ok" ? <ClipboardCheck aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied === "ok" ? p.copied : p.copy}
        </Button>
        <Button type="button" variant="secondary" onClick={onRestart}>
          <RotateCcw aria-hidden="true" />
          {p.restart}
        </Button>
        <Link href="/forum" className={buttonVariants({ variant: "secondary" })}>
          <MessageSquareText aria-hidden="true" />
          {p.askForum}
        </Link>
      </div>
      <p id="plan-druk-podpowiedz" className="print-hidden mt-3 text-sm text-muted">
        {p.printHint}
      </p>
      <p role="status" aria-live="polite" className="print-hidden text-sm">
        {copied === "ok" && p.copiedInfo}
        {copied === "error" && <span className="font-bold text-destructive">{p.copyFailed}</span>}
      </p>
    </article>
  );
}

export function Middleman({ innovationId, innovationTitle: knownTitle, problem = "", variant = "page" }: MiddlemanProps) {
  const ids = useId();
  const t = useT();
  const m = t.middleman;
  // Lista innowacji do wyboru jest lokalna (dane demo, po polsku) — tłumaczy ją backend.
  const tr = useTranslatedTexts(libraryInnovations.flatMap((item) => [item.title, item.targetGroup]));
  const libraryMatch = libraryInnovations.find((item) => item.id === innovationId);

  const [phase, setPhase] = useState<Phase>("intro");
  const [picked, setPicked] = useState<string>(innovationId ?? "");
  const [institutionIndex, setInstitutionIndex] = useState(0);
  const institution = m.institutions[institutionIndex];
  const [need, setNeed] = useState(problem);
  const [session, setSession] = useState<StartResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");
  const [questionIndex, setQuestionIndex] = useState(1);
  const [plan, setPlan] = useState<MiddlemanPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const answerRef = useRef<HTMLTextAreaElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, streaming]);

  useEffect(() => {
    if (phase === "chat" && !busy) answerRef.current?.focus();
  }, [phase, busy]);

  // Bez ?innowacja= użytkownik wybiera z Biblioteki. Z wyników (A2) przychodzi id z backendu.
  const needsPicker = !innovationId;
  const pickedLibrary = libraryInnovations.find((item) => item.id === picked);

  async function begin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const local = libraryMatch ?? pickedLibrary;
    try {
      const result = await startMiddleman({
        innovation_id: innovationId ?? picked ?? null,
        innovation_title: local?.title ?? knownTitle,
        innovation_desc: local?.summary,
        problem_desc: need.trim(),
        institution,
      });
      setSession(result);
      setMessages([{ role: "ai", text: result.first_question }]);
      setQuestionIndex(result.question_index);
      setPhase("chat");
    } catch {
      setError(m.connectError);
    } finally {
      setBusy(false);
    }
  }

  async function send(finish: boolean) {
    if (!session || busy) return;
    const text = answer.trim();
    if (!finish && !text) {
      setError(m.answerRequired);
      answerRef.current?.focus();
      return;
    }
    setError(null);
    setBusy(true);
    setAnswer("");
    if (text) setMessages((current) => [...current, { role: "user", text }]);

    const controller = new AbortController();
    abortRef.current = controller;
    let typed = "";
    try {
      await answerMiddleman(
        { session_id: session.session_id, answer: text, finish },
        (evt) => {
          if (evt.type === "delta") {
            typed += evt.content;
            setStreaming(typed);
          } else if (evt.type === "question") {
            setStreaming("");
            setMessages((current) => [...current, { role: "ai", text: evt.content }]);
            setQuestionIndex(evt.index);
          } else if (evt.type === "plan") {
            setStreaming("");
            setPlan(evt.content);
            setPhase("plan");
          } else if (evt.type === "error") {
            setStreaming("");
            setError(evt.content);
          }
        },
        controller.signal,
      );
    } catch {
      setStreaming("");
      if (!controller.signal.aborted) setError(m.interrupted);
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    abortRef.current?.abort();
    setPhase("intro");
    setSession(null);
    setMessages([]);
    setPlan(null);
    setAnswer("");
    setStreaming("");
    setError(null);
  }

  const innovationTitle =
    session?.innovation.title ?? libraryMatch?.title ?? pickedLibrary?.title ?? knownTitle ?? m.innovationFallback;
  const inDialog = variant === "dialog";

  return (
    <div className={inDialog ? "mt-4" : "mx-auto max-w-content px-4 py-12 sm:px-6"}>
      <div className="print-hidden">
        {!inDialog && <CutoutText as="h1" size="section" text={m.heading} />}
        <p className={cn("max-w-[62ch] text-lg", !inDialog && "mt-4")}>
          {m.lead}
        </p>
        <ol aria-label={m.steps} className="mt-6 flex flex-wrap gap-2 text-base">
          {(["intro", "chat", "plan"] as Phase[]).map((step, index) => (
            <li
              key={step}
              aria-current={phase === step ? "step" : undefined}
              className={cn(
                "rounded-full border-2 border-border px-3 py-1 font-bold",
                phase === step ? "bg-primary text-primary-foreground" : "bg-surface text-foreground",
              )}
            >
              {index + 1}. {m.stepNames[index]}
            </li>
          ))}
        </ol>
      </div>

      {error && (
        <p role="alert" className="print-hidden mt-6 flex max-w-2xl items-start gap-3 rounded-ui border-2 border-destructive bg-surface px-4 py-3 font-bold text-destructive">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-8">
        {phase === "intro" && (
          <form onSubmit={begin} className="max-w-3xl border-(length:--bw) border-border bg-surface p-6 shadow-raised sm:p-8">
            {needsPicker ? (
              <fieldset>
                <legend className="text-xl font-bold text-foreground">{m.pickInnovation}</legend>
                <div className="mt-4 grid gap-3">
                  {libraryInnovations.map((item) => (
                    <label
                      key={item.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-ui border-(length:--bw) p-4",
                        picked === item.id ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary",
                      )}
                    >
                      <input
                        type="radio"
                        name={`${ids}-innowacja`}
                        value={item.id}
                        checked={picked === item.id}
                        onChange={() => setPicked(item.id)}
                        required
                        className="mt-1.5 size-5 shrink-0 accent-primary"
                      />
                      <span>
                        <span className="block font-bold text-foreground">{tr(item.title)}</span>
                        <span className="block text-base text-muted">{tr(item.targetGroup)}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              <p className="text-lg">
                {m.selected}{" "}
                <strong className="text-foreground">
                  {libraryMatch ? tr(libraryMatch.title) : (knownTitle ?? m.fromResults(innovationId ?? ""))}
                </strong>
              </p>
            )}

            <div className="mt-6">
              <label htmlFor={`${ids}-instytucja`} className="block font-bold text-foreground">
                {m.yourInstitution}
              </label>
              <select
                id={`${ids}-instytucja`}
                value={institutionIndex}
                onChange={(event) => setInstitutionIndex(Number(event.target.value))}
                className={cn(fieldClass, "min-h-12 cursor-pointer")}
              >
                {m.institutions.map((option, index) => (
                  <option key={option} value={index}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6">
              <label htmlFor={`${ids}-potrzeba`} className="block font-bold text-foreground">
                {m.problem} <span className="font-normal text-muted">{m.optional}</span>
              </label>
              <textarea
                id={`${ids}-potrzeba`}
                value={need}
                onChange={(event) => setNeed(event.target.value)}
                rows={3}
                maxLength={1500}
                placeholder={m.problemPlaceholder}
                className={cn(fieldClass, "min-h-28 py-3")}
              />
            </div>

            <Button type="submit" disabled={busy} className="mt-8">
              {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Bot aria-hidden="true" />}
              {busy ? m.connecting : m.start}
            </Button>
          </form>
        )}

        {phase === "chat" && session && (
          <section aria-labelledby={`${ids}-rozmowa`} className="max-w-3xl">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id={`${ids}-rozmowa`} className="text-xl font-bold text-foreground">
                {m.conversationAbout(session.innovation.title)}
              </h2>
              <p className="font-bold text-muted">
                {m.question(questionIndex, session.max_questions)}
              </p>
            </div>
            <AiDisclaimer className="mt-3" />
            <div aria-hidden="true" className="mt-4 h-2 rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${(questionIndex / session.max_questions) * 100}%` }}
              />
            </div>

            <div role="log" aria-live="polite" aria-label={m.log} className="mt-6 space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={cn("appear flex", message.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-ui border-2 border-border px-5 py-3 text-lg",
                      message.role === "ai" ? "bg-surface shadow-raised" : "bg-primary/10",
                    )}
                  >
                    <p className="text-sm font-bold text-muted">{message.role === "ai" ? m.assistant : m.you}</p>
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start" aria-hidden={streaming ? undefined : true}>
                  <div className="max-w-[85%] rounded-ui border-2 border-border bg-surface px-5 py-3 text-lg shadow-raised">
                    <p className="text-sm font-bold text-muted">{m.assistant}</p>
                    {streaming ? (
                      <p>{streaming}</p>
                    ) : (
                      <p className="flex items-center gap-2 text-muted">
                        <Loader2 aria-hidden="true" className="size-5 animate-spin" />
                        {m.analysing}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div ref={logEndRef} />
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(false);
              }}
              className="mt-6 border-(length:--bw) border-border bg-surface p-5"
            >
              <label htmlFor={`${ids}-odpowiedz`} className="block font-bold text-foreground">
                {m.yourAnswer}
              </label>
              <textarea
                id={`${ids}-odpowiedz`}
                ref={answerRef}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send(false);
                  }
                }}
                rows={2}
                maxLength={1500}
                disabled={busy}
                className={cn(fieldClass, "min-h-20 py-3")}
                aria-describedby={`${ids}-odpowiedz-podpowiedz`}
              />
              <p id={`${ids}-odpowiedz-podpowiedz`} className="mt-1 text-sm text-muted">
                {m.enterHint}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="submit" disabled={busy}>
                  <Send aria-hidden="true" />
                  {m.reply}
                </Button>
                <Button type="button" variant="secondary" disabled={busy} onClick={() => send(true)}>
                  <ClipboardList aria-hidden="true" />
                  {m.showPlan}
                </Button>
              </div>
            </form>
          </section>
        )}

        {phase === "plan" && plan && (
          <PlanDocument plan={plan} innovationTitle={innovationTitle} institution={institution} onRestart={restart} />
        )}
      </div>
    </div>
  );
}
