"use client";

import { Info } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

// Wspólne ostrzeżenie przy treściach z AI (Middleman, czat, kreator, generator wniosków).
// Spokojne, informacyjne — bez czerwieni i role="alert", żeby nie straszyć ani nie przerywać czytnika.

type AiDisclaimerProps = {
  className?: string;
  /** Na druku zostaje — wydruk planu czy wniosku też jest wygenerowany przez AI. */
  printable?: boolean;
};

export function AiDisclaimer({ className, printable = true }: AiDisclaimerProps) {
  const t = useT();
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-ui border-2 border-border/40 bg-surface px-4 py-2 text-base text-foreground",
        !printable && "print:hidden",
        className,
      )}
    >
      <Info aria-hidden="true" className="mt-1 size-5 shrink-0 text-foreground" />
      <span>{t.common.aiDisclaimer}</span>
    </p>
  );
}
