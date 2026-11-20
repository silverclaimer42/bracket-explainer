import { defineConfig } from "vitest/config";

// Local config so Vitest does not pick up the root app's vite.config.ts.
export default defineConfig({
  root: import.meta.dirname,
  test: { include: ["test/**/*.test.ts"] },
});
