import { expect, test } from "@playwright/test";

// /edukacja na danych z GET /api/resources?type=education.

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Resource = { title: string; areas: Array<{ slug: string; name: string }> };

async function education(request: import("@playwright/test").APIRequestContext) {
  const body = (await (await request.get(`${API}/api/resources?type=education&limit=100`)).json()) as {
    items: Resource[];
  };
  return body.items;
}

test("pokazuje materiały z API", async ({ page, request }) => {
  const items = await education(request);
  await page.goto("/edukacja");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Edukacja");
  const cards = page.getByRole("main").getByRole("article");
  await expect(cards).toHaveCount(items.length);
  for (const item of items) await expect(page.getByRole("heading", { name: item.title, level: 3 })).toBeVisible();
});

test("filtr tematu zawęża listę", async ({ page, request }) => {
  const items = await education(request);
  const area = items.flatMap((item) => item.areas)[0];
  test.skip(!area, "materiały bez tematów");
  const expected = items.filter((item) => item.areas.some((entry) => entry.slug === area.slug)).length;
  await page.goto("/edukacja");
  await page.getByRole("button", { name: area.name, exact: true }).click();
  await expect(page.getByRole("main").getByRole("article")).toHaveCount(expected);
});

test("błąd API: komunikat", async ({ page }) => {
  await page.route("**/api/resources**", (route) => route.fulfill({ status: 500, body: "" }));
  await page.goto("/edukacja");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Nie udało się wczytać materiałów");
});

test("link w stopce prowadzi na /edukacja", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Edukacja" }).click();
  await expect(page).toHaveURL(/\/edukacja$/);
});
