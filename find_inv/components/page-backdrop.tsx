import type { ReactNode } from "react";

import { Monstera } from "@/components/monstera";
import { PaperCloud } from "@/components/paper-cloud";

// Tło podstron: jeden liść monstery wychodzący zza krawędzi ekranu i chmurki
// w pustym miejscu obok nagłówka (DESIGN.md, sekcja 7). Dekoracje leżą tylko
// w pasie nagłówka i na marginesach, nigdy pod treścią. Bez ruchu (sekcja 9).
// Znikają w trybie prostym i w druku (.simple-hidden).

// Chmurki w pasie nagłówka trzymają się prawej krawędzi treści (za akapitem 60ch i polem wyszukiwania)
// i pojawiają się dopiero od 1280 px, bo węziej dochodziłyby do tekstu.
// Ozdoby na marginesach dopiero od 1400 px, bo tam margines ma ponad 140 px.
const LAYOUTS = {
  // Liść w prawym górnym rogu, chmurki po jego lewej.
  "corner-right": (leafColor: LeafColor) => (
    <>
      <Monstera
        size="small"
        color={leafColor}
        className="absolute -top-12 -right-14 hidden w-52 rotate-[210deg] lg:block"
      />
      <div className="relative mx-auto h-full max-w-content">
        <PaperCloud className="absolute top-8 right-10 hidden w-40 -rotate-2 xl:block" />
        <PaperCloud shape="tall" color="mint" className="absolute top-40 right-4 hidden w-24 rotate-3 xl:block" />
      </div>
      <PaperCloud shape="tall" className="absolute top-[38rem] -left-12 hidden w-40 rotate-2 min-[1400px]:block" />
    </>
  ),
  // Liść wychodzi zza lewej krawędzi, chmurki po prawej stronie nagłówka.
  "corner-left": (leafColor: LeafColor) => (
    <>
      <Monstera
        size="small"
        color={leafColor}
        className="absolute top-20 -left-20 hidden w-48 rotate-[110deg] min-[1400px]:block"
      />
      <div className="relative mx-auto h-full max-w-content">
        <PaperCloud shape="tall" color="mint" className="absolute top-4 right-36 hidden w-28 -rotate-3 xl:block" />
        <PaperCloud className="absolute top-20 right-6 hidden w-48 rotate-1 xl:block" />
      </div>
    </>
  ),
  // Wąska kolumna treści (formularz): duży liść z obrysem papieru po prawej, chmurki nad nim.
  side: (leafColor: LeafColor) => (
    <>
      <div className="relative mx-auto h-full max-w-content">
        <PaperCloud className="absolute top-10 right-10 hidden w-56 -rotate-2 xl:block" />
        <PaperCloud shape="tall" color="mint" className="absolute top-[13rem] right-60 hidden w-28 rotate-3 xl:block" />
      </div>
      <Monstera
        size="small"
        color={leafColor}
        outlined
        className="absolute top-[22rem] -right-24 hidden w-80 rotate-[-120deg] xl:block"
      />
    </>
  ),
  // Treść na całą szerokość (karty, plan wdrożenia): ozdoby tylko na marginesach.
  gutters: (leafColor: LeafColor) => (
    <>
      <Monstera
        size="small"
        color={leafColor}
        className="absolute top-16 -left-20 hidden w-44 rotate-[120deg] min-[1400px]:block"
      />
      <PaperCloud className="absolute top-[26rem] -right-14 hidden w-44 -rotate-2 min-[1400px]:block" />
    </>
  ),
} as const;

type LeafColor = "mint" | "sage" | "leaf";

type PageBackdropProps = {
  layout?: keyof typeof LAYOUTS;
  leafColor?: LeafColor;
  children: ReactNode;
};

export function PageBackdrop({ layout = "corner-right", leafColor = "mint", children }: PageBackdropProps) {
  return (
    // overflow-clip, a nie hidden: nie tworzy kontenera przewijania, więc sticky w treści dalej działa.
    <div className="relative overflow-clip">
      <div aria-hidden="true" className="simple-hidden pointer-events-none absolute inset-0 select-none">
        {LAYOUTS[layout](leafColor)}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
