"use client";

import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { CircleAlert, FileUp, ListChecks, Loader2, PenLine, Sparkles } from "lucide-react";

import {
  DictationButton,
  DictationNotice,
  DictationStatus,
  DictationSuggestion,
  useDictation,
} from "@/components/dictation";
import { IdeaCardEditor } from "@/components/idea-card-editor";
import { IdeaMatches } from "@/components/idea-matches";
import { IdeaWizard, type WizardAnswers } from "@/components/idea-wizard";
import { Button } from "@/components/ui/button";
import { TAG_GROUPS, type Tag } from "@/data/mock";
import { analyzeIdea, extractPdfText, type IdeaDraft } from "@/lib/ideas";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

// Kreator pomysłów: opis swobodny albo asystent krok po kroku → AI rozpisuje pomysł na pola fiszki
// (POST /api/ideas/analyze) → użytkownik poprawia fiszkę, dodaje pliki i zapisuje ją dla ROPS.

type Mode = "free" | "wizard";

/** Czas płynnej zmiany wysokości przy przełączeniu trybu. */
const MODE_MS = 320;

const MODES: Array<{ value: Mode; icon: typeof PenLine }> = [
  { value: "free", icon: PenLine },
  { value: "wizard", icon: ListChecks },
];

export function IdeaCreator() {
  const ids = useId();
  const t = useT();
  const c = t.creator;
  const fieldId = `${ids}-pomysl`;
  const errorId = `${ids}-blad`;
  const hintId = `${ids}-podpowiedz`;
  const dictationHintId = `${ids}-dyktowanie`;

  const [mode, setMode] = useState<Mode>("free");
  const [text, setText] = useState("");
  const [chosen, setChosen] = useState<Tag[]>([]);
  const [error, setError] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [card, setCard] = useState<{ draft: IdeaDraft; searchText: string; key: number } | null>(null);
  const [pdf, setPdf] = useState<{ status: "reading" | "done" | "error"; message: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const dictation = useDictation(setText, () => setError(false));

  // Zmiana trybu bez skoku treści: kontener płynnie zmienia wysokość ze starej na nową (reszta strony,
  // ze stopką, jedzie razem z nim), a nowa treść wjeżdża z boku — „Asystent” leży na prawo od „Opiszę sam”.
  // Przy prefers-reduced-motion zwykła podmiana.
  const bodyRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<"forward" | "back" | null>(null);

  function changeMode(value: Mode) {
    if (value === mode) return;
    const body = bodyRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!body || reduce) {
      setMode(value);
      setCard(null);
      return;
    }
    const from = body.offsetHeight;
    body.style.height = `${from}px`;
    flushSync(() => {
      setDirection(value === "wizard" ? "forward" : "back");
      setMode(value);
      setCard(null);
    });
    const to = (body.firstElementChild as HTMLElement | null)?.offsetHeight ?? from;
    body.style.overflow = "clip";
    // Klatka przerwy, żeby przeglądarka zapamiętała wysokość startową, potem przejście do nowej.
    requestAnimationFrame(() => {
      body.style.transition = `height ${MODE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
      body.style.height = `${to}px`;
    });
    window.setTimeout(() => {
      body.style.removeProperty("height");
      body.style.removeProperty("transition");
      body.style.removeProperty("overflow");
    }, MODE_MS + 50);
  }

  function toggleTag(tag: Tag) {
    setChosen((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  async function showCard(draft: Promise<IdeaDraft>, searchText: string) {
    setCard(null);
    setAnalyzing(true);
    const result = await draft;
    setAnalyzing(false);
    setCard((current) => ({ draft: result, searchText, key: (current?.key ?? 0) + 1 }));
  }

  function analyzeText(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const idea = text.trim();
    if (idea.length < 10) {
      setError(true);
      textareaRef.current?.focus();
      return;
    }
    setError(false);
    dictation.abort();
    void showCard(analyzeIdea(idea, chosen), idea);
  }

  // PDF → tekst (backend) → pole opisu → ta sama analiza co przy wpisanym opisie.
  async function readPdf(file: File | undefined) {
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    if (!file) return;
    dictation.abort();
    setPdf({ status: "reading", message: c.readingPdf(file.name) });
    try {
      const result = await extractPdfText(file);
      setText(result.text);
      setError(false);
      setPdf({ status: "done", message: c.pdfLoaded(file.name, result.pages, result.truncated) });
      void showCard(analyzeIdea(result.text, chosen), result.text);
    } catch (problem) {
      const code = (problem as Error).message;
      setPdf({ status: "error", message: c.pdfErrors[code] ?? code });
    }
  }

  function finishWizard(answers: WizardAnswers) {
    const idea = answers.idea.trim();
    const problem = answers.problem.trim();
    // Odpowiedzi z asystenta są pewniejsze niż to, co AI wyczyta z tekstu — mają pierwszeństwo.
    const draft = analyzeIdea(`${idea}\n${problem}`, []).then((analysis) => ({
      ...analysis,
      essence: idea,
      problem,
      forWhom: answers.forWhom.trim() || analysis.forWhom,
      place: answers.place.trim() || analysis.place,
      stage: answers.stage,
      budget: answers.budget.trim() || analysis.budget,
      partners: answers.partners.trim() || analysis.partners,
    }));
    void showCard(draft, problem || idea);
  }

  function editIdea() {
    setCard(null);
    if (mode === "free") textareaRef.current?.focus();
    else startRef.current?.focus();
  }

  return (
    <>
      <div ref={startRef} tabIndex={-1} className="mt-8 max-w-3xl focus:outline-none">
        <fieldset>
          <legend className="text-lg font-bold text-foreground">{c.howToStart}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {MODES.map(({ value, icon: Icon }) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 rounded-ui border-(length:--bw) border-border bg-surface p-4 hover:bg-background has-checked:border-primary has-checked:bg-primary/10"
              >
                <input
                  type="radio"
                  name={`${ids}-tryb`}
                  value={value}
                  checked={mode === value}
                  onChange={() => changeMode(value)}
                  disabled={analyzing}
                  className="mt-1 size-5 shrink-0 accent-primary"
                />
                <span>
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <Icon aria-hidden="true" className="size-5" />
                    {c.modes[value].label}
                  </span>
                  <span className="mt-1 block text-muted">{c.modes[value].text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* flow-root: marginesy treści nie wychodzą poza kontenery, więc pomiar wysokości jest dokładny. */}
      <div ref={bodyRef} className="flow-root">
        <div
          key={mode}
          className={cn(
            "flow-root",
            direction === "forward" && "step-in-forward",
            direction === "back" && "step-in-back",
          )}
        >
          {mode === "wizard" ? (
            // Po utworzeniu fiszki asystent znika (ale pamięta odpowiedzi) — „Popraw opis” wraca do pytań.
            <div hidden={Boolean(card)}>
              <IdeaWizard onFinish={finishWizard} busy={analyzing} />
            </div>
          ) : (
            <form onSubmit={analyzeText} noValidate className="mt-8 max-w-3xl">
              <label htmlFor={fieldId} className="block text-lg font-bold text-foreground">
                {c.describe}
              </label>
              <p id={hintId} className="mt-1 text-muted">
                {c.describeHint}
              </p>
              <textarea
                ref={textareaRef}
                id={fieldId}
                rows={5}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  if (event.target.value.trim().length >= 10) setError(false);
                }}
                aria-invalid={error || undefined}
                aria-describedby={[hintId, dictation.supported ? dictationHintId : null, error ? errorId : null]
                  .filter(Boolean)
                  .join(" ")}
                placeholder={c.describePlaceholder}
                className={cn(
                  "mt-2 min-h-[160px] w-full resize-y rounded-ui border-(length:--bw) bg-surface p-4 text-base text-foreground placeholder:text-muted",
                  error ? "border-destructive" : "border-border",
                )}
              />
              <div className="mt-3 flex flex-wrap items-start gap-3">
                <DictationButton dictation={dictation} />
                <label
                  className={cn(
                    "inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-ui border-(length:--bw) border-border bg-surface px-5 py-2 text-base font-bold text-foreground hover:bg-primary/10 has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-focus",
                    (analyzing || pdf?.status === "reading") && "pointer-events-none opacity-60",
                  )}
                >
                  {pdf?.status === "reading" ? <Loader2 aria-hidden="true" className="size-5 animate-spin" /> : <FileUp aria-hidden="true" className="size-5" />}
                  {c.loadPdf}
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    disabled={analyzing || pdf?.status === "reading"}
                    aria-describedby={`${ids}-pdf-opis`}
                    onChange={(event) => void readPdf(event.target.files?.[0])}
                    className="sr-only"
                  />
                </label>
              </div>
              <p id={`${ids}-pdf-opis`} className="mt-1 text-sm text-muted">
                {c.pdfHint}
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
              <DictationStatus dictation={dictation} />
              <DictationSuggestion dictation={dictation} />
              <DictationNotice dictation={dictation} id={dictationHintId} />
              {error && (
                <p
                  id={errorId}
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-ui border-2 border-destructive bg-surface px-4 py-3 font-bold text-destructive"
                >
                  <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                  {c.tooShort}
                </p>
              )}

              <fieldset className="mt-8">
                <legend className="text-lg font-bold text-foreground">{c.whatAbout}</legend>
                <p className="mt-1 text-muted">{c.whatAboutHint}</p>
                {TAG_GROUPS.map((group, groupIndex) => (
                  <div key={group.title} role="group" aria-labelledby={`${ids}-grupa-${groupIndex}`} className="mt-4">
                    <p id={`${ids}-grupa-${groupIndex}`} className="font-bold text-muted">
                      {c.tagGroups[groupIndex] ?? group.title}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {group.tags.map((tag) => {
                        const active = chosen.includes(tag);
                        return (
                          <li key={tag}>
                            <button
                              type="button"
                              aria-pressed={active}
                              onClick={() => toggleTag(tag)}
                              className={cn(
                                "inline-flex min-h-12 cursor-pointer items-center gap-1.5 rounded-ui border-(length:--bw) border-border px-4 py-2 text-base",
                                active ? "bg-primary/10 font-bold text-foreground" : "bg-surface text-foreground hover:bg-primary/10",
                              )}
                            >
                              {active && <span aria-hidden="true">✓</span>}
                              {t.tags[tag]}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </fieldset>

              <Button type="submit" disabled={analyzing} className="mt-8">
                {analyzing ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Sparkles aria-hidden="true" />}
                {c.analyze}
              </Button>
            </form>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className={cn("flex items-center gap-2 font-bold text-foreground", analyzing && "mt-4")}>
        {analyzing && (
          <>
            <span className="rounded-ui border-2 border-accent bg-accent px-3 py-1 text-accent-foreground">{c.aiAnalyzing}</span>
            {c.splitting}
          </>
        )}
      </p>

      {/* Zanim powstanie fiszka, podobne innowacje podpowiadamy już z samego opisu. */}
      {!card && !analyzing && mode === "free" && <IdeaMatches text={text} tags={chosen} />}

      {card && <IdeaCardEditor key={card.key} initial={card.draft} searchText={card.searchText} onEdit={editIdea} />}
    </>
  );
}
