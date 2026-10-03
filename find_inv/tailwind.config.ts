import type { Config } from "tailwindcss";

// Typografia i odstępy z DESIGN.md, sekcja 12. Wczytywane w app/globals.css przez @config (Tailwind v4).
// Kolory i cienie są tokenami CSS w @theme (app/globals.css), żeby tryb kontrastu mógł je podmienić.
// Rodziny krojów wskazują na zmienne CSS z next/font (app/fonts.ts).
const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-atkinson)", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        body: ["var(--font-atkinson)", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        cut1: ["var(--font-abril)", "serif"],
        cut2: ["var(--font-alfa)", "serif"],
        cut3: ["var(--font-playfair)", "serif"],
        cut4: ["var(--font-courier)", "monospace"],
        cut5: ["var(--font-bitter)", "serif"],
      },
      fontSize: {
        sm: ["1rem", { lineHeight: "1.5" }],
        base: ["1.125rem", { lineHeight: "1.6" }],
        lg: ["1.3125rem", { lineHeight: "1.55" }],
        xl: ["1.625rem", { lineHeight: "1.3" }],
        "2xl": ["2.125rem", { lineHeight: "1.2" }],
        hero: ["clamp(2.75rem, 7vw, 5rem)", { lineHeight: "1.15" }],
      },
      borderRadius: { ui: "12px" },
      maxWidth: { content: "1120px" },
    },
  },
} satisfies Config;

// CommonJS: Tailwind wczytuje plik przez Node, który bez "type": "module" ostrzega przy `export default`.
module.exports = config;
