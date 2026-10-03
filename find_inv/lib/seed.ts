// Deterministyczna „losowość" dla kolażu (DESIGN.md 6.3): ten sam tekst daje
// zawsze ten sam wygląd na serwerze i w przeglądarce, bez Math.random().

export function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i) * 31 + i;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Generator mulberry32: zwraca liczby z przedziału [0, 1). */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}
