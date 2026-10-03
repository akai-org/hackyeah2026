import {
  Abril_Fatface,
  Alfa_Slab_One,
  Atkinson_Hyperlegible,
  Bitter,
  Courier_Prime,
  Playfair_Display,
} from "next/font/google";

// Krój podstawowy: cała treść, formularze, przyciski.
export const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-atkinson",
  display: "swap",
});

// Kroje „wycięte z gazet": tylko litery w <CutoutText>. Bez preloadu, żeby nie spowalniać treści.
export const abril = Abril_Fatface({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-abril",
  display: "swap",
  preload: false,
});

export const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-alfa",
  display: "swap",
  preload: false,
});

export const playfair = Playfair_Display({
  weight: ["700", "900"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

export const courier = Courier_Prime({
  weight: "700",
  subsets: ["latin", "latin-ext"],
  variable: "--font-courier",
  display: "swap",
  preload: false,
});

export const bitter = Bitter({
  weight: "700",
  subsets: ["latin", "latin-ext"],
  variable: "--font-bitter",
  display: "swap",
  preload: false,
});

export const fontVariables = [atkinson, abril, alfa, playfair, courier, bitter]
  .map((font) => font.variable)
  .join(" ");
