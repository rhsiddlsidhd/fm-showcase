import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  forecastBerlin1d,
  forecastBerlin7d,
  geocodingBerlin,
  geocodingNoResults,
  setupTestServer,
  stubPrefersReducedMotion,
} from "@/shared/test";
import { WeatherAppPage } from "../index";

const server = setupTestServer();

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

type User = ReturnType<typeof userEvent.setup>;

afterEach(() => {
  vi.unstubAllGlobals();
});

// Forecast는 언제나 주어진 Berlin 응답을 돌려주고 받은 요청을 모은다.
const stubForecast = (body: Record<string, unknown> = forecastBerlin1d) => {
  const forecastRequests: URL[] = [];
  server.use(
    http.get(FORECAST_URL, ({ request }) => {
      forecastRequests.push(new URL(request.url));
      return HttpResponse.json(body);
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

const getUnitsButton = () => screen.getByRole("button", { name: "Units" });

// Units 드롭다운이 열려 있으면 그대로 쓰고, 닫혀 있으면 Units 버튼으로 연다.
const openUnitsMenu = async (user: User) => {
  const opened = screen.queryByRole("menu");
  if (opened) return opened;
  await user.click(getUnitsButton());
  return screen.findByRole("menu");
};

const chooseUnit = async (user: User, name: string) => {
  const menu = await openUnitsMenu(user);
  await user.click(within(menu).getByRole("menuitemradio", { name }));
};

const clickToggle = async (user: User, name: string) => {
  const menu = await openUnitsMenu(user);
  await user.click(within(menu).getByRole("menuitem", { name }));
};

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 글자 내용 전체가 parts를 이 순서로만 담은(사이에는 공백과 "/"만) 가장 안쪽 묶음을 찾는다.
// withImage면 이미지를 포함하는 묶음 중에서 고른다.
const findGroup = (parts: string[], { withImage = false } = {}) => {
  const pattern = new RegExp(
    `^\\s*${parts.map(escapeRegExp).join("[\\s/]*")}\\s*$`,
  );
  return waitFor(() => {
    const groups = screen
      .getAllByText((_, element) => pattern.test(element?.textContent ?? ""))
      .filter(
        (group) => !withImage || within(group).queryAllByRole("img").length > 0,
      );
    expect(groups.length).toBeGreaterThan(0);
    return groups[groups.length - 1];
  });
};

const TODAY = "Wednesday, Nov 11, 2026";

// 현재 날씨 카드: 지역명·국가, 날짜, 아이콘, 기온.
const findCurrentCard = (temperature: string) =>
  findGroup(["Berlin, Germany", TODAY, temperature], { withImage: true });

// 카드 아래 지표 한 칸: 이름과 값.
const findMetric = (label: string, value: string) => findGroup([label, value]);

// 일별 한 칸: 요일 약어, 아이콘, 최고°/최저°.
const findDailyCell = (abbreviation: string, max: string, min: string) =>
  findGroup([abbreviation, max, min], { withImage: true });

// 시간별 한 행: 아이콘, 시각, 기온.
const findHourlyRow = (label: string, temperature: string) =>
  findGroup([label, temperature], { withImage: true });

// Berlin 1일 fixture를 Imperial로 환산·반올림한 값: 2.3°C → 36°, -1.0°C → 30°, 8.4 km/h → 5 mph, 0 mm → 0 in.
const expectImperialCurrent = async () => {
  expect(await findCurrentCard("36°")).toBeInTheDocument();
  expect(await findMetric("Feels Like", "30°")).toBeInTheDocument();
  expect(await findMetric("Wind", "5 mph")).toBeInTheDocument();
  expect(await findMetric("Precipitation", "0 in")).toBeInTheDocument();
};

// Berlin 1일 fixture의 기본 단위 값을 반올림한 값.
const expectMetricCurrent = async () => {
  expect(await findCurrentCard("2°")).toBeInTheDocument();
  expect(await findMetric("Feels Like", "-1°")).toBeInTheDocument();
  expect(await findMetric("Wind", "8 km/h")).toBeInTheDocument();
  expect(await findMetric("Precipitation", "0 mm")).toBeInTheDocument();
};

const expectChecked = (menu: HTMLElement, names: string[]) => {
  for (const name of names) {
    expect(within(menu).getByRole("menuitemradio", { name })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  }
};

const expectNotChecked = (menu: HTMLElement, names: string[]) => {
  for (const name of names) {
    expect(within(menu).getByRole("menuitemradio", { name })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  }
};

const METRIC_ITEMS = ["Celsius (°C)", "km/h", "Millimeters (mm)"];
const IMPERIAL_ITEMS = ["Fahrenheit (°F)", "mph", "Inches (in)"];

describe("최초 진입 단위", () => {
  it("처음 Units 드롭다운을 열면 Celsius, km/h, Millimeters가 선택돼 있다", async () => {
    stubForecast();
    const user = await renderApp();

    const menu = await openUnitsMenu(user);

    expectChecked(menu, METRIC_ITEMS);
    expectNotChecked(menu, IMPERIAL_ITEMS);
  });

  it("처음 Units 드롭다운을 열면 상단 토글 문구가 Switch to Imperial이다", async () => {
    stubForecast();
    const user = await renderApp();

    const menu = await openUnitsMenu(user);

    expect(
      within(menu).getByRole("menuitem", { name: "Switch to Imperial" }),
    ).toBeInTheDocument();
  });
});

describe("Imperial/Metric 한 번에 전환", () => {
  it("Switch to Imperial을 누르면 기온·체감온도·풍속·강수량이 모두 Imperial 값으로 바뀐다", async () => {
    stubForecast();
    const user = await renderApp();

    await clickToggle(user, "Switch to Imperial");

    await expectImperialCurrent();
  });

  it("Switch to Imperial을 눌러도 예보를 다시 요청하지 않는다", async () => {
    const { forecastRequests } = stubForecast();
    const user = await renderApp();

    await clickToggle(user, "Switch to Imperial");
    await findMetric("Wind", "5 mph");

    expect(forecastRequests).toHaveLength(1);
  });

  it("Imperial로 바꾼 뒤 Units 드롭다운을 열면 토글 문구가 Switch to Metric이고 Fahrenheit, mph, Inches가 선택돼 있다", async () => {
    stubForecast();
    const user = await renderApp();
    await clickToggle(user, "Switch to Imperial");
    await findMetric("Wind", "5 mph");

    const menu = await openUnitsMenu(user);

    expect(
      within(menu).getByRole("menuitem", { name: "Switch to Metric" }),
    ).toBeInTheDocument();
    expectChecked(menu, IMPERIAL_ITEMS);
    expectNotChecked(menu, METRIC_ITEMS);
  });

  it("Imperial 상태에서 Switch to Metric을 누르면 섭씨·km/h·mm 값으로 돌아온다", async () => {
    stubForecast();
    const user = await renderApp();
    await clickToggle(user, "Switch to Imperial");
    await findMetric("Wind", "5 mph");

    await clickToggle(user, "Switch to Metric");

    await expectMetricCurrent();
  });

  it("Imperial로 바꾸면 Daily forecast의 최고·최저 기온도 화씨로 바뀐다", async () => {
    stubForecast(forecastBerlin7d);
    const user = await renderApp();

    await clickToggle(user, "Switch to Imperial");

    // 2026-11-11 최고 5.4°C → 41.72°F, 최저 1.9°C → 35.42°F
    expect(await findDailyCell("Wed", "42°", "35°")).toBeInTheDocument();
  });

  it("Imperial로 바꾸면 Hourly forecast의 시각별 기온도 화씨로 바뀐다", async () => {
    stubForecast(forecastBerlin7d);
    const user = await renderApp();

    await clickToggle(user, "Switch to Imperial");

    // 9 AM 2.5°C → 36.5°F(.5는 올림), 3 PM 5.4°C → 41.72°F
    expect(await findHourlyRow("9 AM", "37°")).toBeInTheDocument();
    expect(await findHourlyRow("3 PM", "42°")).toBeInTheDocument();
  });
});

describe("혼합 단위에서 한 번에 전환", () => {
  it("Fahrenheit만 고른 상태에서 Units 드롭다운을 열면 토글 문구가 Switch to Imperial이다", async () => {
    stubForecast();
    const user = await renderApp();
    await chooseUnit(user, "Fahrenheit (°F)");
    await findCurrentCard("36°");

    const menu = await openUnitsMenu(user);

    expect(
      within(menu).getByRole("menuitem", { name: "Switch to Imperial" }),
    ).toBeInTheDocument();
  });

  it("Fahrenheit만 고른 상태에서 Switch to Imperial을 누르면 세 단위가 모두 Imperial이 된다", async () => {
    stubForecast();
    const user = await renderApp();
    await chooseUnit(user, "Fahrenheit (°F)");
    await findCurrentCard("36°");

    await clickToggle(user, "Switch to Imperial");

    await expectImperialCurrent();
  });
});

describe("개별 단위 선택", () => {
  it("Fahrenheit만 고르면 기온만 화씨로 바뀌고 풍속과 강수량은 km/h·mm 그대로다", async () => {
    stubForecast();
    const user = await renderApp();

    await chooseUnit(user, "Fahrenheit (°F)");

    expect(await findCurrentCard("36°")).toBeInTheDocument();
    expect(await findMetric("Feels Like", "30°")).toBeInTheDocument();
    expect(await findMetric("Wind", "8 km/h")).toBeInTheDocument();
    expect(await findMetric("Precipitation", "0 mm")).toBeInTheDocument();
  });

  it("mph만 고르면 풍속만 mph로 바뀌고 기온과 강수량은 섭씨·mm 그대로다", async () => {
    stubForecast();
    const user = await renderApp();

    await chooseUnit(user, "mph");

    expect(await findMetric("Wind", "5 mph")).toBeInTheDocument();
    expect(await findCurrentCard("2°")).toBeInTheDocument();
    expect(await findMetric("Precipitation", "0 mm")).toBeInTheDocument();
  });

  it("Inches만 고르면 강수량만 in으로 바뀌고 기온과 풍속은 섭씨·km/h 그대로다", async () => {
    stubForecast();
    const user = await renderApp();

    await chooseUnit(user, "Inches (in)");

    expect(await findMetric("Precipitation", "0 in")).toBeInTheDocument();
    expect(await findCurrentCard("2°")).toBeInTheDocument();
    expect(await findMetric("Wind", "8 km/h")).toBeInTheDocument();
  });

  it("Fahrenheit만 고른 뒤 Units 드롭다운을 열면 Fahrenheit, km/h, Millimeters가 선택돼 있다", async () => {
    stubForecast();
    const user = await renderApp();
    await chooseUnit(user, "Fahrenheit (°F)");
    await findCurrentCard("36°");

    const menu = await openUnitsMenu(user);

    expectChecked(menu, ["Fahrenheit (°F)", "km/h", "Millimeters (mm)"]);
    expectNotChecked(menu, ["Celsius (°C)", "mph", "Inches (in)"]);
  });
});

describe("움직임 설정과 단위 전환", () => {
  it("일반 모션에서 Switch to Imperial을 누르면 숫자가 Imperial 값으로 바뀐 상태로 끝난다", async () => {
    stubPrefersReducedMotion(false);
    stubForecast();
    const user = await renderApp();

    await clickToggle(user, "Switch to Imperial");

    await expectImperialCurrent();
  });

  it("움직임 줄이기에서 Switch to Imperial을 누르면 숫자가 Imperial 값으로 바뀐다", async () => {
    stubPrefersReducedMotion(true);
    stubForecast();
    const user = await renderApp();

    await clickToggle(user, "Switch to Imperial");

    await expectImperialCurrent();
  });
});

describe("개별 단위 선택 뒤 메뉴 닫힘", () => {
  // Units 버튼으로 메뉴를 열고 개별 단위 항목을 고른다.
  const openMenuAndChoose = async (user: User, name: string) => {
    await user.click(getUnitsButton());
    const menu = await screen.findByRole("menu");
    await user.click(within(menu).getByRole("menuitemradio", { name }));
  };

  const expectMenuClosed = () =>
    waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

  it("Units 메뉴에서 Fahrenheit를 고르면 기온이 화씨로 바뀌고 메뉴가 닫힌다", async () => {
    stubForecast();
    const user = await renderApp();

    await openMenuAndChoose(user, "Fahrenheit (°F)");

    // 2.3°C → 36.14°F
    expect(await findCurrentCard("36°")).toBeInTheDocument();
    await expectMenuClosed();
  });

  it("Units 메뉴에서 mph를 고르면 풍속만 mph로 바뀌고 메뉴가 닫힌다", async () => {
    stubForecast();
    const user = await renderApp();

    await openMenuAndChoose(user, "mph");

    // 8.4 km/h → 5.22 mph
    expect(await findMetric("Wind", "5 mph")).toBeInTheDocument();
    expect(await findCurrentCard("2°")).toBeInTheDocument();
    expect(await findMetric("Precipitation", "0 mm")).toBeInTheDocument();
    await expectMenuClosed();
  });

  it("Units 메뉴에서 Inches를 고르면 강수량만 in으로 바뀌고 메뉴가 닫힌다", async () => {
    stubForecast();
    const user = await renderApp();

    await openMenuAndChoose(user, "Inches (in)");

    expect(await findMetric("Precipitation", "0 in")).toBeInTheDocument();
    expect(await findCurrentCard("2°")).toBeInTheDocument();
    expect(await findMetric("Wind", "8 km/h")).toBeInTheDocument();
    await expectMenuClosed();
  });
});

describe("단위 변경과 알림 영역", () => {
  const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

  // Geocoding은 "Berlin" 검색에만 후보를 돌려준다.
  const stubGeocoding = () => {
    server.use(
      http.get(GEOCODING_URL, ({ request }) => {
        const name = new URL(request.url).searchParams.get("name");
        return HttpResponse.json(
          name === "Berlin" ? geocodingBerlin : geocodingNoResults,
        );
      }),
    );
  };

  const getStatusText = () => screen.getByRole("status").textContent?.trim();

  it("검색으로 고른 지역의 날씨 알림이 있는 상태에서 Fahrenheit를 고르면 알림 영역 문구가 그대로다", async () => {
    stubForecast();
    stubGeocoding();
    const user = await renderApp();
    await user.type(screen.getByRole("combobox"), "Berlin{Enter}");
    await user.click(
      await screen.findByRole("option", {
        name: "Berlin, New Hampshire, United States",
      }),
    );
    await waitFor(() =>
      expect(getStatusText()).toBe("Weather for Berlin, United States"),
    );

    await chooseUnit(user, "Fahrenheit (°F)");
    // 기온 단위가 실제로 바뀐 뒤 확인한다: 체감온도 -1.0°C → 30°F.
    await findMetric("Feels Like", "30°");

    expect(getStatusText()).toBe("Weather for Berlin, United States");
  });
});
