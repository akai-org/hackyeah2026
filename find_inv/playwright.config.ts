import { defineConfig, devices } from "@playwright/test";

// Testy e2e (UX / dostępność). Wymagają backendu na :8000 (cd find_inv_server && fastapi dev app/main.py);
// frontend startuje sam (`next dev`), albo używa już działającego na :3000.
// Pierwsze uruchomienie: npx playwright install chromium

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
