import { defineConfig } from "vite";

export default defineConfig({
  base: "/finviz/",
  test: {
    include: ["src/**/*.test.ts"],
  },
});
