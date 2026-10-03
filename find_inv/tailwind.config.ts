import type { Config } from "tailwindcss";

// Tokeny z DESIGN.md, sekcja 12. Wczytywane w app/globals.css przez @config (Tailwind v4).
// Rodziny krojów wskazują na zmienne CSS z next/font (app/fonts.ts).
const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EEF3EA",
        surface: "#FAFCF7",
        sage: "#D3E3D0",
        mint: "#B8DCC4",
        butter: "#F2E2A0",
        deep: "#1B4332",
        leaf: "#2D6A4F",
        ink: "#14251C",
        muted: "#3D5A4A",
        alert: "#8A2D1F",
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
      boxShadow: { paper: "3px 3px 0 rgba(27, 67, 50, 0.25)" },
      maxWidth: { content: "1120px" },
    },
  },
} satisfies Config;

// CommonJS: Tailwind wczytuje plik przez Node, który bez "type": "module" ostrzega przy `export default`.
module.exports = config;
