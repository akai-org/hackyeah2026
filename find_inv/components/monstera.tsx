import { useId } from "react";

import { cn } from "@/lib/utils";

// Dekoracyjny liść monstery (DESIGN.md, sekcja 7): płaski, jednokolorowy,
// z nacięciami od brzegu i dziurami przy nerwie głównym. Zawsze aria-hidden.

const LEAF_OUTLINE =
  "M200 338 C150 372 58 352 34 268 C10 186 52 88 132 48 C164 32 186 26 204 22 C292 30 370 102 374 200 C378 290 320 360 252 362 C226 362 210 352 200 338 Z";

const PETIOLE = "M206 346 C210 368 214 384 222 404";

// Nacięcia: od punktu przy nerwie głównym (wąsko) do punktu za brzegiem liścia (szeroko).
const SLITS: Array<[number, number, number, number]> = [
  [192, 96, 92, 14],
  [189, 150, 10, 112],
  [189, 205, -6, 214],
  [194, 262, 18, 318],
  [214, 100, 330, 24],
  [217, 156, 406, 126],
  [215, 212, 408, 232],
  [210, 268, 372, 336],
];

const HOLES: Array<[number, number, number, number, number]> = [
  [164, 128, 10, 6, -30],
  [158, 182, 11, 6, -15],
  [162, 236, 10, 6, 10],
  [244, 132, 10, 6, 30],
  [250, 186, 11, 6, 15],
  [244, 242, 10, 6, -10],
];

function wedge([x1, y1, x2, y2]: [number, number, number, number]): string {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const nx = -(y2 - y1) / length;
  const ny = (x2 - x1) / length;
  const inner = 3;
  const outer = 15;
  return [
    [x1 + nx * inner, y1 + ny * inner],
    [x2 + nx * outer, y2 + ny * outer],
    [x2 - nx * outer, y2 - ny * outer],
    [x1 - nx * inner, y1 - ny * inner],
  ]
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}

const SLIT_POINTS = SLITS.map(wedge);

// Liść to dekoracja: domyślnie miękki `secondary`, `primary` tylko jako rzadki mocniejszy akcent.
const COLORS = {
  secondary: "text-secondary",
  primary: "text-primary",
} as const;

const SIZES = {
  hero: "w-[34rem]",
  small: "w-36",
  icon: "w-6",
} as const;

type MonsteraProps = {
  /** Duży liść do hero albo mały do stopki i pustych stanów. */
  size?: keyof typeof SIZES;
  color?: keyof typeof COLORS;
  /** Obrys papieru (biała ramka 6 px i twardy cień), spina liść z kolażem. */
  outlined?: boolean;
  className?: string;
};

export function Monstera({ size = "small", color = "secondary", outlined = false, className }: MonsteraProps) {
  const id = useId().replace(/:/g, "");
  const maskId = `monstera-mask-${id}`;
  const filterId = `monstera-paper-${id}`;

  return (
    <svg
      aria-hidden="true"
      role="presentation"
      focusable="false"
      viewBox="-20 -10 440 430"
      className={cn("pointer-events-none select-none", SIZES[size], COLORS[color], className)}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-20" y="-10" width="440" height="430">
          <path d={LEAF_OUTLINE} fill="white" />
          <path d={PETIOLE} stroke="white" strokeWidth="12" strokeLinecap="round" fill="none" />
          {SLIT_POINTS.map((points) => (
            <polygon key={points} points={points} fill="black" />
          ))}
          {HOLES.map(([cx, cy, rx, ry, angle]) => (
            <ellipse
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              transform={`rotate(${angle} ${cx} ${cy})`}
              fill="black"
            />
          ))}
        </mask>
        {outlined && (
          <filter id={filterId} x="-10%" y="-10%" width="125%" height="125%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="grown" />
            <feOffset in="grown" dx="6" dy="6" result="shadowShape" />
            <feFlood style={{ floodColor: "var(--color-foreground)", floodOpacity: 0.22 }} />
            <feComposite in2="shadowShape" operator="in" result="shadow" />
            <feFlood style={{ floodColor: "var(--color-surface)" }} />
            <feComposite in2="grown" operator="in" result="paper" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="paper" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <g filter={outlined ? `url(#${filterId})` : undefined}>
        <g mask={`url(#${maskId})`}>
          <rect x="-20" y="-10" width="440" height="430" fill="currentColor" />
        </g>
      </g>
    </svg>
  );
}
