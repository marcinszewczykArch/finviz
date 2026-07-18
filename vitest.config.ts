import { defineConfig } from "vitest/config";

export default defineConfig({
  base: '/finviz/',
  test: {
    include: ["src/**/*.test.ts"],
  },
});
