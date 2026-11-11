import { expect, test, type Locator, type Page } from "@playwright/test";
import { routeForecastToHttp400, routeOpenMeteo } from "./open-meteo-route.ts";

// 반응형 경계는 lg(1024px) 하나다. 미만은 모바일(S-02), 이상은 데스크톱(S-01) 배치다.
// 배치는 요소의 실제 위치(boundingBox)로 판정한다.

type Box = { x: number; y: number; width: number; height: number };

// forecast-berlin-7d.json의 daily.time(2026-11-11 ~ 2026-11-17)을 요일 약어로 쓴 것.
const dailyAbbreviations = ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"];

const metricLabels = ["Feels Like", "Humidity", "Wind", "Precipitation"];

// 알림 영역(role="status") 안의 글자는 화면 배치 판정에서 뺀다.
const outsideStatus = ':not([role="status"], [role="status"] *)';

async function box(locator: Locator): Promise<Box> {
  const result = await locator.boundingBox();
  expect(result, "요소가 화면에 배치돼 있어야 한다").not.toBeNull();
  return result!;
}

const bottom = (b: Box) => b.y + b.height;
const right = (b: Box) => b.x + b.width;

// 같은 행: 세로 범위가 겹친다.
const sameRow = (a: Box, b: Box) => a.y < bottom(b) && b.y < bottom(a);

function text(page: Page, value: string) {
  return page
    .getByText(value, { exact: true })
    .and(page.locator(outsideStatus));
}

const searchInput = (page: Page) => page.getByRole("combobox");
const searchButton = (page: Page) =>
  page.getByRole("button", { name: "Search" });
const logo = (page: Page) => page.getByRole("img", { name: "Weather Now" });
const unitsButton = (page: Page) => page.getByRole("button", { name: "Units" });

// 요소 상자가 아니라 글자가 실제로 그려진 범위의 가로 중심을 잰다.
// 전체 폭 블록 안의 왼쪽 정렬 글자도 상자 중심은 가운데라서 글자 범위로 본다.
async function textCenterX(locator: Locator) {
  return locator.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const rect = range.getBoundingClientRect();
    return rect.left + rect.width / 2;
  });
}

async function boxCenterX(locator: Locator) {
  const b = await box(locator);
  return b.x + b.width / 2;
}

// 가운데 정렬: 가로 중심이 화면(문서 폭) 중심에서 1px 안에 있다.
async function expectHorizontallyCentered(
  page: Page,
  centerX: number,
  message: string,
) {
  const pageCenter = await page.evaluate(
    () => document.documentElement.clientWidth / 2,
  );
  expect(Math.abs(centerX - pageCenter), message).toBeLessThanOrEqual(1);
}

async function openWithBerlinWeekly(page: Page) {
  await routeOpenMeteo(page, {
    geocoding: "geocoding-berlin.json",
    forecast: "forecast-berlin-7d.json",
  });
  await page.goto("/weather-app");
  await expect(text(page, "Berlin, Germany")).toBeVisible();
}

async function expectMobileSearchRow(page: Page) {
  const input = await box(searchInput(page));
  const button = await box(searchButton(page));
  expect(
    button.y,
    "Search 버튼의 위쪽 끝이 검색 입력의 아래쪽 끝보다 아래에 있다",
  ).toBeGreaterThanOrEqual(bottom(input));
}

async function expectMobileTopBar(page: Page) {
  const logoBox = await box(logo(page));
  const unitsBox = await box(unitsButton(page));
  expect(sameRow(logoBox, unitsBox), "로고와 Units 버튼이 같은 행이다").toBe(
    true,
  );
  expect(
    unitsBox.x,
    "Units 버튼이 로고의 오른쪽에 있다",
  ).toBeGreaterThanOrEqual(right(logoBox));
}

test.describe("화면 폭 1023px", () => {
  test.use({ viewport: { width: 1023, height: 900 } });

  test("Search 버튼이 검색 입력 아래로, 지표가 2행으로, Daily는 첫 3칸만 한 행으로 놓이는 모바일 배치가 보인다", async ({
    page,
  }) => {
    await openWithBerlinWeekly(page);

    await expectMobileSearchRow(page);

    const [feelsLike, humidity, wind, precipitation] = await Promise.all(
      metricLabels.map((label) => box(text(page, label))),
    );
    expect(
      sameRow(feelsLike, humidity),
      "Feels Like와 Humidity가 같은 행이다",
    ).toBe(true);
    expect(
      sameRow(wind, precipitation),
      "Wind와 Precipitation이 같은 행이다",
    ).toBe(true);
    expect(
      wind.y,
      "Wind·Precipitation 행이 Feels Like·Humidity 행 아래에 있다",
    ).toBeGreaterThanOrEqual(bottom(feelsLike));

    const cells = await Promise.all(
      dailyAbbreviations.map((day) => box(text(page, day))),
    );
    expect(sameRow(cells[0], cells[1]), "Daily 1·2번째 칸이 같은 행이다").toBe(
      true,
    );
    expect(sameRow(cells[0], cells[2]), "Daily 1·3번째 칸이 같은 행이다").toBe(
      true,
    );
    expect(
      cells[3].y,
      "Daily 4번째 칸이 첫 행 아래에 있다",
    ).toBeGreaterThanOrEqual(bottom(cells[0]));
  });
});

