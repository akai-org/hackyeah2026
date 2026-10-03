"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { ArrowRight, MapPin, Search } from "lucide-react";

import { formatNumber } from "@/components/malopolska-stats";
import { MOCK_GAP_INDEX, type GapEntry } from "@/data/innovations";
import { MAP_VIEWBOX, POWIAT_SHAPES, type PowiatShape } from "@/data/malopolska-map";
import { GAP_BINS, GAP_NO_DATA, gapBin } from "@/lib/gap-scale";
import { getGapIndex, getPulse, type GminaPulse } from "@/lib/knowledge";
import { cn, plural } from "@/lib/utils";

// Interaktywna mapa powiatów: kolor = Indeks Luki Innowacyjnej (jedna skala sekwencyjna zieleni, lib/gap-scale.ts),
// kliknięcie pokazuje najważniejsze wyzwania i pasujące innowacje. Dane z tych samych endpointów co lista
// „Gdzie najbardziej brakuje rozwiązań” (/api/innovation-gap, /api/gmina-pulse/{powiat}), więc wartości się zgadzają.
// Kolor nigdy nie jest jedyną informacją: wartość indeksu widać w panelu, a powiat można też wybrać z listy.

/** Etykiety, które nachodzą na sąsiednie miasto, przesuwamy ręcznie. */
const LABEL_OFFSET: Record<string, [number, number]> = {
  nowosadecki: [20, 60],
  krakowski: [-40, -30],
  tarnowski: [0, 30],
  proszowicki: [2, 0],
  bochenski: [-5, 25],
};

/** Wąskie powiaty dostają mniejszą etykietę. */
const SMALL_LABEL = new Set(["proszowicki", "bochenski", "chrzanowski", "oswiecimski"]);

/** Nazwa powiatu w API: miasta na prawach powiatu mają przedrostek „m.”. */
const apiName = (shape: PowiatShape) => (shape.city ? `m. ${shape.name}` : shape.name).toLowerCase();

function fullName(shape: PowiatShape) {
  return shape.city ? `${shape.name} (miasto)` : `Powiat ${shape.name}`;
}

