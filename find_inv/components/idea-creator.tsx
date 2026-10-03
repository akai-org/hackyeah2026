"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, CircleCheck, CircleHelp, Loader2, Pencil, Save, Search, Sparkles } from "lucide-react";

import { DictationButton, DictationNotice, DictationStatus, useDictation } from "@/components/dictation";
import { Button, buttonVariants } from "@/components/ui/button";
import { TAG_GROUPS, TAG_KEYWORDS, TAG_LABELS, TARGET_GROUP_LABELS, type Tag } from "@/data/mock";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

// Kreator pomysłów (mock): „AI” to słowa kluczowe i szablon, bez wywołania backendu.
// Jury ogląda wynik, więc fiszka składa się z tego, co użytkownik naprawdę wpisał.

const ANALYSIS_MS = 1500;
const ANALYSIS_STEPS = ["Czytam opis…", "Dobieram tagi…", "Układam fiszkę…"];

type IdeaCard = {
  title: string;
  essence: string;
  audience: string;
  place: string;
  stage: string;
  tags: Tag[];
  suggestedTags: Tag[];
};

function suggestTags(text: string): Tag[] {
  const lower = text.toLowerCase();
  return TAG_KEYWORDS.filter(([pattern]) => pattern.test(lower)).map(([, tag]) => tag);
}

function firstSentence(text: string): string {
  const sentence = text.split(/(?<=[.!?])\s+/)[0] ?? text;
  const words = sentence
    .replace(/[.!?]+$/, "")
    .split(/\s+/)
    .filter(Boolean);
  const title = words.slice(0, 8).join(" ");
  const capitalized = title.charAt(0).toUpperCase() + title.slice(1);
  return words.length > 8 ? `${capitalized}…` : capitalized;
}

function trimTo(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", max)).trimEnd()}…`;
}

function buildCard(text: string, chosen: Tag[]): IdeaCard {
  const suggested = suggestTags(text).filter((tag) => !chosen.includes(tag));
  const tags = [...chosen, ...suggested];

  const audience = tags.map((tag) => TARGET_GROUP_LABELS[tag]).filter(Boolean);
  const place = [tags.includes("gmina_wiejska") && "gmina wiejska", tags.includes("gmina_miejska") && "miasto"].filter(
    Boolean,
  );

  return {
    title: firstSentence(text),
    essence: trimTo(text, 320),
    audience: audience.length ? audience.join(", ") : "",
    place: place.join(" lub "),
    stage: "Pomysł, przed pilotażem",
    tags,
    suggestedTags: suggested,
  };
}

function Missing() {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <CircleHelp aria-hidden="true" className="size-5 shrink-0" />
      do uzupełnienia
    </span>
  );
}

// Pola fiszki, które AI nie zawsze rozpozna — użytkownik uzupełnia je wprost na fiszce.
type Details = { audience: string; place: string; budget: string; partners: string };

function DetailField({
  id,
  label,
  value,
  placeholder,
  readOnly = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}) {
  const missingId = `${id}-brak`;
  return (
    <>
      <dt className="font-bold text-deep">
        <label htmlFor={id}>{label}</label>
      </dt>
      <dd>
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          aria-describedby={value.trim() ? undefined : missingId}
          className={cn(
            "min-h-12 w-full rounded-ui border-(length:--bw) border-deep px-4 text-base text-ink placeholder:text-muted",
            readOnly ? "bg-paper" : "bg-surface",
          )}
        />
        {/* Brak oznaczony tekstem i ikoną, nie samym kolorem (DESIGN.md 8). */}
        {!value.trim() && (
          <p id={missingId} className="mt-1 text-sm">
            <Missing />
          </p>
        )}
      </dd>
    </>
  );
}

