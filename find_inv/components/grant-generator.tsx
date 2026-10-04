"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  CalendarClock,
  CalendarX2,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  ExternalLink,
  FileText,
  FileUp,
  Loader2,
  Printer,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  fillGrant,
  formatCallDate,
  getGrants,
  parseStoredIdea,
  readStoredRaw,
  submitApplication,
  type Applicant,
  type Grant,
} from "@/lib/grants";
import { extractPdfText } from "@/lib/ideas";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";

// Generator wniosków: wybór naboru → „Uzupełnij z fiszki” (z kreatora albo z wklejonego opisu) →
// AI wypełnia sekcje wniosku → użytkownik poprawia pola → druk / PDF → złożenie wniosku.
// Złożyć wniosek można TYLKO w trakcie naboru (status „open”, pilnuje też backend). Przed otwarciem
// naboru wniosek da się przygotować i wydrukować; zakończone nabory są tylko do wglądu.

const FIELD_CLASS =
  "w-full rounded-ui border-(length:--bw) border-border bg-surface p-4 text-base text-foreground placeholder:text-muted";

// Fiszka trafia do sessionStorage w kreatorze; tu tylko ją czytamy (bez efektu — zgodnie z SSR).
const noSubscribe = () => () => {};

const EMPTY_APPLICANT: Applicant = { applicant_name: "", applicant_email: "", organization: "" };

/** Termin naboru słowem i ikoną (nie tylko kolorem). */
function CallStatusBadge({ grant }: { grant: Grant }) {
  const { t, locale } = useI18n();
  const g = t.grants;
  const date = (iso: string) => formatCallDate(iso, locale);
  if (grant.status === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-ui border-2 border-primary bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-foreground">
        <CalendarClock aria-hidden="true" className="size-4 text-foreground" />
        {g.status.open(date(grant.closes_at))}
      </span>
    );
  }
  if (grant.status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-ui border-2 border-border bg-background px-2.5 py-0.5 text-sm font-bold text-foreground">
        <CalendarClock aria-hidden="true" className="size-4 text-foreground" />
        {g.status.upcoming(date(grant.opens_at), date(grant.closes_at))}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-ui border-2 border-border bg-secondary px-2.5 py-0.5 text-sm font-bold text-foreground">
      <CalendarX2 aria-hidden="true" className="size-4" />
      {g.status.closed(date(grant.closes_at))}
    </span>
  );
}

