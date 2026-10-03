import { expect, type Page } from "@playwright/test";

/** Ctrl+K działa dopiero po hydracji — ponawiamy skrót, aż okno wyszukiwania się otworzy. */
export async function openQuickSearch(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Czego szukasz?" });
  await expect(async () => {
    await page.locator("body").press("Control+k");
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  return dialog;
}
