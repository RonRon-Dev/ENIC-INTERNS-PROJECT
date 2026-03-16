/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  // ── Test discovery ──────────────────────────────────────────────────────
  testDir: "./src/tests/e2e",
  outputDir: "src/tests/e2e/test-results",

  // ── Run settings ────────────────────────────────────────────────────────
  fullyParallel: true,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,

  // ── Reporter ─────────────────────────────────────────────────────────────
  reporter: [
    ["list"],
    ["html", { outputFolder: "src/tests/e2e/results", open: "never" }],
  ],

  // ── Global test settings ─────────────────────────────────────────────────
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  // ── Browsers ─────────────────────────────────────────────────────────────
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    // {
    //   name: "msedge",
    //   use: { ...devices["Desktop Edge"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],

  // ── Dev server ────────────────────────────────────────────────────────────
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !isCI,
    timeout: 30_000,
  },
});
