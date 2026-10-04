import { expect, test } from "@playwright/test";

// Przyklejony nagłówek, skip link, płynne przewijanie do kotwic, kolejność sekcji strony głównej.

test("pierwszy Tab pokazuje „Przejdź do treści”, Enter przenosi focus do #main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Przejdź do treści" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("nagłówek zostaje u góry po przewinięciu", async ({ page }) => {
  await page.goto("/");
  await page.mouse.wheel(0, 2500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
  const box = await page.getByRole("banner").boundingBox();
  expect(box?.y).toBe(0);
});

test("płynne przewijanie włączone, a przy prefers-reduced-motion wyłączone", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("smooth");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
});

test("kotwica nie chowa sekcji pod nagłówkiem", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("navigation", { name: "Szybki dostęp" }).getByRole("link", { name: "Kondycja Małopolski" }).click();
  await expect(page).toHaveURL(/#kondycja-malopolski$/);
  const header = await page.getByRole("banner").boundingBox();
  const section = await page.locator("#kondycja-malopolski").boundingBox();
  expect(section!.y).toBeGreaterThanOrEqual(header!.height - 1);
  expect(section!.y).toBeLessThan(header!.height + 60);
});

test("linki szybkiego dostępu są w kolejności sekcji na stronie", async ({ page }) => {
  await page.goto("/");
  const targets = await page
    .getByRole("navigation", { name: "Szybki dostęp" })
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")!.slice(1)));
  expect(targets.length).toBeGreaterThan(1);
  const tops = await page.evaluate(
    (ids) => ids.map((id) => document.getElementById(id)!.getBoundingClientRect().top + window.scrollY),
    targets,
  );
  expect(tops).toEqual([...tops].sort((a, b) => a - b));
});
