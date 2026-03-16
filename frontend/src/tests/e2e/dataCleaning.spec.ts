// ─── Data Cleaning Tool — E2E Tests ──────────────────────────────────────────
// These tests run in a real browser against your live Vite dev server.
// They simulate exactly what a user does — no mocks, no shortcuts.
//
// Prerequisites:
//   1. npm i -D @playwright/test
//   2. npx playwright install
//   3. Place a small test .xlsx file at src/tests/e2e/fixtures/sample.xlsx
//      (any spreadsheet with a few rows and an xml_data column will do)
//
// Run:  npx playwright test
// UI:   npx playwright test --ui

import { expect, test, type Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to a small fixture file used for upload tests
const FIXTURE_XLSX = path.join(__dirname, "fixtures", "[T5] ttdh.xlsx");

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Log in and navigate to the Data Cleaning page */
async function goToDataCleaning(page: Page) {
  await page.goto("/");
  // Use placeholder to target specifically the login form's username input
  // (the signup form is also on the page with a different "System Username" label)
  await page.getByPlaceholder("eg. j.luna").fill("enic.mis@superadmin");
  await page.getByPlaceholder("e.g., S3cur3P@ssw0rd").fill("Superadmin@123");
  await page.getByRole("button", { name: /^login$/i }).click();
  await page.waitForURL("**/home");
  await page.getByRole("link", { name: /data cleaning/i }).click();
  await page.waitForURL("**/operations/automation");
}

/** Upload the fixture file and wait for the header picker dialog */
async function uploadFile(page: Page) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(FIXTURE_XLSX);
  // Wait for the HeaderPickerDialog to appear
  await expect(
    page.getByRole("dialog", { name: /select header row/i })
  ).toBeVisible({ timeout: 10_000 });
}

/** Confirm the header row and wait for the ColumnDialog */
async function confirmHeaderRow(page: Page) {
  await page.getByRole("button", { name: /use row/i }).click();
  // ColumnDialog should open automatically after header confirmation
  await expect(
    page.getByRole("dialog", { name: /configure columns/i })
  ).toBeVisible({ timeout: 8_000 });
}

/** Close the ColumnDialog and wait for the data table */
async function applyColumns(page: Page) {
  await page.getByRole("button", { name: /apply/i }).click();
  // Table should now be visible
  await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("Data Cleaning — page load", () => {
  test("shows the upload zone when no file is loaded", async ({ page }) => {
    await goToDataCleaning(page);
    await expect(page.getByText(/drop your spreadsheet here/i)).toBeVisible();
  });

  test("Export button is not visible before a file is loaded", async ({
    page,
  }) => {
    await goToDataCleaning(page);
    await expect(
      page.getByRole("button", { name: /export/i })
    ).not.toBeVisible();
  });
});

test.describe("Data Cleaning — file import flow", () => {
  test("shows HeaderPickerDialog after uploading a file", async ({ page }) => {
    await goToDataCleaning(page);
    await uploadFile(page);
    await expect(
      page.getByText(/click the row that contains your column headers/i)
    ).toBeVisible();
  });

  test("shows ColumnDialog after confirming header row", async ({ page }) => {
    await goToDataCleaning(page);
    await uploadFile(page);
    await confirmHeaderRow(page);
    await expect(page.getByText(/toggle visibility/i)).toBeVisible();
  });

  test("renders the data table after applying columns", async ({ page }) => {
    await goToDataCleaning(page);
    await uploadFile(page);
    await confirmHeaderRow(page);
    await applyColumns(page);
    await expect(page.locator("table")).toBeVisible();
  });

  test("shows row count in file info badge after import", async ({ page }) => {
    await goToDataCleaning(page);
    await uploadFile(page);
    await confirmHeaderRow(page);
    await applyColumns(page);
    // The file info badge shows "N rows"
    await expect(page.getByText(/rows/i).first()).toBeVisible();
  });
});

test.describe("Data Cleaning — row selection", () => {
  test.beforeEach(async ({ page }) => {
    await goToDataCleaning(page);
    await uploadFile(page);
    await confirmHeaderRow(page);
    await applyColumns(page);
  });

  test("selecting a single row enables the Export button", async ({ page }) => {
    // Click the first data row checkbox
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("button", { name: /export/i })).toBeEnabled();
  });

  test("select all checkbox selects all visible rows", async ({ page }) => {
    // Click the header checkbox (select all)
    await page.locator("table thead th").first().click();
    // Export button should now show the row count
    await expect(
      page.getByRole("button", { name: /export \d+/i })
    ).toBeVisible();
  });

  test("deselecting all hides the row count from Export button", async ({
    page,
  }) => {
    // Select all
    await page.locator("table thead th").first().click();
    // Deselect all
    await page.locator("table thead th").first().click();
    // Export button should be disabled again
    await expect(
      page.getByRole("button", { name: /^export$/i })
    ).toBeDisabled();
  });

  test("Clear button appears when rows are selected", async ({ page }) => {
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("button", { name: /clear/i })).toBeVisible();
  });
});

