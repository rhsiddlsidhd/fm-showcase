import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  forecastBerlin7d,
  geocodingBerlin,
  geocodingNoResults,
  setupTestServer,
} from "@/shared/test";
import { WeatherAppPage } from "../index";

const server = setupTestServer();

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

type User = ReturnType<typeof userEvent.setup>;

// Forecast는 언제나 7일치 Berlin 응답을, Geocoding은 "Berlin" 검색에만 후보를 돌려준다.
const stubOpenMeteo = () => {
  const forecastRequests: URL[] = [];
  server.use(
    http.get(FORECAST_URL, ({ request }) => {
      forecastRequests.push(new URL(request.url));
      return HttpResponse.json(forecastBerlin7d);
    }),
    http.get(GEOCODING_URL, ({ request }) => {
      const name = new URL(request.url).searchParams.get("name");
      return HttpResponse.json(
        name === "Berlin" ? geocodingBerlin : geocodingNoResults,
      );
    }),
  );
  return { forecastRequests };
};

// 최초 진입 Berlin 날씨가 표시될 때까지 기다린 뒤 조작을 시작한다.
const renderApp = async () => {
  const user = userEvent.setup();
  render(<WeatherAppPage />);
  await screen.findByText("Berlin, Germany");
  return user;
};

const DAY_NAME = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/;

// 요일 선택기 버튼은 지금 선택된 요일 전체 이름을 이름으로 갖는다.
const getDaySelector = () => screen.getByRole("button", { name: DAY_NAME });

const openDayMenu = async (user: User) => {
  await user.click(getDaySelector());
  return screen.findByRole("menu");
};

// 메뉴 항목은 일반 항목이나 라디오 항목일 수 있어 둘 다 모아 화면 순서로 정렬한다.
const getMenuItems = (menu: HTMLElement) =>
  [
    ...within(menu).queryAllByRole("menuitem"),
    ...within(menu).queryAllByRole("menuitemradio"),
  ].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );

const selectDay = async (user: User, dayName: string) => {
  const menu = await openDayMenu(user);
  const item = getMenuItems(menu).find(
    (element) => element.textContent?.trim() === dayName,
  );
  expect(item).toBeDefined();
  await user.click(item!);
};

const HOUR_LABEL = /^(1[0-2]|[1-9]) (AM|PM)$/;

const hourLabel = (hour: number) => {
  const suffix = hour < 12 ? "AM" : "PM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve} ${suffix}`;
};

const visibleHourLabels = () =>
  screen.getAllByText(HOUR_LABEL).map((el) => el.textContent);

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 시간별 한 행: 아이콘, 시각, 기온을 모두 담은 가장 안쪽 묶음.
const getHourlyRow = (label: string, temperature: string) => {
  const pattern = new RegExp(
    `^\\s*${escapeRegExp(label)}\\s*${escapeRegExp(temperature)}\\s*$`,
  );
  const rows = screen
    .getAllByText((_, element) => pattern.test(element?.textContent ?? ""))
    .filter((row) => within(row).queryAllByRole("img").length > 0);
  expect(rows.length).toBeGreaterThan(0);
  return rows[rows.length - 1];
};

describe("요일 선택기 목록", () => {
  it("요일 선택기를 열면 Daily forecast와 같은 7일을 오늘부터 날짜순으로 요일 전체 이름으로 보여준다", async () => {
    stubOpenMeteo();
    const user = await renderApp();

    const menu = await openDayMenu(user);

    expect(getMenuItems(menu).map((item) => item.textContent?.trim())).toEqual([
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
      "Monday",
      "Tuesday",
    ]);
  });
});

describe("다른 요일 선택", () => {
  it("Thursday를 고르면 요일 선택기가 Thursday를 가리킨다", async () => {
    stubOpenMeteo();
    const user = await renderApp();

    await selectDay(user, "Thursday");

    expect(
      await screen.findByRole("button", { name: "Thursday" }),
    ).toBeInTheDocument();
  });

  it("Thursday를 고르면 시간별 예보가 12 AM부터 11 PM까지 24행으로 바뀐다", async () => {
    stubOpenMeteo();
    const user = await renderApp();

    await selectDay(user, "Thursday");
    await screen.findByText("12 AM");

    expect(visibleHourLabels()).toEqual(
      Array.from({ length: 24 }, (_, hour) => hourLabel(hour)),
    );
  });

  it("Thursday를 고르면 각 시각 행에 그날 그 시각의 반올림한 기온과 날씨 아이콘을 보여준다", async () => {
    stubOpenMeteo();
    const user = await renderApp();

    await selectDay(user, "Thursday");
    await screen.findByText("12 AM");

    // 2026-11-12의 시간별 기온·날씨 코드를 반올림·아이콘 매핑한 값.
    const expected: Array<[number, string, string]> = [
      [0, "4°", "Overcast"],
      [1, "4°", "Drizzle"],
      [2, "4°", "Overcast"],
      [3, "5°", "Drizzle"],
      [4, "5°", "Drizzle"],
      [5, "5°", "Overcast"],
      [6, "5°", "Overcast"],
      [7, "4°", "Overcast"],
      [8, "4°", "Overcast"],
      [9, "4°", "Overcast"],
      [10, "4°", "Overcast"],
      [11, "5°", "Overcast"],
      [12, "5°", "Overcast"],
      [13, "6°", "Partly cloudy"],
      [14, "7°", "Clear"],
      [15, "7°", "Clear"],
      [16, "7°", "Overcast"],
      [17, "7°", "Partly cloudy"],
      [18, "6°", "Clear"],
      [19, "5°", "Clear"],
      [20, "5°", "Clear"],
      [21, "4°", "Clear"],
      [22, "4°", "Clear"],
      [23, "4°", "Clear"],
    ];
    for (const [hour, temperature, iconName] of expected) {
      const row = getHourlyRow(hourLabel(hour), temperature);
      expect(
        within(row).getByRole("img", { name: iconName }),
      ).toBeInTheDocument();
    }
  });

  it("다른 요일을 골라도 예보를 다시 요청하지 않는다", async () => {
    const { forecastRequests } = stubOpenMeteo();
    const user = await renderApp();

    await selectDay(user, "Thursday");
    await screen.findByText("12 AM");

    expect(forecastRequests).toHaveLength(1);
  });
});

describe("새 지역 선택 뒤 요일 선택기", () => {
  // Sunday로 바꾼 뒤 Berlin, United States를 골라 새 날씨가 표시될 때까지 기다린다.
  const selectSundayThenNewPlace = async () => {
    stubOpenMeteo();
    const user = await renderApp();
    await selectDay(user, "Sunday");
    await screen.findByRole("button", { name: "Sunday" });

    await user.type(screen.getByRole("combobox"), "Berlin{Enter}");
    await user.click(
      await screen.findByRole("option", {
        name: "Berlin, New Hampshire, United States",
      }),
    );
    await screen.findByText("Berlin, United States");
  };

  it("다른 요일을 고른 뒤 새 지역을 선택하면 요일 선택기가 오늘(Wednesday)로 돌아간다", async () => {
    await selectSundayThenNewPlace();

    expect(getDaySelector()).toHaveAccessibleName("Wednesday");
  });

  it("다른 요일을 고른 뒤 새 지역을 선택하면 시간별 예보가 오늘의 현재 시각 9 AM부터 다시 보인다", async () => {
    await selectSundayThenNewPlace();

    expect(visibleHourLabels()).toEqual(
      Array.from({ length: 15 }, (_, i) => hourLabel(9 + i)),
    );
  });
});
