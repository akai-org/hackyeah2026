import { Easing } from "remotion";

export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const between = (r: () => number, a: number, b: number) => a + r() * (b - a);

const smooth = Easing.inOut(Easing.cubic);

/** Odcinkami liniowe mapowanie (np. czas sceny → czas nagrania). */
export function piecewise(keys: ReadonlyArray<readonly [number, number]>, t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) return v0 + ((t - t0) / (t1 - t0)) * (v1 - v0);
  }
  return keys[keys.length - 1][1];
}

/** Nachylenie mapowania czasu = tempo odtwarzania w danej chwili. */
export function slopeAt(keys: ReadonlyArray<readonly [number, number]>, t: number): number {
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t >= t0 && t <= t1) return (v1 - v0) / (t1 - t0);
  }
  return 1;
}

export type Cam = { t: number; x: number; y: number; z: number };

/** Kamera z płynnym przejściem (ease in-out) między klatkami kluczowymi. */
export function camAt(keys: Cam[], t: number): Omit<Cam, "t"> {
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b.t) {
      const p = smooth((t - a.t) / (b.t - a.t));
      return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, z: a.z + (b.z - a.z) * p };
    }
  }
  return keys[keys.length - 1];
}
