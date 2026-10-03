import type { Config } from "tailwindcss";

// Tokeny z DESIGN.md, sekcja 12. Wczytywane w app/globals.css przez @config (Tailwind v4).
// Rodziny krojów wskazują na zmienne CSS z next/font (app/fonts.ts).
const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta instytucjonalna: chłodne neutralne tło, granat do nagłówków, jeden niebieski akcent.
        paper: "#F5F7FA",
        surface: "#FFFFFF",
        sage: "#E9EFF6",
        mint: "#D8E6F7",
        butter: "#F7E4B0",
        deep: "#0E2A47",
        leaf: "#1D5BA6",
        ink: "#15202E",
        muted: "#4A5A6E",
        alert: "#B42318",
        // Ramki: `line` dla kart i sekcji, `field` (kontrast 3,6:1) dla pól formularzy.
        line: "#D3DBE5",
        field: "#7B8898",
        // Akcenty dodatkowe (oszczędnie: ikony, kategorie, statusy). Kolor ciemny na jasnym tle ≥ 4,2:1.
        forest: "#1A7F55",
        "forest-soft": "#DFF2E8",
        ember: "#A84B19",
        "ember-soft": "#FCE6D8",
        plum: "#6B44A6",
        "plum-soft": "#ECE5F7",
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
      borderRadius: { ui: "8px" },
      boxShadow: { paper: "0 1px 2px rgba(14, 42, 71, 0.06), 0 4px 16px rgba(14, 42, 71, 0.06)" },
      maxWidth: { content: "1120px" },
    },
  },
} satisfies Config;

// CommonJS: Tailwind wczytuje plik przez Node, który bez "type": "module" ostrzega przy `export default`.
module.exports = config;
