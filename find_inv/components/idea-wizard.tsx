"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, Loader2, Sparkles } from "lucide-react";

import { DictationButton, DictationStatus, DictationSuggestion, useDictation } from "@/components/dictation";
import { Button } from "@/components/ui/button";
import { STAGES } from "@/lib/ideas";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

// Asystent krok po kroku: jedno pytanie na ekran, odpowiedzi trafiają wprost do pól fiszki.

export type WizardAnswers = {
  problem: string;
  idea: string;
  forWhom: string;
  place: string;
  stage: string;
  budget: string;
  partners: string;
};

type StepText = { question: string; hint: string; placeholder: string };

type TextStep = StepText & {
  kind: "text";
  key: "problem" | "idea" | "forWhom" | "place";
  required: boolean;
  rows: number;
};

type Step = TextStep | (StepText & { kind: "stage" }) | (StepText & { kind: "money" });

// Treść pytań jest w słowniku (creator.wizard.steps) — tu tylko budowa kroków w tej samej kolejności.
type StepShape = Omit<TextStep, keyof StepText> | { kind: "stage" } | { kind: "money" };

const STEP_SHAPES: StepShape[] = [
  { kind: "text", key: "problem", required: true, rows: 4 },
  { kind: "text", key: "idea", required: true, rows: 5 },
  { kind: "text", key: "forWhom", required: false, rows: 2 },
  { kind: "text", key: "place", required: false, rows: 2 },
  { kind: "stage" },
  { kind: "money" },
];

function TextAnswer({
  step,
  value,
  onChange,
  invalid,
  inputRef,
}: {
  step: TextStep;
  value: string;
  onChange: (update: (previous: string) => string) => void;
  invalid: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const ids = useId();
  const dictation = useDictation(onChange);
  return (
    <>
      <label htmlFor={`${ids}-odp`} className="sr-only">
        {step.question}
      </label>
      <textarea
        ref={inputRef}
        id={`${ids}-odp`}
        rows={step.rows}
        value={value}
        onChange={(event) => onChange(() => event.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={`${ids}-podp`}
        placeholder={step.placeholder}
        className={cn(
          "mt-4 w-full resize-y rounded-ui border-(length:--bw) bg-surface p-4 text-base text-foreground placeholder:text-muted",
          invalid ? "border-destructive" : "border-border",
        )}
      />
      <p id={`${ids}-podp`} className="sr-only">
        {step.hint}
      </p>
      <DictationButton dictation={dictation} className="mt-3" />
      <DictationStatus dictation={dictation} />
      <DictationSuggestion dictation={dictation} />
    </>
  );
}

export function IdeaWizard({ onFinish, busy }: { onFinish: (answers: WizardAnswers) => void; busy: boolean }) {
  const ids = useId();
  const t = useT();
  const w = t.creator.wizard;
  const STEPS = STEP_SHAPES.map((shape, i) => ({ ...shape, ...w.steps[i] }) as Step);
  const [index, setIndex] = useState(0);
  // Kierunek ostatniego kroku: „Dalej” wjeżdża z prawej, „Wstecz” z lewej.
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [answers, setAnswers] = useState<WizardAnswers>({
    problem: "",
    idea: "",
    forWhom: "",
    place: "",
    stage: STAGES[0],
    budget: "",
    partners: "",
  });
  const [invalid, setInvalid] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const firstRender = useRef(true);

  // Przy zmianie kroku focus na pytanie — czytnik ekranu odczyta je jako pierwsze.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [index]);

  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  function setAnswer(key: keyof WizardAnswers) {
    return (update: (previous: string) => string) => {
      setAnswers((current) => ({ ...current, [key]: update(current[key]) }));
      setInvalid(false);
    };
  }

  function next(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step.kind === "text" && step.required && answers[step.key].trim().length < 5) {
      setInvalid(true);
      answerRef.current?.focus();
      return;
    }
    setInvalid(false);
    if (last) onFinish(answers);
    else {
      setDirection("forward");
      setIndex(index + 1);
    }
  }

  return (
    <form onSubmit={next} noValidate className="mt-8 max-w-3xl rounded-ui border-(length:--bw) border-border bg-surface p-6 sm:p-8">
      <p className="font-bold text-muted">
        {w.step(index + 1, STEPS.length)}
      </p>
      <div
        role="progressbar"
        aria-label={w.progress}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={index + 1}
        className="mt-2 h-2 overflow-hidden rounded-ui bg-secondary"
      >
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* key: każdy krok to nowy element, więc animacja wejścia gra przy każdej zmianie. */}
      <div key={index} className={direction === "forward" ? "step-in-forward" : "step-in-back"}>
        <h2 ref={headingRef} tabIndex={-1} id={`${ids}-pytanie`} className="mt-6 text-2xl font-bold text-foreground">
          {step.question}
        </h2>
        <p className="mt-1 text-muted">{step.hint}</p>

        {step.kind === "text" && (
          <TextAnswer
            key={step.key}
            step={step}
            value={answers[step.key]}
            onChange={setAnswer(step.key)}
            invalid={invalid}
            inputRef={answerRef}
          />
        )}

        {step.kind === "stage" && (
          <fieldset className="mt-4" aria-labelledby={`${ids}-pytanie`}>
            <ul className="space-y-2">
              {STAGES.map((stage) => (
                <li key={stage}>
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-ui border-(length:--bw) border-border bg-surface px-4 has-checked:bg-primary/10">
                    <input
                      type="radio"
                      name={`${ids}-etap`}
                      value={stage}
                      checked={answers.stage === stage}
                      onChange={() => setAnswer("stage")(() => stage)}
                      className="size-5 accent-primary"
                    />
                    {t.creator.stages[STAGES.indexOf(stage)] ?? stage}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        {step.kind === "money" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${ids}-budzet`} className="block font-bold text-foreground">
                {w.budget}
              </label>
              <input
                id={`${ids}-budzet`}
                type="text"
                value={answers.budget}
                onChange={(event) => setAnswer("budget")(() => event.target.value)}
                placeholder={w.budgetPlaceholder}
                className="mt-2 min-h-12 w-full rounded-ui border-(length:--bw) border-border bg-surface px-4 text-base text-foreground placeholder:text-muted"
              />
            </div>
            <div>
              <label htmlFor={`${ids}-partnerzy`} className="block font-bold text-foreground">
                {w.partners}
              </label>
              <input
                id={`${ids}-partnerzy`}
                type="text"
                value={answers.partners}
                onChange={(event) => setAnswer("partners")(() => event.target.value)}
                placeholder={w.partnersPlaceholder}
                className="mt-2 min-h-12 w-full rounded-ui border-(length:--bw) border-border bg-surface px-4 text-base text-foreground placeholder:text-muted"
              />
            </div>
          </div>
        )}
      </div>

      {invalid && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-ui border-2 border-destructive bg-surface px-4 py-3 font-bold text-destructive"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {w.oneSentence}
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {index > 0 && (
          <Button type="button" variant="secondary" onClick={() => {
            setDirection("back");
            setIndex(index - 1);
          }} disabled={busy}>
            {w.back}
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {last ? (
            busy ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : (
              <Sparkles aria-hidden="true" />
            )
          ) : null}
          {last ? (busy ? w.building : w.create) : w.next}
        </Button>
      </div>
    </form>
  );
}
