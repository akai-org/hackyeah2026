import { cn } from "@/lib/utils";

// Dekoracyjna chmurka wycięta z papieru: płaska, jednokolorowa, z tym samym
// twardym cieniem co kartki (DESIGN.md, sekcja 5). Stoi w miejscu, bez ruchu
// (sekcja 9). Zawsze aria-hidden, nigdy pod tekstem, znika w druku.

// Kształt to suma kół i zaokrąglonego prostokąta. Cień liczy się po całości,
// bo filter siedzi na <svg>, a nie na poszczególnych kształtach.
const SHAPES = {
  wide: {
    viewBox: "0 0 240 112",
    base: { x: 18, y: 62, width: 204, height: 40, rx: 20 },
    puffs: [
      [68, 66, 32],
      [122, 50, 44],
      [180, 66, 28],
    ],
  },
  tall: {
    viewBox: "0 0 200 112",
    base: { x: 14, y: 64, width: 172, height: 38, rx: 19 },
    puffs: [
      [56, 66, 28],
      [96, 44, 38],
      [142, 58, 30],
    ],
  },
} as const;

const COLORS = {
  surface: "text-primary-foreground",
  secondary: "text-secondary",
} as const;

type PaperCloudProps = {
  shape?: keyof typeof SHAPES;
  color?: keyof typeof COLORS;
  className?: string;
};

export function PaperCloud({ shape = "wide", color = "surface", className }: PaperCloudProps) {
  const { viewBox, base, puffs } = SHAPES[shape];

  return (
    <svg
      aria-hidden="true"
      role="presentation"
      focusable="false"
      viewBox={viewBox}
      className={cn(
        "simple-hidden shadow-cutout pointer-events-none select-none",
        COLORS[color],
        className,
      )}
    >
      <g fill="currentColor">
        <rect {...base} />
        {puffs.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </svg>
  );
}
