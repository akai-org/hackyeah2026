import { expect, test } from "@playwright/test";

// Nawigacja główna: linki do najważniejszych działów, na desktopie i w menu mobilnym.

const LINKS = ["Biblioteka", "Kreator pomysłów", "Forum", "Edukacja"];

test("nawigacja zawiera najważniejsze działy", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  const nav = page.getByRole("navigation", { name: isMobile ? "Główna, wersja mobilna" : "Główna", exact: true });
  for (const name of LINKS) await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
});

test("link Forum prowadzi na /forum", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  const nav = page.getByRole("navigation", { name: isMobile ? "Główna, wersja mobilna" : "Główna", exact: true });
  await nav.getByRole("link", { name: "Forum", exact: true }).click();
  await expect(page).toHaveURL(/\/forum$/);
});
