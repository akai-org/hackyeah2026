"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, Loader2, Sparkles } from "lucide-react";

import { DictationButton, DictationStatus, DictationSuggestion, useDictation } from "@/components/dictation";
import { Button } from "@/components/ui/button";
import { STAGES } from "@/lib/ideas";
import { cn } from "@/lib/utils";

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

type TextStep = {
  kind: "text";
  key: "problem" | "idea" | "forWhom" | "place";
  question: string;
  hint: string;
  placeholder: string;
  required: boolean;
  rows: number;
};

type Step = TextStep | { kind: "stage"; question: string; hint: string } | { kind: "money"; question: string; hint: string };

const STEPS: Step[] = [
  {
    kind: "text",
    key: "problem",
    question: "Jaki problem chcesz rozwiązać?",
    hint: "Opisz, co się dzieje i kogo to dotyka. Własnymi słowami.",
    placeholder: "Na przykład: seniorzy w naszej wsi nie umieją umówić się do lekarza przez internet",
    required: true,
    rows: 4,
  },
  {
    kind: "text",
    key: "idea",
    question: "Co chcesz zrobić?",
    hint: "Na czym polega Twój pomysł i jak ma działać.",
    placeholder: "Na przykład: raz w tygodniu uczniowie liceum uczą seniorów w świetlicy obsługi smartfona",
    required: true,
    rows: 5,
  },
  {
    kind: "text",
    key: "forWhom",
    question: "Dla kogo jest ten pomysł?",
    hint: "Kto na nim skorzysta. Możesz pominąć ten krok.",
    placeholder: "Na przykład: seniorzy mieszkający samotnie",
    required: false,
    rows: 2,
  },
  {
    kind: "text",
    key: "place",
    question: "Gdzie chcesz to zrobić?",
    hint: "Gmina, miejscowość albo miejsce, np. świetlica. Możesz pominąć ten krok.",
    placeholder: "Na przykład: świetlica wiejska, gmina Racławice",
    required: false,
    rows: 2,
  },
  {
    kind: "stage",
    question: "Na jakim etapie jest pomysł?",
    hint: "Wybierz najbliższą odpowiedź.",
  },
  {
    kind: "money",
    question: "Ile to może kosztować i kto może pomóc?",
    hint: "Jeśli jeszcze nie wiesz, zostaw puste — uzupełnisz na fiszce.",
  },
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
        Krok {index + 1} z {STEPS.length}
      </p>
      <div
        role="progressbar"
        aria-label="Postęp asystenta"
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
                    {stage}
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
                Budżet
              </label>
              <input
                id={`${ids}-budzet`}
                type="text"
                value={answers.budget}
                onChange={(event) => setAnswer("budget")(() => event.target.value)}
                placeholder="np. ok. 5 tys. zł rocznie"
                className="mt-2 min-h-12 w-full rounded-ui border-(length:--bw) border-border bg-surface px-4 text-base text-foreground placeholder:text-muted"
              />
            </div>
            <div>
              <label htmlFor={`${ids}-partnerzy`} className="block font-bold text-foreground">
                Partnerzy
              </label>
              <input
                id={`${ids}-partnerzy`}
                type="text"
                value={answers.partners}
                onChange={(event) => setAnswer("partners")(() => event.target.value)}
                placeholder="np. GOPS, szkoła"
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
          Napisz choć jedno zdanie, żeby przejść dalej.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {index > 0 && (
          <Button type="button" variant="secondary" onClick={() => {
            setDirection("back");
            setIndex(index - 1);
          }} disabled={busy}>
            Wstecz
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
          {last ? (busy ? "AI układa fiszkę…" : "Utwórz fiszkę") : "Dalej"}
        </Button>
      </div>
    </form>
  );
}
