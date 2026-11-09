import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    // E2E는 Playwright가 실행한다.
    exclude: [...configDefaults.exclude, "e2e/**"],
    globals: true,
    setupFiles: ["./src/shared/test/setup.ts"],
  },
});
