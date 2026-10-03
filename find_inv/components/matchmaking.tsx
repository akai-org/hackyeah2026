"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  Clock,
  Coins,
  Info,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Send,
  TriangleAlert,
  X,
} from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { useSimpleMode } from "@/components/simple-mode";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  TAXONOMY_TAGS,
  matchInnovations,
  reportNeed,
  streamChat,
  tagLabel,
  tagProblem,
  type ChatMessage,
  type CostLevel,
  type MatchedInnovation,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type Phase = "tagging" | "matching" | "ready" | "irrelevant" | "error";

const COST_LABEL: Record<CostLevel, string> = { low: "niski", medium: "średni", high: "wysoki" };

// DESIGN.md, sekcja 8: przy słowach kryzysowych zamiast wyników spokojny panel z numerami pomocowymi.
const CRISIS_PATTERN =
  /samob[óo]j|zabi[ćcj][a-ząęółśżźćń]* si[ęe]|nie chc[ęe] (już )?[żz]y[ćc]|odebra[ćc] sobie [żz]ycie|przemoc|bije mnie|znęca si[ęe]/i;

export function Matchmaking({ query }: { query: string }) {
  const { simple } = useSimpleMode();
  const limit = simple ? 3 : 5;

  if (CRISIS_PATTERN.test(query)) return <CrisisPanel />;

  return <MatchmakingFlow query={query} limit={limit} />;
}

function MatchmakingFlow({ query, limit }: { query: string; limit: number }) {
  const [phase, setPhase] = useState<Phase>("tagging");
  const [tags, setTags] = useState<string[]>([]);
  const [appliedTags, setAppliedTags] = useState<string[]>([]);
  const [innovations, setInnovations] = useState<MatchedInnovation[]>([]);
  const [status, setStatus] = useState("Analizuję opis problemu…");
  const controllerRef = useRef<AbortController | null>(null);

  async function runMatch(currentTags: string[], signal: AbortSignal) {
    setPhase("matching");
    setStatus("Szukam pasujących rozwiązań…");
    const result = await matchInnovations(query, currentTags, signal);
    setInnovations(result.innovations);
    setAppliedTags(currentTags);
    setPhase("ready");
    setStatus(
      result.innovations.length
        ? `Znaleziono ${result.innovations.length} pasujących rozwiązań.`
        : "Nie znaleziono pasującej innowacji.",
    );
  }

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;

    (async () => {
      try {
        const tagged = await tagProblem(query, controller.signal);
        setTags(tagged.tags);
        if (!tagged.is_relevant) {
          setPhase("irrelevant");
          setStatus("Opis nie dotyczy problemu społecznego.");
          return;
        }
        await runMatch(tagged.tags, controller.signal);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
        setPhase("error");
        setStatus("");
      }
    })();

    return () => controller.abort();
    // runMatch zależy tylko od query, które jest w tablicy zależności.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function updateResults() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      await runMatch(tags, controller.signal);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
      setPhase("error");
      setStatus("");
    }
  }

  const tagsChanged = tags.length !== appliedTags.length || tags.some((tag) => !appliedTags.includes(tag));
  const busy = phase === "tagging" || phase === "matching";
  const shown = innovations.slice(0, limit);

  return (
    <div className="mt-10">
      {tags.length > 0 && (
        <TagEditor tags={tags} onChange={setTags} disabled={busy} />
      )}

      {tagsChanged && phase === "ready" && (
        <Button type="button" onClick={updateResults} className="mt-4">
          <RefreshCw aria-hidden="true" />
          Zaktualizuj wyniki
        </Button>
      )}

      <p
        role="status"
        aria-live="polite"
        className={cn(
          "mt-6 inline-flex items-center gap-2 rounded-ui border-2 border-deep px-4 py-2 font-bold text-deep",
          busy ? "bg-butter" : "sr-only",
        )}
      >
        {busy && <Clock aria-hidden="true" className="size-5 shrink-0" />}
        {status}
      </p>

      {phase === "error" && (
        <p
          role="alert"
          className="mt-6 flex max-w-[65ch] items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Nie udało się połączyć z wyszukiwarką. Sprawdź połączenie z internetem i odśwież stronę.
        </p>
      )}

      {phase === "irrelevant" && (
        <div className="mt-6 max-w-[65ch] rounded-ui border-2 border-deep bg-sage px-5 py-4">
          <p className="flex items-start gap-2 font-bold text-deep">
            <Info aria-hidden="true" className="mt-1 size-5 shrink-0" />
            Ten opis nie wygląda na problem społeczny.
          </p>
          <p className="mt-2">
            Napisz, kogo dotyczy kłopot i co się dzieje, na przykład: „starsi sąsiedzi nie mają z kim porozmawiać”.
          </p>
        </div>
      )}

      {phase === "ready" && shown.length === 0 && <NoResults query={query} />}

      {shown.length > 0 && (
        <section aria-labelledby="wyniki-naglowek" className="mt-8" aria-busy={busy}>
          <h2 id="wyniki-naglowek" className="text-2xl font-bold text-deep">
            Co już działa w Małopolsce
          </h2>
          <ul className="mt-6 grid gap-8 md:grid-cols-2">
            {shown.map((innovation) => (
              <li key={innovation.id} className="flex">
                <ResultCard innovation={innovation} query={query} />
              </li>
            ))}
          </ul>
          <Link
            href={`/biblioteka?tags=${encodeURIComponent(appliedTags.join(","))}`}
            className={buttonVariants({ variant: "secondary", className: "mt-8" })}
          >
            Zobacz więcej w Bibliotece
          </Link>
        </section>
      )}

      {phase === "ready" && shown.length > 0 && <ProblemChat query={query} innovations={shown} />}
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send() {
    setState("sending");
    try {
      await reportNeed(query);
      setState("sent");
    } catch (error) {
      console.error(error);
      setState("error");
    }
  }

  return (
    <div className="mt-6 max-w-[65ch]">
      <CutoutText as="h2" size="section" text="Nic tu jeszcze nie ma" />
      <p className="mt-4 text-lg">
        Nie znalazłem pasującej innowacji. Usuń część tagów powyżej albo opisz problem inaczej.
      </p>
      <p className="mt-4">
        Możesz też zgłosić tę potrzebę do Regionalnego Ośrodka Polityki Społecznej. Dzięki temu będzie wiadomo, gdzie
        w Małopolsce brakuje rozwiązań.
      </p>
      {state === "sent" ? (
        <p role="status" className="mt-4 flex items-start gap-2 font-bold text-deep">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Zgłoszenie wysłane. Dziękujemy.
        </p>
      ) : (
        <Button type="button" onClick={send} disabled={state === "sending"} className="mt-4">
          <Megaphone aria-hidden="true" />
          {state === "sending" ? "Wysyłam…" : "Zgłoś tę potrzebę do ROPS"}
        </Button>
      )}
      {state === "error" && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Nie udało się wysłać zgłoszenia. Spróbuj jeszcze raz za chwilę.
        </p>
      )}
    </div>
  );
}

