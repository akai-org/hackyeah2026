import type { Config } from "tailwindcss";

// Tokeny z DESIGN.md, sekcja 12. Wczytywane w app/globals.css przez @config (Tailwind v4).
// Rodziny krojów wskazują na zmienne CSS z next/font (app/fonts.ts).
const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7FAF8",
        surface: "#FFFFFF",
        sage: "#E5F0E8",
        mint: "#CBE7D4",
        butter: "#FFF1C7",
        deep: "#163B2B",
        leaf: "#1F7A5A",
        ink: "#15231B",
        muted: "#4B6356",
        alert: "#B42318",
      },
      fontFamily: {
        sans: ["var(--font-atkinson)", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        body: ["var(--font-atkinson)", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
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
      boxShadow: { paper: "0 12px 24px rgba(22, 59, 43, 0.12)" },
      maxWidth: { content: "1120px" },
    },
  },
} satisfies Config;

// CommonJS: Tailwind wczytuje plik przez Node, który bez "type": "module" ostrzega przy `export default`.
module.exports = config;
