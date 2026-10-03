import { expect, test } from "@playwright/test";

import { openQuickSearch } from "./helpers";

// Szybkie wyszukiwanie (Ctrl+K): kategoria wybiera, GDZIE szukać — „Szukaj” prowadzi na stronę kategorii
// z tekstem i tagami. Bez wyników na żywo i bez skakania okna przy zmianie kategorii.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("zmiana kategorii nie zmienia wysokości okna i nie pokazuje wyników na żywo", async ({ page }) => {
  const dialog = await openQuickSearch(page);
  await page.locator("#quick-search").fill("opieka");
  const heights: number[] = [];
  for (const name of ["Wszystko", "Problemy", "Innowacje", "Artykuły", "Wszystko"]) {
    await dialog.getByRole("button", { name, exact: true }).click();
    await expect(dialog.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.waitForTimeout(300);
    heights.push((await dialog.boundingBox())!.height);
    await expect(dialog.getByRole("link")).toHaveCount(0);
  }
  expect(new Set(heights).size).toBe(1);
});

test("tagi są dostępne w każdej kategorii", async ({ page }) => {
  const dialog = await openQuickSearch(page);
  for (const name of ["Problemy", "Innowacje", "Artykuły", "Wszystko"]) {
    await dialog.getByRole("button", { name, exact: true }).click();
    await expect(dialog.getByText("Wybierz tagi")).toBeVisible();
  }
});

test("Problemy: „Szukaj” otwiera wyzwania z tekstem i tagiem", async ({ page }) => {
  const dialog = await openQuickSearch(page);
  await dialog.getByRole("button", { name: "Problemy", exact: true }).click();
  await page.locator("#quick-search").fill("opieka");
  await dialog.getByText("Wybierz tagi").click();
  await dialog.getByLabel("#Seniorzy").check();
  await page.locator("#quick-search").press("Enter");

  await expect(page).toHaveURL(/\/wyzwania\?q=opieka&tagi=Seniorzy$/);
  const main = page.getByRole("main");
  await expect(main.getByLabel("Szukaj problemu")).toHaveValue("opieka");
  await expect(main.getByRole("button", { name: "Usuń tag Seniorzy" })).toBeVisible();
  // „opieka” + Seniorzy → tylko starzenie się (opieka nad osobami 65+).
  await expect(main.locator("h3")).toHaveText(["Starzenie się mieszkańców"]);

  await main.getByRole("button", { name: "Usuń tag Seniorzy" }).click();
  await expect.poll(() => main.locator("h3").count()).toBeGreaterThan(1);
});

test("Innowacje: „Szukaj” otwiera Bibliotekę z tekstem i tagiem taksonomii", async ({ page }) => {
  const dialog = await openQuickSearch(page);
  await dialog.getByRole("button", { name: "Innowacje", exact: true }).click();
  await page.locator("#quick-search").fill("wolontariat");
  await dialog.getByText("Wybierz tagi").click();
  await dialog.getByLabel("#Seniorzy").check();
  await dialog.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(page).toHaveURL(/\/biblioteka\?q=wolontariat&tags=seniorzy$/);
});

test("Artykuły: „Szukaj” otwiera Edukację przefiltrowaną tekstem", async ({ page }) => {
  const dialog = await openQuickSearch(page);
  await dialog.getByRole("button", { name: "Artykuły", exact: true }).click();
  await page.locator("#quick-search").fill("spółdzielnia");
  await dialog.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(page).toHaveURL(/\/edukacja\?q=sp%C3%B3%C5%82dzielnia$/);
  await expect(page.getByRole("main").getByRole("article")).toHaveCount(1);
});

test("Wszystko: tagi trafiają do opisu dla dopasowania AI, pusty formularz nie wysyła", async ({ page }) => {
  const dialog = await openQuickSearch(page);
  await dialog.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  await page.locator("#quick-search").fill("samotność na wsi");
  await dialog.getByText("Wybierz tagi").click();
  await dialog.getByLabel("#Transport").check();
  await dialog.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(page).toHaveURL(/\/wyniki\?q=samotno%C5%9B%C4%87\+na\+wsi%2C\+Transport$/);
});
