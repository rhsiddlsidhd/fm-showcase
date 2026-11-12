import { expect, test, type Page } from "@playwright/test";
import {
  daySelector,
  disableTransitions,
  expectRingShownOnFocus,
  menuItems,
  openWithBerlinWeekly,
  tabThroughPage,
  unitsButton,
} from "./keyboard-focus.ts";
import { routeForecastToHttp400 } from "./open-meteo-route.ts";

// 포커스 링 판정 기준은 keyboard-focus.ts 머리 주석에 있다.

test.describe("포커스 링", () => {
  test("Tab으로 날씨 화면을 순회하면 검색창, Search 버튼, Units 버튼, 요일 선택기를 포함한 모든 요소에 포커스 링이 보인다", async ({
    page,
  }) => {
    await openWithBerlinWeekly(page);

    const visits = await tabThroughPage(page);

    const labels = visits.map((visit) => visit.label);
    expect(labels.some((label) => label.startsWith("combobox"))).toBe(true);
    for (const name of ["Search", "Units", "Wednesday"]) {
      expect(
        labels.some((label) => label.includes(`"${name}`)),
        `Tab 순회에 ${name} 버튼이 포함된다`,
      ).toBe(true);
    }
    visits.forEach(expectRingShownOnFocus);
  });

  test("오류 화면에서 Tab으로 Retry 버튼에 가면 포커스 링이 보인다", async ({
    page,
  }) => {
    await routeForecastToHttp400(page);
    await page.goto("/weather-app");
    const retry = page.getByRole("button", { name: "Retry" });
    await expect(retry).toBeVisible();
    await disableTransitions(page);

    const visits = await tabThroughPage(page);

    const retryVisit = visits.find((visit) => visit.label.includes('"Retry'));
    expect(retryVisit, "Tab 순회에 Retry 버튼이 포함된다").toBeDefined();
    expectRingShownOnFocus(retryVisit!);
  });
});

// 메뉴 열기·닫기·포커스 복귀는 메뉴 부품(Base UI)의 기본 동작이라 처음부터 통과한다.
// 이 프로젝트가 쓴 코드가 아니라 이후 변경(부품 교체·업그레이드, 트리거 교체)이 이 동작을 깨뜨리지
// 않게 지키는 회귀 테스트다(docs/testing/test-policy.md#회귀-테스트).
test.describe("회귀 테스트: 메뉴의 기본 키보드 동작", () => {
  const menus = [
    {
      name: "Units 버튼",
      trigger: unitsButton,
      firstItem: (page: Page) =>
        page.getByRole("menuitem", { name: "Switch to Imperial" }),
      firstItemName: "Switch to Imperial",
    },
    {
      name: "요일 선택기",
      trigger: daySelector,
      firstItem: (page: Page) => menuItems(page).first(),
      firstItemName: "Wednesday",
    },
  ];
  const openKeys = [
    { key: "Enter", label: "Enter" },
    { key: " ", label: "Space" },
    { key: "ArrowDown", label: "↓" },
  ];

  for (const menu of menus) {
    for (const { key, label } of openKeys) {
      test(`${menu.name}에서 ${label} 키를 누르면 포커스가 첫 항목 ${menu.firstItemName}으로 간다`, async ({
        page,
      }) => {
        await openWithBerlinWeekly(page);
        await menu.trigger(page).focus();

        await page.keyboard.press(key);

        await expect(menu.firstItem(page)).toBeFocused();
        await expect(menu.firstItem(page)).toHaveText(menu.firstItemName);
      });
    }
  }

  test("Units 드롭다운에서 Esc를 누르면 패널이 닫히고 포커스가 Units 버튼으로 돌아간다", async ({
    page,
  }) => {
    await openWithBerlinWeekly(page);
    await unitsButton(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("menu")).toBeHidden();
    await expect(unitsButton(page)).toBeFocused();
  });

  test("요일 선택기에서 요일을 고르면 패널이 닫히고 포커스가 요일 선택기 버튼으로 돌아간다", async ({
    page,
  }) => {
    await openWithBerlinWeekly(page);
    await daySelector(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("menu")).toBeHidden();
    await expect(page.getByRole("button", { name: "Thursday" })).toBeFocused();
  });
});

// 지표 한 칸: "Feels Like" 글자를 담은 가장 안쪽 요소(문서 순서상 마지막 조상).
const feelsLikeMetric = (page: Page) =>
  page
    .locator("div")
    .filter({ has: page.getByText("Feels Like", { exact: true }) })
    .last();

test("Units 드롭다운에서 키보드로 Fahrenheit를 고르면 체감 기온이 화씨로 바뀌고 패널이 닫히며 포커스가 Units 버튼으로 돌아간다", async ({
  page,
}) => {
  await openWithBerlinWeekly(page);
  // forecast-berlin-7d.json의 체감 기온 -0.7°C → 섭씨 -1°, 화씨 30.74°F → 31°.
  await expect(feelsLikeMetric(page)).toContainText("-1°");
  await unitsButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "Switch to Imperial" }),
  ).toBeFocused();

  // 메뉴 항목 순서: Switch to Imperial, Celsius (°C), Fahrenheit (°F).
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitemradio", { name: "Fahrenheit (°F)" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("menu")).toBeHidden();
  await expect(feelsLikeMetric(page)).toContainText("31°");
  await expect(unitsButton(page)).toBeFocused();
});
