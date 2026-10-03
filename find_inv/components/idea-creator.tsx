"use client";

import { useId, useRef, useState } from "react";
import { CircleAlert, ListChecks, Loader2, PenLine, Sparkles } from "lucide-react";

import { DictationButton, DictationNotice, DictationStatus, useDictation } from "@/components/dictation";
import { IdeaCardEditor } from "@/components/idea-card-editor";
import { IdeaWizard, type WizardAnswers } from "@/components/idea-wizard";
import { Button } from "@/components/ui/button";
import { TAG_GROUPS, TAG_LABELS, type Tag } from "@/data/mock";
import { analyzeIdea, type IdeaDraft } from "@/lib/ideas";
import { cn } from "@/lib/utils";

// Kreator pomysłów: opis swobodny albo asystent krok po kroku → AI rozpisuje pomysł na pola fiszki
// (POST /api/ideas/analyze) → użytkownik poprawia fiszkę, dodaje pliki i zapisuje ją dla ROPS.

type Mode = "free" | "wizard";

const MODES: Array<{ value: Mode; label: string; text: string; icon: typeof PenLine }> = [
  { value: "free", label: "Opiszę pomysł sam", text: "Jeden opis własnymi słowami — AI rozpisze go na fiszkę.", icon: PenLine },
  { value: "wizard", label: "Asystent krok po kroku", text: "Odpowiesz na 6 krótkich pytań, jedno po drugim.", icon: ListChecks },
];

export function IdeaCreator() {
  const ids = useId();
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const dictation = useDictation(setText, () => setError(false));

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
          <legend className="text-lg font-bold text-foreground">Jak chcesz zacząć?</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {MODES.map(({ value, label, text: description, icon: Icon }) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 rounded-ui border-(length:--bw) border-border bg-surface p-4 has-checked:border-primary has-checked:bg-primary/10"
              >
                <input
                  type="radio"
                  name={`${ids}-tryb`}
                  value={value}
                  checked={mode === value}
                  onChange={() => {
                    setMode(value);
                    setCard(null);
                  }}
                  disabled={analyzing}
                  className="mt-1 size-5 shrink-0 accent-primary"
                />
                <span>
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <Icon aria-hidden="true" className="size-5" />
                    {label}
                  </span>
                  <span className="mt-1 block text-muted">{description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {mode === "wizard" ? (
        // Po utworzeniu fiszki asystent znika (ale pamięta odpowiedzi) — „Popraw opis” wraca do pytań.
        <div hidden={Boolean(card)}>
          <IdeaWizard onFinish={finishWizard} busy={analyzing} />
        </div>
      ) : (
        <form onSubmit={analyzeText} noValidate className="mt-8 max-w-3xl">
          <label htmlFor={fieldId} className="block text-lg font-bold text-foreground">
            Opisz swój pomysł społeczny
          </label>
          <p id={hintId} className="mt-1 text-muted">
            Co chcesz zrobić, dla kogo i gdzie. Możesz dodać, na jakim etapie jest pomysł, ile może kosztować i kto
            pomoże — AI rozpisze to na pola fiszki.
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
            placeholder="Na przykład: chcę zorganizować w świetlicy wiejskiej spotkania, na których młodzież uczy seniorów obsługi smartfona"
            className={cn(
              "mt-2 min-h-[160px] w-full resize-y rounded-ui border-(length:--bw) bg-surface p-4 text-base text-foreground placeholder:text-muted",
              error ? "border-destructive" : "border-border",
            )}
          />
          <DictationButton dictation={dictation} className="mt-3" />
          <DictationStatus dictation={dictation} />
          <DictationNotice dictation={dictation} id={dictationHintId} />
          {error && (
            <p
              id={errorId}
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-ui border-2 border-destructive bg-surface px-4 py-3 font-bold text-destructive"
            >
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              Opisz pomysł w co najmniej jednym zdaniu, żeby AI mogło go przeanalizować.
            </p>
          )}

          <fieldset className="mt-8">
            <legend className="text-lg font-bold text-foreground">Czego dotyczy pomysł?</legend>
            <p className="mt-1 text-muted">Nieobowiązkowe. Resztę tagów zaproponuje AI.</p>
            {TAG_GROUPS.map((group, groupIndex) => (
              <div key={group.title} role="group" aria-labelledby={`${ids}-grupa-${groupIndex}`} className="mt-4">
                <p id={`${ids}-grupa-${groupIndex}`} className="font-bold text-muted">
                  {group.title}
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
                            active ? "bg-primary font-bold text-primary-foreground" : "bg-surface text-foreground hover:bg-secondary/60",
                          )}
                        >
                          {active && <span aria-hidden="true">✓</span>}
                          {TAG_LABELS[tag]}
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
            Analizuj pomysł
          </Button>
        </form>
      )}

      <p role="status" aria-live="polite" className={cn("flex items-center gap-2 font-bold text-foreground", analyzing && "mt-4")}>
        {analyzing && (
          <>
            <span className="rounded-ui border-2 border-accent bg-accent px-3 py-1 text-accent-foreground">AI analizuje pomysł</span>
            Rozpisuję opis na pola fiszki…
          </>
        )}
      </p>

      {card && <IdeaCardEditor key={card.key} initial={card.draft} searchText={card.searchText} onEdit={editIdea} />}
    </>
  );
}