function TagEditor({
  tags,
  onChange,
  disabled,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled: boolean;
}) {
  const ids = useId();
  const [toAdd, setToAdd] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const focusIndexRef = useRef<number | null>(null);
  const available = TAXONOMY_TAGS.filter((tag) => !tags.includes(tag));

  // Usunięty chip zabiera ze sobą fokus, więc przenosimy go na sąsiedni chip albo na listę tagów.
  useEffect(() => {
    const index = focusIndexRef.current;
    if (index === null) return;
    focusIndexRef.current = null;
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("button");
    const target = buttons?.length ? buttons[Math.min(index, buttons.length - 1)] : selectRef.current;
    target?.focus();
  }, [tags]);

  return (
    <div role="group" aria-labelledby={`${ids}-zrozumialem`}>
      <p id={`${ids}-zrozumialem`} className="font-bold text-deep">
        Zrozumiałem
      </p>
      <ul ref={listRef} className="mt-2 flex flex-wrap gap-3">
        {tags.map((tag, index) => (
          <li
            key={tag}
            className="inline-flex min-h-10 items-center gap-1 rounded-ui border-(length:--bw) border-deep bg-mint py-1 pl-4 pr-1 text-ink"
          >
            {tagLabel(tag)}
            <button
              type="button"
              onClick={() => {
                onChange(tags.filter((t) => t !== tag));
                focusIndexRef.current = index;
              }}
              disabled={disabled}
              aria-label={`Usuń tag ${tagLabel(tag)}`}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-ui hover:bg-sage disabled:cursor-not-allowed"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </li>
        ))}
      </ul>

      {available.length > 0 && (
        <form
          className="mt-3 flex flex-wrap items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!toAdd) return;
            onChange([...tags, toAdd]);
            setToAdd("");
          }}
        >
          <label htmlFor={`${ids}-dodaj`} className="sr-only">
            Wybierz tag do dodania
          </label>
          <select
            ref={selectRef}
            id={`${ids}-dodaj`}
            value={toAdd}
            onChange={(event) => setToAdd(event.target.value)}
            disabled={disabled}
            className="min-h-12 rounded-ui border-(length:--bw) border-deep bg-surface px-3 text-base text-ink"
          >
            <option value="">Wybierz tag…</option>
            {available.map((tag) => (
              <option key={tag} value={tag}>
                {tagLabel(tag)}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary" disabled={disabled || !toAdd}>
            <Plus aria-hidden="true" />
            Dodaj tag
          </Button>
        </form>
      )}
    </div>
  );
}

function ResultCard({ innovation, query }: { innovation: MatchedInnovation; query: string }) {
  const titleId = `wynik-${innovation.id}`;
  const middlemanHref = `/wdrozenie?innowacja=${innovation.id}&problem=${encodeURIComponent(query)}`;

  return (
    <article
      aria-labelledby={titleId}
      className="relative flex w-full flex-col border-(length:--bw) border-deep bg-surface p-6 shadow-paper"
    >
      <span
        aria-hidden="true"
        className="simple-hidden absolute -top-3 right-6 h-6 w-20 rotate-[4deg] bg-butter [clip-path:polygon(0_8%,6%_0,100%_4%,95%_50%,100%_96%,4%_100%,0_55%)]"
      />

      <h3 id={titleId} className="pr-16 text-xl font-bold text-deep">
        {innovation.title}
      </h3>

      {innovation.is_unmaintained && (
        <p className="mt-3 inline-flex items-center gap-2 self-start rounded-ui border-2 border-muted bg-paper px-3 py-1 font-bold text-muted">
          <TriangleAlert aria-hidden="true" className="size-5 shrink-0" />
          Nieaktualna: sprawdź, czy nadal działa
        </p>
      )}

      <p className="mt-4 text-sm text-muted">Dlaczego pasuje</p>
      <blockquote className="mt-1 border-l-4 border-leaf pl-4 text-lg">{innovation.short_desc}</blockquote>

      <dl className="mt-4 space-y-3">
        {innovation.target_group && (
          <div>
            <dt className="text-sm text-muted">Dla kogo</dt>
            <dd className="font-bold">{innovation.target_group}</dd>
          </div>
        )}
        {innovation.where_implemented && (
          <div>
            <dt className="flex items-center gap-1 text-sm text-muted">
              <MapPin aria-hidden="true" className="size-4" />
              Gdzie już działa
            </dt>
            <dd className="font-bold">{innovation.where_implemented}</dd>
          </div>
        )}
      </dl>

      {(innovation.cost_level || innovation.implementation_time_months) && (
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
          {innovation.cost_level && (
            <div>
              <dt className="flex items-center gap-1 text-sm text-muted">
                <Coins aria-hidden="true" className="size-4" />
                Koszt
              </dt>
              <dd className="font-bold">{COST_LABEL[innovation.cost_level]}</dd>
            </div>
          )}
          {innovation.implementation_time_months && (
            <div>
              <dt className="flex items-center gap-1 text-sm text-muted">
                <Clock aria-hidden="true" className="size-4" />
                Czas wdrożenia
              </dt>
              <dd className="font-bold">{formatMonths(innovation.implementation_time_months)}</dd>
            </div>
          )}
        </dl>
      )}

      {innovation.tags.length > 0 && (
        <ul aria-label="Tagi" className="mt-4 flex flex-wrap gap-2">
          {innovation.tags.map((tag) => (
            <li key={tag} className="rounded-ui bg-sage px-3 py-1 text-sm text-ink">
              {tagLabel(tag)}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Link href={middlemanHref} className={buttonVariants()}>
          Dostosuj do mojej instytucji<span className="sr-only">: {innovation.title}</span>
        </Link>
        {innovation.source_url && (
          <a href={innovation.source_url} className={buttonVariants({ variant: "secondary" })}>
            Zobacz kartę<span className="sr-only">: {innovation.title} (strona ROPS)</span>
          </a>
        )}
      </div>
    </article>
  );
}

function formatMonths(months: number) {
  if (months === 1) return "1 miesiąc";
  const lastDigit = months % 10;
  const lastTwo = months % 100;
  const few = lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14);
  return `${months} ${few ? "miesiące" : "miesięcy"}`;
}

function ProblemChat({ query, innovations }: { query: string; innovations: MatchedInnovation[] }) {
  const ids = useId();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [failed, setFailed] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || streaming) return;

    const history: ChatMessage[] = [...messages, { role: "user", content: question }];
    // Pierwsze pytanie dostaje opis problemu, żeby asystent znał kontekst.
    const payload = history.map((message, index) =>
      index === 0 ? { ...message, content: `Mój problem: ${query}\n\nPytanie: ${message.content}` } : message,
    );
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setFailed(false);
    setStreaming(true);

    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      await streamChat(
        payload,
        innovations.map((innovation) => innovation.id),
        (chunk) =>
          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content: last.content + chunk };
            return next;
          }),
        controller.signal,
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error(error);
        setFailed(true);
        setMessages(history);
      }
    } finally {
      setStreaming(false);
    }
  }

  return (
    <section aria-labelledby={`${ids}-naglowek`} className="mt-16 max-w-[70ch]">
      <h2 id={`${ids}-naglowek`} className="flex items-center gap-3 text-2xl font-bold text-deep">
        <MessageCircle aria-hidden="true" className="size-8 shrink-0 text-leaf" />
        Zapytaj o te rozwiązania
      </h2>
      <p className="mt-2 text-muted">
        Asystent zna opisy znalezionych innowacji. Zapytaj na przykład, która będzie najtańsza albo od czego zacząć.
      </p>

      {messages.length > 0 && (
        <div role="log" aria-live="polite" aria-busy={streaming} className="mt-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "rounded-ui border-2 px-5 py-4",
                message.role === "user" ? "ml-8 border-deep bg-mint" : "mr-8 border-deep bg-surface",
              )}
            >
              <p className="text-sm font-bold text-muted">{message.role === "user" ? "Ty" : "Asystent"}</p>
              <p className="mt-1 whitespace-pre-wrap">
                {message.content}
                {streaming && index === messages.length - 1 && !message.content && "Piszę odpowiedź…"}
              </p>
            </div>
          ))}
        </div>
      )}

      {failed && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Asystent nie odpowiedział. Spróbuj zadać pytanie jeszcze raz.
        </p>
      )}

      <form onSubmit={ask} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={`${ids}-pytanie`} className="block font-bold text-deep">
            Twoje pytanie
          </label>
          <input
            id={`${ids}-pytanie`}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Która z tych innowacji sprawdzi się w małej gminie?"
            className="mt-2 min-h-12 w-full rounded-ui border-(length:--bw) border-deep bg-surface px-4 text-base text-ink placeholder:text-muted"
          />
        </div>
        <Button type="submit" disabled={streaming || !input.trim()}>
          <Send aria-hidden="true" />
          Zapytaj
        </Button>
      </form>
    </section>
  );
}

