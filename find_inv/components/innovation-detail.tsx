"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, ExternalLink, MessageSquareText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { COST_LABELS, type InnovationCard } from "@/data/innovations";
import { TAG_LABELS, type Tag } from "@/data/mock";
import { getInnovation } from "@/lib/matchmaking";
import { plural } from "@/lib/utils";

// Pełna karta innowacji: GET /api/innovations/{id}, a bez backendu dane mock.

export function InnovationDetail({ id }: { id: number }) {
  const [innovation, setInnovation] = useState<InnovationCard | null | undefined>(undefined);

  useEffect(() => {
    getInnovation(id).then(setInnovation);
  }, [id]);

  if (innovation === undefined) {
    return (
      <p role="status" className="text-lg text-muted">
        Wczytuję kartę innowacji…
      </p>
    );
  }

  if (innovation === null) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-deep">Nie znalazłem tej innowacji</h1>
        <p className="mt-3 text-lg">Mogła zostać usunięta z Biblioteki albo link jest niepełny.</p>
        <Link href="/biblioteka" className={buttonVariants({ variant: "secondary", className: "mt-6" })}>
          Przejdź do Biblioteki
        </Link>
      </div>
    );
  }

  const facts: Array<[string, string | undefined]> = [
    ["Dla kogo", innovation.target_group],
    ["Obszar", innovation.area ?? innovation.category],
    ["Gdzie działa", innovation.where_implemented],
    ["Koszt", innovation.cost_level ? COST_LABELS[innovation.cost_level] : undefined],
    [
      "Czas wdrożenia",
      innovation.implementation_time_months
        ? `${innovation.implementation_time_months} ${plural(innovation.implementation_time_months, "miesiąc", "miesiące", "miesięcy")}`
        : undefined,
    ],
    [
      "Testy w praktyce",
      innovation.testers_count
        ? `${innovation.testers_count} ${plural(innovation.testers_count, "tester", "testerzy", "testerów")}`
        : undefined,
    ],
  ];

  return (
    <article aria-labelledby="karta-tytul" className="max-w-4xl">
      <p className="font-bold text-muted">
        {innovation.category ? `Karta innowacji · ${innovation.category}` : "Karta innowacji"}
      </p>
      <h1 id="karta-tytul" className="mt-1 text-2xl font-bold text-deep">
        {innovation.title}
      </h1>

      {(innovation.is_unmaintained || innovation.status === "unmaintained") && (
        <p className="mt-4 inline-flex items-start gap-2 rounded-ui border-2 border-muted bg-sage px-3 py-1.5 font-bold text-ink">
          <Archive aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Nieaktualna: nikt już jej nie prowadzi. Pomysł nadal może się przydać.
        </p>
      )}

      <p className="mt-4 max-w-[60ch] text-lg">{innovation.short_desc}</p>

      <div className="relative mt-8 border-(length:--bw) border-deep bg-surface p-6 shadow-paper sm:p-8">
        <span
          aria-hidden="true"
          className="simple-hidden absolute -top-3 right-10 h-6 w-24 rotate-[4deg] bg-butter [clip-path:polygon(0_8%,6%_0,100%_4%,95%_50%,100%_96%,4%_100%,0_55%)]"
        />
        {innovation.full_desc && (
          <>
            <h2 className="text-xl font-bold text-deep">Na czym polega</h2>
            <p className="mt-2 max-w-[65ch]">{innovation.full_desc}</p>
          </>
        )}

        <h2 className="mt-8 text-xl font-bold text-deep">W skrócie</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-[12rem_1fr]">
          {facts
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-bold text-deep">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>

        {innovation.tags.length > 0 && (
          <>
            <h2 className="mt-8 text-xl font-bold text-deep">Tematy</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {innovation.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/biblioteka?tags=${encodeURIComponent(tag)}`}
                    className="inline-flex min-h-12 items-center rounded-ui border-(length:--bw) border-deep bg-mint px-4 text-base text-ink hover:bg-sage"
                  >
                    {TAG_LABELS[tag as Tag] ?? tag}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/wdrozenie?innowacja=${innovation.id}`} className={buttonVariants({ variant: "primary" })}>
          <MessageSquareText aria-hidden="true" />
          Dostosuj do mojej instytucji
        </Link>
        {innovation.source_url && (
          <a
            href={innovation.source_url}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary" })}
          >
            <ExternalLink aria-hidden="true" />
            Źródło: Biblioteka ROPS<span className="sr-only"> (otwiera się w nowej karcie)</span>
          </a>
        )}
      </div>
    </article>
  );
}
