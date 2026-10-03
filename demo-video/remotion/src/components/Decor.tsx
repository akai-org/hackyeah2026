import React from "react";
import { AbsoluteFill } from "remotion";

import { C } from "../theme";

// Liść monstery przeniesiony 1:1 z find_inv/components/monstera.tsx.
const LEAF_OUTLINE =
  "M200 338 C150 372 58 352 34 268 C10 186 52 88 132 48 C164 32 186 26 204 22 C292 30 370 102 374 200 C378 290 320 360 252 362 C226 362 210 352 200 338 Z";
const PETIOLE = "M206 346 C210 368 214 384 222 404";
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
function wedge([x1, y1, x2, y2]: [number, number, number, number]) {
  const l = Math.hypot(x2 - x1, y2 - y1);
  const nx = -(y2 - y1) / l;
  const ny = (x2 - x1) / l;
  return [
    [x1 + nx * 3, y1 + ny * 3],
    [x2 + nx * 15, y2 + ny * 15],
    [x2 - nx * 15, y2 - ny * 15],
    [x1 - nx * 3, y1 - ny * 3],
  ]
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}

export const Monstera: React.FC<{ color?: string; outlined?: boolean; style?: React.CSSProperties; size: number }> = ({
  color = C.leaf,
  outlined,
  style,
  size,
}) => {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="-20 -10 440 430" width={size} height={size * (430 / 440)} style={{ position: "absolute", overflow: "visible", ...style }}>
      <defs>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-20" y="-10" width="440" height="430">
          <path d={LEAF_OUTLINE} fill="white" />
          <path d={PETIOLE} stroke="white" strokeWidth="12" strokeLinecap="round" fill="none" />
          {SLITS.map((s) => (
            <polygon key={s.join()} points={wedge(s)} fill="black" />
          ))}
          {HOLES.map(([cx, cy, rx, ry, a]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${a} ${cx} ${cy})`} fill="black" />
          ))}
        </mask>
        {outlined && (
          <filter id={`${id}-paper`} x="-10%" y="-10%" width="125%" height="125%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="grown" />
            <feOffset in="grown" dx="7" dy="7" result="shadowShape" />
            <feFlood floodColor={C.deep} floodOpacity="0.28" />
            <feComposite in2="shadowShape" operator="in" result="shadow" />
            <feFlood floodColor={C.surface} />
            <feComposite in2="grown" operator="in" result="paper" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="paper" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <g filter={outlined ? `url(#${id}-paper)` : undefined}>
        <g mask={`url(#${id}-mask)`}>
          <rect x="-20" y="-10" width="440" height="430" fill={color} />
        </g>
      </g>
    </svg>
  );
};

/** Delikatna faktura papieru (≤ 5%), jak w aplikacji. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", opacity }}>
    <svg width="100%" height="100%">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  </AbsoluteFill>
);

/** Kawałek taśmy klejącej (maślany), dekoracja kartek. */
export const Tape: React.FC<{ style?: React.CSSProperties; w?: number }> = ({ style, w = 120 }) => (
  <div
    style={{
      position: "absolute",
      width: w,
      height: w * 0.28,
      background: C.butter,
      opacity: 0.95,
      clipPath: "polygon(0 8%, 6% 0, 100% 4%, 95% 50%, 100% 96%, 4% 100%, 0 55%)",
      ...style,
    }}
  />
);
