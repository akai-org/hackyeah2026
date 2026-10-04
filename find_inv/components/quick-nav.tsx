"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

// „Szybki dostęp” w hero: linki do sekcji strony głównej w ich kolejności. Sekcje, które same się chowają
// (np. artykuł dnia bez danych), znikają też stąd — żaden link nie prowadzi donikąd.

export type QuickNavSection = { id: string; label: string };

export function QuickNav({ sections }: { sections: QuickNavSection[] }) {
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    const check = () => {
      const next = sections.filter((section) => !document.getElementById(section.id)).map((section) => section.id);
      setMissing((current) => (current.join() === next.join() ? current : next));
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.getElementById("main") ?? document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Szybki dostęp" className="mt-6">
      <ul className="flex flex-wrap gap-x-6 gap-y-1">
        {sections
          .filter((section) => !missing.includes(section.id))
          .map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex min-h-12 items-center gap-2 font-medium text-primary underline underline-offset-4 hover:text-primary-hover"
              >
                {section.label}
                <ArrowRight aria-hidden="true" className="size-5" />
              </a>
            </li>
          ))}
      </ul>
    </nav>
  );
}
