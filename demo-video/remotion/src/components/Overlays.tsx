import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { C, F, SHADOW } from "../theme";
import { Cutout } from "./Cutout";
import { Grain, Monstera, Tape } from "./Decor";

/** Tło scen z nagraniami: papier, dwa liście wychodzące zza krawędzi, faktura. */
export const Backdrop: React.FC<{ variant?: number }> = ({ variant = 0 }) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame / 40) * 2;
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {variant % 2 === 0 ? (
        <>
          <Monstera size={760} color={C.mint} style={{ right: -300, top: -260, transform: `rotate(${200 + sway}deg)` }} />
          <Monstera size={560} color={C.sage} style={{ left: -260, bottom: -250, transform: `rotate(${30 - sway}deg)` }} />
        </>
      ) : (
        <>
          <Monstera size={700} color={C.sage} style={{ left: -300, top: -240, transform: `rotate(${150 + sway}deg)` }} />
          <Monstera size={620} color={C.mint} style={{ right: -280, bottom: -300, transform: `rotate(${-20 - sway}deg)` }} />
        </>
      )}
      <Grain />
    </AbsoluteFill>
  );
};

/** Rozdział w lewym górnym rogu: numer w kółku + nazwa modułu. */
export const Chapter: React.FC<{ n: string; label: string }> = ({ n, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 4, fps, config: { damping: 14 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 56,
        top: 26,
        display: "flex",
        alignItems: "center",
        gap: 14,
        transform: `translateX(${(1 - p) * -260}px)`,
        opacity: p,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 99,
          background: C.deep,
          color: C.surface,
          fontFamily: F.alfa,
          fontSize: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {n}
      </div>
      <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 30, color: C.deep, letterSpacing: 0.2 }}>{label}</div>
    </div>
  );
};

type CaptionProps = {
  title: string;
  sub: string;
  from: number;
  to: number;
  side?: "left" | "right";
  bottom?: number;
  /** Gdy podane, kartka stoi u góry kadru (np. gdy dół zajmuje pole formularza). */
  top?: number;
  width?: number;
};

/** Napis: kartka z taśmą, tytuł kolażem, podpis zwykłym krojem (czytelność przed stylem). */
export const Caption: React.FC<CaptionProps> = ({ title, sub, from, to, side = "left", bottom = 54, top, width = 720 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from - 2 || frame > to + 14) return null;
  const pIn = spring({ frame: frame - from, fps, config: { damping: 15, stiffness: 120 } });
  const pOut = interpolate(frame, [to, to + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const dir = side === "left" ? -1 : 1;
  const subIn = interpolate(frame - from, [8, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        ...(top !== undefined ? { top } : { bottom }),
        [side]: 44,
        width,
        transform: `translateX(${dir * ((1 - pIn) * 900 + pOut * 900)}px) rotate(${dir * -1.2 + (1 - pIn) * dir * 8}deg)`,
      }}
    >
      <div
        style={{
          position: "relative",
          background: C.surface,
          border: `3px solid ${C.deep}`,
          boxShadow: `9px 9px 0 ${SHADOW}`,
          padding: "30px 34px 26px",
        }}
      >
        <Tape w={130} style={{ top: -16, [side === "left" ? "right" : "left"]: 40, transform: "rotate(4deg)" }} />
        <Cutout text={title} size={50} start={from + 2} stagger={1} />
        <div
          style={{
            marginTop: 16,
            fontFamily: F.body,
            fontSize: 30,
            lineHeight: 1.35,
            color: C.ink,
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 14}px)`,
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
};

/**
 * Przejście „wycinanka": trzy ukośne pasy (mięta, liść, głęboka zieleń) przelatują przez kadr.
 * W klatce CUT ekran jest w całości zakryty ostatnim pasem — tu następuje cięcie.
 */
export const SWOOSH_CUT = 13;
export const SWOOSH_LEN = 28;

export const Swoosh: React.FC = () => {
  const frame = useCurrentFrame();
  const bands = [C.mint, C.leaf, C.deep];
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {bands.map((color, k) => {
        const s = k * 2;
        const x = interpolate(frame, [s, s + 9, s + 13, s + 24], [-3300, -560, -200, 2400], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.quad),
        });
        return (
          <div
            key={color}
            style={{
              position: "absolute",
              top: -200,
              left: x,
              width: 2900,
              height: 1480,
              background: color,
              transform: "skewX(-18deg)",
              borderRight: k === 2 ? `10px solid ${C.butter}` : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Cienki pasek postępu u dołu kadru. */
export const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, height: 6, width: `${(frame / durationInFrames) * 100}%`, background: C.leaf }} />
  );
};
