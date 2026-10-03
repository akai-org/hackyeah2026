import Link from "next/link";
import { Archive, Coins, MapPin, Puzzle, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { COST_LABELS, type InnovationCard } from "@/data/innovations";
import { TAG_LABELS, type Tag } from "@/data/mock";
import { cn, plural } from "@/lib/utils";

// Kolor ikony monet wzmacnia słowo „Niski / Średni / Wysoki koszt”, nigdy go nie zastępuje.
const COST_TONE: Record<string, string> = { low: "text-forest", medium: "text-ember", high: "text-alert" };

// Karta innowacji w wynikach matchmakingu (DESIGN.md 8): stoi prosto,
// „Dlaczego pasuje” w blockquote z lewą linią. „Nieaktualna” to szara plakietka z ikoną i słowem.

/** Dane ROPS mają czasem całe akapity w polach „dla kogo” i „gdzie” — na karcie skrót, pełny tekst w karcie innowacji. */
function short(text: string, max = 110): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", max)).replace(/[,;:.]$/, "")}…`;
}

function tagLabel(tag: string): string {
  return TAG_LABELS[tag as Tag] ?? tag.replace(/_/g, " ");
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
};

export function MatchCard({
  innovation,
  queryTags = [],
  query = "",
  rank,
  headingLevel: Heading = "h3",
}: MatchCardProps) {
  const titleId = `innowacja-${innovation.id}`;
  const unmaintained = innovation.is_unmaintained ?? innovation.status === "unmaintained";
  const shared = innovation.tags.filter((tag) => queryTags.includes(tag));
  // Middleman (A5): /wdrozenie?innowacja={id}&problem={opis}
  const deployHref = `/wdrozenie?innowacja=${innovation.id}${query ? `&problem=${encodeURIComponent(query)}` : ""}`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "relative flex h-full flex-col border-(length:--bw) border-line p-6 rounded-ui shadow-paper",
        unmaintained ? "bg-paper" : "bg-surface",
      )}
    >
      {rank !== undefined && (
        <p className="mb-1 flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
          {/* Bez procentu dopasowania: wynik TF-IDF nie jest skalibrowany, „28%” czyta się jak „nie pasuje”. */}
          <span>{rank === 1 ? "Najlepiej pasuje" : `Wynik ${rank}`}</span>
        </p>
      )}

      <Heading id={titleId} className="pr-16 text-xl font-bold text-deep">
        {innovation.title}
      </Heading>

      {unmaintained && (
        <p className="mt-3 inline-flex items-start gap-2 self-start rounded-ui border border-muted bg-sage px-3 py-1 font-bold text-ink">
          <Archive aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Nieaktualna: nikt już jej nie prowadzi
        </p>
      )}

      <p className="mt-3 text-lg">{innovation.short_desc}</p>

      {shared.length > 0 && (
        <blockquote className="mt-4 border-l-4 border-leaf pl-4">
          <p className="text-sm font-bold text-muted">Dlaczego pasuje</p>
          <p>Wspólne tematy: {shared.map(tagLabel).join(", ").toLowerCase()}.</p>
        </blockquote>
      )}

      <dl className="mt-4 grid gap-2">
        {innovation.target_group && (
          <div>
            <dt className="sr-only">Dla kogo</dt>
            <dd className="flex items-start gap-2">
              <Users aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
              <span>{short(innovation.target_group)}</span>
            </dd>
          </div>
        )}
        {innovation.where_implemented && (
          <div>
            <dt className="sr-only">Gdzie działa</dt>
            <dd className="flex items-start gap-2">
              <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
              <span>{short(innovation.where_implemented)}</span>
            </dd>
          </div>
        )}
        {innovation.cost_level && (
          <div>
            <dt className="sr-only">Koszt</dt>
            <dd className="flex items-start gap-2">
              <Coins aria-hidden="true" className={cn("mt-1 size-5 shrink-0", COST_TONE[innovation.cost_level] ?? "text-leaf")} />
              <span>
                {COST_LABELS[innovation.cost_level]}
                {innovation.implementation_time_months
                  ? `, start w ${innovation.implementation_time_months} ${plural(innovation.implementation_time_months, "miesiąc", "miesiące", "miesięcy")}`
                  : ""}
              </span>
            </dd>
          </div>
        )}
        {typeof innovation.testers_count === "number" && innovation.testers_count > 0 && (
          <div>
            <dt className="sr-only">Testy</dt>
            <dd className="flex items-start gap-2">
              <Puzzle aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
              <span>
                Sprawdzona przez {innovation.testers_count}{" "}
                {plural(innovation.testers_count, "testera", "testerów", "testerów")}
              </span>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Link href={deployHref} className={buttonVariants({ variant: "primary" })}>
          Jak to wdrożyć?<span className="sr-only"> {innovation.title}</span>
        </Link>
        <Link href={`/innowacje/${innovation.id}`} className={buttonVariants({ variant: "secondary" })}>
          Zobacz kartę<span className="sr-only">: {innovation.title}</span>
        </Link>
      </div>
    </article>
  );
}
