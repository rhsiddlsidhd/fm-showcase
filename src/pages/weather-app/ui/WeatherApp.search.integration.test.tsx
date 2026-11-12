import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import {
  forecastBerlin7d,
  geocodingBerlin,
  geocodingNoResults,
  geocodingSingapore,
  setupTestServer,
} from "@/shared/test";
import { WeatherAppPage } from "../index";

const server = setupTestServer();

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

const NO_RESULT_QUERY = "zzzqqqnonexistentplace";

const GEOCODING_BY_NAME: Record<string, unknown> = {
  Berlin: geocodingBerlin,
  Singapore: geocodingSingapore,
};

type Gate = { promise: Promise<void>; release: () => void };

// 테스트가 끝날 때 열려 있는 응답 대기를 모두 풀어 대역 요청이 남지 않게 한다.
const openGates: Gate[] = [];

afterEach(() => {
  openGates.splice(0).forEach((gate) => gate.release());
});

// 테스트가 응답 도착 시점을 정할 수 있게 한다.
const createGate = (): Gate => {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  const gate = { promise, release };
  openGates.push(gate);
  return gate;
};

// Forecast·Geocoding 대역을 등록하고 받은 요청을 모은다.
// gates에 값을 넣으면 그 뒤에 들어온 요청은 gate가 풀릴 때까지 응답하지 않는다.
const stubOpenMeteo = () => {
  const forecastRequests: URL[] = [];
  const geocodingRequests: URL[] = [];
  const gates: { forecast?: Promise<void>; geocoding?: Promise<void> } = {};
  server.use(
    http.get(FORECAST_URL, async ({ request }) => {
      forecastRequests.push(new URL(request.url));
      await gates.forecast;
      return HttpResponse.json(forecastBerlin7d);
    }),
    http.get(GEOCODING_URL, async ({ request }) => {
      const url = new URL(request.url);
      geocodingRequests.push(url);
      await gates.geocoding;
      const name = url.searchParams.get("name") ?? "";
      return HttpResponse.json(GEOCODING_BY_NAME[name] ?? geocodingNoResults);
    }),
  );
  return { forecastRequests, geocodingRequests, gates };
};

// 최초 진입 Berlin 날씨가 표시될 때까지 기다린 뒤 조작을 시작한다.
const renderApp = async () => {
  const user = userEvent.setup();
  render(<WeatherAppPage />);
  await screen.findByText("Berlin, Germany");
  return user;
};

const getSearchInput = () => screen.getByRole("combobox");

const getSearchButton = () => screen.getByRole("button", { name: "Search" });

// 검색창에 입력하고 Enter로 검색한 뒤 후보 목록이 열릴 때까지 기다린다.
const searchAndWaitForCandidates = async (
  user: ReturnType<typeof userEvent.setup>,
  query: string,
) => {
  await user.type(getSearchInput(), `${query}{Enter}`);
  return screen.findByRole("listbox");
};

const getStatus = () => screen.getByRole("status");

// 알림 영역(role="status")을 뺀 화면 글자를 찾는다.
const OUTSIDE_STATUS = { ignore: '[role="status"]' };

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 글자 내용 전체가 parts를 이 순서로만 담은(사이에는 공백과 "/"만) 가장 안쪽 묶음을 찾는다.
const getGroup = (parts: string[]) => {
  const pattern = new RegExp(
    `^\\s*${parts.map(escapeRegExp).join("[\\s/]*")}\\s*$`,
  );
  const groups = screen.getAllByText((_, element) =>
    pattern.test(element?.textContent ?? ""),
  );
  return groups[groups.length - 1];
};

const DAY_ABBREVIATIONS = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/;
const HOUR_LABEL = /^(1[0-2]|[1-9]) (AM|PM)$/;

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

const isSearchSpinner = (image: HTMLElement) =>
  image.getAttribute("src") === "/weather-app/images/icon-loading.svg";

const querySearchSpinner = () =>
  screen.queryAllByRole("presentation").find(isSearchSpinner) ?? null;

