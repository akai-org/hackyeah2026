import { expect, test, type Page } from "@playwright/test";

import { openQuickSearch } from "./helpers";

// Wspólny <Dialog> (components/ui/dialog.tsx) na przykładzie szybkiego wyszukiwania (Ctrl+K)
// i okna logowania.

async function openSearchWithKeyboard(page: Page) {
  await page.goto("/");
  const dialog = await openQuickSearch(page);
  return dialog;
}

test("Ctrl+K otwiera okno, focus trafia do pola wyszukiwania", async ({ page }) => {
  await openSearchWithKeyboard(page);
  await expect(page.locator("#quick-search")).toBeFocused();
});

test("Esc zamyka okno", async ({ page }) => {
  const dialog = await openSearchWithKeyboard(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("klik w tło zamyka okno, klik w treść nie", async ({ page }) => {
  const dialog = await openSearchWithKeyboard(page);
  await dialog.getByRole("heading", { name: "Czego szukasz?" }).click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
});

test("Tab krąży w oknie i dochodzi do przycisku zamknięcia", async ({ page }) => {
  const dialog = await openSearchWithKeyboard(page);
  const close = dialog.getByRole("button", { name: /^Zamknij/ });
  let reachedClose = false;
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    // Focus nigdy nie wychodzi poza okno.
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    if (await close.evaluate((el) => el === document.activeElement)) reachedClose = true;
  }
  expect(reachedClose).toBe(true);

  // Shift+Tab z pierwszego elementu przeskakuje na ostatni (dalej w oknie).
  await close.focus();
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
});

test("focus wraca na element, który otworzył okno", async ({ page, isMobile }) => {
  test.skip(isMobile, "przycisk „Zaloguj się” na telefonie jest w menu");
  await page.goto("/");
  const opener = page.getByRole("banner").getByRole("button", { name: "Zaloguj się" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Zaloguj się" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Zamknij okno logowania" }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
