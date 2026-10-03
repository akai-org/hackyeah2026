"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, Clock, Plus, RefreshCw, Search, X } from "lucide-react";

import { CrisisPanel, isCrisis } from "@/components/crisis-panel";
import { MatchCard } from "@/components/match-card";
import { MatchChat } from "@/components/match-chat";
import { useSimpleMode } from "@/components/simple-mode";
import { Button, buttonVariants } from "@/components/ui/button";
import type { InnovationCard } from "@/data/innovations";
import { TAG_LABELS, TAXONOMY_TAGS, type Tag } from "@/data/mock";
import { matchInnovations, tagProblem, type TagResult } from "@/lib/matchmaking";
import { cn } from "@/lib/utils";

// Wyniki matchmakingu (CONTEXT.md, moduł 1): najpierw chipy „Zrozumiałem”, potem 5 kart, potem czat.
// Po zmianie tagów wyniki nie odświeżają się same, pojawia się „Zaktualizuj wyniki” (DESIGN.md 8).

type Phase = "tagging" | "matching" | "done" | "irrelevant";

const FALLBACK_AREAS = [
  { label: "Seniorzy i samotność", query: "Samotni seniorzy potrzebują towarzystwa i pomocy" },
  { label: "Wykluczenie cyfrowe", query: "Osoby starsze nie radzą sobie z internetem i smartfonem" },
  { label: "Zdrowie psychiczne młodzieży", query: "Młodzież w kryzysie psychicznym nie ma gdzie szukać pomocy" },
];

function sameTags(a: string[], b: string[]) {
  return a.length === b.length && a.every((tag) => b.includes(tag));
}

