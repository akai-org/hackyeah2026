"use client";

import Link from "next/link";
import { ChevronRight, CircleHelp, MapPin, Tag, TrendingUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export interface BackendInnovation {
  id: number;
  title: string;
  short_desc: string;
  full_desc?: string;
  category?: string;
  area?: string;
  target_group?: string;
  location?: string;
  status: string;
  cost_level?: string;
  implementation_time_months?: number;
  testers_count?: number;
  where_implemented?: string;
  source_url?: string;
  tags: string[];
  match_score?: number;
  is_unmaintained: boolean;
}

interface Props {
  innovation: BackendInnovation;
  headingLevel?: "h2" | "h3";
  onMiddleman?: (id: number, title: string) => void;
  showScore?: boolean;
}

export function BackendInnovationCard({ innovation, headingLevel: Heading = "h3", onMiddleman, showScore }: Props) {
  const t = useT();
  return (
    <article
      aria-label={innovation.title}
      className={cn(
        "relative flex flex-col border-(length:--bw) border-border bg-surface p-6 shadow-raised",
        innovation.is_unmaintained && "opacity-80",
      )}
    >
      {/* taśma dekoracyjna */}
      <span
        aria-hidden="true"
        className="simple-hidden absolute -top-3 right-6 h-6 w-20 rotate-[4deg] bg-accent [clip-path:polygon(0_8%,6%_0,100%_4%,95%_50%,100%_96%,4%_100%,0_55%)]"
      />

      {innovation.is_unmaintained && (
        <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-ui border-2 border-border bg-background px-2 py-0.5 text-sm text-muted">
          <CircleHelp className="size-4" aria-hidden="true" />
          {t.card.unmaintained}
        </span>
      )}

      <Heading className="pr-4 text-xl font-bold text-foreground">{innovation.title}</Heading>
      <p className="mt-3">{innovation.short_desc}</p>

      <dl className="mt-4 space-y-2 text-sm">
        {innovation.target_group && (
          <div className="flex gap-2">
            <dt className="text-muted shrink-0">{t.card.forWhom}:</dt>
            <dd className="font-bold">{innovation.target_group}</dd>
          </div>
        )}
        {innovation.where_implemented && (
          <div className="flex gap-2 items-start">
            <dt>
              <MapPin className="inline size-4 text-muted" aria-hidden="true" />
              <span className="sr-only">{t.card.whereImplemented}:</span>
            </dt>
            <dd className="text-muted">{innovation.where_implemented}</dd>
          </div>
        )}
        {innovation.cost_level && (
          <div className="flex gap-2">
            <dt className="text-muted shrink-0">{t.card.cost}:</dt>
            <dd className="font-bold">{t.cost[innovation.cost_level] ?? innovation.cost_level}</dd>
          </div>
        )}
        {showScore && innovation.match_score !== undefined && (
          <div className="flex gap-2">
            <dt className="text-muted shrink-0">{t.card.match}:</dt>
            <dd className="font-bold">{Math.round(innovation.match_score * 100)}%</dd>
          </div>
        )}
      </dl>

      {innovation.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={t.results.tagsLabel}>
          {innovation.tags.slice(0, 4).map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-primary bg-background px-2.5 py-0.5 text-sm text-primary"
            >
              <Tag className="size-3" aria-hidden="true" />
              {t.tags[tag] ?? tag}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        {onMiddleman && (
          <button
            onClick={() => onMiddleman(innovation.id, innovation.title)}
            className={buttonVariants({ variant: "primary", className: "gap-2 text-sm" })}
          >
            <TrendingUp className="size-4" aria-hidden="true" />
            {t.card.howToDeploy}
          </button>
        )}
        <Link
          href={`/innowacje/${innovation.id}`}
          className={buttonVariants({ variant: "secondary", className: "gap-2 text-sm" })}
        >
          {t.card.details}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
