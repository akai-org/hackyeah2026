import { expect, test } from "@playwright/test";

// Kreator pomysłów: animowana zmiana trybu (View Transitions) i kroki asystenta.

test("zmiana trybu odpala przejście View Transition w stronę wybranego trybu", async ({ page }) => {
  await page.goto("/kreator");
  // Licznik animacji pseudo-elementów ::view-transition-*(kreator-body).
  await page.evaluate(() => {
    (window as unknown as { __vt: string[] }).__vt = [];
    const original = document.startViewTransition.bind(document);
    document.startViewTransition = ((callback: () => void) => {
      const transition = original(callback);
      transition.ready.then(() => {
        const names = document
          .getAnimations()
          .map((animation) => (animation as CSSAnimation).animationName)
          .filter(Boolean);
        (window as unknown as { __vt: string[] }).__vt.push(...names);
      });
      return transition;
    }) as typeof document.startViewTransition;
  });

  await page.getByText("Asystent krok po kroku").click();
  await expect(page.getByText(/Krok 1 z/)).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __vt: string[] }).__vt))
    .toEqual(expect.arrayContaining(["kreator-out-left", "kreator-in-right"]));
  await expect.poll(() => page.evaluate(() => document.documentElement.hasAttribute("data-kreator-dir"))).toBe(false);

  await page.getByText("Opiszę pomysł sam").click();
  await expect(page.getByLabel("Opisz swój pomysł społeczny")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __vt: string[] }).__vt))
    .toEqual(expect.arrayContaining(["kreator-out-right", "kreator-in-left"]));
});

test("kroki asystenta wjeżdżają z prawej przy „Dalej” i z lewej przy „Wstecz”", async ({ page }) => {
  await page.goto("/kreator");
  await page.getByText("Asystent krok po kroku").click();
  await page.getByRole("textbox", { name: "Jaki problem chcesz rozwiązać?" }).fill("Spotkania młodzieży z seniorami w świetlicy");
  await page.getByRole("button", { name: "Dalej" }).click();
  await expect(page.getByText(/Krok 2 z/)).toBeVisible();
  expect(await page.locator(".step-in-forward").evaluate((el) => getComputedStyle(el).animationName)).toBe(
    "kreator-in-right",
  );
  await page.getByRole("button", { name: "Wstecz" }).click();
  await expect(page.getByText(/Krok 1 z/)).toBeVisible();
  expect(await page.locator(".step-in-back").evaluate((el) => getComputedStyle(el).animationName)).toBe(
    "kreator-in-left",
  );
});

test("prefers-reduced-motion: tryb zmienia się bez animacji", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/kreator");
  await page.getByText("Asystent krok po kroku").click();
  await expect(page.getByText(/Krok 1 z/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.hasAttribute("data-kreator-dir"))).toBe(false);
  expect(await page.locator(".step-in-forward").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});
