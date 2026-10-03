import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { Cutout } from "../components/Cutout";
import { Grain, Monstera, Tape } from "../components/Decor";
import { C, F, SHADOW } from "../theme";

// 0–135: hook. Problemy wyskakują jak karteczki (chipy tagów z aplikacji),
// potem zbierają się i ustępują hasłu „Rozwiązania już istnieją".

const PROBLEMS: Array<{ text: string; x: number; y: number; r: number; d: number }> = [
  { text: "samotność", x: 260, y: 170, r: -6, d: 6 },
  { text: "wykluczenie cyfrowe", x: 1250, y: 140, r: 5, d: 10 },
  { text: "brak transportu do lekarza", x: 130, y: 760, r: 4, d: 14 },
  { text: "kryzys psychiczny młodzieży", x: 1120, y: 790, r: -4, d: 18 },
  { text: "ubóstwo", x: 1590, y: 330, r: 7, d: 22 },
  { text: "niepełnosprawność", x: 90, y: 330, r: -3, d: 26 },
  { text: "bezdomność", x: 740, y: 900, r: 3, d: 30 },
  { text: "opieka nad seniorami", x: 720, y: 250, r: -2, d: 34 },
];

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gather = interpolate(frame, [58, 74], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const q = spring({ frame: frame + 8, fps, config: { damping: 14 } });
  const qOut = interpolate(frame, [56, 66], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sub = interpolate(frame, [96, 108], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = interpolate(frame, [0, 135], [1, 1.06]);
  const leaf = spring({ frame: frame - 70, fps, config: { damping: 18, stiffness: 60 } });

  return (
    <AbsoluteFill style={{ background: C.paper, overflow: "hidden" }}>
      <Monstera
        size={900}
        color={C.leaf}
        outlined
        style={{ right: -420 + (1 - leaf) * -500, top: 120, transform: `rotate(${-28 + (1 - leaf) * 60}deg)`, opacity: leaf }}
      />
      <Monstera
        size={620}
        color={C.mint}
        style={{ left: -330 - (1 - leaf) * 400, top: -260, transform: `rotate(${150 + frame * 0.15}deg)`, opacity: leaf }}
      />

      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        {PROBLEMS.map((p) => {
          const s = spring({ frame: frame - p.d, fps, config: { damping: 10, stiffness: 160, mass: 0.6 } });
          const cx = 960;
          const cy = 540;
          const x = p.x + (cx - p.x - 150) * gather;
          const y = p.y + (cy - p.y) * gather;
          return (
            <div
              key={p.text}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `rotate(${p.r + gather * 30}deg) scale(${s * (1 - gather * 0.9)})`,
                opacity: 1 - gather,
                fontFamily: F.body,
                fontWeight: 700,
                fontSize: 40,
                color: C.ink,
                background: C.mint,
                border: `3px solid ${C.deep}`,
                borderRadius: 14,
                padding: "10px 22px",
                boxShadow: `6px 6px 0 ${SHADOW}`,
                whiteSpace: "nowrap",
              }}
            >
              {p.text}
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            top: 450,
            width: "100%",
            textAlign: "center",
            fontFamily: F.body,
            fontWeight: 700,
            fontSize: 92,
            color: C.deep,
            transform: `translateY(${(1 - q) * 60}px) scale(${1 - qOut * 0.2})`,
            opacity: q * (1 - qOut),
          }}
        >
          Każda gmina ma swoje kłopoty.
        </div>

        {frame >= 66 && (
          <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Cutout text="Rozwiązania już istnieją." size={118} start={68} stagger={1} align="center" style={{ maxWidth: 1500 }} />
            <div
              style={{
                position: "relative",
                marginTop: 70,
                background: C.surface,
                border: `3px solid ${C.deep}`,
                boxShadow: `9px 9px 0 ${SHADOW}`,
                padding: "22px 36px",
                fontFamily: F.body,
                fontSize: 44,
                color: C.ink,
                opacity: sub,
                transform: `translateY(${(1 - sub) * 30}px) rotate(-1deg)`,
              }}
            >
              <Tape w={140} style={{ top: -18, right: 50, transform: "rotate(5deg)" }} />
              Ponad 100 sprawdzonych innowacji społecznych w Małopolsce.
              <br />
              <b style={{ color: C.deep }}>Tylko jak do nich dotrzeć?</b>
            </div>
          </div>
        )}
      </AbsoluteFill>
      <Grain />
    </AbsoluteFill>
  );
};
