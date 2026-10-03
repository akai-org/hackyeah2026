import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { Cutout } from "../components/Cutout";
import { Grain, Monstera } from "../components/Decor";
import { C, F, SHADOW } from "../theme";

// Logo HubMI z kolażu + trzy kroki z sekcji „Jak to działa".

const STEPS = ["Opisz problem", "Zobacz, co już działa", "Dostosuj do swojej gminy"];

export const LogoReveal: React.FC<{ outro?: boolean }> = ({ outro }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const leaves = spring({ frame, fps, config: { damping: 16, stiffness: 70 } });
  const sub = spring({ frame: frame - 16, fps, config: { damping: 15 } });
  const bg = outro ? C.deep : C.paper;
  const fg = outro ? C.surface : C.deep;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Monstera
        size={820}
        color={outro ? C.leaf : C.mint}
        style={{ left: -330 - (1 - leaves) * 500, top: -300, transform: `rotate(${150 + frame * 0.2 + (1 - leaves) * -80}deg)` }}
      />
      <Monstera
        size={880}
        color={outro ? C.mint : C.leaf}
        outlined={!outro}
        style={{ right: -360 - (1 - leaves) * 500, bottom: -360, transform: `rotate(${-20 - frame * 0.15 + (1 - leaves) * 80}deg)` }}
      />

      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `scale(${interpolate(frame, [0, 90], [1, 1.05])})` }}>
          <Cutout text="HubMI" size={250} start={2} stagger={3} align="center" seed={outro ? 0 : 0} />
        </div>
        <div
          style={{
            marginTop: 46,
            fontFamily: F.body,
            fontWeight: 700,
            fontSize: 52,
            color: fg,
            opacity: sub,
            transform: `translateY(${(1 - sub) * 40}px)`,
          }}
        >
          Małopolski Hub Innowacji Społecznych
        </div>

        {outro ? (
          <div
            style={{
              marginTop: 36,
              fontFamily: F.body,
              fontSize: 38,
              color: C.mint,
              opacity: interpolate(frame, [30, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            HackYeah 2026 · wyzwanie ROPS Kraków
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 28, marginTop: outro ? 50 : 70 }}>
          {STEPS.map((s, i) => {
            const p = spring({ frame: frame - (outro ? 40 : 30) - i * 7, fps, config: { damping: 12, stiffness: 150 } });
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 28 }}>
                <div
                  style={{
                    background: outro ? C.surface : C.surface,
                    border: `3px solid ${C.deep}`,
                    boxShadow: `7px 7px 0 ${outro ? "rgba(0,0,0,0.3)" : SHADOW}`,
                    padding: "16px 26px",
                    fontFamily: F.body,
                    fontWeight: 700,
                    fontSize: 36,
                    color: C.deep,
                    transform: `scale(${p}) rotate(${(i - 1) * 2}deg)`,
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontFamily: F.alfa, fontWeight: 400, color: C.leaf }}>{i + 1}</span>
                  {s}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 44, color: outro ? C.mint : C.leaf, opacity: p }}>→</div>
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Grain opacity={outro ? 0.1 : 0.06} />
    </AbsoluteFill>
  );
};