test.describe("Data Cleaning — Export dialog", () => {
  test.beforeEach(async ({ page }) => {
    await goToDataCleaning(page);
    await uploadFile(page);
    await confirmHeaderRow(page);
    await applyColumns(page);
    // Select all rows
    await page.locator("table thead th").first().click();
    // Open Export dialog
    await page.getByRole("button", { name: /export/i }).click();
    await expect(
      page.getByRole("dialog", { name: /export configuration/i })
    ).toBeVisible();
  });

  test("Export dialog opens with xlsx selected by default", async ({
    page,
  }) => {
    // The xlsx format card should have the active (primary) style
    await expect(page.getByText("Excel").locator("..")).toHaveClass(
      /border-primary/
    );
  });

  test("clicking XML with multiple visible columns shows a toast warning", async ({
    page,
  }) => {
    // With default columns (multiple visible), XML should show a warning
    await page.getByText("XML").click();
    await expect(page.getByText(/xml export unavailable/i)).toBeVisible({
      timeout: 3_000,
    });
  });

  test("single file mode is selected by default", async ({ page }) => {
    await expect(page.getByText("Single file").locator("..")).toHaveClass(
      /border-primary/
    );
  });

  test("switching to per-row mode shows the filename column picker", async ({
    page,
  }) => {
    await page.getByText("One file per row").click();
    await expect(page.getByText(/filename column/i)).toBeVisible();
  });

  test("Export button is disabled with no filename column selected in per-row mode", async ({
    page,
  }) => {
    await page.getByText("One file per row").click();
    // Clear the filename column selection
    // (depends on your Select component's clear behaviour)
    await expect(
      page.getByRole("button", { name: /export \d+ rows/i })
    ).toBeDisabled();
  });

  test("Cancel button closes the dialog", async ({ page }) => {
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(
      page.getByRole("dialog", { name: /export configuration/i })
    ).not.toBeVisible();
  });
});

test.describe("Data Cleaning — navigation guard", () => {
  test("shows leave confirmation when navigating away with unsaved data", async ({
    page,
  }) => {
    await goToDataCleaning(page);
    await uploadFile(page);
    await confirmHeaderRow(page);
    await applyColumns(page);
    // Try to navigate away via the sidebar
    await page.getByRole("link", { name: /home/i }).first().click();
    // The unsaved changes dialog should appear
    await expect(page.getByRole("dialog", { name: /leave page/i })).toBeVisible(
      { timeout: 5_000 }
    );
  });

  test("confirming leave navigates away and clears data", async ({ page }) => {
    await goToDataCleaning(page);
    await uploadFile(page);
    await confirmHeaderRow(page);
    await applyColumns(page);
    await page.getByRole("link", { name: /home/i }).first().click();
    await page.getByRole("button", { name: /leave/i }).click();
    // Should now be on the home page
    await page.waitForURL("**/home");
  });

  test("cancelling leave stays on the data cleaning page", async ({ page }) => {
    await goToDataCleaning(page);
    await uploadFile(page);
    await confirmHeaderRow(page);
    await applyColumns(page);
    await page.getByRole("link", { name: /home/i }).first().click();
    await page.getByRole("button", { name: /cancel/i }).click();
    // Should still be on the data cleaning page
    expect(page.url()).toContain("/operations/automation");
  });
});
