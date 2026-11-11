import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import {
  forecastBerlin1d,
  geocodingBerlin,
  geocodingNoResults,
  geocodingSingapore,
  setupTestServer,
} from "@/shared/test";
import { WeatherAppPage } from "../index";

const server = setupTestServer();

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

const GEOCODING_BY_NAME: Record<string, JsonBodyType> = {
  Berlin: geocodingBerlin,
  Singapore: geocodingSingapore,
};

// 늦게 도착할 이전 날씨 응답. 1일 fixture에서 현재 날씨 값만 바꿔 두 응답을 구별한다.
const forecastStale = {
  ...forecastBerlin1d,
  current: {
    ...forecastBerlin1d.current,
    temperature_2m: 20.0,
    apparent_temperature: 18.0,
    relative_humidity_2m: 40,
    wind_speed_10m: 30.0,
    precipitation: 5.0,
  },
};

type User = ReturnType<typeof userEvent.setup>;

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

// 요청 하나에 줄 응답. wait가 있으면 그 약속이 풀린 뒤 응답한다.
type Reply = { body?: JsonBodyType; wait?: Promise<void> };

// Forecast·Geocoding 대역을 등록하고 받은 요청을 모은다.
// 요청이 들어온 순서대로 replies의 응답을 하나씩 쓰고, 다 쓰면 1일 fixture·검색어별 fixture로 바로 응답한다.
// served에는 요청마다 대역이 응답을 돌려준 시점에 풀리는 약속이 쌓인다.
const stubOpenMeteo = ({
  forecast = [],
  geocoding = [],
}: { forecast?: Reply[]; geocoding?: Reply[] } = {}) => {
  const forecastRequests: URL[] = [];
  const geocodingRequests: URL[] = [];
  const forecastServed: Promise<void>[] = [];
  const geocodingServed: Promise<void>[] = [];

  const serve = (served: Promise<void>[], next: Reply, body: JsonBodyType) => {
    const response = (async () => {
      await next.wait;
      return HttpResponse.json(next.body ?? body);
    })();
    served.push(response.then(() => undefined));
    return response;
  };

  server.use(
    http.get(FORECAST_URL, ({ request }) => {
      forecastRequests.push(new URL(request.url));
      return serve(forecastServed, forecast.shift() ?? {}, forecastBerlin1d);
    }),
    http.get(GEOCODING_URL, ({ request }) => {
      const url = new URL(request.url);
      geocodingRequests.push(url);
      const name = url.searchParams.get("name") ?? "";
      return serve(
        geocodingServed,
        geocoding.shift() ?? {},
        GEOCODING_BY_NAME[name] ?? geocodingNoResults,
      );
    }),
  );
  return {
    forecastRequests,
    geocodingRequests,
    forecastServed,
    geocodingServed,
  };
};

// 최초 진입 Berlin 날씨가 표시될 때까지 기다린 뒤 조작을 시작한다.
const renderAppLoaded = async () => {
  const user = userEvent.setup();
  render(<WeatherAppPage />);
  await screen.findByText("Berlin, Germany");
  return user;
};

const getSearchInput = () => screen.getByRole("combobox");

const search = async (user: User, query: string) => {
  await user.clear(getSearchInput());
  await user.type(getSearchInput(), `${query}{Enter}`);
};

const selectCandidate = async (user: User, name: string) => {
  await user.click(await screen.findByRole("option", { name }));
};

// 대역이 응답을 돌려준 뒤 앱이 응답을 처리할 시간을 준다.
const settle = async (served: Promise<void>) => {
  await served;
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
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

describe("늦게 도착한 이전 검색 응답", () => {
  it("검색 중에 새 검색을 실행하면 이전 검색 응답이 나중에 도착해도 새 검색의 후보만 보여준다", async () => {
    const firstSearchGate = createGate();
    const { geocodingRequests, geocodingServed } = stubOpenMeteo({
      geocoding: [{ wait: firstSearchGate.promise }],
    });
    const user = await renderAppLoaded();

    await search(user, "Berlin");
    await waitFor(() => expect(geocodingRequests).toHaveLength(1));
    await search(user, "Singapore");
    await screen.findByRole("option", { name: "Singapore, Singapore" });

    firstSearchGate.release();
    await settle(geocodingServed[0]);

    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "Singapore, Singapore",
    ]);
  });
});

describe("늦게 도착한 이전 날씨 응답", () => {
  // 첫 후보(Berlin, Germany)의 날씨 응답을 붙잡아 둔 채 다시 검색해 둘째 후보(Berlin, United States)를 고르고,
  // 둘째 후보의 날씨가 표시된 뒤에 첫 후보의 날씨 응답이 도착하게 한다.
  const selectAnotherWhileLoading = async () => {
    const firstWeatherGate = createGate();
    const { forecastRequests, forecastServed } = stubOpenMeteo({
      forecast: [{}, { body: forecastStale, wait: firstWeatherGate.promise }],
    });
    const user = await renderAppLoaded();

    await search(user, "Berlin");
    await selectCandidate(user, "Berlin, State of Berlin, Germany");
    await waitFor(() => expect(forecastRequests).toHaveLength(2));
    await search(user, "Berlin");
    await selectCandidate(user, "Berlin, New Hampshire, United States");
    await screen.findByText("Berlin, United States");

    firstWeatherGate.release();
    await settle(forecastServed[1]);
  };

  it("날씨를 불러오는 중에 다른 후보를 고르면 이전 후보의 날씨 응답이 나중에 도착해도 새 후보의 날씨만 보여준다", async () => {
    await selectAnotherWhileLoading();

    // 1일 fixture 현재 기온 2.3°C → "2°"
    expect(
      await findGroup(["Berlin, United States", TODAY, "2°"], {
        withImage: true,
      }),
    ).toBeInTheDocument();
    expect(await findGroup(["Feels Like", "-1°"])).toBeInTheDocument();
    expect(screen.queryByText("Berlin, Germany")).not.toBeInTheDocument();
  });
});
