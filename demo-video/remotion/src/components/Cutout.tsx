import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { between, hashString, rng } from "../lib";
import { C, F, SHADOW } from "../theme";

// „Ransom note" jak <CutoutText> z aplikacji: każda litera to wycinek z gazety.
// Litery „przyklejają się" po kolei: spadają z większej skali i obrotu, z lekkim odbiciem.

const CALM = [F.body, F.bitter];
const LOUD = [F.abril, F.alfa, F.playfair, F.courier];
const BGS = [C.paper, C.surface, C.sage, C.mint, C.butter];

function clip(r: () => number) {
  const j = () => between(r, 0, 2.4).toFixed(2);
  const pts = [`${j()}% ${j()}%`];
  if (r() > 0.5) pts.push(`${between(r, 35, 65).toFixed(1)}% ${j()}%`);
  pts.push(`${(100 - +j()).toFixed(2)}% ${j()}%`);
  if (r() > 0.5) pts.push(`${(100 - +j()).toFixed(2)}% ${between(r, 35, 65).toFixed(1)}%`);
  pts.push(`${(100 - +j()).toFixed(2)}% ${(100 - +j()).toFixed(2)}%`);
  if (r() > 0.5) pts.push(`${between(r, 35, 65).toFixed(1)}% ${(100 - +j()).toFixed(2)}%`);
  pts.push(`${j()}% ${(100 - +j()).toFixed(2)}%`);
  return `polygon(${pts.join(", ")})`;
}

type Props = {
  text: string;
  size: number;
  /** Klatka (lokalna), od której litery zaczynają się przyklejać. */
  start?: number;
  /** Odstęp między literami w klatkach. */
  stagger?: number;
  /** Bez animacji (np. w statycznym nagłówku). */
  still?: boolean;
  seed?: number;
  style?: React.CSSProperties;
  /** Wyrównanie wierszy. */
  align?: "left" | "center";
  /** Klatka, od której litery odpadają (wyjście). */
  exit?: number;
};

export const Cutout: React.FC<Props> = ({ text, size, start = 0, stagger = 2, still, seed = 0, style, align = "left", exit }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const base = hashString(text) + seed;
  const words = text.split(" ");
  let index = 0;
  let prevBg = "";
  let lastButter = -9;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.38,
        rowGap: size * 0.12,
        lineHeight: 1,
        ...style,
      }}
    >
      {words.map((word, wi) => {
        const wr = rng(base + wi * 7919);
        const chars = Array.from(word);
        const calmCount = chars.length >= 2 ? Math.ceil(chars.length * 0.4) : 0;
        const keys = chars.map(() => wr());
        const calm = new Set(chars.map((_, i) => i).sort((a, b) => keys[a] - keys[b]).slice(0, calmCount));
        return (
          <div key={wi} style={{ display: "flex", gap: Math.max(2, size * 0.035) }}>
            {chars.map((ch, ci) => {
              const i = index++;
              const r = rng(base ^ (ch.charCodeAt(0) * 31 + i * 2654435761));
              const font = calm.has(ci) ? CALM[Math.floor(r() * CALM.length)] : LOUD[Math.floor(r() * LOUD.length)];
              const allowed = BGS.filter((b) => b !== prevBg && (b !== C.butter || i - lastButter >= 5));
              const bg = allowed[Math.floor(r() * allowed.length)];
              if (bg === C.butter) lastButter = i;
              prevBg = bg;
              const color = r() > 0.5 ? C.ink : C.deep;
              const rot = between(r, -5, 5);
              const dy = between(r, -0.07, 0.07) * size;
              const sc = between(r, 0.94, 1.08);
              const shape = clip(r);
              const fromRot = between(r, -40, 40);

              const local = frame - start - i * stagger;
              const p = still ? 1 : spring({ frame: local, fps, config: { damping: 11, stiffness: 170, mass: 0.6 } });
              const appear = still ? 1 : interpolate(local, [0, 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              let out = 0;
              if (exit !== undefined) {
                out = interpolate(frame - exit - i * 1, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              }
              const scale = (2.2 - 1.2 * p) * sc * (1 - out * 0.4);
              const rotate = rot + fromRot * (1 - p) + out * fromRot;
              const ty = dy + out * size * 1.2;

              return (
                <div
                  key={ci}
                  style={{
                    filter: `drop-shadow(${size * 0.04}px ${size * 0.04}px 0 ${SHADOW})`,
                    transform: `translateY(${ty}px) rotate(${rotate}deg) scale(${scale})`,
                    opacity: appear * (1 - out),
                  }}
                >
                  <div
                    style={{
                      fontFamily: font,
                      fontWeight: font === F.body || font === F.bitter || font === F.courier ? 700 : font === F.playfair ? 900 : 400,
                      fontSize: size,
                      color,
                      background: bg,
                      padding: `${size * 0.1}px ${size * 0.17}px ${size * 0.06}px`,
                      clipPath: shape,
                      minWidth: size * 0.55,
                      textAlign: "center",
                    }}
                  >
                    {ch}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
