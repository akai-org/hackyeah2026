import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Własny rozmiar `text-hero` musi być rozpoznany jako rozmiar, a nie kolor,
// inaczej twMerge usunąłby klasę koloru tekstu stojącą obok.
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ["hero"] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Polska odmiana liczebnika: 1 tester, 2 testerzy, 5 testerów. */
export function plural(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one;
  const lastTwo = count % 100;
  const last = count % 10;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many;
}
