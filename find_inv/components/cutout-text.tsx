import type { CSSProperties } from "react";

import { between, createRandom, hashString } from "@/lib/seed";
import { cn } from "@/lib/utils";

// Kolaż „ransom note" wg DESIGN.md, sekcja 6.
// Czytnik ekranu dostaje jedno zdanie z aria-label, litery są aria-hidden.
// W trybie prostym i przy prefers-reduced-motion CSS pokazuje zwykły nagłówek (.cutout-plain).

const MAX_WORDS = 6;
const MAX_CHARS = 40;

// Spokojne kroje: min. 2 z 5 liter w słowie (DESIGN.md 4.2).
const CALM_FONTS = ["font-body font-bold", "font-cut5 font-bold"];
const LOUD_FONTS = ["font-cut1", "font-cut2", "font-cut3 font-black", "font-cut4 font-bold"];

// Każde tło ma kontrast ≥ 4,5:1 z obydwoma kolorami liter (ink, deep).
const BACKGROUNDS = ["bg-paper", "bg-surface", "bg-sage", "bg-mint", "bg-butter"] as const;
const BUTTER = "bg-butter";
const TEXT_COLORS = ["text-ink", "text-deep"];

const SIZES = {
  hero: "text-hero",
  section: "text-2xl",
  logo: "text-xl",
} as const;

type Letter = {
  char: string;
  className: string;
  style: CSSProperties;
};

type CutoutTextProps = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  size?: keyof typeof SIZES;
  /** Jednorazowe „przyklejanie" liter (tylko nagłówek strony głównej). */
  animate?: boolean;
  /**
   * Gdy false, element nie dostaje aria-label, bo nazwę daje rodzic
   * (np. link z logo ma własny aria-label).
   */
  labelled?: boolean;
  id?: string;
  className?: string;
};

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

/** Nieregularny wielokąt 5–7 punktów, odchylenie od prostokąta do 2%. */
function clipPolygon(random: () => number): string {
  const j = () => between(random, 0, 2).toFixed(2);
  const points = [`${j()}% ${j()}%`];
  if (random() > 0.5) points.push(`${between(random, 35, 65).toFixed(2)}% ${j()}%`);
  points.push(`${(100 - Number(j())).toFixed(2)}% ${j()}%`);
  if (random() > 0.5) points.push(`${(100 - Number(j())).toFixed(2)}% ${between(random, 35, 65).toFixed(2)}%`);
  points.push(`${(100 - Number(j())).toFixed(2)}% ${(100 - Number(j())).toFixed(2)}%`);
  if (random() > 0.5) points.push(`${between(random, 35, 65).toFixed(2)}% ${(100 - Number(j())).toFixed(2)}%`);
  points.push(`${j()}% ${(100 - Number(j())).toFixed(2)}%`);
  return `polygon(${points.join(", ")})`;
}

function buildWords(text: string, animate: boolean): Letter[][] {
  const textSeed = hashString(text);
  const words = text.split(" ").filter(Boolean);
  const totalLetters = words.reduce((sum, word) => sum + Array.from(word).length, 0);
  // Cała animacja mieści się w 900 ms: 300 ms na literę plus rozłożone opóźnienia.
  const step = totalLetters > 1 ? Math.min(45, Math.floor(600 / (totalLetters - 1))) : 0;

  let index = 0;
  let lastButter = -Infinity;
  let previousBackground = "";

  return words.map((word, wordIndex) => {
    const chars = Array.from(word);
    const wordRandom = createRandom(textSeed + wordIndex * 7919);

    // Które litery dostają spokojny krój: co najmniej 40% słowa.
    const calmCount = chars.length >= 2 ? Math.ceil(chars.length * 0.4) : 0;
    // Klucze liczone przed sortowaniem, żeby wynik nie zależał od algorytmu sortowania przeglądarki.
    const keys = chars.map(() => wordRandom());
    const order = chars.map((_, i) => i).sort((a, b) => keys[a] - keys[b] || a - b);
    const calm = new Set(order.slice(0, calmCount));

    return chars.map((char, charIndex) => {
      const random = createRandom(textSeed ^ (char.charCodeAt(0) * 31 + index * 2654435761));

      const font = calm.has(charIndex) ? pick(random, CALM_FONTS) : pick(random, LOUD_FONTS);

      // Maks. 1 tło `butter` na 5 liter i bez dwóch takich samych teł obok siebie.
      const allowed = BACKGROUNDS.filter(
        (bg) => bg !== previousBackground && (bg !== BUTTER || index - lastButter >= 5),
      );
      const background = pick(random, allowed);
      if (background === BUTTER) lastButter = index;
      previousBackground = background;

      const rotation = between(random, -4, 4);
      const style = {
        "--r": `${rotation.toFixed(2)}deg`,
        "--r-sm": `${(rotation / 2).toFixed(2)}deg`,
        "--dy": `${between(random, -0.06, 0.06).toFixed(3)}em`,
        "--s": between(random, 0.94, 1.06).toFixed(3),
        "--clip": clipPolygon(random),
        ...(animate ? { "--delay": `${index * step}ms` } : {}),
      } as CSSProperties;

      index += 1;
      return {
        char,
        className: cn("cutout-piece", font, background, pick(random, TEXT_COLORS)),
        style,
      };
    });
  });
}

export function CutoutText({
  text,
  as: Tag = "h2",
  size = "section",
  animate = false,
  labelled = true,
  id,
  className,
}: CutoutTextProps) {
  if (process.env.NODE_ENV !== "production") {
    const wordCount = text.split(" ").filter(Boolean).length;
    if (wordCount > MAX_WORDS || text.length > MAX_CHARS) {
      console.warn(
        `CutoutText: „${text}" ma ${wordCount} słów i ${text.length} znaków. Limit to ${MAX_WORDS} słów i ${MAX_CHARS} znaków.`,
      );
    }
  }

  const words = buildWords(text, animate);

  return (
    <Tag
      id={id}
      aria-label={labelled ? text : undefined}
      className={cn("cutout", SIZES[size], animate && "cutout-animate", className)}
    >
      <span aria-hidden="true" className="cutout-letters">
        {words.map((letters, wordIndex) => (
          <span key={wordIndex}>
            {wordIndex > 0 && " "}
            <span className="cutout-word">
              {letters.map((letter, letterIndex) => (
                <span key={letterIndex} className="cutout-char" style={letter.style}>
                  <span className={letter.className}>{letter.char}</span>
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
      <span aria-hidden="true" className="cutout-plain">
        {text}
      </span>
    </Tag>
  );
}
