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
import { cn } from "@/lib/utils";

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
  if (grant.status === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-ui border-2 border-primary bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-foreground">
        <CalendarClock aria-hidden="true" className="size-4 text-foreground" />
        Nabór trwa — wnioski do {formatCallDate(grant.closes_at)}
      </span>
    );
  }
  if (grant.status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-ui border-2 border-border bg-background px-2.5 py-0.5 text-sm font-bold text-foreground">
        <CalendarClock aria-hidden="true" className="size-4 text-foreground" />
        Nabór od {formatCallDate(grant.opens_at)} do {formatCallDate(grant.closes_at)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-ui border-2 border-border bg-secondary px-2.5 py-0.5 text-sm font-bold text-foreground">
      <CalendarX2 aria-hidden="true" className="size-4" />
      Zakończony {formatCallDate(grant.closes_at)}
    </span>
  );
}

function CallDetails({ grant }: { grant: Grant }) {
  return (
    <>
      <span className="block font-bold text-foreground">{grant.name}</span>
      <span className="mt-1 block">
        <CallStatusBadge grant={grant} />
      </span>
      <span className="mt-1 block text-sm text-muted">
        Organizator: {grant.organizer} · wzór: {grant.template.name}
        {grant.demo && " · przykładowy nabór (dane demonstracyjne)"}
      </span>
      {grant.template.source_url && (
        <a
          href={grant.template.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-foreground underline"
        >
          Wzór i regulamin <ExternalLink aria-hidden="true" className="size-4" />
          <span className="sr-only">(otwiera się w nowej karcie)</span>
        </a>
      )}
    </>
  );
}

export function GrantGenerator() {
  const ids = useId();
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

  async function fill(source: "card" | "text") {
    if (!grant) return;
    const idea = source === "card" ? storedIdea : ideaText.trim();
    if (!idea || (typeof idea === "string" && idea.length < 10)) {
      setFillError("Wklej opis pomysłu (co najmniej jedno zdanie) albo utwórz fiszkę w Kreatorze.");
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
          ? "Brak połączenia z serwerem. Spróbuj ponownie za chwilę."
          : `Nie udało się uzupełnić wniosku: ${(error as Error).message}`,
      );
    } finally {
      setFilling(false);
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
        error instanceof TypeError ? "Brak połączenia z serwerem. Spróbuj ponownie za chwilę." : (error as Error).message,
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
        Nie udało się pobrać listy naborów. Sprawdź, czy serwer działa, i odśwież stronę.
      </p>
    );
  }

  if (!grants) {
    return (
      <p role="status" className="mt-8 flex items-center gap-2 text-muted">
        <Loader2 aria-hidden="true" className="size-5 animate-spin" />
        Wczytuję nabory…
      </p>
    );
  }

  return (
    <>
      <div className="mt-8 max-w-3xl space-y-8 print:hidden">
        <AiDisclaimer />

        <fieldset>
          <legend className="text-lg font-bold text-foreground">1. Wybierz nabór</legend>
          <p className="mt-1 text-muted">
            Wniosek złożysz tylko w trakcie naboru. Na nabór, który dopiero się zacznie, możesz przygotować wniosek
            wcześniej.
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
                      if (hasContent && !window.confirm("Zmiana naboru wyczyści uzupełnione pola wniosku. Kontynuować?")) return;
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
              Teraz nie trwa ani nie jest zaplanowany żaden nabór. Sprawdź stronę później.
            </p>
          )}
          {closed.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer font-bold text-foreground">Zakończone nabory ({closed.length})</summary>
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
              2. Skąd wziąć treść?
            </h2>
            {storedIdea ? (
              <div className="mt-2 rounded-ui border-(length:--bw) border-border bg-surface p-4">
                <p className="flex items-center gap-2 font-bold text-foreground">
                  <FileText aria-hidden="true" className="size-5" />
                  Fiszka z Kreatora: {storedIdea.title || "bez tytułu"}
                </p>
                <p className="mt-1 text-muted">{storedIdea.shortDesc || storedIdea.essence.slice(0, 160)}</p>
                <Button type="button" onClick={() => fill("card")} disabled={filling || locked} className="mt-3">
                  {filling ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Sparkles aria-hidden="true" />}
                  Uzupełnij z fiszki
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-muted">
                Nie masz jeszcze fiszki?{" "}
                <Link href="/kreator" className="font-bold text-foreground underline">
                  Utwórz ją w Kreatorze pomysłów
                </Link>{" "}
                albo wklej opis poniżej.
              </p>
            )}

            <label htmlFor={`${ids}-opis`} className="mt-6 block font-bold text-foreground">
              {storedIdea ? "albo wklej inny opis pomysłu" : "Opis pomysłu"}
            </label>
            <textarea
              ref={textRef}
              id={`${ids}-opis`}
              rows={5}
              value={ideaText}
              onChange={(event) => setIdeaText(event.target.value)}
              placeholder="Co chcecie zrobić, dla kogo, gdzie, z kim i za ile"
              className={cn(FIELD_CLASS, "mt-2 resize-y")}
            />
            <Button type="button" variant="secondary" onClick={() => fill("text")} disabled={filling || locked} className="mt-3">
              {filling ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Sparkles aria-hidden="true" />}
              Uzupełnij z opisu
            </Button>

            <div role="status" aria-live="polite">
              {filling && <p className="mt-3 font-bold text-foreground">AI pisze sekcje wniosku…</p>}
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
            <span className="print:hidden">3. Wniosek: </span>
            {grant.name}
          </h2>
          <p className="mt-1 text-muted">
            {grant.template.name} · {grant.organizer} · nabór {formatCallDate(grant.opens_at)} –{" "}
            {formatCallDate(grant.closes_at)}
          </p>
          {filledFrom && (
            <p className="mt-2 flex items-start gap-1.5 text-muted print:hidden">
              <Sparkles aria-hidden="true" className="mt-1 size-4 shrink-0" />
              {filledFrom === "llm"
                ? "AI napisało szkic sekcji z Twojej fiszki. Popraw je i uzupełnij miejsca oznaczone „[do uzupełnienia]”."
                : "Sekcje wypełniono polami fiszki (AI jest teraz niedostępne). Popraw je i uzupełnij brakujące miejsca."}
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
                      {value.length} / {section.max_chars} znaków{over && " — za długo"}
                    </span>
                    {todo && (
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <CircleHelp aria-hidden="true" className="size-4" />
                        do uzupełnienia
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
              Drukuj / zapisz jako PDF
            </Button>
            {!submitted && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (window.confirm("Wyczyścić wszystkie pola wniosku?")) clear();
                }}
                disabled={!hasContent || submitting}
              >
                <Trash2 aria-hidden="true" />
                Wyczyść pola
              </Button>
            )}
            <Link href="/kreator" className={buttonVariants({ variant: "secondary" })}>
              <FileText aria-hidden="true" />
              Wróć do Kreatora
            </Link>
          </div>

          <section aria-labelledby={`${ids}-zloz`} className="mt-12 border-t-2 border-border/40 pt-8 print:hidden">
            <h2 id={`${ids}-zloz`} className="text-xl font-bold text-foreground">
              4. Złóż wniosek
            </h2>

            {grant.status === "upcoming" && (
              <p className="mt-3 flex items-start gap-2 rounded-ui border-2 border-border bg-background px-4 py-3">
                <CalendarClock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-foreground" />
                <span>
                  Nabór jeszcze się nie rozpoczął. Wnioski przyjmujemy od <strong>{formatCallDate(grant.opens_at)}</strong>{" "}
                  do <strong>{formatCallDate(grant.closes_at)}</strong>. Przygotuj wniosek już teraz i wydrukuj go albo zapisz
                  jako PDF — złożysz go po otwarciu naboru.
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
                    Wniosek złożony (nr {submitted.id}) w naborze „{grant.name}”.
                  </p>
                  <p className="mt-1 pl-7">
                    Organizator skontaktuje się z Tobą pod adresem {applicant.applicant_email}. Wydrukuj albo zapisz wniosek jako
                    PDF na pamiątkę.
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-3 grid gap-4">
                  <p className="text-muted">
                    Wnioski przyjmujemy do <strong className="text-foreground">{formatCallDate(grant.closes_at)}</strong> (do końca
                    dnia). Wszystkie sekcje muszą być uzupełnione.
                  </p>
                  <div>
                    <label htmlFor={`${ids}-wnioskodawca`} className="block font-bold text-foreground">
                      Wnioskodawca (imię i nazwisko albo nazwa organizacji)
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
                      E-mail do kontaktu
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
                      Organizacja lub grupa <span className="font-normal text-muted">(nieobowiązkowe)</span>
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
                      {submitting ? "Składam wniosek…" : "Złóż wniosek"}
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
