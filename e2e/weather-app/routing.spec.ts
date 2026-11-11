import { expect, test } from "@playwright/test";
import { routeOpenMeteoToBerlin } from "./open-meteo-route.ts";

const headline = "How's the sky looking today?";

test.beforeEach(async ({ page }) => {
  await routeOpenMeteoToBerlin(page);
});

test("날씨 앱 주소로 바로 들어가면 날씨 앱 페이지의 헤드라인이 보인다", async ({
  page,
}) => {
  await page.goto("/weather-app");

  await expect(page.getByRole("heading", { name: headline })).toBeVisible();
});

test.describe("쇼케이스 카드 탐색", () => {
  // 쇼케이스 카드의 부유 애니메이션은 검증 대상이 아니다. 클릭은 움직임이 없는 상태로 한다.
  test.use({ reducedMotion: "reduce" });

  test("쇼케이스에서 날씨 앱 카드를 누르면 날씨 앱 페이지로 이동한다", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /Weather app/ }).click();

    await expect(page).toHaveURL(/\/weather-app$/);
    await expect(page.getByRole("heading", { name: headline })).toBeVisible();
  });
});
