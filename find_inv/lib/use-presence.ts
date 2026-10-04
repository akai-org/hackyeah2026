"use client";

import { useEffect, useState } from "react";

/**
 * Element znika z animacją: po `open=false` zostaje jeszcze `ms` milisekund w DOM z `closing=true`
 * (wtedy CSS gra animację wyjścia), potem się odmontowuje. Przy prefers-reduced-motion — od razu.
 */
export function usePresence(open: boolean, ms = 160) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  // Wzorzec „stan z poprzedniego renderu” (bez efektu): otwarcie montuje od razu.
  const [previous, setPrevious] = useState(open);
  if (open !== previous) {
    setPrevious(open);
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
    }
  }

  useEffect(() => {
    if (!closing) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(
      () => {
        setMounted(false);
        setClosing(false);
      },
      reduce ? 0 : ms,
    );
    return () => clearTimeout(timer);
  }, [closing, ms]);

  return { mounted, closing };
}
