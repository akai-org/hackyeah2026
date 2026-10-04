import { expect, test } from "@playwright/test";

// Usunięte strony: zgłoszenie testera jest teraz w modalu na karcie innowacji.

for (const path of ["/test-krojow", "/konto"]) {
  test(`${path} zwraca 404`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  });
}

test("/testerzy przekierowuje do panelu testera (next.config.ts)", async ({ page }) => {
  await page.goto("/testerzy");
  await expect(page).toHaveURL(/\/testerzy\/panel$/);
});

test("panel testera dalej działa", async ({ page }) => {
  const response = await page.goto("/testerzy/panel");
  expect(response?.status()).toBe(200);
});

test("żaden link na stronie głównej nie prowadzi do usuniętych stron", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page.locator("a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(hrefs.filter((href) => href && /^\/(test-krojow|konto|testerzy)$/.test(href))).toEqual([]);
});
