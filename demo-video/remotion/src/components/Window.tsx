import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { CLIPS, type ClipName } from "../clipMeta";
import { camAt, piecewise, slopeAt, type Cam } from "../lib";
import { C, F, SHADOW } from "../theme";

// Okno przeglądarki z nagraniem aplikacji. Klatki z Playwrighta mają znaczniki czasu,
// więc dowolnie przyspieszamy/zwalniamy nagranie (timeMap) i prowadzimy kamerę (cam).

export const SRC_W = 1920;
export const SRC_H = 1080;

function frameIndex(times: readonly number[], t: number) {
  let lo = 0;
  let hi = times.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (times[mid] <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export type Shot = {
  clip: ClipName;
  /** [czas sceny (s), czas nagrania (s)] */
  timeMap: ReadonlyArray<readonly [number, number]>;
  /** Kamera w układzie nagrania 1920×1080; z = powiększenie. */
  cam: Cam[];
  /** [czas nagrania (s), adres w pasku] */
  urls: ReadonlyArray<readonly [number, string]>;
};

export const ClipView: React.FC<{ shot: Shot; t: number; width: number; height: number }> = ({ shot, t, width, height }) => {
  const meta = CLIPS[shot.clip];
  const src = piecewise(shot.timeMap, t);
  const idx = frameIndex(meta.times, src);
  const cam = camAt(shot.cam, t);
  const base = width / SRC_W;
  const z = Math.max(1, cam.z);
  // Kamera nie wyjeżdża poza kadr nagrania.
  const halfW = SRC_W / 2 / z;
  const halfH = (height / base) / 2 / z;
  const x = Math.min(Math.max(cam.x, halfW), SRC_W - halfW);
  const y = Math.min(Math.max(cam.y, halfH), SRC_H - halfH);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: C.paper }}>
      <Img
        src={staticFile(`clips/${shot.clip}/${String(idx).padStart(5, "0")}.jpg`)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: SRC_W,
          height: SRC_H,
          transformOrigin: "0 0",
          transform: `translate(${width / 2}px, ${height / 2}px) scale(${base * z}) translate(${-x}px, ${-y}px)`,
        }}
      />
    </div>
  );
};

export function urlAt(shot: Shot, t: number) {
  const src = piecewise(shot.timeMap, t);
  let url = shot.urls[0][1];
  for (const [ts, u] of shot.urls) if (src >= ts) url = u;
  return url;
}

type WindowProps = {
  shot: Shot;
  /** Czas sceny w sekundach (domyślnie z bieżącej klatki). */
  t?: number;
  width?: number;
  x?: number;
  y?: number;
  /** Klatka wejścia okna (perspektywa → płasko). */
  enterAt?: number;
  tilt?: number;
  style?: React.CSSProperties;
};

export const BAR = 52;

export const BrowserWindow: React.FC<WindowProps> = ({ shot, t: tProp, width = 1560, x = 960, y = 560, enterAt = 0, tilt = 1, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = tProp ?? frame / fps;
  const height = (width * SRC_H) / SRC_W;
  const p = spring({ frame: frame - enterAt, fps, config: { damping: 16, stiffness: 90, mass: 0.9 } });
  const url = urlAt(shot, t);
  const speed = slopeAt(shot.timeMap, t);
  const ff = interpolate(speed, [2.2, 2.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0, perspective: 2200, ...style }}>
      <div
        style={{
          position: "absolute",
          left: x - width / 2,
          top: y - (height + BAR) / 2,
          width,
          height: height + BAR,
          transform: `translateY(${(1 - p) * 220}px) rotateX(${(1 - p) * 14 * tilt}deg) rotateY(${(1 - p) * -16 * tilt}deg) scale(${0.84 + 0.16 * p})`,
          opacity: interpolate(p, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }),
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            border: `3px solid ${C.deep}`,
            background: C.surface,
            boxShadow: `12px 12px 0 ${SHADOW}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: BAR - 3,
              background: C.sage,
              borderBottom: `3px solid ${C.deep}`,
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
              gap: 10,
            }}
          >
            {[C.butter, C.mint, C.surface].map((c) => (
              <div key={c} style={{ width: 16, height: 16, borderRadius: 99, background: c, border: `2.5px solid ${C.deep}` }} />
            ))}
            <div
              style={{
                marginLeft: 18,
                flex: 1,
                maxWidth: 760,
                height: 32,
                borderRadius: 10,
                background: C.surface,
                border: `2.5px solid ${C.deep}`,
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                fontFamily: F.body,
                fontWeight: 700,
                fontSize: 19,
                color: C.muted,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span style={{ color: C.deep }}>hubmi.pl</span>
              <span>{url}</span>
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                opacity: ff,
                transform: `scale(${0.8 + 0.2 * ff})`,
                fontFamily: F.body,
                fontWeight: 700,
                fontSize: 20,
                color: C.deep,
                background: C.butter,
                border: `2.5px solid ${C.deep}`,
                borderRadius: 10,
                padding: "2px 12px",
              }}
            >
              ▶▶ ×{Math.round(speed)}
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, top: BAR, width: width - 6, height: height - 3 }}>
            <ClipView shot={shot} t={t} width={width - 6} height={height - 3} />
          </div>
        </div>
      </div>
    </div>
  );
};
