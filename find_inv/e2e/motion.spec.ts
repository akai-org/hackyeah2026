import { expect, test } from "@playwright/test";

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
