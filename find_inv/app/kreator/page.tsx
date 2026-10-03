"use client";

import type { Metadata } from "next";
import { useState } from "react";
import { Lightbulb, Loader2, Tag } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { Button } from "@/components/ui/button";
import { TAXONOMY_TAGS } from "@/data/mock";
import { cn } from "@/lib/utils";

const MOCK_FISZKA = {
  title: "Mobilna biblioteka wsparcia dla seniorów",
  essence: "Program regularnych odwiedzin wolontariuszy u seniorów mieszkających samotnie, połączony z dostępem do cyfrowych usług publicznych.",
  forWhom: "Seniorzy 65+ mieszkający samotnie, szczególnie na terenach wiejskich i oddalonych od centrum gminy.",
  stage: "Pomysł — wymaga partnera instytucjonalnego (OPS lub NGO) do pilotażu.",
};

export default function KreatorPage() {
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fiszka, setFiszka] = useState<typeof MOCK_FISZKA | null>(null);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 5),
    );
  }

  function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setFiszka(null);
    setTimeout(() => {
      setFiszka(MOCK_FISZKA);
      setLoading(false);
    }, 1500);
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
        <div className="mt-12 max-w-2xl border-(length:--bw) border-deep bg-surface p-8 shadow-paper">
          <h2 className="text-xl font-bold text-deep">Fiszka pomysłu</h2>
          <dl className="mt-6 space-y-5">
            {[
              ["Tytuł", fiszka.title],
              ["Istota pomysłu", fiszka.essence],
              ["Dla kogo", fiszka.forWhom],
              ["Etap realizacji", fiszka.stage],
            ].map(([label, value]) => (
              <div key={label} className="border-l-4 border-leaf pl-4">
                <dt className="text-sm font-bold text-muted">{label}</dt>
                <dd className="mt-1">{value}</dd>
              </div>
            ))}
            {selectedTags.length > 0 && (
              <div className="border-l-4 border-leaf pl-4">
                <dt className="text-sm font-bold text-muted">Tagi</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {selectedTags.map((t) => (
                    <span key={t} className="rounded-full border-2 border-leaf bg-paper px-2.5 py-0.5 text-sm text-leaf">
                      {t}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-6 text-sm text-muted">
            Fiszka zapisana lokalnie. Pełne zgłoszenie do bazy ROPS będzie dostępne po weryfikacji przez administratora.
          </p>
        </div>
      )}
    </div>
  );
}
