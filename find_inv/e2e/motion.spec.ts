import { expect, test } from "@playwright/test";

import { openQuickSearch } from "./helpers";

// Animacje: sekcje poniżej ekranu pojawiają się przy przewinięciu; przy prefers-reduced-motion nic nie jest ukryte.

test("sekcja poniżej ekranu czeka na przewinięcie, potem się pokazuje", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#artykul-dnia");
  await expect(section).toHaveClass(/reveal-pending/);
  await section.scrollIntoViewIfNeeded();
  await expect(section).not.toHaveClass(/reveal-pending/);
  await expect.poll(() => section.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
});

test("treść widoczna od razu nigdy nie jest ukrywana", async ({ page }) => {
  await page.goto("/");
  const hidden = await page.locator("[data-reveal].reveal-pending").evaluateAll((elements) =>
    elements.filter((el) => el.getBoundingClientRect().top < window.innerHeight).length,
  );
  expect(hidden).toBe(0);
});

test("prefers-reduced-motion: brak ukrytych sekcji i animacji hover", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".reveal-pending")).toHaveCount(0);
  const transition = await page
    .locator(".hover-lift")
    .first()
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(transition).toBe("0s");
});

test("zamykanie okna: najpierw animacja wyjścia, potem znika", async ({ page }) => {
  await page.goto("/");
  const dialog = await openQuickSearch(page);
  await page.keyboard.press("Escape");
  // Zaraz po Esc okno jest jeszcze w DOM i gra animację dialog-out.
  expect(await page.locator("dialog[data-closing]").evaluate((el) => getComputedStyle(el).animationName)).toBe(
    "dialog-out",
  );
  await expect(dialog).toBeHidden();
  await expect(page.locator("dialog[data-closing]")).toHaveCount(0);
});

test("zamykanie panelu dostępności z animacją", async ({ page }) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: "Dostępność" });
  await button.click();
  const panel = page.getByRole("dialog", { name: "Ustawienia dostępności" });
  await expect(panel).toBeVisible();
  await button.click();
  expect(await panel.evaluate((el) => getComputedStyle(el).animationName)).toBe("popover-out");
  await expect(panel).toHaveCount(0);
});

test("prefers-reduced-motion: okno zamyka się od razu, bez animacji", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await openQuickSearch(page);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[data-closing]")).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Czego szukasz?" })).toBeHidden();
});

test("hover przycisku-opcji: uniesienie z twardym cieniem", async ({ page, isMobile }) => {
  test.skip(isMobile, "na ekranie dotykowym nie ma hover");
  await page.goto("/");
  await openQuickSearch(page);
  const option = page.getByRole("dialog").getByRole("button", { name: "Innowacje", exact: true });
  await option.hover();
  await expect.poll(() => option.evaluate((el) => getComputedStyle(el).translate)).toBe("-2px -2px");
  await expect.poll(() => option.evaluate((el) => getComputedStyle(el).boxShadow)).toContain("3px 3px 0px");
});

test("hover głównego przycisku też ma płynne przejście", async ({ page }) => {
  await page.goto("/");
  const submit = page.getByRole("main").getByRole("button", { name: "Szukaj" });
  const transition = await submit.evaluate((el) => getComputedStyle(el).transitionProperty);
  for (const property of ["background-color", "box-shadow", "translate"]) expect(transition).toContain(property);
});
