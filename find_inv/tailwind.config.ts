import type { Config } from "tailwindcss";

// Tokeny z DESIGN.md, sekcja 12. Wczytywane w app/globals.css przez @config (Tailwind v4).
// Rodziny krojów wskazują na zmienne CSS z next/font (app/fonts.ts).
const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4FBF8",
        surface: "#FFFFFF",
        sage: "#C2D2B8",
        mint: "#DCE8D8",
        butter: "#F4845F",
        deep: "#123229",
        leaf: "#1F6F54",
        ink: "#123229",
        muted: "#123229",
        alert: "#9F3F2D",
      },
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
      boxShadow: { paper: "0 12px 24px rgba(18, 50, 41, 0.16)" },
      maxWidth: { content: "1120px" },
    },
  },
} satisfies Config;

// CommonJS: Tailwind wczytuje plik przez Node, który bez "type": "module" ostrzega przy `export default`.
module.exports = config;
