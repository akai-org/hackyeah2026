import type { Locale } from "./config";

// Daty bez Intl: serwer i przeglądarka muszą dać ten sam tekst (inaczej błąd hydracji).

const MONTHS: Record<Locale, string[]> = {
  pl: ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  uk: ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"],
};

const MONTHS_SHORT: Record<Locale, string[]> = {
  pl: ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  uk: ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"],
};

/** „2026-10-03” → „3 października 2026” / „3 October 2026” / „3 жовтня 2026”. */
export function formatDate(iso: string, locale: Locale): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return `${day} ${MONTHS[locale][month - 1]} ${year}`;
}

/** „2026-10-03T11:00:00” → „3 października 2026, 11:00”. */
export function formatDateTime(iso: string, locale: Locale): string {
  const time = iso.split("T")[1] ?? "";
  return `${formatDate(iso, locale)}, ${time.slice(0, 5)}`;
}

/** „2026-10-03” → „3 paź”. */
export function formatShortDate(iso: string, locale: Locale): string {
  const [, month, day] = iso.slice(0, 10).split("-").map(Number);
  return `${day} ${MONTHS_SHORT[locale][month - 1]}`;
}

/** Liczba z separatorem tysięcy właściwym dla języka (Intl daje to samo na serwerze i w przeglądarce). */
export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale === "uk" ? "uk-UA" : locale === "en" ? "en-GB" : "pl-PL", options).format(value);
}
