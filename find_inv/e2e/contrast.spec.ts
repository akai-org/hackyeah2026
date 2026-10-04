import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

// Kontrast tokenów kolorów (@theme w app/globals.css) wg WCAG 2.x: tekst ≥ 4,5:1, elementy UI ≥ 3:1.

// Wartości z @theme w app/globals.css (pierwszy test pilnuje, że się zgadzają).
const COLORS = {
  background: "#f7f8fa",
  surface: "#ffffff",
  secondary: "#ece6da",
  foreground: "#000000",
  muted: "#5b626c",
  border: "#5c6470",
  primary: "#345995",
  "primary-hover": "#284778",
  "primary-foreground": "#ffffff",
  accent: "#f4845f",
  "accent-foreground": "#000000",
  success: "#2e6b45",
  warning: "#aa0505",
  destructive: "#a3322a",
  focus: "#1f3f73",
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Pary tekst/tło używane w interfejsie.
const TEXT_PAIRS: Array<[keyof typeof COLORS, keyof typeof COLORS]> = [
  ["foreground", "background"],
  ["foreground", "surface"],
  ["foreground", "secondary"],
  ["primary", "background"],
  ["primary", "surface"],
  ["primary-hover", "surface"],
  ["primary-foreground", "primary"],
  ["primary-foreground", "primary-hover"],
  ["accent-foreground", "accent"],
  ["destructive", "surface"],
  ["destructive", "background"],
  ["success", "surface"],
  ["warning", "surface"],
];

test("tokeny w app/globals.css zgadzają się z testem", () => {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  const start = css.indexOf("@theme");
  const theme = css.slice(start, css.indexOf("}", start));
  for (const [name, hex] of Object.entries(COLORS)) {
    expect(theme, name).toContain(`--color-${name}: ${hex};`);
  }
});

for (const [fg, bg] of TEXT_PAIRS) {
  test(`tekst ${fg} na ${bg} ≥ 4,5:1`, () => {
    expect(contrast(COLORS[fg], COLORS[bg])).toBeGreaterThanOrEqual(4.5);
  });
}

// Tekst pomocniczy (muted) i obramowania pól (border, elementy UI ≥ 3:1 — WCAG 1.4.11).
for (const bg of ["background", "surface", "secondary"] as const) {
  test(`tekst muted na ${bg} ≥ 4,5:1`, () => {
    expect(contrast(COLORS.muted, COLORS[bg])).toBeGreaterThanOrEqual(4.5);
  });
  test(`obramowanie border na ${bg} ≥ 3:1`, () => {
    expect(contrast(COLORS.border, COLORS[bg])).toBeGreaterThanOrEqual(3);
  });
}

test("pierścień fokusu na mapie widoczny na skrajnych kolorach skali (≥ 3:1)", () => {
  // Skala mapy idzie od `background` do `primary`; pierścień to `surface` + `focus`.
  for (const fill of [COLORS.background, COLORS.secondary, COLORS.primary]) {
    expect(Math.max(contrast(COLORS.surface, fill), contrast(COLORS.focus, fill)), fill).toBeGreaterThanOrEqual(3);
  }
});

test("fokus z klawiatury na mapie rysuje pierścień", async ({ page }) => {
  await page.goto("/");
  const powiat = page.locator('svg[aria-label^="Mapa powiatów"] path[role="button"]').first();
  await powiat.focus();
  // .focus() z kodu nie zawsze daje :focus-visible — przejdź klawiaturą do następnego powiatu.
  await page.keyboard.press("Tab");
  await expect(page.locator('svg[aria-label^="Mapa powiatów"] path[stroke="var(--color-focus)"][fill="none"]')).toHaveCount(
    1,
  );
});
