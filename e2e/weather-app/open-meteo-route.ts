import type { Page } from "@playwright/test";

// 외부 API(Open-Meteo)는 통제할 수 없어 경로 가로채기로 fixture를 돌려준다.
// fixture는 jsdom 테스트와 같은 파일을 쓴다(.sdd/weather-app/api-spec.md).
const fixtureDir = "src/shared/test/fixtures/weather-app";

const corsHeaders = { "access-control-allow-origin": "*" };

// api-spec.md에 기록된 Forecast의 실제 HTTP 400 응답 본문.
const forecast400Body = {
  reason: "Latitude must be in range of -90 to 90°. Given: 999.0.",
  error: true,
};

type OpenMeteoFixtures = {
  geocoding: string;
  forecast: string;
};

// Geocoding·Forecast 요청마다 지정한 fixture 파일(fixtureDir 기준 이름)을 돌려준다.
export async function routeOpenMeteo(
  page: Page,
  { geocoding, forecast }: OpenMeteoFixtures,
) {
  await page.route("https://geocoding-api.open-meteo.com/**", (route) =>
    route.fulfill({
      path: `${fixtureDir}/${geocoding}`,
      headers: corsHeaders,
    }),
  );
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({
      path: `${fixtureDir}/${forecast}`,
      headers: corsHeaders,
    }),
  );
}

export async function routeOpenMeteoToBerlin(page: Page) {
  await routeOpenMeteo(page, {
    geocoding: "geocoding-berlin.json",
    forecast: "forecast-berlin-1d.json",
  });
}

// Forecast 요청이 모두 HTTP 400으로 실패한다.
export async function routeForecastToHttp400(page: Page) {
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({
      status: 400,
      json: forecast400Body,
      headers: corsHeaders,
    }),
  );
}
