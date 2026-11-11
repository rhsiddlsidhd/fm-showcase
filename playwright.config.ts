import { defineConfig, devices } from "@playwright/test";

// E2E는 빌드된 앱을 검증한다 (docs/testing/test-boundaries.md#e2e-경계).
// production은 운영 등록 목록 그대로, fixture는 mode e2e 빌드의 가상 데이터로 본다.
export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-production",
      testMatch: "**/showcase.production.spec.ts",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:4173" },
    },
    {
      name: "chromium-fixture",
      testMatch: "**/showcase.fixture.spec.ts",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:4174" },
    },
    {
      // 챌린지 페이지는 운영 빌드에 그대로 있다. 외부 API는 스펙에서 경로 가로채기로 대역 처리한다.
      name: "chromium-weather-app",
      testMatch: /weather-app.*\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:4173" },
    },
  ],
  webServer: [
    {
      command: "npm run build && npm run preview -- --port 4173 --strictPort",
      url: "http://localhost:4173",
      reuseExistingServer: false,
    },
    {
      command:
        "npx vite build --mode e2e --outDir dist-e2e && npx vite preview --mode e2e --outDir dist-e2e --port 4174 --strictPort",
      url: "http://localhost:4174",
      reuseExistingServer: false,
    },
  ],
});
