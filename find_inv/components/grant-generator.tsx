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
import { cn, plural } from "@/lib/utils";

// Generator wniosków: wybór naboru → „Uzupełnij z fiszki” (z kreatora albo z wklejonego opisu) →
// AI wypełnia sekcje wniosku → użytkownik poprawia pola → druk / PDF → złożenie wniosku.
// Złożyć wniosek można TYLKO w trakcie naboru (status „open”, pilnuje też backend). Przed otwarciem
// naboru wniosek da się przygotować i wydrukować; zakończone nabory są tylko do wglądu.

const FIELD_CLASS =
  "w-full rounded-ui border-(length:--bw) border-deep bg-surface p-4 text-base text-ink placeholder:text-muted";

// Fiszka trafia do sessionStorage w kreatorze; tu tylko ją czytamy (bez efektu — zgodnie z SSR).
const noSubscribe = () => () => {};

const EMPTY_APPLICANT: Applicant = { applicant_name: "", applicant_email: "", organization: "" };

/** Termin naboru słowem i ikoną (nie tylko kolorem). */
function CallStatusBadge({ grant }: { grant: Grant }) {
  if (grant.status === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-ui border-2 border-leaf bg-mint px-2.5 py-0.5 text-sm font-bold text-ink">
        <CalendarClock aria-hidden="true" className="size-4 text-deep" />
        Nabór trwa — wnioski do {formatCallDate(grant.closes_at)}
      </span>
    );
  }
  if (grant.status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-ui border-2 border-deep bg-paper px-2.5 py-0.5 text-sm font-bold text-ink">
        <CalendarClock aria-hidden="true" className="size-4 text-deep" />
        Nabór od {formatCallDate(grant.opens_at)} do {formatCallDate(grant.closes_at)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-ui border-2 border-muted bg-sage px-2.5 py-0.5 text-sm font-bold text-ink">
      <CalendarX2 aria-hidden="true" className="size-4" />
      Zakończony {formatCallDate(grant.closes_at)}
    </span>
  );
}

