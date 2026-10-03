"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, MapPin, Search, Users } from "lucide-react";

import { formatNumber } from "@/components/malopolska-stats";
import { MOCK_INNOVATIONS } from "@/data/innovations";
import { MAP_VIEWBOX, POWIAT_SHAPES, type PowiatShape } from "@/data/malopolska-map";
import { TAG_LABELS } from "@/data/mock";
import { POWIAT_PULSE } from "@/data/powiaty-pulse.mock";
import { cn, plural } from "@/lib/utils";

// Interaktywna mapa powiatów: kolor = Indeks Luki Innowacyjnej (jedna skala sekwencyjna zieleni),
// kliknięcie pokazuje najważniejsze wyzwania i pasujące innowacje. Kolor nigdy nie jest jedyną informacją:
// wartość indeksu widać w panelu, a powiat można też wybrać z listy.

const SCALE_MAX = 6;

const BINS = [
  { max: 2, fill: "#D3E3D0", text: "#14251C", label: "0–2" },
  { max: 3, fill: "#A9CDB4", text: "#14251C", label: "2–3" },
  { max: 4, fill: "#6FA88A", text: "#14251C", label: "3–4" },
  { max: 5, fill: "#2D6A4F", text: "#FAFCF7", label: "4–5" },
  { max: Infinity, fill: "#1B4332", text: "#FAFCF7", label: "5–6" },
];

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

const binFor = (score: number) => BINS.find((bin) => score < bin.max) ?? BINS[BINS.length - 1];

function fullName(shape: PowiatShape) {
  return shape.city ? `${shape.name} (miasto)` : `Powiat ${shape.name}`;
}

