"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Archive, ExternalLink, FileText, MessageSquareText, MessageSquarePlus, Pause, Play, Video } from "lucide-react";

import { ForumThread } from "@/components/forum-thread";
import { StarRating } from "@/components/star-rating";
import { TesterApplyModal } from "@/components/tester-apply-modal";
import { Toast, useToast } from "@/components/toast";
import { TestRequestBox } from "@/components/test-request";
import { Button, buttonVariants } from "@/components/ui/button";
import { COST_LABELS, type InnovationCard } from "@/data/innovations";
import { TAG_LABELS, type Tag } from "@/data/mock";
import { getInnovation } from "@/lib/matchmaking";
import { track, type CtaButton } from "@/lib/track";
import { plural } from "@/lib/utils";

const PLAIN_COST: Record<string, string> = {
  low: "niski koszt — do 10 tys. zł",
  medium: "średni koszt — 10–50 tys. zł",
  high: "wysoki koszt — powyżej 50 tys. zł",
};

function plainTime(months: number): string {
  if (months <= 1) return "ok. miesiąc";
  if (months <= 3) return `ok. ${months} miesiące`;
  return `ok. ${months} miesięcy`;
}

function Description({ text }: { text: string }) {
  const paragraphs = text
    .replace(/^\s*Na czym polega:\s*/i, "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="mt-2 grid max-w-[65ch] gap-3">
      {paragraphs.map((p, i) => {
        const label = p.match(/^([A-ZĄĆĘŁŃÓŚŹŻ][^:\n]{1,40}):\s*/);
        return (
          <p key={i} className="whitespace-pre-line">
            {label ? (
              <>
                <strong className="text-foreground">{label[1]}:</strong> {p.slice(label[0].length)}
              </>
            ) : (
              p
            )}
          </p>
        );
      })}
    </div>
  );
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

function VideoEmbed({ url }: { url: string }) {
  const ytId = extractYoutubeId(url);
  const vimeoId = extractVimeoId(url);

  if (ytId) {
    return (
      <div className="relative mt-6 w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          title="Film o innowacji"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 h-full w-full border-(length:--bw) border-border"
        />
      </div>
    );
  }
  if (vimeoId) {
    return (
      <div className="relative mt-6 w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title="Film o innowacji"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 h-full w-full border-(length:--bw) border-border"
        />
      </div>
    );
  }
  return null;
}

function useSpeech(text: string) {
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  function toggle() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pl-PL";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utterRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  return { speaking, toggle, supported: typeof window !== "undefined" && "speechSynthesis" in window };
}

export function InnovationDetail({ id }: { id: number }) {
  const [innovation, setInnovation] = useState<InnovationCard | null | undefined>(undefined);
  const [testerModalOpen, setTesterModalOpen] = useState(false);
  const [testerStatus, setTesterStatus] = useState<"none" | "pending">("none");
  const toast = useToast();

  useEffect(() => {
    getInnovation(id).then(setInnovation);
  }, [id]);

  const trackedView = useRef<number | null>(null);
  useEffect(() => {
    if (!innovation || trackedView.current === id) return;
    trackedView.current = id;
    track({ type: "innovation_view", innovationId: id });
  }, [innovation, id]);

  const cta = (button: CtaButton) => () => track({ type: "cta_click", innovationId: id, meta: { button } });

  const readText = innovation
    ? [
        innovation.title,
        innovation.short_desc,
        innovation.full_desc ?? "",
      ]
        .filter(Boolean)
        .join(". ")
    : "";

  const speech = useSpeech(readText);

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
        <h1 className="text-2xl font-bold text-foreground">Nie znalazłem tej innowacji</h1>
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
    [
      "Koszt",
      innovation.cost_level ? PLAIN_COST[innovation.cost_level] ?? COST_LABELS[innovation.cost_level] : undefined,
    ],
    [
      "Czas wdrożenia",
      innovation.implementation_time_months ? plainTime(innovation.implementation_time_months) : undefined,
    ],
    [
      "Testy w praktyce",
      innovation.testers_count
        ? `${innovation.testers_count} ${plural(innovation.testers_count, "tester", "testerzy", "testerów")}`
        : undefined,
    ],
  ];

  const isYoutubeOrVimeo =
    !!innovation.video_url &&
    (extractYoutubeId(innovation.video_url) !== null || extractVimeoId(innovation.video_url) !== null);

  return (
    <article aria-labelledby="karta-tytul" className="max-w-4xl">
      <p className="font-bold text-muted">
        {innovation.category ? `Karta innowacji · ${innovation.category}` : "Karta innowacji"}
      </p>
      <h1 id="karta-tytul" className="mt-1 text-2xl font-bold text-foreground">
        {innovation.title}
      </h1>

      {(innovation.is_unmaintained || innovation.status === "unmaintained") && (
        <p className="mt-4 inline-flex items-start gap-2 rounded-ui border-2 border-border bg-secondary/60 px-3 py-1.5 font-bold text-foreground">
          <Archive aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Nieaktualna: nikt już jej nie prowadzi. Pomysł nadal może się przydać.
        </p>
      )}

      <p className="mt-4 max-w-[60ch] text-lg">{innovation.short_desc}</p>

      {/* Osadzone wideo (YouTube / Vimeo) */}
      {innovation.video_url && isYoutubeOrVimeo && (
        <VideoEmbed url={innovation.video_url} />
      )}

      <div className="relative mt-8 border-(length:--bw) border-border bg-surface p-6 shadow-raised sm:p-8">
        <span
          aria-hidden="true"
          className="simple-hidden absolute -top-3 right-10 h-6 w-24 rotate-[4deg] bg-accent [clip-path:polygon(0_8%,6%_0,100%_4%,95%_50%,100%_96%,4%_100%,0_55%)]"
        />
        {innovation.full_desc && (
          <>
            <h2 className="text-xl font-bold text-foreground">Na czym polega</h2>
            <Description text={innovation.full_desc} />
          </>
        )}

        <h2 className="mt-8 text-xl font-bold text-foreground">W skrócie</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-[12rem_1fr]">
          {facts
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-bold text-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>

        {innovation.tags.length > 0 && (
          <>
            <h2 className="mt-8 text-xl font-bold text-foreground">Tematy</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {innovation.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/biblioteka?tags=${encodeURIComponent(tag)}`}
                    className="inline-flex min-h-12 items-center rounded-ui border-(length:--bw) border-border bg-surface px-4 text-base text-primary hover:bg-primary/10"
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

        {/* Zapytaj eksperta — otwiera forum z kontekstem tej innowacji */}
        <Link
          href={`/forum?innowacja=${innovation.id}`}
          onClick={cta("forum")}
          className={buttonVariants({ variant: "secondary" })}
        >
          <MessageSquarePlus aria-hidden="true" />
          Zapytaj eksperta
        </Link>

        {/* Odsłuch TTS */}
        {speech.supported && (
          <Button type="button" variant="secondary" onClick={speech.toggle} aria-label={speech.speaking ? "Zatrzymaj odsłuch" : "Odczytaj kartę na głos"}>
            {speech.speaking ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            {speech.speaking ? "Zatrzymaj" : "Odczytaj"}
          </Button>
        )}

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
        {innovation.video_url && !isYoutubeOrVimeo && (
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

      <StarRating innovationId={id} />

      <TestRequestBox innovation={innovation} />

      {/* Zgłoś się jako tester */}
      <div className="mt-8 rounded-ui border-(length:--bw) border-border bg-secondary/60 p-5 sm:p-6">
        <h2 className="text-xl font-bold text-foreground">Testowanie</h2>
        <p className="mt-2 text-base">Masz doświadczenie z tym tematem? Zgłoś się jako tester i pomóż ocenić tę innowację w praktyce.</p>
        {testerStatus === "pending" ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-success bg-success/10 px-4 py-2 text-sm font-bold text-success">
            Zgłoszenie wysłane — czekamy na odpowiedź
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              cta("zostan_testerem")();
              setTesterModalOpen(true);
            }}
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-ui border-(length:--bw) border-primary bg-primary px-5 font-bold text-primary-foreground hover:bg-primary-hover"
          >
            Zgłoś się jako tester
          </button>
        )}
      </div>

      {/* Forum dyskusji */}
      <section aria-labelledby="dyskusja-tytul" className="mt-12 border-t-2 border-border/40 pt-10">
        <h2 id="dyskusja-tytul" className="text-2xl font-bold text-foreground">Dyskusja społeczności</h2>
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
