import { expect, test } from "@playwright/test";

// Strona główna bez hardkodów: artykuł dnia z API, a bez danych sekcja (i link do niej) znika.

test("artykuł dnia pokazuje innowację z API", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#artykul-dnia");
  await expect(section.getByRole("link", { name: /Czytaj całą kartę/ })).toBeVisible();
  await expect(section.getByRole("heading", { level: 2 })).not.toHaveText(/Wczytuję/);
});

test("bez danych z API sekcja artykułu dnia i link do niej znikają", async ({ page }) => {
  await page.route("**/api/innovations**", (route) => route.fulfill({ status: 500, body: "" }));
  await page.goto("/");
  await expect(page.locator("#artykul-dnia")).toHaveCount(0);
  const nav = page.getByRole("navigation", { name: "Szybki dostęp" });
  await expect(nav.getByRole("link", { name: "Artykuł dnia" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Jak to działa" })).toBeVisible();
});

test("brak zmyślonej oceny kondycji regionu", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Wymaga uwagi|Dobra kondycja|Trudna sytuacja/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Zobacz badania i wyzwania" })).toBeVisible();
});