export function PowiatMap() {
  const [selected, setSelected] = useState("limanowski");
  const [hovered, setHovered] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function select(id: string) {
    if (id === selected) return;
    setSelected(id);
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), 450);
  }

  function onKey(event: KeyboardEvent, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(id);
    }
  }

  // Wybrany powiat rysujemy na końcu, żeby jego gruba ramka i cień leżały nad sąsiadami.
  const ordered = useMemo(
    () => [...POWIAT_SHAPES].sort((a, b) => Number(a.id === selected) - Number(b.id === selected)),
    [selected],
  );
  const sortedByName = useMemo(
    () => [...POWIAT_SHAPES].sort((a, b) => fullName(a).localeCompare(fullName(b), "pl")),
    [],
  );

  const shape = POWIAT_SHAPES.find((item) => item.id === selected)!;
  const hoverShape = hovered ? POWIAT_SHAPES.find((item) => item.id === hovered) : null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      {/* Mapa */}
      <div className="relative border-(length:--bw) border-deep bg-surface p-4 shadow-paper sm:p-6 lg:sticky lg:top-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="grid gap-1 text-sm font-bold text-muted">
            Wybierz powiat
            <select
              value={selected}
              onChange={(event) => select(event.target.value)}
              className="min-h-12 rounded-ui border-2 border-deep bg-surface px-3 text-base font-normal text-ink"
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
              `${fullName(hoverShape)} · indeks ${formatNumber(POWIAT_PULSE[hoverShape.id].gap_score)}`}
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
            const pulse = POWIAT_PULSE[item.id];
            const bin = binFor(pulse.gap_score);
            const isSelected = item.id === selected;
            const isHovered = item.id === hovered;
            return (
              <g key={item.id}>
                {/* Twardy „papierowy” cień pod wybranym powiatem. */}
                {isSelected && <path d={item.d} fill="#1B4332" transform="translate(6 6)" />}
                <path
                  d={item.d}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${fullName(item)}, indeks luki ${formatNumber(pulse.gap_score)} z ${SCALE_MAX}`}
                  fill={bin.fill}
                  stroke="#1B4332"
                  strokeWidth={isSelected ? 5 : isHovered ? 3.5 : 1.5}
                  strokeLinejoin="round"
                  transform={isSelected ? "translate(-3 -3)" : undefined}
                  onClick={() => select(item.id)}
                  onKeyDown={(event) => onKey(event, item.id)}
                  onMouseEnter={() => setHovered(item.id)}
                  onFocus={() => setHovered(item.id)}
                  onBlur={() => setHovered(null)}
                  className="cursor-pointer outline-none transition-[stroke-width,fill] duration-150 focus-visible:stroke-[#F2E2A0] focus-visible:stroke-[6]"
                />
              </g>
            );
          })}

          {/* Etykiety osobno, żeby żaden kształt ich nie zasłonił. */}
          <g aria-hidden="true" className="pointer-events-none select-none">
            {POWIAT_SHAPES.map((item) => {
              const bin = binFor(POWIAT_PULSE[item.id].gap_score);
              const [dx, dy] = LABEL_OFFSET[item.id] ?? [0, 0];
              const lift = item.id === selected ? -3 : 0;
              return (
                <text
                  key={item.id}
                  x={item.cx + dx + lift}
                  y={item.cy + dy + lift}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={item.city ? "#14251C" : bin.text}
                  fontSize={item.city ? 20 : item.id === "proszowicki" ? 16 : SMALL_LABEL.has(item.id) ? 20 : 25}
                  fontWeight={item.city || item.id === selected ? 700 : 400}
                  paintOrder="stroke"
                  stroke={item.city ? "#FAFCF7" : "none"}
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
          <ul className="flex" aria-label="Skala kolorów">
            {BINS.map((bin) => (
              <li key={bin.label} className="flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className="block h-4 w-10 border-y-2 border-deep first:border-l-2"
                  style={{ background: bin.fill }}
                />
                <span className="mt-1 tabular-nums">{bin.label}</span>
              </li>
            ))}
          </ul>
          <span className="text-muted">duża luka</span>
        </div>
      </div>

      {/* Panel powiatu */}
      <div aria-live="polite" className="border-(length:--bw) border-deep bg-surface p-5 shadow-paper sm:p-6">
        {loading ? <PanelSkeleton /> : <PowiatPanel key={shape.id} shape={shape} />}
      </div>
    </div>
  );
}

function PowiatPanel({ shape }: { shape: PowiatShape }) {
  const pulse = POWIAT_PULSE[shape.id];

  const matches = useMemo(
    () =>
      MOCK_INNOVATIONS.map((innovation) => ({
        innovation,
        shared: pulse.tags.filter((tag) => innovation.tags.includes(tag)),
      }))
        .filter((item) => item.shared.length > 0)
        .sort((a, b) => b.shared.length - a.shared.length)
        .slice(0, 3),
    [pulse.tags],
  );

  const query = `${fullName(shape)}: ${pulse.challenges.map((challenge) => challenge.title.toLowerCase()).join(", ")}`;

  return (
    <div className="appear">
      <p className="flex items-center gap-2 text-sm font-bold text-muted">
        <MapPin aria-hidden="true" className="size-4" />
        {shape.city ? "Miasto na prawach powiatu" : "Powiat"} · <Users aria-hidden="true" className="size-4" />
        {pulse.population} mieszkańców
      </p>
      <h3 className="mt-1 text-2xl font-bold text-deep">{fullName(shape)}</h3>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative h-5 flex-1 border-l border-muted" aria-hidden="true">
          <div
            className="h-full rounded-r-[4px] bg-leaf transition-[width] duration-500"
            style={{ width: `${(pulse.gap_score / SCALE_MAX) * 100}%` }}
          />
        </div>
        <p className="shrink-0 tabular-nums">
          Indeks luki <span className="text-xl font-bold text-deep">{formatNumber(pulse.gap_score)}</span>
          <span className="text-muted"> / {SCALE_MAX}</span>
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">
        {pulse.innovations_count} {plural(pulse.innovations_count, "innowacja", "innowacje", "innowacji")} z Biblioteki
        już tu działa.
      </p>

      <h4 className="mt-6 font-bold text-deep">Najważniejsze wyzwania</h4>
      <ol className="mt-2 grid gap-2">
        {pulse.challenges.map((challenge, index) => (
          <li
            key={challenge.title}
            className="appear border-l-4 border-leaf bg-paper py-2 pr-3 pl-4"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <p className="font-bold text-deep">{challenge.title}</p>
            <p>
              <span className="text-lg font-bold text-deep tabular-nums">{challenge.value}</span>{" "}
              <span className="text-muted">{challenge.unit}</span>
            </p>
          </li>
        ))}
      </ol>

      <h4 className="mt-6 font-bold text-deep">Co może pomóc</h4>
      <ul className="mt-2 grid gap-2">
        {matches.map(({ innovation, shared }, index) => (
          <li key={innovation.id} className="appear" style={{ animationDelay: `${210 + index * 70}ms` }}>
            <Link
              href={`/innowacje/${innovation.id}`}
              className="group block rounded-ui border-2 border-deep bg-surface p-3 transition-colors hover:bg-sage"
            >
              <span className="flex items-center justify-between gap-2 font-bold text-deep">
                {innovation.title}
                <ArrowRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-leaf transition-transform group-hover:translate-x-1"
                />
              </span>
              <span className="mt-1 block text-sm">{innovation.short_desc}</span>
              <span className="mt-2 flex flex-wrap gap-1">
                {shared.map((tag) => (
                  <span key={tag} className="rounded-ui bg-mint px-2 py-0.5 text-xs font-bold text-ink">
                    {TAG_LABELS[tag]}
                  </span>
                ))}
              </span>
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
        <div key={index} className="mt-2 h-14 w-full border-l-4 border-mint bg-paper" />
      ))}
      <div className="mt-7 h-4 w-32 rounded bg-sage" />
      {[0, 1].map((index) => (
        <div key={index} className="mt-2 h-20 w-full rounded-ui bg-sage/60" />
      ))}
    </div>
  );
}
