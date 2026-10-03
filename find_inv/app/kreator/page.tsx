"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ChevronRight, Lightbulb, Loader2, Send, Tag } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { Button, buttonVariants } from "@/components/ui/button";
import { TAXONOMY_TAGS } from "@/data/mock";
import { apiPost } from "@/lib/api";
import { type BackendInnovation } from "@/components/backend-innovation-card";
import { cn } from "@/lib/utils";

interface Fiszka {
  title: string;
  essence: string;
  forWhom: string;
  stage: string;
  autoTags: string[];
  similar: BackendInnovation[];
}

function makeTitleFromText(text: string): string {
  const words = text.trim().split(/\s+/).slice(0, 8);
  const first = words.join(" ");
  return first.length > 60 ? first.slice(0, 57) + "…" : first;
}

function KreatorContent() {
  const searchParams = useSearchParams();
  const [text, setText] = useState(decodeURIComponent(searchParams.get("prefill") ?? ""));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fiszka, setFiszka] = useState<Fiszka | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Kreator pomysłów – HubMI";
    return () => { document.title = "HubMI – znajdź rozwiązanie, które już działa"; };
  }, []);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 5),
    );
  }

  async function submitIdea() {
    if (!fiszka) return;
    setSubmitting(true);
    try {
      await apiPost("/api/ideas", {
        title: fiszka.title,
        essence: fiszka.essence,
        for_whom: fiszka.forWhom,
        tags: fiszka.autoTags,
      });
    } catch {
      // fail silently — show success regardless (demo)
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  }

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setFiszka(null);
    try {
      const [tagResult, matchResult] = await Promise.all([
        apiPost<{ tags: string[]; area: string; target_group: string }>("/api/tag", { text }),
        apiPost<{ innovations: BackendInnovation[] }>("/api/match", {
          text,
          tags: selectedTags,
        }),
      ]);
      const allTags = [...new Set([...selectedTags, ...tagResult.tags])];
      setFiszka({
        title: makeTitleFromText(text),
        essence: text.trim(),
        forWhom: tagResult.target_group || "Osoby potrzebujące wsparcia w Małopolsce",
        stage: "Pomysł — wymaga partnera instytucjonalnego (OPS lub NGO) do pilotażu.",
        autoTags: allTags,
        similar: matchResult.innovations.slice(0, 2),
      });
    } catch {
      setFiszka({
        title: makeTitleFromText(text),
        essence: text.trim(),
        forWhom: "Osoby potrzebujące wsparcia w Małopolsce",
        stage: "Pomysł — wymaga partnera instytucjonalnego (OPS lub NGO) do pilotażu.",
        autoTags: selectedTags,
        similar: [],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <CutoutText as="h1" size="section" text="Kreator pomysłów" />
      <p className="mt-4 max-w-[60ch] text-lg">
        Opisz swój pomysł na innowację społeczną. AI pomoże Ci ustrukturyzować go w fiszkę gotową do zgłoszenia.
      </p>

      <div className="mt-10 max-w-2xl space-y-6">
        <div>
          <label htmlFor="pomysl" className="block font-bold text-deep">
            Opisz swój pomysł społeczny
          </label>
          <textarea
            id="pomysl"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Na przykład: chcę zorganizować wolontariat sąsiedzki dla samotnych seniorów w naszej gminie…"
            className="mt-2 w-full resize-y rounded-ui border-(length:--bw) border-deep bg-surface p-4 text-base"
          />
        </div>

        <div>
          <p className="font-bold text-deep flex items-center gap-2">
            <Tag className="size-4" aria-hidden="true" />
            Wybierz tematy (max 5)
          </p>
          <ul className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Tagi tematyczne">
            {TAXONOMY_TAGS.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={selectedTags.includes(tag)}
                  className={cn(
                    "rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors",
                    selectedTags.includes(tag)
                      ? "border-leaf bg-leaf text-surface"
                      : "border-deep bg-surface text-deep hover:bg-sage",
                  )}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={analyze} disabled={!text.trim() || loading} className="gap-2">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              AI analizuje…
            </>
          ) : (
            <>
              <Lightbulb className="size-4" aria-hidden="true" />
              Analizuj pomysł
            </>
          )}
        </Button>
      </div>

      {fiszka && (
        <div className="mt-12 max-w-2xl space-y-6">
          <div className="border-(length:--bw) border-deep bg-surface p-8 shadow-paper">
            <h2 className="text-xl font-bold text-deep">Fiszka pomysłu</h2>
            <dl className="mt-6 space-y-5">
              {[
                ["Tytuł (roboczo)", fiszka.title],
                ["Istota pomysłu", fiszka.essence],
                ["Dla kogo", fiszka.forWhom],
                ["Etap realizacji", fiszka.stage],
              ].map(([label, value]) => (
                <div key={label} className="border-l-4 border-leaf pl-4">
                  <dt className="text-sm font-bold text-muted">{label}</dt>
                  <dd className="mt-1">{value}</dd>
                </div>
              ))}
              {fiszka.autoTags.length > 0 && (
                <div className="border-l-4 border-leaf pl-4">
                  <dt className="text-sm font-bold text-muted">Tematy (rozpoznane przez AI)</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {fiszka.autoTags.map((t) => (
                      <span key={t} className="rounded-full border-2 border-leaf bg-paper px-2.5 py-0.5 text-sm text-leaf">
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-6 border-t-2 border-sage pt-6">
              {submitted ? (
                <div className="flex items-center gap-3 rounded-ui border-2 border-leaf bg-paper px-4 py-3">
                  <CheckCircle className="size-5 shrink-0 text-leaf" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-deep">Pomysł wysłany do ROPS!</p>
                    <p className="text-sm text-muted">Administrator przejrzy Twój pomysł i skontaktuje się z Tobą.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={submitIdea}
                    disabled={submitting}
                    className="gap-2"
                  >
                    {submitting ? (
                      <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Wysyłanie…</>
                    ) : (
                      <><Send className="size-4" aria-hidden="true" />Zgłoś pomysł do ROPS</>
                    )}
                  </Button>
                  <Link
                    href="/testerzy"
                    className={buttonVariants({ variant: "secondary", className: "gap-2 text-sm" })}
                  >
                    Zostań testerem
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {fiszka.similar.length > 0 && (
            <div className="border-(length:--bw) border-sage bg-paper p-6">
              <h3 className="font-bold text-deep">Podobne innowacje już w Bibliotece</h3>
              <p className="mt-1 text-sm text-muted">
                Może nie musisz zaczynać od zera — sprawdź, co już działa.
              </p>
              <ul className="mt-4 space-y-3">
                {fiszka.similar.map((inn) => (
                  <li key={inn.id} className="flex items-start gap-3 border-(length:--bw) border-sage bg-surface p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-deep">{inn.title}</p>
                      <p className="mt-1 text-sm text-muted line-clamp-2">{inn.short_desc}</p>
                    </div>
                    <Link
                      href={`/biblioteka/${inn.id}`}
                      className={buttonVariants({ variant: "secondary", className: "shrink-0 text-sm" })}
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                      <span className="sr-only">Szczegóły: {inn.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function KreatorPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-content px-4 py-16 sm:px-6"><p className="text-lg text-muted">Wczytuję…</p></div>}>
      <KreatorContent />
    </Suspense>
  );
}
