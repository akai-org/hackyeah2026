"use client";

import { Fragment, type ReactNode } from "react";

import { useI18n } from "@/lib/i18n/client";

// Po zmianie języka treść strony montuje się od nowa: każdy komponent pobiera dane z backendu jeszcze raz,
// już z nowym X-Lang (cookie „lang” jest zapisane, zanim zmieni się locale). Komponenty serwerowe odświeża
// router.refresh() w I18nProvider. Nagłówek i stopka zostają — tłumaczą się same ze słownika.
export function LocaleBoundary({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  return <Fragment key={locale}>{children}</Fragment>;
}
