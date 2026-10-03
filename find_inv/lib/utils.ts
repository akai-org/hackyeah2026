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