test.describe("화면 폭 1024px", () => {
  test.use({ viewport: { width: 1024, height: 900 } });

  test("Search 버튼이 검색 입력과 한 행에, 지표와 Daily가 각각 한 행에, Hourly 패널이 현재 날씨 카드 오른쪽에 놓이는 데스크톱 배치가 보인다", async ({
    page,
  }) => {
    await openWithBerlinWeekly(page);

    const input = await box(searchInput(page));
    const button = await box(searchButton(page));
    expect(
      sameRow(input, button),
      "Search 버튼이 검색 입력과 같은 행이다",
    ).toBe(true);

    const [firstMetric, ...otherMetrics] = await Promise.all(
      metricLabels.map((label) => box(text(page, label))),
    );
    otherMetrics.forEach((other, index) => {
      expect(
        sameRow(firstMetric, other),
        `지표 ${metricLabels[index + 1]}이(가) Feels Like와 같은 행이다`,
      ).toBe(true);
    });

    const [firstDay, ...otherDays] = await Promise.all(
      dailyAbbreviations.map((day) => box(text(page, day))),
    );
    otherDays.forEach((other, index) => {
      expect(
        sameRow(firstDay, other),
        `Daily ${dailyAbbreviations[index + 1]} 칸이 첫 칸과 같은 행이다`,
      ).toBe(true);
    });

    const currentPlace = await box(text(page, "Berlin, Germany"));
    const hourlyTitle = await box(text(page, "Hourly forecast"));
    expect(
      hourlyTitle.x,
      "Hourly 패널이 현재 날씨 카드의 오른쪽에 있다",
    ).toBeGreaterThanOrEqual(right(currentPlace));
  });
});

test.describe("화면 폭 320px", () => {
  test.use({ viewport: { width: 320, height: 900 } });

  test("가로 스크롤 없이 Search 버튼이 검색 입력 아래에 놓이는 모바일 배치가 보인다", async ({
    page,
  }) => {
    await openWithBerlinWeekly(page);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      overflow.scrollWidth,
      "문서 폭이 화면 폭을 넘지 않아 가로 스크롤이 없다",
    ).toBeLessThanOrEqual(overflow.clientWidth);

    await expectMobileSearchRow(page);
  });
});

test.describe("화면 폭 375px", () => {
  test.use({ viewport: { width: 375, height: 900 } });

  test("검색 결과가 없으면 상단 바와 검색 행이 모바일 배치이고 결과 없음 메시지가 가운데에 보인다", async ({
    page,
  }) => {
    const noResultMessage = "No search result found!";
    await routeOpenMeteo(page, {
      geocoding: "geocoding-no-results.json",
      forecast: "forecast-berlin-7d.json",
    });
    await page.goto("/weather-app");
    await expect(text(page, "Berlin, Germany")).toBeVisible();
    await searchInput(page).fill("Nowhere");
    await searchInput(page).press("Enter");
    await expect(text(page, noResultMessage)).toBeVisible();

    await expectMobileTopBar(page);
    await expectMobileSearchRow(page);
    await expectHorizontallyCentered(
      page,
      await textCenterX(text(page, noResultMessage)),
      "결과 없음 메시지가 화면 가운데에 있다",
    );
  });

  test("오류가 나면 상단 바가 모바일 배치이고 오류 제목과 Retry 버튼이 가운데에 보인다", async ({
    page,
  }) => {
    await routeForecastToHttp400(page);
    await page.goto("/weather-app");
    await expect(text(page, "Something went wrong")).toBeVisible();

    await expectMobileTopBar(page);
    await expectHorizontallyCentered(
      page,
      await textCenterX(text(page, "Something went wrong")),
      "오류 제목이 화면 가운데에 있다",
    );
    await expectHorizontallyCentered(
      page,
      await boxCenterX(page.getByRole("button", { name: "Retry" })),
      "Retry 버튼이 화면 가운데에 있다",
    );
  });
});