/** Opis wysyłany do ROPS: istota pomysłu + pola, dla których tabela ideas nie ma osobnych kolumn. */
function ideaEssence(card: IdeaCard, details: Details) {
  const extra = [
    ["Gdzie", details.place],
    ["Etap realizacji", card.stage],
    ["Budżet", details.budget],
    ["Partnerzy", details.partners],
  ]
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}: ${value.trim()}`);
  return [card.essence, ...extra].join("\n");
}

export function IdeaCreator() {
  const ids = useId();
  const fieldId = `${ids}-pomysl`;
  const errorId = `${ids}-blad`;
  const hintId = `${ids}-podpowiedz`;
  const dictationHintId = `${ids}-dyktowanie`;

  const [text, setText] = useState("");
  const [chosen, setChosen] = useState<Tag[]>([]);
  const [error, setError] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [card, setCard] = useState<IdeaCard | null>(null);
  const [details, setDetails] = useState<Details>({ audience: "", place: "", budget: "", partners: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // Po zapisie fiszka zostaje na ekranie z potwierdzeniem; ponowny zapis utworzyłby duplikat.
  const [saved, setSaved] = useState<{ id: number | null } | null>(null);
  const { user } = useAuth();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dictation = useDictation(setText, () => setError(false));
  const cardHeadingRef = useRef<HTMLHeadingElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  // Po analizie focus idzie na nagłówek fiszki, żeby czytnik i klawiatura trafiły do wyniku.
  useEffect(() => {
    if (card) cardHeadingRef.current?.focus();
  }, [card]);

  function toggleTag(tag: Tag) {
    setChosen((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  function analyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const idea = text.trim();
    if (idea.length < 10) {
      setError(true);
      textareaRef.current?.focus();
      return;
    }

    setError(false);
    dictation.abort();
    setCard(null);
    setAnalyzing(true);
    setStep(0);
    const stepMs = ANALYSIS_MS / ANALYSIS_STEPS.length;
    timers.current = [
      window.setTimeout(() => setStep(1), stepMs),
      window.setTimeout(() => setStep(2), stepMs * 2),
      window.setTimeout(() => {
        setAnalyzing(false);
        const built = buildCard(idea, chosen);
        setCard(built);
        setDetails({ audience: built.audience, place: built.place, budget: "", partners: "" });
        setSaveError(false);
        setSaved(null);
      }, ANALYSIS_MS),
    ];
  }

  async function saveCard() {
    if (!card || saved) return;
    setSaving(true);
    setSaveError(false);
    try {
      const result = await apiPost<{ id: number | null; message: string }>("/api/ideas", {
        title: card.title,
        essence: ideaEssence(card, details),
        for_whom: details.audience.trim() || null,
        tags: card.tags,
        author_name: user?.name ?? null,
      });
      setSaved({ id: result?.id ?? null });
    } catch (error) {
      console.error(error);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  function editIdea() {
    setCard(null);
    textareaRef.current?.focus();
  }

  return (
    <>
      <form onSubmit={analyze} noValidate className="mt-8 max-w-3xl">
        <label htmlFor={fieldId} className="block text-lg font-bold text-deep">
          Opisz swój pomysł społeczny
        </label>
        <p id={hintId} className="mt-1 text-muted">
          Co chcesz zrobić, dla kogo i gdzie. Wystarczy kilka zdań.
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
            "mt-2 min-h-[160px] w-full resize-y rounded-ui border-(length:--bw) bg-surface p-4 text-base text-ink placeholder:text-muted",
            error ? "border-alert" : "border-deep",
          )}
        />
        <DictationButton dictation={dictation} className="mt-3" />
        <DictationStatus dictation={dictation} />
        <DictationNotice dictation={dictation} id={dictationHintId} />
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            Opisz pomysł w co najmniej jednym zdaniu, żeby AI mogło go przeanalizować.
          </p>
        )}

        <fieldset className="mt-8">
          <legend className="text-lg font-bold text-deep">Czego dotyczy pomysł?</legend>
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
                          "inline-flex min-h-12 cursor-pointer items-center gap-1.5 rounded-ui border-(length:--bw) border-deep px-4 py-2 text-base",
                          active ? "bg-mint font-bold text-ink" : "bg-surface text-ink hover:bg-sage",
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

        <p
          role="status"
          aria-live="polite"
          className={cn("flex items-center gap-2 font-bold text-deep", analyzing && "mt-4")}
        >
          {analyzing && (
            <>
              <span className="rounded-ui border-2 border-deep bg-butter px-3 py-1">AI analizuje pomysł</span>
              {ANALYSIS_STEPS[step]}
            </>
          )}
        </p>
      </form>

      {card && (
        <section aria-labelledby={`${ids}-fiszka`} className="appear mt-12 max-w-3xl">
          <article className="relative border-(length:--bw) border-deep bg-surface p-6 shadow-paper sm:p-8">
            {/* Kawałek taśmy przyklejający fiszkę do tablicy (DESIGN.md 8, karta innowacji). */}
            <span
              aria-hidden="true"
              className="simple-hidden absolute -top-3 right-10 h-6 w-24 rotate-[4deg] bg-butter/90"
            />

            <p className="font-bold text-muted">Fiszka pomysłu</p>
            <h2 id={`${ids}-fiszka`} ref={cardHeadingRef} tabIndex={-1} className="mt-1 text-xl font-bold text-deep">
              {card.title}
            </h2>

            <dl className="mt-6 grid gap-5 sm:grid-cols-[12rem_1fr]">
              <dt className="font-bold text-deep">Istota pomysłu</dt>
              <dd>
                <blockquote className="border-l-4 border-leaf pl-4">{card.essence}</blockquote>
              </dd>

              <DetailField
                id={`${ids}-dla-kogo`}
                label="Dla kogo"
                value={details.audience}
                placeholder="np. seniorzy mieszkający samotnie"
                readOnly={Boolean(saved)}
                onChange={(audience) => setDetails((current) => ({ ...current, audience }))}
              />

              <DetailField
                id={`${ids}-gdzie`}
                label="Gdzie"
                value={details.place}
                placeholder="np. świetlica wiejska w gminie Racławice"
                readOnly={Boolean(saved)}
                onChange={(place) => setDetails((current) => ({ ...current, place }))}
              />

              <dt className="font-bold text-deep">Etap realizacji</dt>
              <dd>{card.stage}</dd>

              <DetailField
                id={`${ids}-budzet`}
                label="Budżet"
                value={details.budget}
                placeholder="np. ok. 5 tys. zł rocznie"
                readOnly={Boolean(saved)}
                onChange={(budget) => setDetails((current) => ({ ...current, budget }))}
              />

              <DetailField
                id={`${ids}-partnerzy`}
                label="Partnerzy"
                value={details.partners}
                placeholder="np. GOPS, szkoła, koło gospodyń wiejskich"
                readOnly={Boolean(saved)}
                onChange={(partners) => setDetails((current) => ({ ...current, partners }))}
              />

              <dt className="font-bold text-deep">Tagi</dt>
              <dd>
                {card.tags.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <li
                        key={tag}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-ui border-2 border-deep bg-mint px-3 text-base"
                      >
                        {card.suggestedTags.includes(tag) && (
                          <Sparkles aria-hidden="true" className="size-4 text-deep" />
                        )}
                        {TAG_LABELS[tag]}
                        {card.suggestedTags.includes(tag) && <span className="sr-only">(propozycja AI)</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Missing />
                )}
                {card.suggestedTags.length > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                    <Sparkles aria-hidden="true" className="size-4" />
                    oznacza tag zaproponowany przez AI
                  </p>
                )}
              </dd>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              {saved ? (
                <Button type="button" disabled>
                  <CircleCheck aria-hidden="true" />
                  Zapisano
                </Button>
              ) : (
                <Button type="button" onClick={saveCard} disabled={saving}>
                  {saving ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Save aria-hidden="true" />}
                  {saving ? "Zapisuję…" : "Zapisz fiszkę"}
                </Button>
              )}
              <Link
                href={`/wyniki?q=${encodeURIComponent(text.trim())}`}
                className={buttonVariants({ variant: "secondary" })}
              >
                <Search aria-hidden="true" />
                Sprawdź, co już działa
              </Link>
              <Button type="button" variant="secondary" onClick={editIdea}>
                <Pencil aria-hidden="true" />
                Popraw opis
              </Button>
            </div>
            {/* Potwierdzenie na fiszce, przy przycisku — komunikat na dole ekranu łatwo przeoczyć. */}
            <div role="status" aria-live="polite">
              {saved && (
                <p className="mt-4 flex items-start gap-2 rounded-ui border-2 border-leaf bg-mint px-4 py-3 font-bold text-ink">
                  <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-deep" />
                  {saved.id ? `Fiszka zapisana (nr ${saved.id}).` : "Fiszka zapisana."} Ekspert ROPS przejrzy ją w ciągu
                  kilku dni.
                </p>
              )}
            </div>
            {saveError && (
              <p
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
              >
                <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                Nie udało się zapisać fiszki. Sprawdź połączenie i spróbuj jeszcze raz.
              </p>
            )}
          </article>
        </section>
      )}

    </>
  );
}
