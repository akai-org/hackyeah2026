import type { Tag } from "@/data/mock";

// Tagi z okna szybkiego wyszukiwania (Ctrl+K), wspólne dla wszystkich kategorii.
// - Innowacje: zamiana na tag taksonomii Biblioteki (?tags=…).
// - Problemy i Artykuły: element pasuje, jeśli zawiera któryś z rdzeni słów tagu (?tagi=…).
// - Wszystko: etykiety dopisane do opisu dla dopasowania AI.

export type SearchTag = { label: string; taxonomy: Tag; stems: string[] };

export const SEARCH_TAGS: SearchTag[] = [
  { label: "Aplikacja", taxonomy: "wykluczenie_cyfrowe", stems: ["aplikac", "cyfrow", "internet", "smartfon"] },
  { label: "Małe firmy", taxonomy: "rynek_pracy", stems: ["firm", "przedsieb", "spoldziel", "prac"] },
  { label: "Niewidomi", taxonomy: "niepełnosprawność", stems: ["niewidom", "wzrok", "niepelnospraw"] },
  { label: "Seniorzy", taxonomy: "seniorzy", stems: ["senior", "starz", "65+", "starsz"] },
  { label: "Transport", taxonomy: "transport", stems: ["transport", "dojazd", "komunikac"] },
  { label: "Zdrowie", taxonomy: "zdrowie_psychiczne", stems: ["zdrow", "lekar", "psych"] },
];

/** Małe litery bez polskich znaków — do porównań „zawiera”. */
export function normalizeText(text: string) {
  return text.toLocaleLowerCase("pl").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/ł/g, "l");
}

/** Etykiety z parametru ?tagi=Seniorzy,Transport → znane tagi. */
export function parseSearchTags(value: string): SearchTag[] {
  const labels = value.split(",").map((label) => label.trim());
  return SEARCH_TAGS.filter((tag) => labels.includes(tag.label));
}

/** Czy tekst pasuje do któregoś z wybranych tagów (brak tagów = pasuje). */
export function matchesSearchTags(text: string, tags: SearchTag[]) {
  if (!tags.length) return true;
  const haystack = normalizeText(text);
  return tags.some((tag) => tag.stems.some((stem) => haystack.includes(stem)));
}

/**
 * Słowa zapytania jako rdzenie: polska odmiana zmienia końcówki („opieka” → „opiekuńczych”),
 * więc dłuższe słowa skracamy o 1–2 litery (min. 4 znaki).
 */
export function queryStems(query: string) {
  return normalizeText(query)
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map((word) => (word.length >= 6 ? word.slice(0, Math.max(4, word.length - 2)) : word.length === 5 ? word.slice(0, 4) : word));
}
