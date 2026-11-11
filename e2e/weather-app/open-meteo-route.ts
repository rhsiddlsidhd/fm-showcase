import type { Page } from "@playwright/test";

// 외부 API(Open-Meteo)는 통제할 수 없어 경로 가로채기로 Berlin fixture를 돌려준다.
// fixture는 jsdom 테스트와 같은 파일을 쓴다(.sdd/weather-app/api-spec.md).
const fixtureDir = "src/shared/test/fixtures/weather-app";

export async function routeOpenMeteoToBerlin(page: Page) {
  await page.route("https://geocoding-api.open-meteo.com/**", (route) =>
    route.fulfill({
      path: `${fixtureDir}/geocoding-berlin.json`,
      headers: { "access-control-allow-origin": "*" },
    }),
  );
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({
      path: `${fixtureDir}/forecast-berlin-1d.json`,
      headers: { "access-control-allow-origin": "*" },
    }),
  );
}