describe("지역 검색 요청", () => {
  it("검색어로 Geocoding을 후보 5건, 영어, JSON 형식으로 요청한다", async () => {
    const { geocodingRequests } = stubOpenMeteo();
    const user = await renderApp();

    await searchAndWaitForCandidates(user, "Berlin");

    expect(geocodingRequests).toHaveLength(1);
    const params = geocodingRequests[0].searchParams;
    expect(params.get("name")).toBe("Berlin");
    expect(params.get("count")).toBe("5");
    expect(params.get("language")).toBe("en");
    expect(params.get("format")).toBe("json");
  });

  it("검색어 앞뒤 공백을 지운 값으로 Geocoding을 요청한다", async () => {
    const { geocodingRequests } = stubOpenMeteo();
    const user = await renderApp();

    await user.type(getSearchInput(), "  Berlin ");
    await user.click(getSearchButton());
    await screen.findByRole("listbox");

    expect(geocodingRequests).toHaveLength(1);
    expect(geocodingRequests[0].searchParams.get("name")).toBe("Berlin");
  });
});

describe("빈 검색어", () => {
  it.each([
    ["비워 둔 채 Search를 누르면", "", "click"],
    ["비워 둔 채 Enter를 치면", "", "enter"],
    ["공백 두 칸만 입력하고 Search를 누르면", "  ", "click"],
  ] as const)(
    "검색창을 %s 검색하지 않고 화면도 그대로다",
    async (_, value, submit) => {
      const { geocodingRequests } = stubOpenMeteo();
      const user = await renderApp();

      if (value) await user.type(getSearchInput(), value);
      if (submit === "click") await user.click(getSearchButton());
      else await user.type(getSearchInput(), "{Enter}");

      expect(
        screen.queryByText("Search in progress", OUTSIDE_STATUS),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(getStatus().textContent?.trim()).toBe("");
      expect(screen.getByText("Berlin, Germany")).toBeInTheDocument();

      // 빈 검색이 요청을 보냈다면 이어지는 정상 검색보다 먼저 기록된다.
      await user.clear(getSearchInput());
      await searchAndWaitForCandidates(user, "Berlin");
      expect(
        geocodingRequests.map((url) => url.searchParams.get("name")),
      ).toEqual(["Berlin"]);
    },
  );
});

describe("검색 진행 중", () => {
  it("응답 전에는 검색창 아래 Search in progress를 보이고 날씨 영역은 그대로 둔다", async () => {
    const { gates } = stubOpenMeteo();
    const user = await renderApp();
    gates.geocoding = createGate().promise;

    await user.type(getSearchInput(), "Berlin{Enter}");

    expect(
      await screen.findByText("Search in progress", OUTSIDE_STATUS),
    ).toBeInTheDocument();
    expect(screen.getByText("Berlin, Germany")).toBeInTheDocument();
  });

  it("검색을 시작하면 알림 영역이 Search in progress를 알린다", async () => {
    const { gates } = stubOpenMeteo();
    const user = await renderApp();
    gates.geocoding = createGate().promise;

    await user.type(getSearchInput(), "Berlin{Enter}");

    await waitFor(() =>
      expect(getStatus()).toHaveTextContent("Search in progress"),
    );
  });

  it("검색 중에는 회전 아이콘을 보이고 응답을 받으면 아이콘이 사라진다", async () => {
    const { gates } = stubOpenMeteo();
    const user = await renderApp();
    const geocodingGate = createGate();
    gates.geocoding = geocodingGate.promise;

    await user.type(getSearchInput(), "Berlin{Enter}");
    await waitFor(() => expect(querySearchSpinner()).not.toBeNull());

    geocodingGate.release();

    await screen.findByRole("listbox");
    await waitFor(() => expect(querySearchSpinner()).toBeNull());
    expect(
      screen.queryByText("Search in progress", OUTSIDE_STATUS),
    ).not.toBeInTheDocument();
  });
});

describe("후보 목록", () => {
  it("Berlin을 검색하면 동명 지역 2건을 지역명, 행정구역, 국가 순으로 보여준다", async () => {
    stubOpenMeteo();
    const user = await renderApp();

    const listbox = await searchAndWaitForCandidates(user, "Berlin");
    const options = within(listbox).getAllByRole("option");

    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAccessibleName("Berlin, State of Berlin, Germany");
    expect(options[1]).toHaveAccessibleName(
      "Berlin, New Hampshire, United States",
    );
  });

  it("행정구역이 없는 지역은 빈 칸과 쉼표 없이 지역명, 국가만 보여준다", async () => {
    stubOpenMeteo();
    const user = await renderApp();

    const listbox = await searchAndWaitForCandidates(user, "Singapore");
    const options = within(listbox).getAllByRole("option");

    expect(options).toHaveLength(1);
    expect(options[0]).toHaveAccessibleName("Singapore, Singapore");
  });

  it("검색 결과를 받으면 후보 목록 패널이 보이는 상태가 된다", async () => {
    stubOpenMeteo();
    const user = await renderApp();

    const listbox = await searchAndWaitForCandidates(user, "Berlin");

    await waitFor(() => expect(listbox).toBeVisible());
  });

  it("목록이 열리면 검색창이 펼쳐진 콤보박스로서 그 목록을 가리킨다", async () => {
    stubOpenMeteo();
    const user = await renderApp();

    const listbox = await searchAndWaitForCandidates(user, "Berlin");

    const input = getSearchInput();
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(listbox.id).not.toBe("");
    expect(input).toHaveAttribute("aria-controls", listbox.id);
  });
});

describe("후보 목록 키보드 조작", () => {
  it("목록이 열린 상태에서 ↓를 눌러도 포커스는 검색창에 남는다", async () => {
    stubOpenMeteo();
    const user = await renderApp();
    await searchAndWaitForCandidates(user, "Berlin");

    await user.keyboard("{ArrowDown}");

    expect(getSearchInput()).toHaveFocus();
  });

  it("↓를 두 번 누르면 둘째 후보가 활성 후보가 된다", async () => {
    stubOpenMeteo();
    const user = await renderApp();
    const listbox = await searchAndWaitForCandidates(user, "Berlin");
    const options = within(listbox).getAllByRole("option");

    await user.keyboard("{ArrowDown}{ArrowDown}");

    expect(options[1].id).not.toBe("");
    expect(getSearchInput()).toHaveAttribute(
      "aria-activedescendant",
      options[1].id,
    );
  });

  it("둘째 후보에서 ↑를 누르면 첫 후보가 활성 후보가 된다", async () => {
    stubOpenMeteo();
    const user = await renderApp();
    const listbox = await searchAndWaitForCandidates(user, "Berlin");
    const options = within(listbox).getAllByRole("option");

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}");

    expect(options[0].id).not.toBe("");
    expect(getSearchInput()).toHaveAttribute(
      "aria-activedescendant",
      options[0].id,
    );
  });

  it("활성 후보에서 Enter를 누르면 그 후보의 좌표로 날씨를 불러오기 시작한다", async () => {
    const { forecastRequests, gates } = stubOpenMeteo();
    const user = await renderApp();
    await searchAndWaitForCandidates(user, "Berlin");
    gates.forecast = createGate().promise;

    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(
      await screen.findByText("Loading...", OUTSIDE_STATUS),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(forecastRequests).toHaveLength(2);
    expect(forecastRequests[1].searchParams.get("latitude")).toBe("44.46867");
    expect(forecastRequests[1].searchParams.get("longitude")).toBe("-71.18508");
  });

  it("Esc를 누르면 목록만 닫히고 날씨 영역과 검색창 포커스는 그대로다", async () => {
    stubOpenMeteo();
    const user = await renderApp();
    await searchAndWaitForCandidates(user, "Berlin");

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    expect(getSearchInput()).toHaveAttribute("aria-expanded", "false");
    expect(getSearchInput()).toHaveFocus();
    expect(screen.getByText("Berlin, Germany")).toBeInTheDocument();
  });
});

describe("후보 선택", () => {
  it("후보 Berlin, State of Berlin, Germany를 고르면 로딩을 거쳐 그 지역 날씨를 보여준다", async () => {
    const { forecastRequests, gates } = stubOpenMeteo();
    const user = await renderApp();
    await searchAndWaitForCandidates(user, "Berlin");
    const forecastGate = createGate();
    gates.forecast = forecastGate.promise;

    await user.click(
      screen.getByRole("option", { name: "Berlin, State of Berlin, Germany" }),
    );

    expect(
      await screen.findByText("Loading...", OUTSIDE_STATUS),
    ).toBeInTheDocument();
    expect(screen.queryByText("Berlin, Germany")).not.toBeInTheDocument();

    forecastGate.release();

    expect(await screen.findByText("Berlin, Germany")).toBeInTheDocument();
    expect(
      screen.queryByText("Loading...", OUTSIDE_STATUS),
    ).not.toBeInTheDocument();
    expect(forecastRequests).toHaveLength(2);
    expect(forecastRequests[1].searchParams.get("latitude")).toBe("52.52437");
    expect(forecastRequests[1].searchParams.get("longitude")).toBe("13.41053");
  });

  it("후보 Berlin, New Hampshire, United States를 고르면 카드에 Berlin, United States를 보여준다", async () => {
    stubOpenMeteo();
    const user = await renderApp();
    await searchAndWaitForCandidates(user, "Berlin");

    await user.click(
      screen.getByRole("option", {
        name: "Berlin, New Hampshire, United States",
      }),
    );

    expect(
      await screen.findByText("Berlin, United States"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Berlin, Germany")).not.toBeInTheDocument();
  });

  it("후보를 고른 뒤 목록이 닫혀도 포커스는 검색창에 남는다", async () => {
    stubOpenMeteo();
    const user = await renderApp();
    await searchAndWaitForCandidates(user, "Berlin");

    await user.keyboard("{ArrowDown}{Enter}");

    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    expect(getSearchInput()).toHaveFocus();
  });
});

describe("후보 선택 뒤 날씨 로딩", () => {
  const selectGermanBerlinAndHoldForecast = async () => {
    const { gates } = stubOpenMeteo();
    const user = await renderApp();
    await searchAndWaitForCandidates(user, "Berlin");
    const forecastGate = createGate();
    gates.forecast = forecastGate.promise;
    await user.click(
      screen.getByRole("option", { name: "Berlin, State of Berlin, Germany" }),
    );
    await screen.findByText("Loading...", OUTSIDE_STATUS);
    return forecastGate;
  };

  it("응답 전에는 현재 날씨 카드에 Loading...을 보이고 날씨 아이콘과 예보 내용을 비운다", async () => {
    await selectGermanBerlinAndHoldForecast();

    expect(screen.queryByText("Berlin, Germany")).not.toBeInTheDocument();
    expect(screen.queryAllByText(DAY_ABBREVIATIONS)).toHaveLength(0);
    expect(screen.queryAllByText(HOUR_LABEL)).toHaveLength(0);
    // 빈 칸·빈 행은 내용이 없는 장식이라 역할·이름이 없어 테스트 ID로 센다.
    expect(screen.getAllByTestId("daily-placeholder")).toHaveLength(7);
    expect(screen.getAllByTestId("hourly-placeholder")).toHaveLength(8);
    const namedImages = screen
      .getAllByRole("img")
      .map((image) => image.getAttribute("alt"));
    for (const name of WEATHER_ICON_NAMES) {
      expect(namedImages).not.toContain(name);
    }
  });

  it.each(["Feels Like", "Humidity", "Wind", "Precipitation"])(
    "응답 전에는 %s 지표 값 자리에 —를 보여준다",
    async (label) => {
      await selectGermanBerlinAndHoldForecast();

      expect(getGroup([label, "—"])).toBeInTheDocument();
    },
  );

  it("응답 전에는 로딩 점 3개를 보이고 응답을 받으면 사라진다", async () => {
    const forecastGate = await selectGermanBerlinAndHoldForecast();

    // 장식용 점이라 역할·이름이 없어 테스트 ID로 찾는다.
    expect(screen.getAllByTestId("loading-dot")).toHaveLength(3);

    forecastGate.release();

    await screen.findByText("Berlin, Germany");
    expect(screen.queryAllByTestId("loading-dot")).toHaveLength(0);
  });

  it("응답을 기다리는 동안 알림 영역이 Loading...을 알린다", async () => {
    await selectGermanBerlinAndHoldForecast();

    await waitFor(() => expect(getStatus()).toHaveTextContent("Loading..."));
  });

  it("응답이 도착하면 알림 영역이 Weather for Berlin, Germany를 알린다", async () => {
    const forecastGate = await selectGermanBerlinAndHoldForecast();

    forecastGate.release();

    await waitFor(() =>
      expect(getStatus()).toHaveTextContent("Weather for Berlin, Germany"),
    );
  });
});

describe("검색 결과 없음", () => {
  it("날씨를 보던 중 결과 없는 지역명을 검색하면 No search result found!를 보이고 날씨 영역을 지운다", async () => {
    stubOpenMeteo();
    const user = await renderApp();

    await user.type(getSearchInput(), `${NO_RESULT_QUERY}{Enter}`);

    expect(
      await screen.findByText("No search result found!", OUTSIDE_STATUS),
    ).toBeInTheDocument();
    expect(screen.queryByText("Berlin, Germany")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily forecast")).not.toBeInTheDocument();
    expect(screen.queryByText("Hourly forecast")).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("결과가 없으면 알림 영역이 No search result found!를 알린다", async () => {
    stubOpenMeteo();
    const user = await renderApp();

    await user.type(getSearchInput(), `${NO_RESULT_QUERY}{Enter}`);

    await waitFor(() =>
      expect(getStatus()).toHaveTextContent("No search result found!"),
    );
  });
});

describe("날씨 응답 대기 중 다시 검색", () => {
  it("후보를 고른 뒤 날씨 응답 전에 Singapore를 검색해도 날씨가 도착하면 알림 영역이 Weather for Berlin, Germany를 알린다", async () => {
    const { gates } = stubOpenMeteo();
    const user = await renderApp();
    await searchAndWaitForCandidates(user, "Berlin");
    const forecastGate = createGate();
    gates.forecast = forecastGate.promise;
    await user.click(
      screen.getByRole("option", { name: "Berlin, State of Berlin, Germany" }),
    );
    await screen.findByText("Loading...", OUTSIDE_STATUS);

    await user.clear(getSearchInput());
    const listbox = await searchAndWaitForCandidates(user, "Singapore");
    expect(
      within(listbox).getByRole("option", { name: "Singapore, Singapore" }),
    ).toBeInTheDocument();

    forecastGate.release();

    expect(await screen.findByText("Berlin, Germany")).toBeInTheDocument();
    await waitFor(() =>
      expect(getStatus()).toHaveTextContent("Weather for Berlin, Germany"),
    );
  });

  it("후보를 고른 뒤 Singapore를 검색하고 날씨가 먼저 표시된 다음 후보 목록이 도착해도 알림 영역은 Weather for Berlin, Germany를 알린다", async () => {
    const { gates } = stubOpenMeteo();
    const user = await renderApp();
    await searchAndWaitForCandidates(user, "Berlin");
    const forecastGate = createGate();
    gates.forecast = forecastGate.promise;
    await user.click(
      screen.getByRole("option", { name: "Berlin, State of Berlin, Germany" }),
    );
    await screen.findByText("Loading...", OUTSIDE_STATUS);

    const geocodingGate = createGate();
    gates.geocoding = geocodingGate.promise;
    await user.clear(getSearchInput());
    await user.type(getSearchInput(), "Singapore{Enter}");
    await screen.findByText("Search in progress", OUTSIDE_STATUS);

    forecastGate.release();
    expect(await screen.findByText("Berlin, Germany")).toBeInTheDocument();

    geocodingGate.release();
    const listbox = await screen.findByRole("listbox");
    expect(
      within(listbox).getByRole("option", { name: "Singapore, Singapore" }),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(getStatus()).toHaveTextContent("Weather for Berlin, Germany"),
    );
  });
});
