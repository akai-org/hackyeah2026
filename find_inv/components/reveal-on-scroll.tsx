"use client";

import { useEffect } from "react";

// Subtelne pojawianie się sekcji przy wejściu w viewport. Ukrywamy tylko elementy [data-reveal], które
// w chwili wczytania leżą poniżej ekranu — to, co już widać, nigdy nie mruga. Bez JS i przy
// prefers-reduced-motion wszystko jest od razu widoczne (CSS w globals.css działa tylko na .reveal-pending).

export function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const pending = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
      (element) => element.getBoundingClientRect().top > window.innerHeight,
    );
    if (!pending.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.remove("reveal-pending");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    for (const element of pending) {
      element.classList.add("reveal-pending");
      observer.observe(element);
    }
    return () => {
      observer.disconnect();
      for (const element of pending) element.classList.remove("reveal-pending");
    };
  }, []);

  return null;
}
