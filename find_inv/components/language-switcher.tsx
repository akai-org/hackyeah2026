"use client";

import { Languages, Router } from "lucide-react";

import { LOCALE_NAMES, LOCALES, isLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

// Wybór języka interfejsu: natywny <select> — działa z klawiatury i czytnikiem bez dodatkowej pracy.
// Nazwy języków zawsze w ich własnym języku (z atrybutem lang), żeby każdy znalazł swój.
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();

  return (
    <label
      className={cn(
        "relative inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-ui border-(length:--bw) border-border bg-surface px-3 text-primary hover:bg-primary/10 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-primary",
        className,
      )}
    >
      <Languages aria-hidden="true" className="size-5 shrink-0" />
      <span aria-hidden="true" className="font-bold text-foreground">
        {locale.toUpperCase()}
      </span>
      {/* Przezroczysty select na całym przycisku: widać krótki kod, a lista ma pełne nazwy. */}
      <select
        value={locale}
        aria-label={t.lang.change}
        onChange={(event) => isLocale(event.target.value) && setLocale(event.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
        onSelect={() => router.refresh()}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code} lang={code}>
            {code.toUpperCase()} — {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
