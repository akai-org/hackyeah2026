import { expect, test } from "@playwright/test";

// /wyzwania na danych z GET /api/challenges (a nie 4 hardkodowanych kartach).

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Challenge = { area: string; powiat: string; source: string };

test("karty obszarów odpowiadają danym z API, ze źródłem i linkiem", async ({ page, request }) => {
  const { data } = (await (await request.get(`${API}/api/challenges`)).json()) as { data: Challenge[] };
  const areas = new Set(data.map((item) => item.area));

  await page.goto("/wyzwania");
  const cards = page.locator("main ul > li").filter({ has: page.locator("h3") });
  await expect(cards).toHaveCount(areas.size);

  const firstSource = cards.first().getByRole("link", { name: /GUS/ });
  await expect(firstSource).toHaveAttribute("href", "https://bdl.stat.gov.pl");
  await expect(firstSource).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: /Raporty i diagnozy ROPS/ })).toBeVisible();

  // Stara, zmyślona treść zniknęła.
  await expect(page.getByText("Wykluczenie cyfrowe", { exact: true })).toHaveCount(0);
});

test("filtr powiatu zawęża wskaźniki", async ({ page, request }) => {
  const { data } = (await (await request.get(`${API}/api/challenges`)).json()) as { data: Challenge[] };
  const powiat = data[0].powiat;
  const expected = data.filter((item) => item.powiat === powiat).length;

  await page.goto("/wyzwania");
  await page.getByLabel("Pokaż dla powiatu").selectOption(powiat);
  await expect(page.getByText(new RegExp(`· ${expected} wskaźnik`))).toBeVisible();
  const rows = page.locator("main tbody tr");
  await expect(rows).toHaveCount(expected);
});

test("błąd API: komunikat zamiast przykładowych danych", async ({ page }) => {
  await page.route("**/api/challenges", (route) => route.fulfill({ status: 500, body: "" }));
  await page.goto("/wyzwania");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Nie udało się wczytać wyzwań");
  await expect(page.locator("main h3")).toHaveCount(0);
});
