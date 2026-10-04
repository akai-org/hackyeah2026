import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

// Wspólne ostrzeżenie przy treściach z AI (Middleman, czat, kreator, generator wniosków).
// Spokojne, informacyjne — bez czerwieni i role="alert", żeby nie straszyć ani nie przerywać czytnika.

type AiDisclaimerProps = {
  className?: string;
  /** Na druku zostaje — wydruk planu czy wniosku też jest wygenerowany przez AI. */
  printable?: boolean;
};

export function AiDisclaimer({ className, printable = true }: AiDisclaimerProps) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-ui border-2 border-sage bg-surface px-4 py-2 text-base text-ink",
        !printable && "print:hidden",
        className,
      )}
    >
      <Info aria-hidden="true" className="mt-1 size-5 shrink-0 text-deep" />
      <span>Odpowiedzi generuje AI i mogą zawierać błędy — zweryfikuj przed wdrożeniem.</span>
    </p>
  );
}
