import { expect, test, type Page } from "@playwright/test";
import { unitsButton } from "./keyboard-focus.ts";
import { routeOpenMeteoToBerlin } from "./open-meteo-route.ts";

// 후보 목록이 포커스 이탈로 닫히는 동작이 생겨도 깨지면 안 되는 동작을 지킨다.
// 키보드 포커스 이동은 브라우저의 포커스 탐색에 달려 실제 브라우저에서 본다(test-boundaries.md).

const searchInput = (page: Page) => page.getByRole("combobox");
const searchButton = (page: Page) =>
  page.getByRole("button", { name: "Search" });
const candidateList = (page: Page) =>
  page.getByRole("listbox", { name: "Search results" });

// 처음 화면의 날씨(Berlin, Germany)가 보인 뒤 "Berlin"을 검색해 후보 목록을 연다.
async function openCandidates(page: Page) {
  await routeOpenMeteoToBerlin(page);
  await page.goto("/weather-app");
  await expect(page.getByText("Berlin, Germany").first()).toBeVisible();
  await searchInput(page).fill("Berlin");
  await searchInput(page).press("Enter");
  await expect(candidateList(page)).toBeVisible();
}

test("후보 목록이 열린 채 Tab으로 포커스를 검색창에서 Search 버튼으로 옮기면 목록이 그대로 열려 있다", async ({
  page,
}) => {
  await openCandidates(page);
  await expect(searchInput(page)).toBeFocused();

  await page.keyboard.press("Tab");

  await expect(searchButton(page)).toBeFocused();
  await expect(candidateList(page)).toBeVisible();
  await expect(
    candidateList(page).getByRole("option", {
      name: "Berlin, State of Berlin, Germany",
    }),
  ).toBeVisible();
});

test("후보 Berlin, State of Berlin, Germany 행을 클릭하면 목록이 닫히고 그 지역의 날씨를 다시 받아 표시한다", async ({
  page,
}) => {
  await openCandidates(page);
  // geocoding-berlin.json의 첫 후보 좌표로 날씨를 요청해야 한다.
  const forecastRequest = page.waitForRequest((request) => {
    if (!request.url().startsWith("https://api.open-meteo.com/")) return false;
    const params = new URL(request.url()).searchParams;
    return (
      params.get("latitude") === "52.52437" &&
      params.get("longitude") === "13.41053"
    );
  });

  await candidateList(page)
    .getByRole("option", { name: "Berlin, State of Berlin, Germany" })
    .click();

  await forecastRequest;
  await expect(candidateList(page)).toBeHidden();
  await expect(page.getByText("Berlin, Germany").first()).toBeVisible();
});

// 지역명과 현재 기온을 함께 담은 가장 안쪽 영역. forecast-berlin-1d.json의 현재 기온 2.3°C → "2°".
const currentWeather = (page: Page) =>
  page
    .locator("div")
    .filter({ has: page.getByText("Berlin, Germany", { exact: true }) })
    .filter({ has: page.getByText("2°", { exact: true }) })
    .last();

test("후보 목록이 열린 채 페이지의 빈 곳을 클릭하면 목록이 닫히고 날씨 영역과 검색창의 검색어는 그대로다", async ({
  page,
}) => {
  await openCandidates(page);
  await expect(currentWeather(page)).toBeVisible();

  // 페이지 왼쪽 위 모서리의 빈 곳을 누른다.
  await page.locator("body").click({ position: { x: 1, y: 1 } });

  await expect(candidateList(page)).toBeHidden();
  await expect(currentWeather(page)).toBeVisible();
  await expect(searchInput(page)).toHaveValue("Berlin");
});

test("후보 목록이 열린 채 포커스를 검색 영역 밖의 Units 버튼으로 옮기면 목록이 닫힌다", async ({
  page,
}) => {
  await openCandidates(page);

  await unitsButton(page).focus();

  await expect(unitsButton(page)).toBeFocused();
  await expect(candidateList(page)).toBeHidden();
});
