import { loadFont as loadAtkinson } from "@remotion/google-fonts/AtkinsonHyperlegible";
import { loadFont as loadAbril } from "@remotion/google-fonts/AbrilFatface";
import { loadFont as loadAlfa } from "@remotion/google-fonts/AlfaSlabOne";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadCourier } from "@remotion/google-fonts/CourierPrime";
import { loadFont as loadBitter } from "@remotion/google-fonts/Bitter";

// Paleta i kroje 1:1 z find_inv/DESIGN.md.
export const C = {
  paper: "#EEF3EA",
  surface: "#FAFCF7",
  sage: "#D3E3D0",
  mint: "#B8DCC4",
  butter: "#F2E2A0",
  deep: "#1B4332",
  leaf: "#2D6A4F",
  ink: "#14251C",
  muted: "#3D5A4A",
} as const;

const subsets = ["latin", "latin-ext"];

export const F = {
  body: loadAtkinson("normal", { weights: ["400", "700"], subsets }).fontFamily,
  abril: loadAbril("normal", { weights: ["400"], subsets }).fontFamily,
  alfa: loadAlfa("normal", { weights: ["400"], subsets }).fontFamily,
  playfair: loadPlayfair("normal", { weights: ["900"], subsets }).fontFamily,
  courier: loadCourier("normal", { weights: ["700"], subsets }).fontFamily,
  bitter: loadBitter("normal", { weights: ["700"], subsets }).fontFamily,
};

export const SHADOW = "rgba(27, 67, 50, 0.28)";
export const FPS = 30;
