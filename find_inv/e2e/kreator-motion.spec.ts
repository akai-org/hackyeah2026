import { expect, test } from "@playwright/test";

// Kreator pomysłów: animowana zmiana trybu (View Transitions) i kroki asystenta.

// Zapisuje pozycję stopki w każdej klatce przez `ms` milisekund.
async function recordFooter(page: import("@playwright/test").Page, ms: number) {
  await page.evaluate((duration) => {
    const frames: number[] = [];
    (window as unknown as { __frames: number[] }).__frames = frames;
    const start = performance.now();
    const tick = () => {
      frames.push(document.querySelector("footer")!.getBoundingClientRect().top);
      if (performance.now() - start < duration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, ms);
}

test("zmiana trybu bez skoku: stopka przesuwa się płynnie, nie w jednej klatce", async ({ page }) => {
  await page.goto("/kreator");
  for (const label of ["Asystent krok po kroku", "Opiszę pomysł sam"]) {
    await recordFooter(page, 600);
    await page.getByText(label).click();
    await page.waitForTimeout(800);
    const frames = await page.evaluate(() => (window as unknown as { __frames: number[] }).__frames);
    const total = Math.abs(frames.at(-1)! - frames[0]);
    expect(total, label).toBeGreaterThan(100);
    const biggestStep = Math.max(...frames.slice(1).map((value, i) => Math.abs(value - frames[i])));
    // Największy ruch w jednej klatce to wyraźnie mniej niż cała zmiana.
    expect(biggestStep, label).toBeLessThan(total * 0.5);
  }
  await expect(page.getByLabel("Opisz swój pomysł społeczny")).toBeVisible();
});

test("kroki asystenta wjeżdżają z prawej przy „Dalej” i z lewej przy „Wstecz”", async ({ page }) => {
  await page.goto("/kreator");
  await page.getByText("Asystent krok po kroku").click();
  await page.getByRole("textbox", { name: "Jaki problem chcesz rozwiązać?" }).fill("Spotkania młodzieży z seniorami w świetlicy");
  await page.getByRole("button", { name: "Dalej" }).click();
  await expect(page.getByText(/Krok 2 z/)).toBeVisible();
  expect(await page.locator("form .step-in-forward").evaluate((el) => getComputedStyle(el).animationName)).toBe(
    "kreator-in-right",
  );
  await page.getByRole("button", { name: "Wstecz" }).click();
  await expect(page.getByText(/Krok 1 z/)).toBeVisible();
  expect(await page.locator("form .step-in-back").evaluate((el) => getComputedStyle(el).animationName)).toBe(
    "kreator-in-left",
  );
});

test("prefers-reduced-motion: tryb zmienia się bez animacji", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/kreator");
  await page.getByText("Asystent krok po kroku").click();
  await expect(page.getByText(/Krok 1 z/)).toBeVisible();
  expect(await page.locator("form .step-in-forward").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});
