import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  forecastBerlin1d,
  forecastBerlin7d,
  setupTestServer,
} from "@/shared/test";
import { WeatherAppPage } from "../index";

const server = setupTestServer();

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_ICON_NAMES = [
  "Clear",
  "Partly cloudy",
  "Overcast",
  "Fog",
  "Drizzle",
  "Rain",
  "Snow",
  "Thunderstorm",
];

type ForecastBody = Record<string, unknown>;

// Forecast·Geocoding 대역을 등록하고 받은 요청을 모은다.
const useOpenMeteo = (
  forecastBody: ForecastBody,
  options: { forecastGate?: Promise<void> } = {},
) => {
  const forecastRequests: URL[] = [];
  const geocodingRequests: URL[] = [];
  server.use(
    http.get(FORECAST_URL, async ({ request }) => {
      forecastRequests.push(new URL(request.url));
      await options.forecastGate;
      return HttpResponse.json(forecastBody);
    }),
    http.get(GEOCODING_URL, ({ request }) => {
      geocodingRequests.push(new URL(request.url));
      return HttpResponse.json({ generationtime_ms: 0.1 });
    }),
  );
  return { forecastRequests, geocodingRequests };
};

const withCurrentTime = (time: string): ForecastBody => ({
  ...forecastBerlin7d,
  current: { ...forecastBerlin7d.current, time },
});

const withHourlyCode = (time: string, code: number): ForecastBody => {
  const index = forecastBerlin7d.hourly.time.indexOf(time);
  const weatherCode = [...forecastBerlin7d.hourly.weather_code];
  weatherCode[index] = code;
  return {
    ...forecastBerlin7d,
    hourly: { ...forecastBerlin7d.hourly, weather_code: weatherCode },
  };
};

const renderApp = () => render(<WeatherAppPage />);

const waitForBerlinWeather = () => screen.findByText("Berlin, Germany");

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 글자 내용 전체가 parts를 이 순서로만 담은(사이에는 공백과 "/"만) 가장 안쪽 묶음을 찾는다.
// withImage면 이미지를 포함하는 묶음 중에서 고른다.
const getGroup = (parts: string[], { withImage = false } = {}) => {
  const pattern = new RegExp(
    `^\\s*${parts.map(escapeRegExp).join("[\\s/]*")}\\s*$`,
  );
  const groups = screen
    .getAllByText((_, element) => pattern.test(element?.textContent ?? ""))
    .filter(
      (group) => !withImage || within(group).queryAllByRole("img").length > 0,
    );
  expect(groups.length).toBeGreaterThan(0);
  return groups[groups.length - 1];
};

const HOUR_LABEL = /^(1[0-2]|[1-9]) (AM|PM)$/;

const hourLabel = (hour: number) => {
  const suffix = hour < 12 ? "AM" : "PM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve} ${suffix}`;
};

const visibleHourLabels = () =>
  screen.getAllByText(HOUR_LABEL).map((el) => el.textContent);

// 시간별 한 행: 아이콘, 시각, 기온.
const getHourlyRow = (label: string, temperature: string) =>
  getGroup([label, temperature], { withImage: true });

const DAY_ABBREVIATIONS = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/;

// 일별 한 칸: 요일 약어, 아이콘, 최고°/최저°.
const getDailyCell = (abbreviation: string, max: string, min: string) =>
  getGroup([abbreviation, max, min], { withImage: true });

// 현재 날씨 카드: 지역명·국가, 날짜, 아이콘, 기온.
const getCurrentCard = (date: string, temperature: string) =>
  getGroup(["Berlin, Germany", date, temperature], { withImage: true });

