"use client";

import { Bot } from "lucide-react";

import { Middleman } from "@/components/middleman";
import { Dialog } from "@/components/ui/dialog";

// Okno „Jak to wdrożyć?” z wyników i karty innowacji. To ten sam Middleman co na /wdrozenie
// (jeden UI), tylko w dużym oknie — prawie pełny ekran, żeby plan był czytelny.

// Druk z okna: drukujemy tylko okno (bez strony pod spodem i bez przycisku „Zamknij”), na pełną szerokość.
const PRINT_CSS = `
@media print {
  body:has(dialog.middleman-dialog[open]) *:not(:has(dialog.middleman-dialog[open])):not(dialog.middleman-dialog[open]):not(dialog.middleman-dialog[open] *) {
    display: none !important;
  }
  dialog.middleman-dialog[open] {
    position: static; width: 100%; max-width: none; height: auto; max-height: none;
    overflow: visible; margin: 0; border: 0; box-shadow: none;
  }
  dialog.middleman-dialog::backdrop { display: none; }
  dialog.middleman-dialog button[aria-label="Zamknij"] { display: none; }
}
`;

interface Props {
  innovationId: number | string;
  innovationTitle: string;
  /** Opis problemu z wyszukiwania — trafia do pola „Jaki problem chcecie rozwiązać?”. */
  problem?: string;
  onClose: () => void;
}

export function MiddlemanModal({ innovationId, innovationTitle, problem = "", onClose }: Props) {
  return (
    <Dialog
      open
      onClose={onClose}
      title="Jak to wdrożyć?"
      description={innovationTitle}
      icon={<Bot aria-hidden="true" className="size-8 shrink-0 text-leaf" />}
      size="xl"
      className="middleman-dialog h-[calc(100dvh-2rem)] max-w-[min(90rem,calc(100vw-2rem))]"
    >
      <style>{PRINT_CSS}</style>
      <Middleman
        variant="dialog"
        innovationId={String(innovationId)}
        innovationTitle={innovationTitle}
        problem={problem}
      />
    </Dialog>
  );
}
