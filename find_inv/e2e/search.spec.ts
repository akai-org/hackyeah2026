import { expect, test } from "@playwright/test";

import { openQuickSearch } from "./helpers";

// Szybkie wyszukiwanie (Ctrl+K): kategorie Problemy / Innowacje / Artykuły filtrują wyniki i cel „Szukaj”.

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("Problemy: wyniki tylko z wyzwań, zawężane wpisanym tekstem", async ({ page }) => {
  const dialog = await openQuickSearch(page);
  await dialog.getByRole("button", { name: "Problemy", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Problemy", exact: true })).toHaveAttribute("aria-pressed", "true");
  const results = dialog.getByRole("list", { name: "Wyniki: Problemy" }).getByRole("link");
  await expect(results.first()).toBeVisible();
  for (const text of await results.allInnerTexts()) expect(text).toMatch(/powiat|\(miasto\)|[A-ZŁŚŻ]/);
  await expect(results.first()).toHaveAttribute("href", /^\/wyzwania\?/);

  await page.getByLabel(/Szukaj problemu/).fill("starzenie");
  await expect(results.first()).toContainText("Starzenie się mieszkańców");
  for (const text of await results.allInnerTexts()) expect(text).toContain("Starzenie");
});

test("Innowacje: wyniki z biblioteki, linki do kart innowacji", async ({ page }) => {
  const dialog = await openQuickSearch(page);
  await dialog.getByRole("button", { name: "Innowacje", exact: true }).click();
  await page.getByLabel(/Szukaj innowacji/).fill("senior");
  const results = dialog.getByRole("list", { name: "Wyniki: Innowacje" }).getByRole("link");
  await expect(results.first()).toBeVisible();
  for (const href of await results.evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
    expect(href).toMatch(/^\/innowacje\/\d+$/);
});

test("Artykuły: wyniki z materiałów edukacyjnych", async ({ page, request }) => {
  const body = (await (await request.get(`${API}/api/resources?type=education&limit=5`)).json()) as {
    items: Array<{ title: string }>;
  };
  const dialog = await openQuickSearch(page);
  await dialog.getByRole("button", { name: "Artykuły", exact: true }).click();
  const results = dialog.getByRole("list", { name: "Wyniki: Artykuły" }).getByRole("link");
  await expect(results).toHaveCount(body.items.length);
  await expect(results.first()).toHaveAttribute("href", /^\/edukacja\?q=/);
});

test("Wszystko: po wpisaniu tekstu wyniki z kilku kategorii", async ({ page }) => {
  const dialog = await openQuickSearch(page);
  await expect(dialog.getByRole("button", { name: "Wszystko", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByText("Wpisz co najmniej 2 znaki")).toBeVisible();
  // „zdrow” pasuje i do wyzwań (opieka zdrowotna), i do innowacji.
  await page.getByLabel("Opisz problem własnymi słowami").fill("zdrow");
  const results = dialog.getByRole("list", { name: "Wyniki: Wszystko" }).getByRole("link");
  await expect
    .poll(async () => {
      const hrefs = await results.evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
      return [...new Set(hrefs.map((href) => href.split(/[/?]/)[1]))].sort();
    })
    .toEqual(["innowacje", "wyzwania"]);
});

test("„Szukaj” prowadzi na stronę wybranej kategorii, z filtrem", async ({ page }) => {
  let dialog = await openQuickSearch(page);
  await dialog.getByRole("button", { name: "Problemy", exact: true }).click();
  await page.getByLabel(/Szukaj problemu/).fill("starzenie");
  await page.getByLabel(/Szukaj problemu/).press("Enter");
  await expect(page).toHaveURL(/\/wyzwania\?q=starzenie$/);
  await expect(page.getByRole("main").getByLabel("Szukaj problemu")).toHaveValue("starzenie");
  await expect(page.getByRole("main").locator("h3")).toHaveText(["Starzenie się mieszkańców"]);

  dialog = await openQuickSearch(page);
  await dialog.getByRole("button", { name: "Innowacje", exact: true }).click();
  await page.getByLabel(/Szukaj innowacji/).fill("senior");
  await dialog.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(page).toHaveURL(/\/biblioteka\?q=senior$/);

  dialog = await openQuickSearch(page);
  await dialog.getByRole("button", { name: "Artykuły", exact: true }).click();
  await page.getByLabel(/Szukaj artykułu/).fill("spółdzielnia");
  await dialog.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(page).toHaveURL(/\/edukacja\?q=sp%C3%B3%C5%82dzielnia$/);
  await expect(page.getByRole("main").getByRole("article")).toHaveCount(1);
});