function CallDetails({ grant }: { grant: Grant }) {
  const g = useI18n().t.grants;
  return (
    <>
      <span className="block font-bold text-foreground">{grant.name}</span>
      <span className="mt-1 block">
        <CallStatusBadge grant={grant} />
      </span>
      <span className="mt-1 block text-sm text-muted">
        {g.organizer} {grant.organizer} · {g.template} {grant.template.name}
        {grant.demo && g.demo}
      </span>
      {grant.template.source_url && (
        <a
          href={grant.template.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-foreground underline"
        >
          {g.rules} <ExternalLink aria-hidden="true" className="size-4" />
          <span className="sr-only">{g.newTab}</span>
        </a>
      )}
    </>
  );
}

export function GrantGenerator() {
  const ids = useId();
  const { t, locale } = useI18n();
  const g = t.grants;
  const date = (iso: string) => formatCallDate(iso, locale);
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [grantId, setGrantId] = useState<string>("");
  const [ideaText, setIdeaText] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [filling, setFilling] = useState(false);
  const [fillError, setFillError] = useState<string | null>(null);
  const [filledFrom, setFilledFrom] = useState<"llm" | "rules" | null>(null);
  const [applicant, setApplicant] = useState<Applicant>(EMPTY_APPLICANT);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ id: number; at: string } | null>(null);
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pdf, setPdf] = useState<{ status: "reading" | "done" | "error"; message: string } | null>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);

  const storedRaw = useSyncExternalStore(noSubscribe, readStoredRaw, () => null);
  const storedIdea = useMemo(() => parseStoredIdea(storedRaw), [storedRaw]);

  useEffect(() => {
    getGrants()
      .then((list) => {
        setGrants(list);
        // Domyślnie pierwszy otwarty nabór, a gdy żadnego nie ma — najbliższy nadchodzący.
        const first = list.find((item) => item.status === "open") ?? list.find((item) => item.status === "upcoming");
        setGrantId((current) => current || first?.id || "");
      })
      .catch((error) => {
        console.error(error);
        setLoadError(true);
      });
  }, []);

  const available = grants?.filter((item) => item.status !== "closed") ?? [];
  const closed = grants?.filter((item) => item.status === "closed") ?? [];
  const grant = available.find((item) => item.id === grantId) ?? null;
  const hasContent = Object.values(values).some((value) => value.trim());
  const locked = Boolean(submitted) || submitting;

  /** `text` — opis podany wprost (np. świeżo odczytany z PDF-u), zanim stan pola zdąży się zaktualizować. */
  async function fill(source: "card" | "text", text?: string) {
    if (!grant) return;
    const idea = source === "card" ? storedIdea : (text ?? ideaText).trim();
    if (!idea || (typeof idea === "string" && idea.length < 10)) {
      setFillError(g.ideaTooShort);
      textRef.current?.focus();
      return;
    }
    setFilling(true);
    setFillError(null);
    try {
      const result = await fillGrant(grant.id, idea);
      setValues(result.sections);
      setFilledFrom(result.source);
      requestAnimationFrame(() => formHeadingRef.current?.focus());
    } catch (error) {
      console.error(error);
      setFillError(
        error instanceof TypeError
          ? g.offline
          : g.fillFailed((error as Error).message),
      );
    } finally {
      setFilling(false);
    }
  }

  // PDF → tekst (backend, ten sam endpoint co w Kreatorze) → pole opisu → od razu uzupełnienie wniosku.
  async function readPdf(file: File | undefined) {
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    if (!file) return;
    setPdf({ status: "reading", message: t.creator.readingPdf(file.name) });
    try {
      const result = await extractPdfText(file);
      setIdeaText(result.text);
      setPdf({ status: "done", message: g.pdfLoaded(file.name, result.pages, result.truncated) });
      await fill("text", result.text);
    } catch (problem) {
      const code = (problem as Error).message;
      setPdf({ status: "error", message: t.creator.pdfErrors[code] ?? code });
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!grant || grant.status !== "open" || locked) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitApplication(grant.id, applicant, values);
      setSubmitted({ id: result.id, at: result.submitted_at });
      requestAnimationFrame(() => confirmationRef.current?.focus());
    } catch (error) {
      console.error(error);
      // Backend odrzuca wniosek poza terminem naboru albo niekompletny — pokazujemy jego komunikat.
      setSubmitError(
        error instanceof TypeError ? g.offline : (error as Error).message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  function clear() {
    setValues({});
    setFilledFrom(null);
    setSubmitted(null);
    setSubmitError(null);
  }

  if (loadError) {
    return (
      <p role="alert" className="mt-8 flex max-w-3xl items-start gap-2 rounded-ui border-2 border-destructive bg-surface px-4 py-3 font-bold text-destructive">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        {g.loadFailed}
      </p>
    );
  }

  if (!grants) {
    return (
      <p role="status" className="mt-8 flex items-center gap-2 text-muted">
        <Loader2 aria-hidden="true" className="size-5 animate-spin" />
        {g.loading}
      </p>
    );
  }

  return (
    <>
      <div className="mt-8 max-w-3xl space-y-8 print:hidden">
        <AiDisclaimer />

        <fieldset>
          <legend className="text-lg font-bold text-foreground">{g.step1}</legend>
          <p className="mt-1 text-muted">
            {g.step1Hint}
          </p>
          {available.length ? (
            <div className="mt-3 grid gap-3">
              {available.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-3 rounded-ui border-(length:--bw) border-border bg-surface p-4 has-checked:bg-primary/10"
                >
                  <input
                    type="radio"
                    name={`${ids}-nabor`}
                    value={item.id}
                    checked={grantId === item.id}
                    onChange={() => {
                      if (hasContent && !window.confirm(g.confirmChange)) return;
                      setGrantId(item.id);
                      clear();
                    }}
                    disabled={filling || submitting}
                    className="mt-1 size-5 shrink-0 accent-primary"
                  />
                  <span>
                    <CallDetails grant={item} />
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-ui border-2 border-border bg-surface px-4 py-3">
              {g.noCalls}
            </p>
          )}
          {closed.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer font-bold text-foreground">{g.closedCalls(closed.length)}</summary>
              <ul className="mt-3 grid gap-3">
                {closed.map((item) => (
                  <li key={item.id} className="rounded-ui border-2 border-border/40 bg-background p-4">
                    <CallDetails grant={item} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </fieldset>

        {grant && (
          <section aria-labelledby={`${ids}-zrodlo`}>
            <h2 id={`${ids}-zrodlo`} className="text-lg font-bold text-foreground">
              {g.step2}
            </h2>
            {storedIdea ? (
              <div className="mt-2 rounded-ui border-(length:--bw) border-border bg-surface p-4">
                <p className="flex items-center gap-2 font-bold text-foreground">
                  <FileText aria-hidden="true" className="size-5" />
                  {g.fromCard(storedIdea.title || g.untitled)}
                </p>
                <p className="mt-1 text-muted">{storedIdea.shortDesc || storedIdea.essence.slice(0, 160)}</p>
                <Button type="button" onClick={() => fill("card")} disabled={filling || locked} className="mt-3">
                  {filling ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Sparkles aria-hidden="true" />}
                  {g.fillFromCard}
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-muted">
                {g.noCard}{" "}
                <Link href="/kreator" className="font-bold text-foreground underline">
                  {g.createCard}
                </Link>{" "}
                {g.noCardRest}
              </p>
            )}

            <label htmlFor={`${ids}-opis`} className="mt-6 block font-bold text-foreground">
              {storedIdea ? g.otherDescription : g.description}
            </label>
            <textarea
              ref={textRef}
              id={`${ids}-opis`}
              rows={5}
              value={ideaText}
              onChange={(event) => setIdeaText(event.target.value)}
              placeholder={g.descriptionPlaceholder}
              className={cn(FIELD_CLASS, "mt-2 resize-y")}
            />
            <div className="mt-3 flex flex-wrap items-start gap-3">
              <Button type="button" variant="secondary" onClick={() => fill("text")} disabled={filling || locked}>
                {filling ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Sparkles aria-hidden="true" />}
                {g.fillFromText}
              </Button>
              <label
                className={cn(
                  "inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-ui border-(length:--bw) border-border bg-surface px-5 py-2 text-base font-bold text-foreground hover:bg-primary/10 has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-focus",
                  (filling || locked || pdf?.status === "reading") && "pointer-events-none opacity-60",
                )}
              >
                {pdf?.status === "reading" ? (
                  <Loader2 aria-hidden="true" className="size-5 animate-spin" />
                ) : (
                  <FileUp aria-hidden="true" className="size-5" />
                )}
                {t.creator.loadPdf}
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={filling || locked || pdf?.status === "reading"}
                  aria-describedby={`${ids}-pdf-opis`}
                  onChange={(event) => void readPdf(event.target.files?.[0])}
                  className="sr-only"
                />
              </label>
            </div>
            <p id={`${ids}-pdf-opis`} className="mt-1 text-sm text-muted">
              {g.pdfHint}
            </p>
            <p role="status" aria-live="polite" className={cn(pdf && pdf.status !== "error" && "mt-2 text-foreground")}>
              {pdf && pdf.status !== "error" && pdf.message}
            </p>
            {pdf?.status === "error" && (
              <p role="alert" className="mt-2 flex items-start gap-2 rounded-ui border-2 border-destructive bg-surface px-4 py-3 font-bold text-destructive">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                {pdf.message}
              </p>
            )}

            <div role="status" aria-live="polite">
              {filling && <p className="mt-3 font-bold text-foreground">{g.aiWriting}</p>}
            </div>
            {fillError && (
              <p role="alert" className="mt-3 flex items-start gap-2 rounded-ui border-2 border-destructive bg-surface px-4 py-3 font-bold text-destructive">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                {fillError}
              </p>
            )}
          </section>
        )}
      </div>

      {grant && (
        <section aria-labelledby={`${ids}-wniosek`} className="mt-12 max-w-3xl print:mt-0 print:max-w-none">
          <h2 id={`${ids}-wniosek`} ref={formHeadingRef} tabIndex={-1} className="text-xl font-bold text-foreground focus:outline-none print:text-2xl">
            <span className="print:hidden">{g.step3}</span>
            {grant.name}
          </h2>
          <p className="mt-1 text-muted">
            {grant.template.name} · {grant.organizer} · {g.call} {date(grant.opens_at)} – {date(grant.closes_at)}
          </p>
          {filledFrom && (
            <p className="mt-2 flex items-start gap-1.5 text-muted print:hidden">
              <Sparkles aria-hidden="true" className="mt-1 size-4 shrink-0" />
              {filledFrom === "llm"
                ? g.filledLlm
                : g.filledRules}
            </p>
          )}

          <div className="mt-6 space-y-6">
            {grant.sections.map((section) => {
              const value = values[section.id] ?? "";
              const fieldId = `${ids}-${section.id}`;
              const todo = !value.trim() || value.includes("[do uzupełnienia");
              const over = value.length > section.max_chars;
              return (
                <div key={section.id} className="print:break-inside-avoid">
                  <label htmlFor={fieldId} className="block font-bold text-foreground">
                    {section.label}
                  </label>
                  <p id={`${fieldId}-podpowiedz`} className="mt-1 text-muted print:hidden">
                    {section.hint}
                  </p>
                  <textarea
                    id={fieldId}
                    rows={section.max_chars > 500 ? 6 : 2}
                    value={value}
                    readOnly={locked}
                    onChange={(event) => setValues((current) => ({ ...current, [section.id]: event.target.value }))}
                    aria-describedby={`${fieldId}-podpowiedz ${fieldId}-licznik`}
                    aria-invalid={over || undefined}
                    className={cn(FIELD_CLASS, "mt-2 resize-y read-only:bg-background print:hidden", over && "border-destructive")}
                  />
                  {/* Na wydruku pole tekstowe ucina treść — drukujemy zwykły tekst. */}
                  <p className="hidden whitespace-pre-wrap print:block">{value || "—"}</p>
                  <p id={`${fieldId}-licznik`} className="mt-1 flex flex-wrap items-center gap-x-4 text-sm print:hidden">
                    <span className={cn("tabular-nums", over ? "font-bold text-destructive" : "text-muted")}>
                      {g.chars(value.length, section.max_chars)}{over && g.tooLong}
                    </span>
                    {todo && (
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <CircleHelp aria-hidden="true" className="size-4" />
                        {g.todo}
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <AiDisclaimer className="mt-8" />

          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <Button type="button" variant="secondary" onClick={() => window.print()} disabled={!hasContent}>
              <Printer aria-hidden="true" />
              {g.print}
            </Button>
            {!submitted && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (window.confirm(g.confirmClear)) clear();
                }}
                disabled={!hasContent || submitting}
              >
                <Trash2 aria-hidden="true" />
                {g.clear}
              </Button>
            )}
            <Link href="/kreator" className={buttonVariants({ variant: "secondary" })}>
              <FileText aria-hidden="true" />
              {g.backToCreator}
            </Link>
          </div>

          <section aria-labelledby={`${ids}-zloz`} className="mt-12 border-t-2 border-border/40 pt-8 print:hidden">
            <h2 id={`${ids}-zloz`} className="text-xl font-bold text-foreground">
              {g.step4}
            </h2>

            {grant.status === "upcoming" && (
              <p className="mt-3 flex items-start gap-2 rounded-ui border-2 border-border bg-background px-4 py-3">
                <CalendarClock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-foreground" />
                <span>
                  {g.notStarted[0]}
                  <strong>{date(grant.opens_at)}</strong>
                  {g.notStarted[1]}
                  <strong>{date(grant.closes_at)}</strong>
                  {g.notStarted[2]}
                </span>
              </p>
            )}

            {grant.status === "open" &&
              (submitted ? (
                <div
                  ref={confirmationRef}
                  tabIndex={-1}
                  role="status"
                  className="mt-3 rounded-ui border-2 border-primary bg-primary/10 px-4 py-3 focus:outline-none"
                >
                  <p className="flex items-start gap-2 font-bold text-foreground">
                    <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-foreground" />
                    {g.submittedTitle(submitted.id, grant.name)}
                  </p>
                  <p className="mt-1 pl-7">
                    {g.submittedInfo(applicant.applicant_email)}
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-3 grid gap-4">
                  <p className="text-muted">
                    {g.deadline[0]}
                    <strong className="text-foreground">{date(grant.closes_at)}</strong>
                    {g.deadline[1]}
                  </p>
                  <div>
                    <label htmlFor={`${ids}-wnioskodawca`} className="block font-bold text-foreground">
                      {g.applicant}
                    </label>
                    <input
                      id={`${ids}-wnioskodawca`}
                      type="text"
                      required
                      autoComplete="name"
                      value={applicant.applicant_name}
                      onChange={(event) => setApplicant((current) => ({ ...current, applicant_name: event.target.value }))}
                      className={cn(FIELD_CLASS, "mt-2 min-h-12 py-2")}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${ids}-email`} className="block font-bold text-foreground">
                      {g.email}
                    </label>
                    <input
                      id={`${ids}-email`}
                      type="email"
                      required
                      autoComplete="email"
                      value={applicant.applicant_email}
                      onChange={(event) => setApplicant((current) => ({ ...current, applicant_email: event.target.value }))}
                      className={cn(FIELD_CLASS, "mt-2 min-h-12 py-2")}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${ids}-organizacja`} className="block font-bold text-foreground">
                      {g.organization} <span className="font-normal text-muted">{g.optional}</span>
                    </label>
                    <input
                      id={`${ids}-organizacja`}
                      type="text"
                      autoComplete="organization"
                      value={applicant.organization}
                      onChange={(event) => setApplicant((current) => ({ ...current, organization: event.target.value }))}
                      className={cn(FIELD_CLASS, "mt-2 min-h-12 py-2")}
                    />
                  </div>
                  {submitError && (
                    <p role="alert" className="flex items-start gap-2 rounded-ui border-2 border-destructive bg-surface px-4 py-3 font-bold text-destructive">
                      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                      {submitError}
                    </p>
                  )}
                  <div>
                    <Button type="submit" disabled={submitting || !hasContent}>
                      {submitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Send aria-hidden="true" />}
                      {submitting ? g.submitting : g.submit}
                    </Button>
                  </div>
                </form>
              ))}
          </section>
        </section>
      )}
    </>
  );
}
