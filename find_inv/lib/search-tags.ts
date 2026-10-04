import { TAG_KEYWORDS, TAG_LABELS, TAXONOMY_TAGS, type Tag } from "@/data/mock";
import { apiFetch } from "@/lib/api";

// Tagi z okna szybkiego wyszukiwania (Ctrl+K): tagi taksonomii Biblioteki (GET /api/tags), wspólne dla kategorii.
// - Innowacje: wprost jako ?tags=… (filtr Biblioteki).
// - Problemy i Artykuły: ?tagi=… — element pasuje, jeśli zawiera słowa typowe dla tagu (TAG_KEYWORDS).
// - Wszystko: nazwy tagów dopisane do opisu dla dopasowania AI.

export type SearchTag = { id: Tag; pattern: RegExp };

export type TagCount = { tag: Tag; count: number };

const KNOWN = new Set<string>(TAXONOMY_TAGS);
export const isTaxonomyTag = (value: string): value is Tag => KNOWN.has(value);

// Starsze linki miały etykiety zamiast tagów (?tagi=Seniorzy,Transport) — dalej działają.
const LEGACY_LABELS: Record<string, Tag> = {
  Aplikacja: "wykluczenie_cyfrowe",
  "Małe firmy": "rynek_pracy",
  Niewidomi: "niepełnosprawność",
  Seniorzy: "seniorzy",
  Transport: "transport",
  Zdrowie: "zdrowie_psychiczne",
};

/** Małe litery bez polskich znaków — do porównań „zawiera”. */
export function normalizeText(text: string) {
  return text.toLocaleLowerCase("pl").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/ł/g, "l");
}

function patternFor(id: Tag): RegExp {
  const keywords = TAG_KEYWORDS.find(([, tag]) => tag === id)?.[0];
  // Tag bez słów kluczowych (np. „inkubator”): rdzeń jego polskiej nazwy.
  return keywords ?? new RegExp(TAG_LABELS[id].toLocaleLowerCase("pl").slice(0, 6));
}

export function searchTag(id: Tag): SearchTag {
  return { id, pattern: patternFor(id) };
}

/** Parametr ?tagi=seniorzy,transport (albo stare etykiety) → znane tagi, bez powtórzeń. */
export function parseSearchTags(value: string): SearchTag[] {
  const ids = value
    .split(",")
    .map((item) => item.trim())
    .map((item) => (isTaxonomyTag(item) ? item : LEGACY_LABELS[item]))
    .filter((item): item is Tag => Boolean(item));
  return [...new Set(ids)].map(searchTag);
}

/** Czy tekst pasuje do któregoś z wybranych tagów (brak tagów = pasuje). */
export function matchesSearchTags(text: string, tags: SearchTag[]) {
  if (!tags.length) return true;
  const lower = text.toLocaleLowerCase("pl");
  return tags.some((tag) => tag.pattern.test(lower));
}

/** Tagi do wyboru: z backendu (najczęstsze na górze); bez połączenia — cała taksonomia po kolei. */
export async function loadTags(): Promise<TagCount[]> {
  try {
    const tags = await apiFetch<Array<{ tag: string; count: number }>>("/api/tags");
    return tags.filter((item): item is TagCount => isTaxonomyTag(item.tag));
  } catch {
    return TAXONOMY_TAGS.map((tag) => ({ tag, count: 0 }));
  }
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
