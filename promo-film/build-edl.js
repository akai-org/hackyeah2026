// Lista montażowa: która klatka nagrania trafia na którą klatkę filmu.
// Segment: [clip, fromMark, fromOff, toMark, toOff, outDur, {x: crossfade}]
// Prędkość = długość źródła / outDur (cięcia oczekiwania na AI = osobne segmenty z przenikaniem).
const fs = require("fs");
const FPS = 30, DURATION = 90;

const SHOTS = [
  { at: 4.0, segs: [["library", "start", 0.2, "end", 0, 6.5]] },
  { at: 10.5, segs: [
    ["match", "start", 1.8, "typeStart", 0, 0.7],
    ["match", "typeStart", 0, "typeEnd", 0, 3.0],
    ["match", "typeEnd", 0, "search", 0.15, 1.0],
    ["match", "search", 1.95, "cards", 0.1, 1.2, { x: 0.25 }],   // cięcie: bez mignięcia „Brak wyników”
    ["match", "cards", 0.1, "cardsView", 0, 2.4],
    ["match", "cardsView", 0, "cardsView", 3.0, 3.0],
    ["match", "cardsView", 3.0, "cardsView", 3.0, 1.2],
  ] },
  { at: 23.0, segs: [
    ["match", "cardsView", 3.0, "chatOpen", 0, 1.6],
    ["match", "chatOpen", 0, "chatSend", 0, 3.0],
    ["match", "chatSend", 0, "chatDone", 0, 3.4],
    ["match", "chatDone", 0, "chatDone", 2.0, 2.0],
  ] },
  { at: 33.0, segs: [
    ["match", "chatDone", 2.0, "mmOpen", 1.2, 2.0],
    ["match", "mmStart", -1.6, "mmStart", 0.6, 1.6, { x: 0.25 }],
    ["match", "q1", -0.2, "q1", 2.6, 2.6, { x: 0.25 }],
    ["match", "q1", 2.6, "a1", 0.3, 2.6],
    ["match", "a1", 0.3, "a1done", 0, 1.4],
    ["match", "a1done", 0, "planReq", 1.0, 1.6],
    ["match", "plan", -0.3, "end", 0, 6.2, { x: 0.3 }],         // cięcie: oczekiwanie na plan
  ] },
  { at: 51.0, segs: [
    ["map", "start", 0.2, "mapView", 0, 2.6],
    ["map", "mapView", 0, "picked", 2.5, 3.4],
    ["map", "picked", 2.5, "end", 0, 2.5],
  ] },
  { at: 59.5, segs: [
    ["creator", "start", 2.5, "typeStart", 0, 0.6],
    ["creator", "typeStart", 0, "typeEnd", 0, 2.0],
    ["creator", "typeEnd", 0, "analyze", 0.3, 1.1],
    ["creator", "analyze", 0.3, "card", 0.2, 1.0],
    ["creator", "card", 0.2, "toGrant", 0, 3.0],
    ["creator", "toGrant", 0, "fill", 0.3, 1.2],
    ["creator", "filled", -0.2, "end", 0, 2.6, { x: 0.25 }],  // cięcie: AI pisze wniosek
  ] },
  { at: 71.0, segs: [
    ["admin", "start", 1.0, "loggedIn", 0.3, 2.0],
    ["admin", "needs", -0.6, "end", 0, 4.5, { x: 0.25 }],
  ] },
  { at: 77.5, segs: [
    ["a11y", "start", 0.3, "panel", 0, 1.0],
    ["a11y", "panel", 0, "contrast", 0.8, 1.4],
    ["a11y", "contrast", 0.8, "bigger", 1.0, 1.4],
    ["a11y", "bigger", 1.0, "en", 1.4, 1.9],
    ["a11y", "en", 1.4, "uk", 1.6, 1.8],
  ] },
];

const cache = {};
const clip = (c) => (cache[c] ??= { f: require(`./clips/${c}/frames.json`), m: require(`./clips/${c}/marks.json`) });
const file = (c, i) => `clips/${c}/f${String(i).padStart(5, "0")}.jpg`;
function frameAt(c, ts) {
  const { f } = clip(c);
  let lo = 0, hi = f.length - 1;
  if (ts <= f[0].ts) return file(c, 0);
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (f[mid].ts <= ts) lo = mid; else hi = mid - 1; }
  return file(c, f[lo].i);
}

const out = new Array(Math.round(DURATION * FPS)).fill(null);
const report = [];
for (const shot of SHOTS) {
  let t = shot.at, prevLast = null;
  for (const [c, fm, fo, tm, to, dur, opt = {}] of shot.segs) {
    const { m } = clip(c);
    if (!(fm in m) || !(tm in m)) throw new Error(`brak znacznika ${c}:${fm}/${tm}`);
    const a = m[fm] + fo, b = m[tm] + to;
    report.push(`${t.toFixed(2).padStart(6)}s  ${c.padEnd(8)} ${fm}+${fo} → ${tm}+${to}  ${(b - a).toFixed(1)}s src → ${dur}s  (x${((b - a) / dur).toFixed(2)})`);
    const n0 = Math.round(t * FPS), n1 = Math.round((t + dur) * FPS);
    for (let n = n0; n < n1 && n < out.length; n++) {
      const u = (n / FPS - t) / dur;
      const e = { f: frameAt(c, a + (b - a) * u) };
      if (opt.x && prevLast && n / FPS - t < opt.x) { e.p = prevLast; e.a = +((n / FPS - t) / opt.x).toFixed(3); }
      out[n] = e;
    }
    prevLast = frameAt(c, b);
    t += dur;
  }
  report.push(`        koniec ujęcia: ${t.toFixed(2)}s`);
}
fs.writeFileSync("edl.js", "window.EDL=" + JSON.stringify(out) + ";");
console.log(report.join("\n"));
