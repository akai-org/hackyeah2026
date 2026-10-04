"use client";

import Link from "next/link";
import { Archive, Coins, MapPin, Puzzle, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { type InnovationCard } from "@/data/innovations";
import { useT } from "@/lib/i18n/client";
import { track, type CardSource } from "@/lib/track";
import { cn } from "@/lib/utils";

// Karta innowacji w wynikach matchmakingu (DESIGN.md 8): stoi prosto, taśma tylko dekoracją,
// „Dlaczego pasuje” w blockquote z lewą linią. „Nieaktualna” to szara plakietka z ikoną i słowem.

/** Dane ROPS mają czasem całe akapity w polach „dla kogo” i „gdzie” — na karcie skrót, pełny tekst w karcie innowacji. */
function short(text: string, max = 110): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", max)).replace(/[,;:.]$/, "")}…`;
}

type MatchCardProps = {
  innovation: InnovationCard;
  /** Tagi zapytania: wspólne trafiają do „Dlaczego pasuje”. */
  queryTags?: string[];
  /** Opis problemu przekazywany do Middlemana. */
  query?: string;
  /** Miejsce w wynikach; bez niego karta nie pokazuje numeru ani dopasowania (np. w Bibliotece). */
  rank?: number;
  headingLevel?: "h2" | "h3" | "h4" | "h5";
  /** Skąd klik — do statystyk. Domyślnie „wyniki”, gdy karta ma miejsce w rankingu, inaczej „biblioteka”. */
  source?: CardSource;
};

export function MatchCard({
  innovation,
  queryTags = [],
  query = "",
  rank,
  headingLevel: Heading = "h3",
  source = rank ? "wyniki" : "biblioteka",
}: MatchCardProps) {
  const t = useT();
  const tagLabel = (tag: string) => t.tags[tag] ?? tag.replace(/_/g, " ");
  const titleId = `innowacja-${innovation.id}`;
  const unmaintained = innovation.is_unmaintained ?? innovation.status === "unmaintained";
  const shared = innovation.tags.filter((tag) => queryTags.includes(tag));
  // Middleman (A5): /wdrozenie?innowacja={id}&problem={opis}
  const deployHref = `/wdrozenie?innowacja=${innovation.id}${query ? `&problem=${encodeURIComponent(query)}` : ""}`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "relative flex h-full min-w-0 flex-col overflow-hidden border-(length:--bw) border-border p-6 shadow-raised",
        unmaintained ? "bg-background" : "bg-surface",
      )}
    >
      <span
        aria-hidden="true"
        className="simple-hidden absolute -top-3 right-6 h-6 w-20 rotate-[4deg] bg-accent [clip-path:polygon(0_8%,6%_0,100%_4%,95%_50%,100%_96%,4%_100%,0_55%)]"
      />

      {rank !== undefined && (
        <p className="mb-1 flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
          {/* Bez procentu dopasowania: wynik TF-IDF nie jest skalibrowany, „28%” czyta się jak „nie pasuje”. */}
          <span>{rank === 1 ? t.card.bestMatch : t.card.rank(rank)}</span>
        </p>
      )}

      <Heading id={titleId} className="pr-16 text-xl font-bold text-foreground">
        {innovation.title}
      </Heading>

      {unmaintained && (
        <p className="mt-3 inline-flex items-start gap-2 self-start rounded-ui border-2 border-border bg-secondary/60 px-3 py-1 font-bold text-foreground">
          <Archive aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {t.card.unmaintainedLong}
        </p>
      )}

      <p className="mt-3 text-lg">{innovation.short_desc}</p>

      {shared.length > 0 && (
        <blockquote className="mt-4 rounded-ui bg-secondary/50 px-3 py-2.5">
          <p className="text-sm font-bold text-muted">{t.card.whyMatches}</p>
          <p className="mt-0.5 text-sm">{t.card.sharedTopics(shared.map(tagLabel).join(", ").toLowerCase())}</p>
        </blockquote>
      )}

      <dl className="mt-4 grid gap-2">
        {innovation.target_group && (
          <div>
            <dt className="sr-only">{t.card.forWhom}</dt>
            <dd className="flex items-start gap-2">
              <Users aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
              <span>{short(innovation.target_group)}</span>
            </dd>
          </div>
        )}
        {innovation.where_implemented && (
          <div>
            <dt className="sr-only">{t.card.where}</dt>
            <dd className="flex items-start gap-2">
              <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
              <span>{short(innovation.where_implemented)}</span>
            </dd>
          </div>
        )}
        {innovation.cost_level && (
          <div>
            <dt className="sr-only">{t.card.cost}</dt>
            <dd className="flex items-start gap-2">
              <Coins aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
              <span>
                {t.cost[innovation.cost_level]}
                {innovation.implementation_time_months
                  ? t.card.startIn(innovation.implementation_time_months)
                  : ""}
              </span>
            </dd>
          </div>
        )}
        {typeof innovation.testers_count === "number" && innovation.testers_count > 0 && (
          <div>
            <dt className="sr-only">{t.card.tests}</dt>
            <dd className="flex items-start gap-2">
              <Puzzle aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
              <span>
                {t.card.testedBy(innovation.testers_count)}
              </span>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Link
          href={deployHref}
          onClick={() => track({ type: "cta_click", innovationId: innovation.id, meta: { button: "wdrozenie" } })}
          className={buttonVariants({ variant: "primary" })}
        >
          {t.card.howToDeploy}<span className="sr-only"> {innovation.title}</span>
        </Link>
        <Link
          href={`/innowacje/${innovation.id}`}
          onClick={() => track({ type: "card_click", innovationId: innovation.id, meta: { source, position: rank } })}
          className={buttonVariants({ variant: "secondary" })}
        >
          {t.card.seeCard}<span className="sr-only">: {innovation.title}</span>
        </Link>
      </div>
    </article>
  );
}
