import { expect, test, type Page } from "@playwright/test";
import {
  routeForecastToHttp400,
  routeOpenMeteo,
  routeOpenMeteoToBerlin,
} from "./open-meteo-route.ts";

// 주요 사용자 흐름을 빌드된 앱에서 끝까지 본다. 외부 API는 경로 가로채기로 fixture를 돌려준다.
// 기대값은 fixture의 입력값과 단위 정의(°F = °C × 9/5 + 32, 1 mph = 1.609344 km/h)에서 구한다.
// 세 흐름 모두 처음부터 통과하는 회귀 테스트다(docs/testing/test-policy.md#회귀-테스트).
//
// forecast-singapore-1d.json: 기온 31.4°C, 체감 36.0°C, 습도 78%, 바람 12.0 km/h, 강수 0.0 mm,
//   일 최고 32.1°C, 최저 26.0°C.
// forecast-berlin-1d.json: 체감 -1.0°C, 습도 87%.

const searchInput = (page: Page) => page.getByRole("combobox");

// 지표 한 칸: 이름과 값을 담은 목록 항목.
const metric = (page: Page, name: string) =>
  page
    .getByRole("listitem")
    .filter({ has: page.getByText(name, { exact: true }) });

test("Singapore를 검색해 후보를 고르면 지역명과 날씨 값이 Berlin에서 Singapore 것으로 바뀐다", async ({
  page,
}) => {
  await routeOpenMeteoToBerlin(page);
  await page.goto("/weather-app");
  await expect(page.getByText("Berlin, Germany").first()).toBeVisible();
  await expect(metric(page, "Humidity")).toContainText("87%");
  // 나중에 등록한 경로가 먼저 적용되므로, 검색과 이후 예보 요청은 Singapore 응답을 받는다.
  await routeOpenMeteo(page, {
    geocoding: "geocoding-singapore.json",
    forecast: "forecast-singapore-1d.json",
  });

  await searchInput(page).fill("Singapore");
  await searchInput(page).press("Enter");
  await page.getByRole("option", { name: "Singapore, Singapore" }).click();

  await expect(page.getByText("Singapore, Singapore").first()).toBeVisible();
  await expect(page.getByText("Berlin, Germany")).toHaveCount(0);
  await expect(page.getByText("31°", { exact: true })).toBeVisible();
  await expect(metric(page, "Feels Like")).toContainText("36°");
  await expect(metric(page, "Humidity")).toContainText("78%");
  await expect(metric(page, "Wind")).toContainText("12 km/h");
});

test("날씨 요청이 실패해 오류 화면이 뜬 뒤 Retry를 누르면 날씨가 다시 나온다", async ({
  page,
}) => {
  await routeForecastToHttp400(page);
  await page.goto("/weather-app");
  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toBeVisible();
  await expect(page.getByText("Berlin, Germany")).toHaveCount(0);
  // 나중에 등록한 경로가 먼저 적용되므로, 재시도 요청은 정상 응답을 받는다.
  await routeOpenMeteoToBerlin(page);

  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page.getByText("Berlin, Germany").first()).toBeVisible();
  await expect(metric(page, "Feels Like")).toContainText("-1°");
  await expect(metric(page, "Humidity")).toContainText("87%");
  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toHaveCount(0);
});

test("Units에서 Switch to Imperial을 고르면 기온·체감 기온·풍속·강수량 숫자와 단위 문구가 Imperial로 바뀐다", async ({
  page,
}) => {
  // 지역명은 Berlin이지만 이 테스트가 보는 것은 단위 환산이라 값이 뚜렷한 Singapore 예보를 쓴다.
  await routeOpenMeteo(page, {
    geocoding: "geocoding-berlin.json",
    forecast: "forecast-singapore-1d.json",
  });
  await page.goto("/weather-app");
  await expect(page.getByText("31°", { exact: true })).toBeVisible();
  await expect(metric(page, "Wind")).toContainText("12 km/h");
  await expect(metric(page, "Precipitation")).toContainText("0 mm");

  await page.getByRole("button", { name: "Units" }).click();
  await page.getByRole("menuitem", { name: "Switch to Imperial" }).click();

  // 31.4°C → 88.52°F, 36.0°C → 96.8°F, 12.0 km/h → 7.46 mph, 0.0 mm → 0.0 in.
  await expect(page.getByText("89°", { exact: true })).toBeVisible();
  await expect(metric(page, "Feels Like")).toContainText("97°");
  await expect(metric(page, "Wind")).toContainText("7 mph");
  await expect(metric(page, "Precipitation")).toContainText("0 in");
  await expect(metric(page, "Humidity")).toContainText("78%");
  await page.getByRole("button", { name: "Units" }).click();
  await expect(
    page.getByRole("menuitem", { name: "Switch to Metric" }),
  ).toBeVisible();
});
