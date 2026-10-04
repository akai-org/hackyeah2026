"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useI18n } from "./client";

// Teksty trzymane na froncie (dane demo, np. lista innowacji w Middlemanie) tłumaczy backend
// (POST /api/translate, cache w translations.db). Do czasu odpowiedzi — oryginał po polsku.

const memory = new Map<string, string>();
const key = (locale: string, text: string) => `${locale}\u0000${text}`;

export function useTranslatedTexts(texts: string[]): (text: string) => string {
  const { locale } = useI18n();
  const [, setVersion] = useState(0);
  const missing = locale === "pl" ? [] : texts.filter((text) => text && !memory.has(key(locale, text)));
  const signature = missing.join("\u0001");

  useEffect(() => {
    if (!signature) return;
    const batch = signature.split("\u0001");
    let cancelled = false;
    apiFetch<string[]>("/api/translate", { method: "POST", body: JSON.stringify({ texts: batch }) })
      .then((translated) => {
        batch.forEach((text, index) => memory.set(key(locale, text), translated[index] ?? text));
        if (!cancelled) setVersion((v) => v + 1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [signature, locale]);

  return (text: string) => (locale === "pl" ? text : (memory.get(key(locale, text)) ?? text));
}
