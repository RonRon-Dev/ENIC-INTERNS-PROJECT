# ENIC MIS — Test Suite

## Structure

```
src/tests/
├── TESTS.md                          ← you are here
├── unit/                             ← Vitest — pure logic, no browser needed
│   └── exportFlow.test.ts
└── e2e/                              ← Playwright — real browser, full user flows
    ├── dataCleaning.spec.ts
    └── fixtures/
        ├── [T1] 022520260857 - OLD.csv
        └── [T5] ttdh.xlsx
```

---

## Tools

| Tool       | Purpose                          | Speed      | Needs browser? | Needs server? |
|------------|----------------------------------|------------|----------------|---------------|
| Vitest     | Unit test pure logic functions   | ~20ms      | No             | No            |
| Playwright | E2E test real user flows         | ~30–60s    | Yes            | Yes           |

---

## Unit Tests — Vitest

Tests isolated pure functions extracted from source files.
No browser, no server, no mocks — just plain TypeScript logic.

### Run

```bash
# Run all unit tests once
npm test

# Watch mode — re-runs on file save (useful during development)
npm run test:watch

# Open visual UI dashboard in browser
npm run test:ui
```

### Output

After each run, results are saved to `src/tests/unit/results/`:
- `latest.html` — open in any browser for a visual summary
- `run-<timestamp>.json` — permanent log per run (accumulates)

> These folders are gitignored — results stay local only.

### Writing new unit tests

1. Create `src/tests/unit/<feature>.test.ts`
2. Inline the pure functions you want to test (copy from the source file)
3. Write `describe` / `it` blocks using Vitest's `expect`
4. Run `npm test` — the config picks it up automatically

**Why inline instead of import?**
Source files like the spreadsheet worker use browser APIs (`Worker`, `self`,
`postMessage`) that don't exist in Node.js. Inlining the pure functions
lets us test the logic without spinning up a browser.

### Current test files

| File                     | What it tests                                      |
|--------------------------|----------------------------------------------------|
| `exportFlow.test.ts`     | `looksLikeValidXml`, `resolveName`, column lookup, XML gate, export mode logic |

---

## E2E Tests — Playwright

Tests real user flows in an actual browser (Chromium and Firefox).
Simulates exactly what a user does — clicks, uploads, navigation.

### Prerequisites

1. The Vite dev server must be running (or point `baseURL` to a remote server)
2. Playwright browsers must be installed: `npx playwright install`
3. A test account must exist in the system (see credentials in `goToDataCleaning` helper)
4. Fixture files must be present in `e2e/fixtures/`

### Run

```bash
# Run all E2E tests headless (no visible browser)
npm run test:e2e

# Open visual UI — step through each action in real time (recommended for learning/debugging)
npm run test:e2e:ui

# Open the HTML report after a run
npx playwright show-report src/tests/e2e/results
```

### Running against a remote server (e.g. laptop → Windows PC)

If your dev server runs on a different machine:
1. Update `baseURL` in `playwright.config.ts` to the server machine's local IP:
   ```ts
   baseURL: "http://192.168.1.x:5173",
   ```
2. Remove the `webServer` block from `playwright.config.ts` (server is already running)
3. Make sure port `5173` is open on the server machine's firewall

### Output

After each run, artifacts are saved to `src/tests/e2e/`:
- `results/index.html` — visual HTML report (overwritten each run)
- `test-results/` — screenshots, videos, and traces for failed tests only

> These folders are gitignored — results stay local only.

### Writing new E2E tests

1. Create `src/tests/e2e/<feature>.spec.ts`
2. Use Playwright's `page` object to simulate user actions
3. Use `expect` from `@playwright/test` to assert what's visible
4. Run `npm run test:e2e` — Playwright picks up all `*.spec.ts` files automatically

**Key Playwright concepts:**
```ts
await page.goto("/")                          // navigate
await page.getByLabel("Username").fill("x")   // type into a field
await page.getByRole("button", { name: /login/i }).click()  // click
await expect(page.getByText("Hello")).toBeVisible()         // assert
await page.waitForURL("**/home")              // wait for navigation
```

### Current test files

| File                      | What it tests                                         |
|---------------------------|-------------------------------------------------------|
| `dataCleaning.spec.ts`    | Page load, file import flow, row selection, export dialog, navigation guard |

---

## Gitignored (generated, never committed)

```
src/tests/unit/results/
src/tests/e2e/results/
src/tests/e2e/test-results/
src/tests/node_modules/
```

---

## Quick Reference

```bash
npm test                          # unit tests (Vitest)
npm run test:watch                # unit tests in watch mode
npm run test:e2e                  # E2E tests (Playwright, headless)
npm run test:e2e:ui               # E2E tests (Playwright, visual mode)
npx playwright show-report src/tests/e2e/results   # open last E2E report
```