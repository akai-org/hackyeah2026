import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

// Kontrast tokenów kolorów (tailwind.config.ts) wg WCAG 2.x: tekst ≥ 4,5:1, elementy UI ≥ 3:1.

const COLORS = {
  paper: "#F4FBF8",
  surface: "#FFFFFF",
  sage: "#C2D2B8",
  mint: "#DCE8D8",
  butter: "#F4845F",
  deep: "#123229",
  leaf: "#1A5E47",
  alert: "#9F3F2D",
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
  ["deep", "paper"],
  ["deep", "surface"],
  ["deep", "sage"],
  ["deep", "mint"],
  ["deep", "butter"],
  ["leaf", "paper"],
  ["leaf", "surface"],
  ["leaf", "sage"],
  ["leaf", "mint"],
  ["alert", "surface"],
  ["alert", "paper"],
  ["surface", "deep"],
  ["surface", "leaf"],
];

test("tokeny w tailwind.config.ts zgadzają się z testem", () => {
  const config = readFileSync(join(process.cwd(), "tailwind.config.ts"), "utf8");
  for (const [name, hex] of Object.entries(COLORS)) {
    expect(config, name).toContain(`${name}: "${hex}"`);
  }
});

for (const [fg, bg] of TEXT_PAIRS) {
  test(`tekst ${fg} na ${bg} ≥ 4,5:1`, () => {
    expect(contrast(COLORS[fg], COLORS[bg])).toBeGreaterThanOrEqual(4.5);
  });
}

test("pierścień fokusu na mapie widoczny na każdym kolorze powiatu (≥ 3:1)", () => {
  const fills = ["#D3E3D0", "#A9CDB4", "#6FA88A", "#2D6A4F", "#1B4332", "#EEF3EA"];
  for (const fill of fills) {
    // Pierścień: biały + ciemny — wystarczy, że jeden z nich ma 3:1 z wypełnieniem.
    expect(Math.max(contrast("#FFFFFF", fill), contrast("#123229", fill)), fill).toBeGreaterThanOrEqual(3);
  }
});

test("fokus z klawiatury na mapie rysuje pierścień", async ({ page }) => {
  await page.goto("/");
  const powiat = page.locator('svg[aria-label^="Mapa powiatów"] path[role="button"]').first();
  await powiat.focus();
  // .focus() z kodu nie zawsze daje :focus-visible — przejdź klawiaturą do następnego powiatu.
  await page.keyboard.press("Tab");
  await expect(page.locator('svg[aria-label^="Mapa powiatów"] path[stroke="#123229"][fill="none"]')).toHaveCount(1);
});
