"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Bot, CircleAlert, CircleHelp, Info, Loader2, MessageSquareText, Printer, RotateCcw, Send } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import type { InnovationCard } from "@/data/innovations";
import { getInnovation } from "@/lib/matchmaking";
import { answerMiddleman, startMiddleman, type Plan } from "@/lib/middleman";
import { cn } from "@/lib/utils";

// Middleman (DESIGN.md 8, „Plan wdrożenia”): krótki wywiad z AI, potem plan jako zwykły dokument.
// Plan ma pasek „To jest szkic…”, braki oznaczone ikoną i tekstem, wydruk do PDF przez window.print().

const INSTITUTION_TYPES = [
  "Gmina wiejska",
  "Gmina miejsko-wiejska",
  "Miasto",
  "Ośrodek pomocy społecznej",
  "Centrum usług społecznych",
  "Organizacja pozarządowa",
  "Szkoła lub placówka oświatowa",
  "Inna instytucja",
];

type Turn = { question: string; answer?: string };
type Stage = "form" | "starting" | "interview" | "thinking" | "plan";

function Missing() {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <CircleHelp aria-hidden="true" className="size-5 shrink-0" />
      do uzupełnienia
    </span>
  );
}

const fieldClass =
  "mt-2 min-h-12 w-full rounded-ui border-(length:--bw) bg-surface px-4 text-base text-ink placeholder:text-muted";