function CrisisPanel() {
  return (
    <section aria-labelledby="pomoc-naglowek" className="mt-10 max-w-[65ch] rounded-ui border-2 border-deep bg-surface p-6">
      <h2 id="pomoc-naglowek" className="text-2xl font-bold text-deep">
        Możesz dostać pomoc teraz
      </h2>
      <p className="mt-3 text-lg">
        To, co opisujesz, brzmi poważnie. Porozmawiaj z kimś, kto pomaga w takich sytuacjach. Te telefony są bezpłatne.
      </p>
      <ul className="mt-6 space-y-4">
        {[
          { number: "112", tel: "112", text: "Numer alarmowy, gdy jest zagrożone życie" },
          { number: "800 70 2222", tel: "800702222", text: "Centrum Wsparcia dla osób w kryzysie, całą dobę" },
          { number: "116 123", tel: "116123", text: "Telefon zaufania dla dorosłych w kryzysie emocjonalnym" },
          { number: "116 111", tel: "116111", text: "Telefon zaufania dla dzieci i młodzieży, całą dobę" },
          { number: "800 120 002", tel: "800120002", text: "Niebieska Linia, pomoc przy przemocy domowej" },
        ].map((line) => (
          <li key={line.tel} className="flex items-start gap-3">
            <Phone aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
            <span>
              <a href={`tel:${line.tel}`} className="text-lg font-bold text-leaf underline underline-offset-4">
                {line.number}
              </a>
              <span className="block">{line.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