export function MatchResults({ query }: { query: string }) {
  const ids = useId();
  const { simple } = useSimpleMode();

  const [crisis, setCrisis] = useState(() => isCrisis(query));
  const [phase, setPhase] = useState<Phase>("tagging");
  const [tagResult, setTagResult] = useState<TagResult | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [appliedTags, setAppliedTags] = useState<Tag[]>([]);
  const [innovations, setInnovations] = useState<InnovationCard[]>([]);
  const [total, setTotal] = useState(0);
  const [refined, setRefined] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState(false);
  const requestRef = useRef(0);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const addSelectRef = useRef<HTMLSelectElement>(null);

  async function runMatch(activeTags: Tag[], moveFocus = false) {
    const request = ++requestRef.current;
    setPhase("matching");
    setError(false);
    try {
      const result = await matchInnovations(query, activeTags, 5);
      if (request !== requestRef.current) return;
      setInnovations(result.innovations);
      setTotal(result.total_found);
      setAppliedTags(activeTags);
      setPhase("done");
      setRefined(true);
      if (moveFocus) resultsHeadingRef.current?.focus();
    } catch {
      if (request === requestRef.current) {
        setError(true);
        setPhase("done");
      }
    }
  }

  // Start: autotagger, a zaraz po nim dopasowanie.
  useEffect(() => {
    if (!query || crisis) return;
    let cancelled = false;
    (async () => {
      const result = await tagProblem(query);
      if (cancelled) return;
      setTagResult(result);
      setTags(result.tags);
      if (result.is_relevant === false) {
        setPhase("irrelevant");
        return;
      }
      await runMatch(result.tags);
    })();
    return () => {
      cancelled = true;
      // Licznik zapytań, nie węzeł DOM: podbicie unieważnia trwające dopasowanie.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestRef.current++;
    };
    // runMatch zależy tylko od query, które jest kluczem komponentu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, crisis]);

  // Plakietka „Wyniki dopracowane” znika po 4 sekundach (DESIGN.md 8).
  useEffect(() => {
    if (!refined) return;
    const timer = window.setTimeout(() => setRefined(false), 4000);
    return () => window.clearTimeout(timer);
  }, [refined]);

  useEffect(() => {
    if (addOpen) addSelectRef.current?.focus();
  }, [addOpen]);

  function removeTag(tag: Tag) {
    setTags((current) => current.filter((item) => item !== tag));
  }

  function addTag(tag: string) {
    if (!tag) return;
    setTags((current) => (current.includes(tag as Tag) ? current : [...current, tag as Tag]));
    setAddOpen(false);
  }

  if (!query) {
    return <p className="mt-6 max-w-[65ch] text-lg">Nie podano opisu problemu. Wpisz go w polu powyżej.</p>;
  }

  if (crisis) {
    return (
      <div className="mt-10">
        <CrisisPanel>
          <p className="mt-6 max-w-[60ch] text-muted">
            Szukasz rozwiązań dla instytucji, a nie pomocy dla siebie albo bliskiej osoby?
          </p>
          <Button type="button" variant="secondary" onClick={() => setCrisis(false)} className="mt-3">
            Pokaż innowacje
          </Button>
        </CrisisPanel>
      </div>
    );
  }

  const visible = innovations.slice(0, simple ? 3 : 5);
  const tagsChanged = phase === "done" && !sameTags(tags, appliedTags);
  const remaining = TAXONOMY_TAGS.filter((tag) => !tags.includes(tag));
  const moreHref = `/biblioteka?tags=${encodeURIComponent(tags.join(","))}`;

  return (
    <div className="mt-10">
      {/* Zrozumiałem: chipy tagów — jury widzi, że system „myśli”, zanim pokaże wyniki. */}
      <section aria-labelledby={`${ids}-tagi`} aria-busy={phase === "tagging"}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 id={`${ids}-tagi`} className="text-lg font-bold text-deep">
            Zrozumiałem:
          </h2>
          {phase === "tagging" && <span className="text-muted">czytam opis…</span>}
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="appear inline-flex min-h-10 items-center gap-1 rounded-ui border-(length:--bw) border-deep bg-mint py-0.5 pr-0.5 pl-3 text-base text-ink"
              >
                {TAG_LABELS[tag]}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Usuń tag ${TAG_LABELS[tag].toLowerCase()}`}
                  className="inline-flex size-10 cursor-pointer items-center justify-center rounded-ui hover:bg-sage"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          {phase !== "tagging" &&
            (addOpen ? (
              <div className="flex items-center gap-2">
                <label htmlFor={`${ids}-dodaj`} className="sr-only">
                  Wybierz temat do dodania
                </label>
                <select
                  ref={addSelectRef}
                  id={`${ids}-dodaj`}
                  defaultValue=""
                  onChange={(event) => addTag(event.target.value)}
                  onKeyDown={(event) => event.key === "Escape" && setAddOpen(false)}
                  className="min-h-12 cursor-pointer rounded-ui border-(length:--bw) border-deep bg-surface px-3 text-base"
                >
                  <option value="">Wybierz temat</option>
                  {remaining.map((tag) => (
                    <option key={tag} value={tag}>
                      {TAG_LABELS[tag]}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
                  Anuluj
                </Button>
              </div>
            ) : (
              <Button type="button" variant="secondary" onClick={() => setAddOpen(true)} className="min-h-10 py-1">
                <Plus aria-hidden="true" />
                Dodaj temat
              </Button>
            ))}
        </div>

        {(tagResult?.target_group || tagResult?.location) && (
          <p className="mt-3 text-muted">
            {tagResult.target_group && <>Dla kogo: {tagResult.target_group}. </>}
            {tagResult.location && <>Gdzie: {tagResult.location}.</>}
          </p>
        )}

        {tagsChanged && (
          <Button type="button" onClick={() => runMatch(tags, true)} className="mt-4">
            <RefreshCw aria-hidden="true" />
            Zaktualizuj wyniki
          </Button>
        )}
      </section>

      {/* Plakietka stanu wyników: maślana, z ikoną zegara, role=status. */}
      <p role="status" aria-live="polite" className="mt-6 min-h-10">
        {phase === "matching" && (
          <span className="inline-flex items-center gap-2 rounded-ui border-2 border-deep bg-butter px-3 py-1.5 font-bold text-deep">
            <Clock aria-hidden="true" className="size-5" />
            Wstępne wyniki, dopracowuję…
          </span>
        )}
        {phase === "done" && refined && !error && (
          <span className="inline-flex items-center gap-2 rounded-ui border-2 border-deep bg-mint px-3 py-1.5 font-bold text-deep">
            Wyniki dopracowane. Znaleziono {visible.length} z {total}.
          </span>
        )}
      </p>

      {phase === "irrelevant" && (
        <div className="max-w-3xl border-(length:--bw) border-deep bg-surface p-6 shadow-paper">
          <h2 className="text-xl font-bold text-deep">To nie wygląda na problem społeczny</h2>
          <p className="mt-2">
            Napisz, kogo dotyczy kłopot i co się dzieje, na przykład „samotni seniorzy na wsi nie mają jak dojechać do
            lekarza”. Możesz też zacząć od jednego z obszarów:
          </p>
          <ul className="mt-4 flex flex-wrap gap-3">
            {FALLBACK_AREAS.map((area) => (
              <li key={area.label}>
                <Link
                  href={`/wyniki?q=${encodeURIComponent(area.query)}`}
                  className={buttonVariants({ variant: "secondary" })}
                >
                  {area.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="flex max-w-3xl items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Nie udało się pobrać wyników. Sprawdź połączenie z internetem i kliknij „Szukaj” jeszcze raz.
        </p>
      )}

      {(phase === "matching" || phase === "done") && !error && (
        <section aria-labelledby={`${ids}-wyniki`} aria-busy={phase === "matching"} className="mt-2">
          <h2 id={`${ids}-wyniki`} ref={resultsHeadingRef} tabIndex={-1} className="text-2xl font-bold text-deep">
            Znalezione innowacje
          </h2>

          {phase === "done" && visible.length === 0 ? (
            <div className="mt-6 max-w-3xl border-(length:--bw) border-deep bg-surface p-6">
              <p className="text-lg">
                Nie znalazłem pasującej innowacji. Wybierz najbliższy obszar albo opisz problem inaczej.
              </p>
              <p className="mt-2 text-muted">Takie zapytania pokazują ROPS, gdzie brakuje rozwiązań.</p>
              <ul className="mt-4 flex flex-wrap gap-3">
                {FALLBACK_AREAS.map((area) => (
                  <li key={area.label}>
                    <Link
                      href={`/wyniki?q=${encodeURIComponent(area.query)}`}
                      className={buttonVariants({ variant: "secondary" })}
                    >
                      {area.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ol className={cn("mt-6 grid gap-8 md:grid-cols-2", phase === "matching" && "opacity-60")}>
              {(phase === "matching" && visible.length === 0 ? [0, 1] : visible).map((item, index) =>
                typeof item === "number" ? (
                  <li
                    key={`szkielet-${item}`}
                    aria-hidden="true"
                    className="h-72 border-(length:--bw) border-sage bg-surface"
                  />
                ) : (
                  <li key={item.id} className="appear flex">
                    <MatchCard innovation={item} queryTags={appliedTags} query={query} rank={index + 1} />
                  </li>
                ),
              )}
            </ol>
          )}

          {phase === "done" && visible.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={moreHref} className={buttonVariants({ variant: "secondary" })}>
                <Search aria-hidden="true" />
                Zobacz więcej w Bibliotece
              </Link>
            </div>
          )}
        </section>
      )}

      {phase === "done" && visible.length > 0 && (
        <div className="mt-12 max-w-4xl">
          <MatchChat innovations={visible} tags={appliedTags} />
        </div>
      )}
    </div>
  );
}
