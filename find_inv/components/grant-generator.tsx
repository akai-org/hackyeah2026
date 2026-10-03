"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CircleAlert, CircleHelp, ExternalLink, FileText, Loader2, Printer, Sparkles, Trash2 } from "lucide-react";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { Button, buttonVariants } from "@/components/ui/button";
import { fillGrant, getGrants, parseStoredIdea, readStoredRaw, type Grant } from "@/lib/grants";
import { cn } from "@/lib/utils";

// Generator wniosków: wybór naboru → „Uzupełnij z fiszki” (z kreatora albo z wklejonego opisu) →
// AI wypełnia sekcje wniosku → użytkownik poprawia pola → druk / PDF przez window.print.

const FIELD_CLASS =
  "w-full rounded-ui border-(length:--bw) border-deep bg-surface p-4 text-base text-ink placeholder:text-muted";

// Fiszka trafia do sessionStorage w kreatorze; tu tylko ją czytamy (bez efektu — zgodnie z SSR).
const noSubscribe = () => () => {};

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
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const storedRaw = useSyncExternalStore(noSubscribe, readStoredRaw, () => null);
  const storedIdea = useMemo(() => parseStoredIdea(storedRaw), [storedRaw]);

  useEffect(() => {
    getGrants()
      .then((list) => {
        setGrants(list);
        setGrantId((current) => current || list[0]?.id || "");
      })
      .catch((error) => {
        console.error(error);
        setLoadError(true);
      });
  }, []);

  const grant = grants?.find((item) => item.id === grantId) ?? null;
  const hasContent = Object.values(values).some((value) => value.trim());

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

  function clear() {
    setValues({});
    setFilledFrom(null);
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
        Wczytuję wzory wniosków…
      </p>
    );
  }

  return (
    <>
      <div className="mt-8 max-w-3xl space-y-8 print:hidden">
        <AiDisclaimer />

        <fieldset>
          <legend className="text-lg font-bold text-deep">1. Wybierz nabór</legend>
          <div className="mt-2 grid gap-3">
            {grants.map((item) => (
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
                  disabled={filling}
                  className="mt-1 size-5 shrink-0 accent-deep"
                />
                <span>
                  <span className="block font-bold text-deep">{item.name}</span>
                  <span className="mt-1 block text-muted">{item.description}</span>
                  <span className="mt-1 block text-sm text-muted">Organizator: {item.organizer}</span>
                  {item.source_url && (
                    <a href={item.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-deep underline">
                      Wzór i regulamin <ExternalLink aria-hidden="true" className="size-4" />
                      <span className="sr-only">(otwiera się w nowej karcie)</span>
                    </a>
                  )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

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
              <Button type="button" onClick={() => fill("card")} disabled={filling || !grant} className="mt-3">
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
              albo wklej opis poniżej.
            </p>
          )}

          <label htmlFor={`${ids}-opis`} className="mt-6 block font-bold text-deep">
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
          <Button type="button" variant="secondary" onClick={() => fill("text")} disabled={filling || !grant} className="mt-3">
            {filling ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Sparkles aria-hidden="true" />}
            Uzupełnij z opisu
          </Button>

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
      </div>

      {grant && (
        <section aria-labelledby={`${ids}-wniosek`} className="mt-12 max-w-3xl print:mt-0 print:max-w-none">
          <h2 id={`${ids}-wniosek`} ref={formHeadingRef} tabIndex={-1} className="text-xl font-bold text-deep focus:outline-none print:text-2xl">
            <span className="print:hidden">3. Wniosek: </span>
            {grant.name}
          </h2>
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
                    onChange={(event) => setValues((current) => ({ ...current, [section.id]: event.target.value }))}
                    aria-describedby={`${fieldId}-podpowiedz ${fieldId}-licznik`}
                    aria-invalid={over || undefined}
                    className={cn(FIELD_CLASS, "mt-2 resize-y print:hidden", over && "border-alert")}
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
            <Button type="button" onClick={() => window.print()} disabled={!hasContent}>
              <Printer aria-hidden="true" />
              Drukuj / zapisz jako PDF
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (window.confirm("Wyczyścić wszystkie pola wniosku?")) clear();
              }}
              disabled={!hasContent}
            >
              <Trash2 aria-hidden="true" />
              Wyczyść pola
            </Button>
            <Link href="/kreator" className={buttonVariants({ variant: "secondary" })}>
              <FileText aria-hidden="true" />
              Wróć do Kreatora
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
