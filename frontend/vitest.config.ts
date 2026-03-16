import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // ── Test discovery ──────────────────────────────────────────────────────
    // Only picks up files inside src/tests/ — keeps test files isolated from
    // the rest of the src tree and avoids accidentally running non-test files.
    include: ["src/tests/**/*.test.ts"],

    // ── Environment ─────────────────────────────────────────────────────────
    // Node environment is correct for pure logic tests (no DOM, no browser APIs).
    // If you ever add React component tests, switch this to 'jsdom'.
    environment: "node",

    // ── Reporters ───────────────────────────────────────────────────────────
    // verbose  → full pass/fail tree printed to terminal on every run
    // json     → machine-readable results file (good for CI and diffs)
    // html     → self-contained HTML report you can open in a browser
    reporters: ["verbose", "json", "html"],

    outputFile: {
      // Timestamped filenames so every run produces a new log instead of
      // overwriting the last one. Results accumulate in src/tests/results/.
      json: `src/tests/results/run-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`,
      html: `src/tests/results/latest.html`,
      // HTML always writes to latest.html for quick viewing — open it in
      // a browser after any run without hunting for the right timestamp.
    },
  },

  // ── Path aliases ───────────────────────────────────────────────────────────
  // Mirror the @/ alias from vite.config.ts so any shared utility imports
  // resolve correctly if you ever import non-worker helpers in test files.
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
