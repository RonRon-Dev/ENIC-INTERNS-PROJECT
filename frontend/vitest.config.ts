import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

// ESM-safe __dirname (project uses "type": "module" in package.json)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // Only picks up Vitest unit tests — explicitly excludes the e2e folder
    // so Playwright and Vitest never conflict with each other.
    root: ".",
    include: ["src/tests/unit/**/*.test.ts"],
    exclude: ["src/tests/e2e/**", "node_modules/**"],

    environment: "node",

    reporters: ["verbose", "json", "html"],

    outputFile: {
      json: `src/tests/results/run-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`,
      html: `src/tests/results/latest.html`,
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