describe("날씨 앱 최초 진입", () => {
  it("검색하지 않아도 지역 검색 없이 Berlin 좌표로 7일 예보를 요청한다", async () => {
    const { forecastRequests, geocodingRequests } =
      useOpenMeteo(forecastBerlin1d);
    renderApp();

    await waitForBerlinWeather();

    expect(geocodingRequests).toHaveLength(0);
    expect(forecastRequests).toHaveLength(1);
    const params = forecastRequests[0].searchParams;
    expect(params.get("latitude")).toBe("52.52437");
    expect(params.get("longitude")).toBe("13.41053");
    expect(params.get("current")).toBe(
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code",
    );
    expect(params.get("daily")).toBe(
      "weather_code,temperature_2m_max,temperature_2m_min",
    );
    expect(params.get("hourly")).toBe("temperature_2m,weather_code");
    expect(params.get("timezone")).toBe("auto");
    expect(params.get("forecast_days")).toBe("7");
    expect(params.has("temperature_unit")).toBe(false);
    expect(params.has("wind_speed_unit")).toBe(false);
    expect(params.has("precipitation_unit")).toBe(false);
  });

  it("예보 응답 전에는 로딩 상태를 보이고 응답 뒤 Berlin, Germany 날씨로 바뀐다", async () => {
    let releaseForecast!: () => void;
    const forecastGate = new Promise<void>((resolve) => {
      releaseForecast = resolve;
    });
    useOpenMeteo(forecastBerlin1d, { forecastGate });
    renderApp();

    expect(
      await screen.findByText("Loading...", { ignore: '[role="status"]' }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Berlin, Germany")).not.toBeInTheDocument();

    releaseForecast();

    expect(await screen.findByText("Berlin, Germany")).toBeInTheDocument();
    expect(
      screen.queryByText("Loading...", { ignore: '[role="status"]' }),
    ).not.toBeInTheDocument();
  });

  it("Berlin 날씨가 처음 표시될 때 화면 낭독기 알림 영역은 비어 있다", async () => {
    useOpenMeteo(forecastBerlin1d);
    renderApp();

    await waitForBerlinWeather();

    expect(screen.getByRole("status").textContent?.trim()).toBe("");
  });
});

describe("현재 날씨 카드", () => {
  it("지역명·국가와 현지 날짜, 반올림한 기온을 함께 보여준다", async () => {
    useOpenMeteo(forecastBerlin1d);
    renderApp();
    await waitForBerlinWeather();

    expect(getCurrentCard("Wednesday, Nov 11, 2026", "2°")).toBeInTheDocument();
  });

  it("현재 날씨 코드 3을 흐림 아이콘과 대체 텍스트 Overcast로 보여준다", async () => {
    useOpenMeteo(forecastBerlin1d);
    renderApp();
    await waitForBerlinWeather();

    const card = getCurrentCard("Wednesday, Nov 11, 2026", "2°");
    const icon = within(card).getByRole("img", { name: "Overcast" });

    expect(icon).toHaveAttribute(
      "src",
      "/weather-app/images/icon-overcast.webp",
    );
  });

  it.each([
    ["Feels Like", "-1°"],
    ["Humidity", "87%"],
    ["Wind", "8 km/h"],
    ["Precipitation", "0 mm"],
  ])("카드 아래 %s 지표에 %s를 보여준다", async (label, value) => {
    useOpenMeteo(forecastBerlin1d);
    renderApp();
    await waitForBerlinWeather();

    expect(getGroup([label, value])).toBeInTheDocument();
  });
});

describe("Daily forecast", () => {
  it("오늘부터 7일의 요일 약어를 날짜순으로 보여준다", async () => {
    useOpenMeteo(forecastBerlin7d);
    renderApp();
    await waitForBerlinWeather();

    expect(
      screen.getAllByText(DAY_ABBREVIATIONS).map((el) => el.textContent),
    ).toEqual(["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"]);
  });

  it.each([
    ["Wed", "Drizzle", "5°", "2°"],
    ["Thu", "Drizzle", "7°", "3°"],
    ["Fri", "Overcast", "8°", "3°"],
    ["Sat", "Overcast", "7°", "3°"],
    ["Sun", "Rain", "7°", "1°"],
    ["Mon", "Rain", "8°", "5°"],
    ["Tue", "Rain", "10°", "6°"],
  ])(
    "%s 칸에 %s 아이콘과 최고 %s·최저 %s를 보여준다",
    async (abbreviation, iconName, max, min) => {
      useOpenMeteo(forecastBerlin7d);
      renderApp();
      await waitForBerlinWeather();

      const cell = getDailyCell(abbreviation, max, min);

      expect(
        within(cell).getByRole("img", { name: iconName }),
      ).toBeInTheDocument();
    },
  );
});

describe("Hourly forecast", () => {
  it("요일 선택기는 처음에 오늘(Wednesday)을 가리킨다", async () => {
    useOpenMeteo(forecastBerlin7d);
    renderApp();
    await waitForBerlinWeather();

    expect(
      screen.getByRole("button", { name: "Wednesday" }),
    ).toBeInTheDocument();
  });

  it("오늘은 현재 시각 9 AM부터 11 PM까지 15행을 보여준다", async () => {
    useOpenMeteo(forecastBerlin7d);
    renderApp();
    await waitForBerlinWeather();

    expect(visibleHourLabels()).toEqual(
      Array.from({ length: 15 }, (_, i) => hourLabel(9 + i)),
    );
  });

  it("오늘의 각 시각 행에 그 시각의 반올림한 기온과 날씨 아이콘을 보여준다", async () => {
    useOpenMeteo(forecastBerlin7d);
    renderApp();
    await waitForBerlinWeather();

    const expected: Array<[number, string, string]> = [
      [9, "3°", "Overcast"],
      [10, "3°", "Overcast"],
      [11, "4°", "Overcast"],
      [12, "4°", "Overcast"],
      [13, "5°", "Overcast"],
      [14, "5°", "Overcast"],
      [15, "5°", "Overcast"],
      [16, "5°", "Overcast"],
      [17, "5°", "Overcast"],
      [18, "5°", "Overcast"],
      [19, "5°", "Overcast"],
      [20, "5°", "Overcast"],
      [21, "4°", "Overcast"],
      [22, "4°", "Drizzle"],
      [23, "4°", "Drizzle"],
    ];
    for (const [hour, temperature, iconName] of expected) {
      const row = getHourlyRow(hourLabel(hour), temperature);
      expect(
        within(row).getByRole("img", { name: iconName }),
      ).toBeInTheDocument();
    }
  });

  it("현재 시각이 9:45이면 그 시각의 정시인 9 AM부터 보여준다", async () => {
    useOpenMeteo(withCurrentTime("2026-11-11T09:45"));
    renderApp();
    await waitForBerlinWeather();

    expect(visibleHourLabels()[0]).toBe("9 AM");
  });

  it("현재 시각이 23:45이면 11 PM 한 행만 보여준다", async () => {
    useOpenMeteo(withCurrentTime("2026-11-11T23:45"));
    renderApp();
    await waitForBerlinWeather();

    expect(visibleHourLabels()).toEqual(["11 PM"]);
  });

  it("날씨 코드 0인 시각의 아이콘은 Clear로 읽힌다", async () => {
    useOpenMeteo(withHourlyCode("2026-11-11T10:00", 0));
    renderApp();
    await waitForBerlinWeather();

    const row = getHourlyRow("10 AM", "3°");

    expect(within(row).getByRole("img", { name: "Clear" })).toBeInTheDocument();
  });
});

describe("이미지 접근성", () => {
  it("로고는 Weather Now로 읽힌다", async () => {
    useOpenMeteo(forecastBerlin7d);
    renderApp();
    await waitForBerlinWeather();

    expect(
      screen.getByRole("img", { name: "Weather Now" }),
    ).toBeInTheDocument();
  });

  it("검색·Units·드롭다운 화살표 아이콘은 화면에 있지만 이름 있는 이미지로 낭독되지 않는다", async () => {
    useOpenMeteo(forecastBerlin7d);
    renderApp();
    await waitForBerlinWeather();

    expect(
      screen.getByPlaceholderText("Search for a place..."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Units" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Wednesday" }),
    ).toBeInTheDocument();

    // alt=""인 이미지는 presentation 역할로 접근성 트리에서 이름 없이 빠진다.
    const decorativeSources = screen
      .getAllByRole("presentation")
      .map((image) => image.getAttribute("src"));
    expect(decorativeSources).toEqual(
      expect.arrayContaining([
        "/weather-app/images/icon-search.svg",
        "/weather-app/images/icon-units.svg",
        "/weather-app/images/icon-dropdown.svg",
      ]),
    );

    const namedImages = screen
      .getAllByRole("img")
      .map((image) => image.getAttribute("alt"));
    for (const name of namedImages) {
      expect(["Weather Now", ...WEATHER_ICON_NAMES]).toContain(name);
    }
  });
});