export function PowiatMap() {
  const [entries, setEntries] = useState<GapEntry[]>(MOCK_GAP_INDEX);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    getGapIndex().then(setEntries);
  }, []);

  const byShape = useMemo(() => {
    const lookup = new Map(entries.map((entry) => [entry.powiat.toLowerCase(), entry]));
    return new Map(POWIAT_SHAPES.map((shape) => [shape.id, lookup.get(apiName(shape))]));
  }, [entries]);

  // Ta sama skala co w liście: 0 … zaokrąglone w górę maksimum, podzielona na 5 równych przedziałów.
  const scaleMax = Math.max(1, Math.ceil(Math.max(...entries.map((entry) => entry.gap_score))));
  const colorFor = (entry?: GapEntry) => (entry ? gapBin(entry.gap_score, scaleMax) : GAP_NO_DATA);

  // Domyślnie powiat z największą luką — ten sam, który jest pierwszy na liście.
  const topShape = useMemo(() => {
    let best: PowiatShape = POWIAT_SHAPES[0];
    for (const shape of POWIAT_SHAPES) {
      if ((byShape.get(shape.id)?.gap_score ?? -1) > (byShape.get(best.id)?.gap_score ?? -1)) best = shape;
    }
    return best.id;
  }, [byShape]);
  const selectedId = selected ?? topShape;

  function onKey(event: KeyboardEvent, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelected(id);
    }
  }

  // Wybrany powiat rysujemy na końcu, żeby jego gruba ramka i cień leżały nad sąsiadami.
  const ordered = useMemo(
    () => [...POWIAT_SHAPES].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId)),
    [selectedId],
  );
  const sortedByName = useMemo(
    () => [...POWIAT_SHAPES].sort((a, b) => fullName(a).localeCompare(fullName(b), "pl")),
    [],
  );

  const shape = POWIAT_SHAPES.find((item) => item.id === selectedId)!;
  const hoverShape = hovered ? POWIAT_SHAPES.find((item) => item.id === hovered) : null;
  const hoverEntry = hoverShape ? byShape.get(hoverShape.id) : undefined;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      {/* Mapa */}
      <div className="relative border-(length:--bw) border-line bg-surface p-4 rounded-ui shadow-paper sm:p-6 lg:sticky lg:top-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="grid gap-1 text-sm font-bold text-muted">
            Wybierz powiat
            <select
              value={selectedId}
              onChange={(event) => setSelected(event.target.value)}
              className="min-h-12 rounded-ui border border-field bg-surface px-3 text-base font-normal text-ink"
            >
              {sortedByName.map((item) => (
                <option key={item.id} value={item.id}>
                  {fullName(item)}
                </option>
              ))}
            </select>
          </label>
          <p
            aria-hidden="true"
            className={cn(
              "min-h-8 rounded-ui bg-deep px-3 py-1 text-sm font-bold text-surface transition-opacity duration-150",
              hoverShape ? "opacity-100" : "opacity-0",
            )}
          >
            {hoverShape &&
              `${fullName(hoverShape)} · ${hoverEntry ? `indeks ${formatNumber(hoverEntry.gap_score)}` : "brak danych"}`}
          </p>
        </div>

        <svg
          viewBox={MAP_VIEWBOX}
          role="group"
          aria-label="Mapa powiatów Małopolski. Kolor oznacza Indeks Luki Innowacyjnej."
          className="mt-4 h-auto w-full"
          onMouseLeave={() => setHovered(null)}
        >
          {ordered.map((item) => {
            const entry = byShape.get(item.id);
            const isSelected = item.id === selectedId;
            const isHovered = item.id === hovered;
            return (
              <g key={item.id}>
                <path
                  d={item.d}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${fullName(item)}, ${
                    entry ? `indeks luki ${formatNumber(entry.gap_score)} z ${scaleMax}` : "brak danych"
                  }`}
                  fill={colorFor(entry).fill}
                  stroke={isSelected || isHovered ? "#0E2A47" : "#FFFFFF"}
                  strokeWidth={isSelected ? 5 : isHovered ? 3.5 : 2}
                  strokeLinejoin="round"
                  onClick={() => setSelected(item.id)}
                  onKeyDown={(event) => onKey(event, item.id)}
                  onMouseEnter={() => setHovered(item.id)}
                  onFocus={() => setHovered(item.id)}
                  onBlur={() => setHovered(null)}
                  className="cursor-pointer outline-none transition-[stroke-width,fill] duration-150 focus-visible:stroke-[#1D5BA6] focus-visible:stroke-[7]"
                />
              </g>
            );
          })}

          {/* Etykiety osobno, żeby żaden kształt ich nie zasłonił. */}
          <g aria-hidden="true" className="pointer-events-none select-none">
            {POWIAT_SHAPES.map((item) => {
              const [dx, dy] = LABEL_OFFSET[item.id] ?? [0, 0];
              return (
                <text
                  key={item.id}
                  x={item.cx + dx}
                  y={item.cy + dy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={item.city ? "#15202E" : colorFor(byShape.get(item.id)).text}
                  fontSize={item.city ? 20 : item.id === "proszowicki" ? 16 : SMALL_LABEL.has(item.id) ? 20 : 25}
                  fontWeight={item.city || item.id === selectedId ? 700 : 400}
                  paintOrder="stroke"
                  stroke={item.city ? "#FFFFFF" : "none"}
                  strokeWidth={item.city ? 5 : 0}
                >
                  {item.name}
                </text>
              );
            })}
          </g>
        </svg>

        {/* Legenda */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="font-bold text-muted">Indeks luki:</span>
          <span className="text-muted">mała luka</span>
          <span className="tabular-nums">0</span>
          <span className="flex" aria-label={`Skala kolorów od 0 do ${scaleMax}`} role="img">
            {GAP_BINS.map((bin) => (
              <span
                key={bin.fill}
                className="block h-4 w-10 border-y border-line first:border-l last:border-r"
                style={{ background: bin.fill }}
              />
            ))}
          </span>
          <span className="tabular-nums">{scaleMax}</span>
          <span className="text-muted">duża luka</span>
        </div>
      </div>

      {/* Panel powiatu */}
      <div aria-live="polite" className="border-(length:--bw) border-line bg-surface p-5 rounded-ui shadow-paper sm:p-6">
        <PowiatPanel key={shape.id} shape={shape} entry={byShape.get(shape.id)} scaleMax={scaleMax} />
      </div>
    </div>
  );
}

function PowiatPanel({ shape, entry, scaleMax }: { shape: PowiatShape; entry?: GapEntry; scaleMax: number }) {
  const [pulse, setPulse] = useState<GminaPulse | null>(null);
  const powiat = entry?.powiat;
  const topArea = entry?.top_area ?? "";

  useEffect(() => {
    if (!powiat) return;
    let live = true;
    getPulse(powiat, topArea).then((result) => live && setPulse(result));
    return () => {
      live = false;
    };
  }, [powiat, topArea]);

  if (!entry) {
    return (
      <div className="appear">
        <h3 className="text-2xl font-bold text-deep">{fullName(shape)}</h3>
        <p className="mt-3 text-muted">Brak danych o tym powiecie.</p>
      </div>
    );
  }

  if (!pulse) return <PanelSkeleton />;

  const query = `${fullName(shape)}: ${pulse.top_challenges.map((challenge) => challenge.title.toLowerCase()).join(", ")}`;

  return (
    <div className="appear">
      <p className="flex items-center gap-2 text-sm font-bold text-muted">
        <MapPin aria-hidden="true" className="size-4" />
        {shape.city ? "Miasto na prawach powiatu" : "Powiat"}
      </p>
      <h3 className="mt-1 text-2xl font-bold text-deep">{fullName(shape)}</h3>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative h-5 flex-1 border-l border-muted" aria-hidden="true">
          <div
            className="h-full rounded-r-[4px]"
            style={{
              width: `${Math.max(2, (entry.gap_score / scaleMax) * 100)}%`,
              background: gapBin(entry.gap_score, scaleMax).fill,
            }}
          />
        </div>
        <p className="shrink-0 tabular-nums">
          Indeks luki <span className="text-xl font-bold text-deep">{formatNumber(entry.gap_score)}</span>
          <span className="text-muted"> / {scaleMax}</span>
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">
        Najczęściej: <span className="font-bold">{entry.top_area}</span> · {entry.innovations_count}{" "}
        {plural(entry.innovations_count, "innowacja", "innowacje", "innowacji")} w Bibliotece
      </p>

      <h4 className="mt-6 font-bold text-deep">Najważniejsze wyzwania</h4>
      {pulse.top_challenges.length ? (
        <ol className="mt-2 grid gap-2">
          {pulse.top_challenges.map((challenge, index) => (
            <li
              key={challenge.id}
              className="appear border-l-4 border-leaf bg-paper py-2 pr-3 pl-4"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <p className="font-bold text-deep">{challenge.title}</p>
              <p>
                <span className="text-lg font-bold text-deep tabular-nums">
                  {formatNumber(challenge.indicator_value)}
                </span>{" "}
                <span className="text-muted">{challenge.indicator_unit}</span>
              </p>
              <p className="text-sm text-muted">
                {challenge.source}, {challenge.data_year} r.
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-muted">Brak szczegółowych wskaźników dla tego powiatu.</p>
      )}

      <h4 className="mt-6 font-bold text-deep">Co może pomóc</h4>
      <ul className="mt-2 grid gap-2">
        {pulse.matching_innovations.map((innovation, index) => (
          <li key={innovation.id} className="appear" style={{ animationDelay: `${210 + index * 70}ms` }}>
            <Link
              href={`/innowacje/${innovation.id}`}
              className="group block rounded-ui border border-line bg-surface p-3 transition-colors hover:bg-sage"
            >
              <span className="flex items-center justify-between gap-2 font-bold text-deep">
                {innovation.title}
                <ArrowRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-leaf transition-transform group-hover:translate-x-1"
                />
              </span>
              <span className="mt-1 line-clamp-2 block text-sm">{innovation.short_desc}</span>
              {innovation.category && (
                <span className="mt-2 inline-block rounded-ui bg-mint px-2 py-0.5 text-xs font-bold text-ink">
                  {innovation.category}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={`/wyniki?q=${encodeURIComponent(query)}`}
        className="mt-5 inline-flex min-h-12 items-center gap-2 font-bold text-leaf underline underline-offset-4 hover:text-deep"
      >
        <Search aria-hidden="true" className="size-5" />
        Szukaj rozwiązań dla tego powiatu
      </Link>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div role="status" aria-label="Wczytuję dane powiatu" className="animate-pulse">
      <div className="h-4 w-40 rounded bg-sage" />
      <div className="mt-3 h-7 w-56 rounded bg-sage" />
      <div className="mt-5 h-5 w-full rounded bg-sage" />
      <div className="mt-7 h-4 w-44 rounded bg-sage" />
      {[0, 1, 2].map((index) => (
        <div key={index} className="mt-2 h-16 w-full border-l-4 border-mint bg-paper" />
      ))}
      <div className="mt-7 h-4 w-32 rounded bg-sage" />
      {[0, 1].map((index) => (
        <div key={index} className="mt-2 h-20 w-full rounded-ui bg-sage/60" />
      ))}
    </div>
  );
}
