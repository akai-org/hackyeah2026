"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { LOCALE_TAGS, writeLocaleCookie, type Locale } from "./config";
import { getMessages, type Messages } from "./messages";

type I18nValue = { locale: Locale; t: Messages; setLocale: (locale: Locale) => void };

const I18nContext = createContext<I18nValue | null>(null);

// Język przychodzi z serwera (cookie "lang"), więc pierwszy render nie miga polskim tekstem.
export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      writeLocaleCookie(next);
      document.documentElement.lang = LOCALE_TAGS[next].slice(0, 2);
      setLocaleState(next);
      // Komponenty serwerowe czytają cookie — odświeżamy je bez przeładowania strony.
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ locale, t: getMessages(locale), setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n poza <I18nProvider>");
  return value;
}

/** Skrót: sam słownik. */
export function useT(): Messages {
  return useI18n().t;
}
