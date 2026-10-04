"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Archive, ArrowDown, ExternalLink, FileText, MessageSquareText, MessageSquarePlus, Pause, Play, Video } from "lucide-react";

import { ForumThread } from "@/components/forum-thread";
import { TesterApplyModal } from "@/components/tester-apply-modal";
import { Toast, useToast } from "@/components/toast";
import { TestRequestBox } from "@/components/test-request";
import { Button, buttonVariants } from "@/components/ui/button";
import { type InnovationCard } from "@/data/innovations";
import { getInnovation } from "@/lib/matchmaking";
import { track, type CtaButton } from "@/lib/track";
import { useT } from "@/lib/i18n/client";

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
  const title = useT().library.detail.video;
  const ytId = extractYoutubeId(url);
  const vimeoId = extractVimeoId(url);

  if (ytId) {
    return (
      <div className="relative mt-6 w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          title={title}
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
          title={title}
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
    // Treść karty z ROPS jest po polsku niezależnie od języka interfejsu.
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
  const [testRefresh, setTestRefresh] = useState(0);
  const toast = useToast();
  const t = useT();
  const d = t.library.detail;

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
        {d.loading}
      </p>
    );
  }

  if (innovation === null) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground">{d.notFound}</h1>
        <p className="mt-3 text-lg">{d.notFoundLead}</p>
        <Link href="/biblioteka" className={buttonVariants({ variant: "secondary", className: "mt-6" })}>
          {d.goLibrary}
        </Link>
      </div>
    );
  }

  const facts: Array<[string, string | undefined]> = [
    [d.facts.forWhom, innovation.target_group],
    [d.facts.area, innovation.area ?? innovation.category],
    [d.facts.where, innovation.where_implemented],
    [d.facts.authors, innovation.authors ?? undefined],
    [d.facts.project, innovation.project ?? undefined],
    [
      d.facts.cost,
      innovation.cost_level ? d.plainCost[innovation.cost_level] ?? t.cost[innovation.cost_level] : undefined,
    ],
    [
      d.facts.time,
      innovation.implementation_time_months ? d.time(innovation.implementation_time_months) : undefined,
    ],
    [
      d.facts.tests,
      innovation.testers_count ? d.testers(innovation.testers_count) : undefined,
    ],
  ];

  const isYoutubeOrVimeo =
    !!innovation.video_url &&
    (extractYoutubeId(innovation.video_url) !== null || extractVimeoId(innovation.video_url) !== null);

  return (
    <article aria-labelledby="karta-tytul" className="max-w-4xl">
      <p className="font-bold text-muted">
        {innovation.category ? `${d.card} · ${innovation.category}` : d.card}
      </p>
      <h1 id="karta-tytul" className="mt-1 text-2xl font-bold text-foreground">
        {innovation.title}
      </h1>

      {(innovation.is_unmaintained || innovation.status === "unmaintained") && (
        <p className="mt-4 inline-flex items-start gap-2 rounded-ui border-2 border-border bg-secondary/60 px-3 py-1.5 font-bold text-foreground">
          <Archive aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {d.unmaintained}
        </p>
      )}

      <p className="mt-4 max-w-[60ch] text-lg">{innovation.short_desc}</p>

      {/* Kotwica jak w „Szybkim dostępie” na stronie głównej: płynne przewijanie z globals.css
          (wyłączone przy prefers-reduced-motion), scroll-margin pod przyklejonym nagłówkiem. */}
      <a href="#dyskusja" className={buttonVariants({ variant: "secondary", className: "mt-6" })}>
        <MessageSquareText aria-hidden="true" />
        {d.goToDiscussion}
        <ArrowDown aria-hidden="true" />
      </a>

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
            <h2 className="text-xl font-bold text-foreground">{d.howItWorks}</h2>
            <Description text={innovation.full_desc} />
          </>
        )}

        <h2 className="mt-8 text-xl font-bold text-foreground">{d.summary}</h2>
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
            <h2 className="mt-8 text-xl font-bold text-foreground">{d.topics}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {innovation.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/biblioteka?tags=${encodeURIComponent(tag)}`}
                    className="inline-flex min-h-12 items-center rounded-ui border-(length:--bw) border-border bg-surface px-4 text-base text-primary hover:bg-primary/10"
                  >
                    {t.tags[tag] ?? tag}
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
          {d.adapt}
        </Link>

        {/* Zapytaj eksperta — otwiera forum z kontekstem tej innowacji */}
        <Link
          href={`/forum?innowacja=${innovation.id}`}
          onClick={cta("forum")}
          className={buttonVariants({ variant: "secondary" })}
        >
          <MessageSquarePlus aria-hidden="true" />
          {d.askExpert}
        </Link>

        {/* Odsłuch TTS */}
        {speech.supported && (
          <Button type="button" variant="secondary" onClick={speech.toggle} aria-label={speech.speaking ? d.stopReading : d.readAloud}>
            {speech.speaking ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            {speech.speaking ? d.stop : d.read}
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
            {d.materials}<span className="sr-only">{d.newTab}</span>
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
            {d.video}<span className="sr-only">{d.newTab}</span>
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
            {d.source}<span className="sr-only">{d.newTab}</span>
          </a>
        )}
      </div>

      <TestRequestBox innovation={innovation} refreshKey={testRefresh} />

      {/* Zgłoś się jako tester */}
      <div className="mt-8 rounded-ui border-(length:--bw) border-border bg-secondary/60 p-5 sm:p-6">
        <h2 className="text-xl font-bold text-foreground">{d.testing}</h2>
        <p className="mt-2 text-base">{d.testingLead}</p>
        {testerStatus === "pending" ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-success bg-success/10 px-4 py-2 text-sm font-bold text-success">
            {d.applicationSent}
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
            {d.applyTester}
          </button>
        )}
      </div>

      {/* Forum dyskusji */}
      <section id="dyskusja" aria-labelledby="dyskusja-tytul" className="mt-12 border-t-2 border-border/40 pt-10">
        <h2 id="dyskusja-tytul" className="text-2xl font-bold text-foreground">{d.discussion}</h2>
        <p className="mt-1 text-base text-muted">{d.discussionLead}</p>
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
            setTestRefresh((n) => n + 1);
            toast.show(d.sentToast);
          }}
        />
      )}
      <Toast message={toast.message} onClose={toast.hide} />
    </article>
  );
}
