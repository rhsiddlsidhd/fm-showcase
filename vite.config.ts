import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    // 테스트 파일이 아직 없어 CI가 실패하지 않게 한다. src에 첫 테스트가 생기면 지운다.
    passWithNoTests: true,
    globals: true,
    setupFiles: ["./src/shared/test/setup.ts"],
  },
});