function CallDetails({ grant }: { grant: Grant }) {
  return (
    <>
      <span className="block font-bold text-deep">{grant.name}</span>
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
          className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-deep underline"
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

  // PDF → tekst (backend, ten sam endpoint co w Kreatorze) → pole opisu → od razu uzupełnienie wniosku.
  async function readPdf(file: File | undefined) {
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    if (!file) return;
    setPdf({ status: "reading", message: `Czytam plik ${file.name}…` });
    try {
      const result = await extractPdfText(file);
      setIdeaText(result.text);
      const pages = `${result.pages} ${plural(result.pages, "strona", "strony", "stron")}`;
      setPdf({
        status: "done",
        message: `Wczytano opis z pliku ${file.name} (${pages})${result.truncated ? " — długi plik, wzięto tylko początek" : ""}. Możesz go poprawić w polu opisu.`,
      });
      await fill("text", result.text);
    } catch (problem) {
      setPdf({ status: "error", message: (problem as Error).message });
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
      <p role="alert" className="mt-8 flex max-w-3xl items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert">
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
          <legend className="text-lg font-bold text-deep">1. Wybierz nabór</legend>
          <p className="mt-1 text-muted">
            Wniosek złożysz tylko w trakcie naboru. Na nabór, który dopiero się zacznie, możesz przygotować wniosek
            wcześniej.
          </p>
          {available.length ? (
            <div className="mt-3 grid gap-3">
              {available.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-3 rounded-ui border-(length:--bw) border-deep bg-surface p-4 has-checked:bg-mint"
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
                    className="mt-1 size-5 shrink-0 accent-deep"
                  />
                  <span>
                    <CallDetails grant={item} />
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-ui border-2 border-deep bg-surface px-4 py-3">
              Teraz nie trwa ani nie jest zaplanowany żaden nabór. Sprawdź stronę później.
            </p>
          )}
          {closed.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer font-bold text-deep">Zakończone nabory ({closed.length})</summary>
              <ul className="mt-3 grid gap-3">
                {closed.map((item) => (
                  <li key={item.id} className="rounded-ui border-2 border-sage bg-paper p-4">
                    <CallDetails grant={item} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </fieldset>

        {grant && (
          <section aria-labelledby={`${ids}-zrodlo`}>
            <h2 id={`${ids}-zrodlo`} className="text-lg font-bold text-deep">
              2. Skąd wziąć treść?
            </h2>
            {storedIdea ? (
              <div className="mt-2 rounded-ui border-(length:--bw) border-deep bg-surface p-4">
                <p className="flex items-center gap-2 font-bold text-deep">
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
                <Link href="/kreator" className="font-bold text-deep underline">
                  Utwórz ją w Kreatorze pomysłów
                </Link>{" "}
                albo wklej opis poniżej lub wczytaj go z pliku PDF.
              </p>
            )}

            <label htmlFor={`${ids}-opis`} className="mt-6 block font-bold text-deep">
              {storedIdea ? "albo wklej inny opis pomysłu lub wczytaj go z PDF" : "Opis pomysłu (wpisz albo wczytaj z PDF)"}
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
            <div className="mt-3 flex flex-wrap items-start gap-3">
              <Button type="button" variant="secondary" onClick={() => fill("text")} disabled={filling || locked}>
                {filling ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Sparkles aria-hidden="true" />}
                Uzupełnij z opisu
              </Button>
              <label
                className={cn(
                  "inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-ui border-(length:--bw) border-deep bg-surface px-5 py-2 text-base font-bold text-deep hover:bg-sage has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-deep",
                  (filling || locked || pdf?.status === "reading") && "pointer-events-none opacity-60",
                )}
              >
                {pdf?.status === "reading" ? (
                  <Loader2 aria-hidden="true" className="size-5 animate-spin" />
                ) : (
                  <FileUp aria-hidden="true" className="size-5" />
                )}
                Wczytaj opis z PDF
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
              PDF do 10 MB z tekstem (np. opis projektu, notatka). Skanu bez warstwy tekstowej nie odczytamy.
            </p>
            <p role="status" aria-live="polite" className={cn(pdf && pdf.status !== "error" && "mt-2 text-deep")}>
              {pdf && pdf.status !== "error" && pdf.message}
            </p>
            {pdf?.status === "error" && (
              <p role="alert" className="mt-2 flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                {pdf.message}
              </p>
            )}

            <div role="status" aria-live="polite">
              {filling && <p className="mt-3 font-bold text-deep">AI pisze sekcje wniosku…</p>}
            </div>
            {fillError && (
              <p role="alert" className="mt-3 flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                {fillError}
              </p>
            )}
          </section>
        )}
      </div>

      {grant && (
        <section aria-labelledby={`${ids}-wniosek`} className="mt-12 max-w-3xl print:mt-0 print:max-w-none">
          <h2 id={`${ids}-wniosek`} ref={formHeadingRef} tabIndex={-1} className="text-xl font-bold text-deep focus:outline-none print:text-2xl">
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
                  <label htmlFor={fieldId} className="block font-bold text-deep">
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
                    className={cn(FIELD_CLASS, "mt-2 resize-y read-only:bg-paper print:hidden", over && "border-alert")}
                  />
                  {/* Na wydruku pole tekstowe ucina treść — drukujemy zwykły tekst. */}
                  <p className="hidden whitespace-pre-wrap print:block">{value || "—"}</p>
                  <p id={`${fieldId}-licznik`} className="mt-1 flex flex-wrap items-center gap-x-4 text-sm print:hidden">
                    <span className={cn("tabular-nums", over ? "font-bold text-alert" : "text-muted")}>
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

          <section aria-labelledby={`${ids}-zloz`} className="mt-12 border-t-2 border-sage pt-8 print:hidden">
            <h2 id={`${ids}-zloz`} className="text-xl font-bold text-deep">
              4. Złóż wniosek
            </h2>

            {grant.status === "upcoming" && (
              <p className="mt-3 flex items-start gap-2 rounded-ui border-2 border-deep bg-paper px-4 py-3">
                <CalendarClock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-deep" />
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
                  className="mt-3 rounded-ui border-2 border-leaf bg-mint px-4 py-3 focus:outline-none"
                >
                  <p className="flex items-start gap-2 font-bold text-ink">
                    <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-deep" />
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
                    Wnioski przyjmujemy do <strong className="text-ink">{formatCallDate(grant.closes_at)}</strong> (do końca
                    dnia). Wszystkie sekcje muszą być uzupełnione.
                  </p>
                  <div>
                    <label htmlFor={`${ids}-wnioskodawca`} className="block font-bold text-deep">
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
                    <label htmlFor={`${ids}-email`} className="block font-bold text-deep">
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
                    <label htmlFor={`${ids}-organizacja`} className="block font-bold text-deep">
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
                    <p role="alert" className="flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert">
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
