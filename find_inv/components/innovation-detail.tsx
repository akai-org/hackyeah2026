"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Archive, ExternalLink, FileText, MessageSquareText, Video } from "lucide-react";

import { ForumThread } from "@/components/forum-thread";
import { TesterApplyModal } from "@/components/tester-apply-modal";
import { Toast, useToast } from "@/components/toast";
import { TestRequestBox } from "@/components/test-request";
import { buttonVariants } from "@/components/ui/button";
import { COST_LABELS, type InnovationCard } from "@/data/innovations";
import { TAG_LABELS, type Tag } from "@/data/mock";
import { getInnovation } from "@/lib/matchmaking";
import { track, type CtaButton } from "@/lib/track";
import { plural } from "@/lib/utils";

// Pełna karta innowacji: GET /api/innovations/{id}, a bez backendu dane mock.

/** Opis z ROPS: akapity rozdzielone pustą linią, często z etykietą („Problem: …”). Pierwsza „Na czym polega:” dubluje nagłówek. */
function Description({ text }: { text: string }) {
  const paragraphs = text
    .replace(/^\s*Na czym polega:\s*/i, "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="mt-2 grid max-w-[65ch] gap-3">
      {paragraphs.map((paragraph, index) => {
        const label = paragraph.match(/^([A-ZĄĆĘŁŃÓŚŹŻ][^:\n]{1,40}):\s*/);
        return (
          <p key={index} className="whitespace-pre-line">
            {label ? (
              <>
                <strong className="text-deep">{label[1]}:</strong> {paragraph.slice(label[0].length)}
              </>
            ) : (
              paragraph
            )}
          </p>
        );
      })}
    </div>
  );
}

export function InnovationDetail({ id }: { id: number }) {
  const [innovation, setInnovation] = useState<InnovationCard | null | undefined>(undefined);
  const [testerModalOpen, setTesterModalOpen] = useState(false);
  const [testerStatus, setTesterStatus] = useState<"none" | "pending">("none");
  const toast = useToast();

  useEffect(() => {
    try {
      if (localStorage.getItem(`hubmi-tester-${id}`)) setTesterStatus("pending");
    } catch {}
  }, [id]);

  useEffect(() => {
    getInnovation(id).then(setInnovation);
  }, [id]);

  // Jedno wyświetlenie na wejście (StrictMode w dev odpala efekt dwa razy).
  const trackedView = useRef<number | null>(null);
  useEffect(() => {
    if (!innovation || trackedView.current === id) return;
    trackedView.current = id;
    track({ type: "innovation_view", innovationId: id });
  }, [innovation, id]);

  const cta = (button: CtaButton) => () => track({ type: "cta_click", innovationId: id, meta: { button } });

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
    ["Autorzy", innovation.authors ?? undefined],
    ["Projekt", innovation.project ?? undefined],
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
            <Description text={innovation.full_desc} />
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
        <Link href={`/wdrozenie?innowacja=${innovation.id}`} onClick={cta("wdrozenie")} className={buttonVariants({ variant: "primary" })}>
          <MessageSquareText aria-hidden="true" />
          Dostosuj do mojej instytucji
        </Link>
        {innovation.materials_url && (
          <a
            href={innovation.materials_url}
            onClick={cta("materialy")}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary" })}
          >
            <FileText aria-hidden="true" />
            Materiały do pobrania<span className="sr-only"> (otwiera się w nowej karcie)</span>
          </a>
        )}
        {innovation.video_url && (
          <a
            href={innovation.video_url}
            onClick={cta("film")}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary" })}
          >
            <Video aria-hidden="true" />
            Film o innowacji<span className="sr-only"> (otwiera się w nowej karcie)</span>
          </a>
        )}
        {innovation.source_url && (
          <a
            href={innovation.source_url}
            onClick={cta("zrodlo")}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary" })}
          >
            <ExternalLink aria-hidden="true" />
            Źródło: Biblioteka ROPS<span className="sr-only"> (otwiera się w nowej karcie)</span>
          </a>
        )}
      </div>

      <TestRequestBox innovation={innovation} />

      {/* Zgłoś się jako tester */}
      <div className="mt-8 rounded-ui border-(length:--bw) border-deep bg-sage p-5 sm:p-6">
        <h2 className="text-xl font-bold text-deep">Testowanie</h2>
        <p className="mt-2 text-base">Masz doświadczenie z tym tematem? Zgłoś się jako tester i pomóż ocenić tę innowację w praktyce.</p>
        {testerStatus === "pending" ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-sm font-bold text-deep">
            Zgłoszenie wysłane — czekamy na odpowiedź
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              cta("zostan_testerem")();
              setTesterModalOpen(true);
            }}
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-ui border-(length:--bw) border-deep bg-deep px-5 font-bold text-surface hover:bg-leaf"
          >
            Zgłoś się jako tester
          </button>
        )}
      </div>

      {/* Forum dyskusji */}
      <section aria-labelledby="dyskusja-tytul" className="mt-12 border-t-2 border-sage pt-10">
        <h2 id="dyskusja-tytul" className="text-2xl font-bold text-deep">Dyskusja społeczności</h2>
        <p className="mt-1 text-base text-muted">Komentarze mieszkańców, testerów i konsultantów dotyczące tej innowacji.</p>
        <div className="mt-6">
          <ForumThread
            innovationId={id}
            embedded
            innovation={innovation.title ? { title: innovation.title, tags: innovation.tags } : undefined}
          />
        </div>
      </section>

      {testerModalOpen && (
        <TesterApplyModal
          innovationId={id}
          innovationTitle={innovation.title}
          onClose={() => setTesterModalOpen(false)}
          onSuccess={() => {
            setTesterStatus("pending");
            toast.show("Zgłoszenie wysłane!");
          }}
        />
      )}
      <Toast message={toast.message} onClose={toast.hide} />
    </article>
  );
}
