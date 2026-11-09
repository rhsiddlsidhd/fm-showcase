import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { configDefaults, defineConfig } from "vitest/config";

const registryPath = fileURLToPath(
  new URL("./src/pages/showcase/model/challenges.ts", import.meta.url),
);
const fixtureRegistryPath = fileURLToPath(
  new URL("./e2e/fixtures/showcase-registry.ts", import.meta.url),
);

// E2E 전용 빌드(mode e2e)에서만 운영 등록 목록을 가상 데이터로 바꾼다.
// 페이지는 같은 슬라이스 안이라 상대 경로로 가져오므로(fsd/import-locality),
// import 문자열이 아니라 해석된 파일 경로로 맞춘다.
const swapShowcaseRegistry = (): Plugin => ({
  name: "e2e-showcase-registry",
  enforce: "pre",
  async resolveId(source, importer, options) {
    const resolved = await this.resolve(source, importer, {
      ...options,
      skipSelf: true,
    });
    return resolved?.id === registryPath ? fixtureRegistryPath : null;
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [
    ...(mode === "e2e" ? [swapShowcaseRegistry()] : []),
    react(),
    tailwindcss(),
  ],
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
}));
