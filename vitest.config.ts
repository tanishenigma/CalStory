// filepath: vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Pure-math helpers and their tests live wherever the source
    // lives — the `lib/` modules in `app/lib/`, plus tool-specific
    // modules in `app/tools/**`. Both globs are picked up here so
    // the Calorie Calculator's `bmr.test.ts` runs alongside the
    // existing `app/lib/bulkMacros.test.ts` style tests.
    include: ["app/lib/**/*.test.ts", "app/tools/**/*.test.ts"],
  },
});