export function Middleman({ innovationId, initialProblem }: { innovationId: number; initialProblem: string }) {
  const ids = useId();
  const [innovation, setInnovation] = useState<InnovationCard | null | undefined>(undefined);
  const [institution, setInstitution] = useState(INSTITUTION_TYPES[0]);
  const [location, setLocation] = useState("");
  const [problem, setProblem] = useState(initialProblem);
  const [problemError, setProblemError] = useState(false);

  const [stage, setStage] = useState<Stage>("form");
  const [sessionId, setSessionId] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [answer, setAnswer] = useState("");
  const [answerError, setAnswerError] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [failed, setFailed] = useState(false);

  const problemRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const planHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    getInnovation(innovationId).then(setInnovation);
  }, [innovationId]);

  // Nowe pytanie → focus na polu odpowiedzi; plan → focus na jego nagłówku.
  useEffect(() => {
    if (stage === "interview") answerRef.current?.focus();
    if (stage === "plan") planHeadingRef.current?.focus();
  }, [stage, turns.length]);

  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!problem.trim()) {
      setProblemError(true);
      problemRef.current?.focus();
      return;
    }
    setFailed(false);
    setStage("starting");
    try {
      const result = await startMiddleman(
        {
          innovation_id: innovationId,
          institution_type: institution,
          location: location.trim(),
          problem_desc: problem.trim(),
        },
        innovation ?? null,
      );
      setSessionId(result.session_id);
      setTurns([{ question: result.first_question }]);
      setStage("interview");
    } catch {
      setFailed(true);
      setStage("form");
    }
  }

  async function reply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = answer.trim();
    if (!text) {
      setAnswerError(true);
      answerRef.current?.focus();
      return;
    }
    setAnswerError(false);
    setFailed(false);
    setTurns((current) =>
      current.map((turn, index) => (index === current.length - 1 ? { ...turn, answer: text } : turn)),
    );
    setAnswer("");
    setStage("thinking");

    try {
      let got = false;
      for await (const event of answerMiddleman(sessionId, text)) {
        got = true;
        if (event.type === "plan") {
          setPlan(event.content);
          setStage("plan");
          return;
        }
        setTurns((current) => [...current, { question: event.content }]);
      }
      if (!got) throw new Error("Pusta odpowiedź");
      setStage("interview");
    } catch {
      // Odpowiedź wraca do pola, żeby nie trzeba było jej pisać od nowa.
      setTurns((current) =>
        current.map((turn, index) => (index === current.length - 1 ? { question: turn.question } : turn)),
      );
      setAnswer(text);
      setFailed(true);
      setStage("interview");
    }
  }

  function restart() {
    setStage("form");
    setTurns([]);
    setPlan(null);
    setSessionId("");
    setFailed(false);
  }

  if (innovation === null) {
    return (
      <div className="mt-8 max-w-3xl border-(length:--bw) border-deep bg-surface p-6">
        <p className="text-lg">Nie znalazłem tej innowacji. Mogła zostać usunięta z Biblioteki.</p>
        <Link href="/biblioteka" className={buttonVariants({ variant: "secondary", className: "mt-4" })}>
          Przejdź do Biblioteki
        </Link>
      </div>
    );
  }

  const busy = stage === "starting" || stage === "thinking";

  return (
    <div className="mt-8 grid max-w-4xl gap-10">
      {/* Którą innowację dostosowujemy */}
      <section
        aria-label="Wybrana innowacja"
        className="print-hidden border-l-4 border-leaf bg-surface px-5 py-4"
        aria-busy={innovation === undefined}
      >
        {innovation ? (
          <>
            <p className="text-sm font-bold text-muted">Dostosowujesz innowację</p>
            <p className="text-xl font-bold text-deep">{innovation.title}</p>
            <p className="mt-1">{innovation.short_desc}</p>
          </>
        ) : (
          <p className="text-muted">Wczytuję kartę innowacji…</p>
        )}
      </section>

      {stage === "form" || stage === "starting" ? (
        <form
          onSubmit={start}
          noValidate
          className="border-(length:--bw) border-deep bg-surface p-6 shadow-paper sm:p-8"
        >
          <h2 className="text-xl font-bold text-deep">Kilka słów o Twojej instytucji</h2>
          <p className="mt-2 text-muted">
            AI zada potem 2–3 krótkie pytania i przygotuje szkic planu: kogo potrzeba, ile to kosztuje i od czego
            zacząć.
          </p>

          <label htmlFor={`${ids}-typ`} className="mt-6 block font-bold text-deep">
            Rodzaj instytucji
          </label>
          <select
            id={`${ids}-typ`}
            value={institution}
            onChange={(event) => setInstitution(event.target.value)}
            className={cn(fieldClass, "cursor-pointer border-deep")}
          >
            {INSTITUTION_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <label htmlFor={`${ids}-miejsce`} className="mt-6 block font-bold text-deep">
            Gmina lub miejscowość <span className="font-normal text-muted">(nieobowiązkowe)</span>
          </label>
          <input
            id={`${ids}-miejsce`}
            type="text"
            autoComplete="address-level2"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Na przykład: Limanowa"
            className={cn(fieldClass, "border-deep")}
          />

          <label htmlFor={`${ids}-problem`} className="mt-6 block font-bold text-deep">
            Jaki problem chcecie rozwiązać?
          </label>
          <textarea
            ref={problemRef}
            id={`${ids}-problem`}
            rows={3}
            value={problem}
            onChange={(event) => {
              setProblem(event.target.value);
              if (event.target.value.trim()) setProblemError(false);
            }}
            aria-invalid={problemError || undefined}
            aria-describedby={problemError ? `${ids}-problem-blad` : undefined}
            className={cn(fieldClass, "min-h-28 py-3", problemError ? "border-alert" : "border-deep")}
          />
          {problemError && (
            <p id={`${ids}-problem-blad`} className="mt-2 flex items-start gap-2 font-bold text-alert">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              Opisz problem w jednym, dwóch zdaniach.
            </p>
          )}

          {failed && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
            >
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              Nie udało się rozpocząć rozmowy. Spróbuj jeszcze raz za chwilę.
            </p>
          )}

          <Button type="submit" disabled={busy} className="mt-8">
            {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : <MessageSquareText aria-hidden="true" />}
            Dostosuj do mojej instytucji
          </Button>
        </form>
      ) : null}

      {turns.length > 0 && (
        <section aria-labelledby={`${ids}-rozmowa`} className="print-hidden">
          <h2 id={`${ids}-rozmowa`} className="text-xl font-bold text-deep">
            Rozmowa z doradcą AI
          </h2>
          <ol className="mt-4 grid gap-4">
            {turns.map((turn, index) => (
              <li key={index} className="grid gap-3">
                <div className="flex gap-3">
                  <Bot aria-hidden="true" className="mt-2 size-6 shrink-0 text-leaf" />
                  <p className="max-w-[60ch] rounded-ui border-2 border-sage bg-surface px-4 py-3">
                    <span className="sr-only">Pytanie {index + 1}: </span>
                    {turn.question}
                  </p>
                </div>
                {turn.answer && (
                  <p className="max-w-[60ch] self-end justify-self-end rounded-ui border-2 border-deep bg-mint px-4 py-3">
                    <span className="sr-only">Twoja odpowiedź: </span>
                    {turn.answer}
                  </p>
                )}
              </li>
            ))}
          </ol>

          <p role="status" aria-live="polite" className="mt-4 flex items-center gap-2 font-bold text-deep">
            {stage === "thinking" && (
              <>
                <Loader2 aria-hidden="true" className="size-5 animate-spin" />
                Doradca analizuje odpowiedź…
              </>
            )}
            {stage === "interview" && `Pytanie ${turns.length}: ${turns[turns.length - 1].question}`}
          </p>

          {stage === "interview" && (
            <form onSubmit={reply} noValidate className="mt-4">
              <label htmlFor={`${ids}-odpowiedz`} className="block font-bold text-deep">
                Twoja odpowiedź
              </label>
              <textarea
                ref={answerRef}
                id={`${ids}-odpowiedz`}
                rows={2}
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  if (event.target.value.trim()) setAnswerError(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                aria-invalid={answerError || undefined}
                aria-describedby={answerError ? `${ids}-odpowiedz-blad` : undefined}
                className={cn(fieldClass, "min-h-20 py-3", answerError ? "border-alert" : "border-deep")}
              />
              {answerError && (
                <p id={`${ids}-odpowiedz-blad`} className="mt-2 flex items-start gap-2 font-bold text-alert">
                  <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                  Napisz odpowiedź. Jeśli nie wiesz, wpisz „nie wiem”.
                </p>
              )}
              {failed && (
                <p
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
                >
                  <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                  Doradca nie odpowiedział. Wyślij odpowiedź jeszcze raz.
                </p>
              )}
              <Button type="submit" className="mt-3">
                <Send aria-hidden="true" />
                Odpowiedz
              </Button>
            </form>
          )}
        </section>
      )}

      {stage === "plan" && plan && (
        <article
          aria-labelledby={`${ids}-plan`}
          className="appear border-(length:--bw) border-deep bg-surface p-6 sm:p-8"
        >
          <p className="font-bold text-muted">Plan wdrożenia</p>
          <h2 id={`${ids}-plan`} ref={planHeadingRef} tabIndex={-1} className="mt-1 text-2xl font-bold text-deep">
            {innovation?.title ?? "Innowacja"}: {institution.toLowerCase()}
            {location.trim() ? `, ${location.trim()}` : ""}
          </h2>

          <p className="mt-4 flex items-start gap-2 rounded-ui bg-sage px-4 py-3">
            <Info aria-hidden="true" className="mt-1 size-5 shrink-0 text-deep" />
            To jest szkic. Sprawdź koszty i przepisy przed wdrożeniem.
          </p>

          <h3 className="mt-6 text-lg font-bold text-deep">Cel</h3>
          <p className="mt-1">{problem.trim()}</p>

          <dl className="mt-6 grid gap-5 sm:grid-cols-[13rem_1fr]">
            <dt className="font-bold text-deep">Kto realizuje</dt>
            <dd>{plan.staff_needed || <Missing />}</dd>
            <dt className="font-bold text-deep">Ile to kosztuje</dt>
            <dd>{plan.estimated_cost || <Missing />}</dd>
            <dt className="font-bold text-deep">Gdzie</dt>
            <dd>{plan.location_suggestions || <Missing />}</dd>
            <dt className="font-bold text-deep">Ile to trwa</dt>
            <dd>{plan.timeline || <Missing />}</dd>
            <dt className="font-bold text-deep">Skąd pieniądze</dt>
            <dd>{plan.funding_hints || <Missing />}</dd>
          </dl>

          <h3 className="mt-8 text-lg font-bold text-deep">Etapy</h3>
          {plan.steps.length ? (
            <ol className="mt-3 grid list-decimal gap-2 pl-6 marker:font-bold marker:text-deep">
              {plan.steps.map((step) => (
                <li key={step} className="pl-1">
                  {step}
                </li>
              ))}
            </ol>
          ) : (
            <Missing />
          )}

          <div className="print-hidden mt-8 flex flex-wrap gap-3">
            <Button type="button" onClick={() => window.print()}>
              <Printer aria-hidden="true" />
              Pobierz plan (PDF)
            </Button>
            <Button type="button" variant="secondary" onClick={restart}>
              <RotateCcw aria-hidden="true" />
              Zacznij od nowa
            </Button>
            <Link href="/forum" className={buttonVariants({ variant: "secondary" })}>
              Zapytaj ekspertów na forum
            </Link>
          </div>
        </article>
      )}
    </div>
  );
}
