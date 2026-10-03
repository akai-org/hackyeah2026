import Link from "next/link";
import { BadgeCheck, CircleHelp, Hourglass, type LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { EvidenceLevel, Innovation } from "@/data/innovations.mock";
import { cn } from "@/lib/utils";

// Odznaka zawsze ma ikonę i słowo, kolor tła tylko je wspiera.
const EVIDENCE: Record<EvidenceLevel, { icon: LucideIcon; className: string }> = {
  Sprawdzone: { icon: BadgeCheck, className: "bg-mint" },
  Wstępne: { icon: Hourglass, className: "bg-butter" },
  "Brak danych": { icon: CircleHelp, className: "bg-paper" },
};

type InnovationCardProps = {
  innovation: Innovation;
  headingLevel?: "h2" | "h3";
  showLink?: boolean;
};

export function InnovationCard({ innovation, headingLevel: Heading = "h3", showLink = true }: InnovationCardProps) {
  const evidence = EVIDENCE[innovation.evidence];
  const EvidenceIcon = evidence.icon;
  const titleId = `innowacja-${innovation.id}`;

  return (
    <article
      id={innovation.id}
      aria-labelledby={titleId}
      className="relative flex scroll-mt-6 flex-col border-(length:--bw) border-deep bg-surface p-6 shadow-paper"
    >
      {/* Kawałek taśmy klejącej: tylko dekoracja. */}
      <span
        aria-hidden="true"
        className="simple-hidden absolute -top-3 right-6 h-6 w-20 rotate-[4deg] bg-butter [clip-path:polygon(0_8%,6%_0,100%_4%,95%_50%,100%_96%,4%_100%,0_55%)]"
      />

      <Heading id={titleId} className="pr-16 text-xl font-bold text-deep">
        {innovation.title}
      </Heading>

      <p className="mt-3 text-lg">{innovation.summary}</p>

      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-sm text-muted">Dla kogo</dt>
          <dd className="font-bold">{innovation.targetGroup}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Dowód skuteczności</dt>
          <dd className="mt-1">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-ui border-2 border-deep px-3 py-1 font-bold text-ink",
                evidence.className,
              )}
            >
              <EvidenceIcon aria-hidden="true" className="size-5 shrink-0 text-deep" />
              {innovation.evidence}
            </span>
          </dd>
        </div>
      </dl>

      {showLink && (
        <div className="mt-auto pt-6">
          <Link href={`/biblioteka#${innovation.id}`} className={buttonVariants({ variant: "secondary" })}>
            Zobacz kartę<span className="sr-only">: {innovation.title}</span>
          </Link>
        </div>
      )}
    </article>
  );
}
