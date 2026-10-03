import type { Shot } from "./components/Window";

// Montaż nagrań: timeMap = [czas sceny, czas nagrania], cam = kamera w pikselach nagrania 1920×1080.
// Momenty w nagraniach (s) są w src/clipMeta.ts (marks).

const Q = "/wyniki?q=w+naszej+gminie+wiejskiej+seniorzy+są+samotni…";

export const SEARCH: Shot = {
  clip: "search",
  timeMap: [
    [0, 4.3],
    [0.8, 5.95],
    [3.4, 11.6],
    [4.5, 13.7],
    [5.2, 16.2],
    [6.9, 17.8],
    [8.6, 19.05],
    [13, 24.4],
  ],
  cam: [
    { t: 0, x: 960, y: 540, z: 1 },
    { t: 0.75, x: 700, y: 860, z: 1.55 },
    { t: 3.3, x: 720, y: 860, z: 1.6 },
    { t: 4.3, x: 880, y: 880, z: 1.5 },
    { t: 4.75, x: 960, y: 540, z: 1.0 },
    { t: 5.3, x: 800, y: 620, z: 1.45 },
    { t: 7.3, x: 820, y: 640, z: 1.45 },
    { t: 8.6, x: 960, y: 540, z: 1.12 },
    { t: 13, x: 960, y: 560, z: 1.12 },
  ],
  urls: [
    [0, "/"],
    [13.8, Q],
  ],
};

export const CHAT: Shot = {
  clip: "chat",
  timeMap: [
    [0, 0.7],
    [1.2, 2.3],
    [5, 7.12],
  ],
  cam: [
    { t: 0, x: 840, y: 300, z: 1.5 },
    { t: 1.6, x: 840, y: 330, z: 1.5 },
    { t: 5, x: 840, y: 520, z: 1.08 },
  ],
  urls: [[0, Q]],
};

export const MIDDLEMAN: Shot = {
  clip: "middleman",
  timeMap: [
    [0, 1.9],
    [0.9, 2.9],
    [1.5, 3.8],
    [2.9, 8.2],
    [3.7, 10.6],
    [4.6, 11.7],
    [6.5, 18.9],
    [7.3, 20.6],
    [8.0, 23.0],
    [8.7, 24.4],
    [9.3, 26.6],
    [10.0, 42.7],
    [10.25, 44.15],
    [13, 52.2],
  ],
  cam: [
    { t: 0, x: 1000, y: 700, z: 1.35 },
    { t: 0.9, x: 1080, y: 780, z: 1.5 },
    { t: 1.4, x: 960, y: 540, z: 1.0 },
    { t: 2.0, x: 780, y: 640, z: 1.3 },
    { t: 2.9, x: 760, y: 700, z: 1.35 },
    { t: 3.6, x: 760, y: 680, z: 1.3 },
    { t: 6.5, x: 760, y: 760, z: 1.3 },
    { t: 7.4, x: 760, y: 600, z: 1.3 },
    { t: 9.3, x: 760, y: 620, z: 1.3 },
    { t: 9.9, x: 960, y: 540, z: 1.0 },
    { t: 10.6, x: 900, y: 560, z: 1.15 },
    { t: 13, x: 900, y: 560, z: 1.15 },
  ],
  urls: [
    [0, Q],
    [3.0, "/wdrozenie?innowacja=…&problem=w+naszej+gminie…"],
  ],
};

export const STATS: Shot = {
  clip: "stats",
  timeMap: [
    [0, 0.25],
    [2.6, 3.3],
  ],
  cam: [
    { t: 0, x: 960, y: 600, z: 1.15 },
    { t: 2.6, x: 960, y: 540, z: 1.15 },
  ],
  urls: [[0, "/#kondycja"]],
};

export const GAP: Shot = {
  clip: "gap",
  timeMap: [
    [0, 1.6],
    [1.0, 3.6],
    [2.2, 5.0],
    [3.9, 8.6],
  ],
  cam: [
    { t: 0, x: 700, y: 500, z: 1.3 },
    { t: 1.0, x: 640, y: 620, z: 1.35 },
    { t: 2.2, x: 900, y: 560, z: 1.15 },
    { t: 3.9, x: 900, y: 560, z: 1.15 },
  ],
  urls: [[0, "/luka-innowacyjna"]],
};

export const KREATOR: Shot = {
  clip: "kreator",
  timeMap: [
    [0, 11.6],
    [0.6, 12.95],
    [1.2, 14.9],
    [3.0, 16.5],
  ],
  cam: [
    { t: 0, x: 640, y: 860, z: 1.3 },
    { t: 0.6, x: 640, y: 880, z: 1.3 },
    { t: 1.2, x: 960, y: 540, z: 1.05 },
    { t: 1.7, x: 760, y: 620, z: 1.22 },
    { t: 3.0, x: 760, y: 600, z: 1.22 },
  ],
  urls: [[0, "/kreator"]],
};

export const SIMPLE: Shot = {
  clip: "simple",
  timeMap: [
    [0, 3.0],
    [0.5, 4.1],
    [2.5, 6.6],
  ],
  cam: [
    { t: 0, x: 1230, y: 200, z: 1.6 },
    { t: 0.6, x: 1100, y: 320, z: 1.5 },
    { t: 1.4, x: 700, y: 440, z: 1.2 },
    { t: 2.5, x: 700, y: 440, z: 1.2 },
  ],
  urls: [[0, "/"]],
};

export const ADMIN: Shot = {
  clip: "admin",
  timeMap: [
    [0, 1.3],
    [0.8, 2.9],
    [1.7, 8.3],
    [2.0, 10.2],
    [2.9, 11.6],
    [3.3, 16.3],
    [4.0, 17.4],
    [5.5, 19.6],
  ],
  cam: [
    { t: 0, x: 1500, y: 200, z: 1.5 },
    { t: 0.8, x: 1450, y: 260, z: 1.4 },
    { t: 1.0, x: 960, y: 540, z: 1.15 },
    { t: 1.7, x: 960, y: 560, z: 1.15 },
    { t: 2.0, x: 960, y: 540, z: 1.0 },
    { t: 2.8, x: 960, y: 600, z: 1.25 },
    { t: 3.3, x: 960, y: 540, z: 1.0 },
    { t: 4.0, x: 960, y: 620, z: 1.12 },
    { t: 5.5, x: 960, y: 600, z: 1.12 },
  ],
  urls: [
    [0, "/"],
    [8.9, "/admin/statystyki"],
    [15.0, "/admin/trendy"],
  ],
};
