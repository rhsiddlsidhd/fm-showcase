import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import {
  forecastBerlin1d,
  geocodingBerlin,
  geocodingNoResults,
  setupTestServer,
} from "@/shared/test";
import { WeatherAppPage } from "../index";

const server = setupTestServer();

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

const ERROR_TITLE = "Something went wrong";
const ERROR_DESCRIPTION =
  "We couldn't connect to the server (API error). Please try again in a few moments.";

// api-spec.md에 기록된 실제 HTTP 400 응답 본문.
const FORECAST_400_BODY = {
  reason: "Latitude must be in range of -90 to 90°. Given: 999.0.",
  error: true,
};
const GEOCODING_400_BODY = {
  error: true,
  reason:
    "Value was not of type 'Int' at path 'count'. Data found at 'count' was not Int.",
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

type ReplyKind = "ok" | "http400" | "network" | "notJson";

// 요청 하나에 줄 응답. wait가 있으면 그 약속이 풀린 뒤 응답한다.
type Reply = { kind: ReplyKind; wait?: Promise<void> };

const reply = (kind: ReplyKind, wait?: Promise<void>): Reply => ({
  kind,
  wait,
});

const respond = (
  kind: ReplyKind,
  okBody: JsonBodyType,
  errorBody: JsonBodyType,
) => {
  switch (kind) {
    case "ok":
      return HttpResponse.json(okBody);
    case "http400":
      return HttpResponse.json(errorBody, { status: 400 });
    case "network":
      return HttpResponse.error();
    case "notJson":
      return new HttpResponse("<html>not json</html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
  }
};

// Forecast·Geocoding 대역을 등록하고 받은 요청을 모은다.
// 요청이 들어온 순서대로 replies의 응답을 하나씩 쓰고, 다 쓰면 성공 응답을 준다.
// served에는 요청마다 대역이 응답을 돌려준 시점에 풀리는 약속이 쌓인다.
const stubOpenMeteo = ({
  forecast = [],
  geocoding = [],
}: { forecast?: Reply[]; geocoding?: Reply[] } = {}) => {
  const forecastRequests: URL[] = [];
  const geocodingRequests: URL[] = [];
  const geocodingServed: Promise<void>[] = [];
  server.use(
    http.get(FORECAST_URL, async ({ request }) => {
      forecastRequests.push(new URL(request.url));
      const next = forecast.shift() ?? reply("ok");
      await next.wait;
      return respond(next.kind, forecastBerlin1d, FORECAST_400_BODY);
    }),
    http.get(GEOCODING_URL, ({ request }) => {
      const url = new URL(request.url);
      geocodingRequests.push(url);
      const next = geocoding.shift() ?? reply("ok");
      const okBody =
        url.searchParams.get("name") === "Berlin"
          ? geocodingBerlin
          : geocodingNoResults;
      const response = (async () => {
        await next.wait;
        return respond(next.kind, okBody, GEOCODING_400_BODY);
      })();
      geocodingServed.push(response.then(() => undefined));
      return response;
    }),
  );
  return { forecastRequests, geocodingRequests, geocodingServed };
};

// 최초 진입 Berlin 날씨가 표시될 때까지 기다린 뒤 조작을 시작한다.
const renderAppLoaded = async () => {
  const user = userEvent.setup();
  render(<WeatherAppPage />);
  await screen.findByText("Berlin, Germany");
  return user;
};

// 최초 진입 응답을 기다리지 않고 렌더링만 한다.
const renderApp = () => {
  const user = userEvent.setup();
  render(<WeatherAppPage />);
  return user;
};

const getSearchInput = () => screen.getByRole("combobox");

const getRetryButton = () => screen.getByRole("button", { name: "Retry" });

// 알림 영역(role="status")을 뺀 화면 글자를 찾는다.
const OUTSIDE_STATUS = { ignore: '[role="status"]' };

const findErrorTitle = () => screen.findByText(ERROR_TITLE, OUTSIDE_STATUS);

const queryErrorTitle = () => screen.queryByText(ERROR_TITLE, OUTSIDE_STATUS);

// 오류 화면: 제목, 설명문, Retry 버튼.
const expectErrorScreen = async () => {
  expect(await findErrorTitle()).toBeInTheDocument();
  expect(
    screen.getByText(ERROR_DESCRIPTION, OUTSIDE_STATUS),
  ).toBeInTheDocument();
  expect(getRetryButton()).toBeInTheDocument();
};

const search = (user: User, query: string) =>
  user.type(getSearchInput(), `${query}{Enter}`);

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

const NO_RESULT_QUERY = "zzzqqqnonexistentplace";

const TODAY = "Wednesday, Nov 11, 2026";

describe("오류 화면 표시", () => {
  it("지역 검색이 HTTP 400으로 실패하면 오류 화면이 나오고 검색창이 사라진다", async () => {
    stubOpenMeteo({ geocoding: [reply("http400")] });
    const user = await renderAppLoaded();

    await search(user, "Berlin");

    await expectErrorScreen();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("지역 검색 요청이 네트워크 오류로 실패하면 오류 화면이 나온다", async () => {
    stubOpenMeteo({ geocoding: [reply("network")] });
    const user = await renderAppLoaded();

    await search(user, "Berlin");

    await expectErrorScreen();
  });

  it("지역 검색이 200이지만 본문이 JSON이 아니면 오류 화면이 나온다", async () => {
    stubOpenMeteo({ geocoding: [reply("notJson")] });
    const user = await renderAppLoaded();

    await search(user, "Berlin");

    await expectErrorScreen();
  });

  it.each([
    ["HTTP 400으로 실패하면", "http400"],
    ["네트워크 오류로 실패하면", "network"],
    ["200이지만 본문이 JSON이 아니면", "notJson"],
  ] as const)("날씨 요청이 %s 오류 화면이 나온다", async (_, kind) => {
    stubOpenMeteo({ forecast: [reply(kind)] });
    renderApp();

    await expectErrorScreen();
  });

  it("날씨 요청이 실패한 오류 화면에도 상단의 Units 버튼은 남는다", async () => {
    stubOpenMeteo({ forecast: [reply("http400")] });
    renderApp();

    await findErrorTitle();

    expect(screen.getByRole("button", { name: "Units" })).toBeInTheDocument();
  });

  it("오류 화면의 제목과 설명문은 alert 역할 요소로 알린다", async () => {
    stubOpenMeteo({ forecast: [reply("http400")] });
    renderApp();

    const alert = await screen.findByRole("alert");

    await waitFor(() => expect(alert).toHaveTextContent(ERROR_TITLE));
    expect(alert).toHaveTextContent(ERROR_DESCRIPTION);
  });
});

describe("Retry", () => {
  it("검색 실패 후 Retry를 누르면 같은 검색어로 다시 검색해 후보 목록을 보여준다", async () => {
    const { geocodingRequests } = stubOpenMeteo({
      geocoding: [reply("http400")],
    });
    const user = await renderAppLoaded();
    await search(user, "Berlin");
    await findErrorTitle();

    await user.click(getRetryButton());

    const listbox = await screen.findByRole("listbox");
    expect(
      within(listbox).getByRole("option", {
        name: "Berlin, State of Berlin, Germany",
      }),
    ).toBeInTheDocument();
    expect(
      geocodingRequests.map((url) => url.searchParams.get("name")),
    ).toEqual(["Berlin", "Berlin"]);
  });

  it("검색이 실패해 Retry를 눌렀다가 다시 실패해도 오류 화면이 다시 나오고, 한 번 더 Retry하면 후보 목록을 보여준다", async () => {
    const { geocodingRequests, forecastRequests } = stubOpenMeteo({
      geocoding: [reply("http400"), reply("http400")],
    });
    const user = await renderAppLoaded();
    await search(user, "Berlin");
    await findErrorTitle();

    await user.click(getRetryButton());
    await waitFor(() => expect(geocodingRequests).toHaveLength(2));
    await expectErrorScreen();
    await user.click(getRetryButton());

    const listbox = await screen.findByRole("listbox");
    expect(
      within(listbox).getByRole("option", {
        name: "Berlin, State of Berlin, Germany",
      }),
    ).toBeInTheDocument();
    expect(queryErrorTitle()).not.toBeInTheDocument();
    expect(
      geocodingRequests.map((url) => url.searchParams.get("name")),
    ).toEqual(["Berlin", "Berlin", "Berlin"]);
    expect(forecastRequests).toHaveLength(1);
  });

  it("검색이 실패해 Retry를 눌렀을 때 결과가 없으면 오류 화면 대신 No search result found!를 보여주고 날씨 영역은 비어 있다", async () => {
    const { geocodingRequests } = stubOpenMeteo({
      geocoding: [reply("http400")],
    });
    const user = await renderAppLoaded();
    await search(user, NO_RESULT_QUERY);
    await findErrorTitle();

    await user.click(getRetryButton());

    expect(
      await screen.findByText("No search result found!", OUTSIDE_STATUS),
    ).toBeInTheDocument();
    expect(queryErrorTitle()).not.toBeInTheDocument();
    expect(screen.queryByText("Berlin, Germany")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily forecast")).not.toBeInTheDocument();
    expect(screen.queryByText("Hourly forecast")).not.toBeInTheDocument();
    expect(
      geocodingRequests.map((url) => url.searchParams.get("name")),
    ).toEqual([NO_RESULT_QUERY, NO_RESULT_QUERY]);
  });

  it("날씨 표시 중 검색이 실패하면 Retry 때 날씨는 다시 요청하지 않는다", async () => {
    const { forecastRequests } = stubOpenMeteo({
      geocoding: [reply("http400")],
    });
    const user = await renderAppLoaded();
    await search(user, "Berlin");
    await findErrorTitle();

    await user.click(getRetryButton());
    await screen.findByRole("listbox");

    expect(forecastRequests).toHaveLength(1);
  });

  it("고른 후보의 날씨 요청이 실패한 뒤 Retry를 누르면 같은 좌표로 날씨만 다시 요청해 보여준다", async () => {
    const { forecastRequests, geocodingRequests } = stubOpenMeteo({
      forecast: [reply("ok"), reply("http400")],
    });
    const user = await renderAppLoaded();
    await search(user, "Berlin");
    await user.click(
      await screen.findByRole("option", {
        name: "Berlin, New Hampshire, United States",
      }),
    );
    await findErrorTitle();

    await user.click(getRetryButton());

    expect(
      await screen.findByText("Berlin, United States"),
    ).toBeInTheDocument();
    expect(forecastRequests).toHaveLength(3);
    for (const url of forecastRequests.slice(1)) {
      expect(url.searchParams.get("latitude")).toBe("44.46867");
      expect(url.searchParams.get("longitude")).toBe("-71.18508");
    }
    expect(geocodingRequests).toHaveLength(1);
  });

  it("Retry를 누르면 오류 화면이 사라지고 포커스가 검색 입력으로 간다", async () => {
    stubOpenMeteo({ forecast: [reply("http400")] });
    const user = renderApp();
    await findErrorTitle();

    await user.click(getRetryButton());

    await waitFor(() => expect(getSearchInput()).toHaveFocus());
    expect(queryErrorTitle()).not.toBeInTheDocument();
  });
});

describe("최초 진입 실패", () => {
  it("처음 Berlin 날씨 요청이 실패하면 오류 화면이 나오고 Retry가 성공하면 Berlin 날씨를 보여준다", async () => {
    const { forecastRequests } = stubOpenMeteo({
      forecast: [reply("http400")],
    });
    const user = renderApp();
    await expectErrorScreen();

    await user.click(getRetryButton());

    expect(await screen.findByText("Berlin, Germany")).toBeInTheDocument();
    expect(queryErrorTitle()).not.toBeInTheDocument();
    expect(forecastRequests).toHaveLength(2);
    expect(forecastRequests[1].searchParams.get("latitude")).toBe("52.52437");
    expect(forecastRequests[1].searchParams.get("longitude")).toBe("13.41053");
  });
});

describe("오류 화면에서 단위 변경", () => {
  it("오류 화면에서 Fahrenheit를 고른 뒤 Retry가 성공하면 기온을 화씨로 보여준다", async () => {
    stubOpenMeteo({ forecast: [reply("http400")] });
    const user = renderApp();
    await findErrorTitle();

    await user.click(screen.getByRole("button", { name: "Units" }));
    const menu = await screen.findByRole("menu");
    await user.click(
      within(menu).getByRole("menuitemradio", { name: "Fahrenheit (°F)" }),
    );
    // 항목을 고르면 메뉴가 닫힌다.
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    await user.click(getRetryButton());

    // 1일 fixture 현재 기온 2.3°C → 36.14°F
    expect(
      await findGroup(["Berlin, Germany", TODAY, "36°"], { withImage: true }),
    ).toBeInTheDocument();
  });
});

describe("오류 중 진행 중이던 다른 요청", () => {
  // 최초 Berlin 날씨 응답을 붙잡아 둔 채 검색을 실행하고, 날씨가 HTTP 400으로 실패한 뒤에 검색 응답이 도착하게 한다.
  const failWeatherWhileSearching = async () => {
    const forecastGate = createGate();
    const geocodingGate = createGate();
    const stub = stubOpenMeteo({
      forecast: [reply("http400", forecastGate.promise)],
      geocoding: [reply("ok", geocodingGate.promise)],
    });
    const user = renderApp();
    await search(user, "Berlin");
    await waitFor(() => expect(stub.geocodingRequests).toHaveLength(1));

    forecastGate.release();
    await findErrorTitle();
    geocodingGate.release();
    await settle(stub.geocodingServed[0]);

    return { ...stub, user };
  };

  it("날씨 요청이 실패한 뒤 도착한 검색 응답은 무시해 오류 화면을 유지하고, Retry를 누르면 검색과 날씨를 같은 입력으로 다시 요청해 날씨와 후보 목록을 보여준다", async () => {
    const { user, forecastRequests, geocodingRequests } =
      await failWeatherWhileSearching();

    expect(screen.getByText(ERROR_TITLE, OUTSIDE_STATUS)).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(getRetryButton());

    expect(await screen.findByText("Berlin, Germany")).toBeInTheDocument();
    const listbox = await screen.findByRole("listbox");
    expect(
      within(listbox).getByRole("option", {
        name: "Berlin, State of Berlin, Germany",
      }),
    ).toBeInTheDocument();
    expect(
      geocodingRequests.map((url) => url.searchParams.get("name")),
    ).toEqual(["Berlin", "Berlin"]);
    expect(forecastRequests).toHaveLength(2);
    expect(forecastRequests[1].searchParams.get("latitude")).toBe("52.52437");
    expect(forecastRequests[1].searchParams.get("longitude")).toBe("13.41053");
  });
});

describe("오류 화면이 나타날 때의 포커스", () => {
  it.each([
    ["HTTP 400으로 실패하면", "http400"],
    ["네트워크 오류로 실패하면", "network"],
  ] as const)(
    "지역 검색이 %s 오류 화면의 Retry 버튼으로 포커스가 이동한다",
    async (_, kind) => {
      stubOpenMeteo({ geocoding: [reply(kind)] });
      const user = await renderAppLoaded();

      await search(user, "Berlin");
      await findErrorTitle();

      await waitFor(() => expect(getRetryButton()).toHaveFocus());
    },
  );

  it("처음 날씨 요청이 HTTP 400으로 실패하면 오류 화면의 Retry 버튼으로 포커스가 이동한다", async () => {
    stubOpenMeteo({ forecast: [reply("http400")] });
    renderApp();

    await findErrorTitle();

    await waitFor(() => expect(getRetryButton()).toHaveFocus());
  });
});

describe("Retry 뒤 날씨 알림", () => {
  it("처음 날씨 요청이 실패한 뒤 Retry로 Berlin 날씨가 표시되면 알림 영역이 Weather for Berlin, Germany를 알린다", async () => {
    stubOpenMeteo({ forecast: [reply("http400")] });
    const user = renderApp();
    await findErrorTitle();

    await user.click(getRetryButton());

    expect(
      await screen.findByText("Berlin, Germany", OUTSIDE_STATUS),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("status").textContent?.trim()).toBe(
        "Weather for Berlin, Germany",
      ),
    );
  });

  it("날씨 표시 중 검색이 실패한 뒤 Retry로 오류 화면이 사라지고 날씨가 다시 보이면 후보 목록이 나온 뒤에도 알림 영역이 Weather for Berlin, Germany를 알린다", async () => {
    stubOpenMeteo({ geocoding: [reply("http400")] });
    const user = await renderAppLoaded();
    await search(user, "Berlin");
    await findErrorTitle();

    await user.click(getRetryButton());

    await screen.findByRole("listbox");
    expect(
      await screen.findByText("Berlin, Germany", OUTSIDE_STATUS),
    ).toBeInTheDocument();
    expect(queryErrorTitle()).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("status").textContent?.trim()).toBe(
        "Weather for Berlin, Germany",
      ),
    );
  });
});

describe("오류 화면이 나타날 때의 알림 영역", () => {
  const getStatus = () => screen.getByRole("status");

  it("검색 중 알림이 있다가 지역 검색이 실패하면 알림 영역이 비워진다", async () => {
    const geocodingGate = createGate();
    stubOpenMeteo({ geocoding: [reply("http400", geocodingGate.promise)] });
    const user = await renderAppLoaded();
    await search(user, "Berlin");
    await waitFor(() =>
      expect(getStatus()).toHaveTextContent("Search in progress"),
    );

    geocodingGate.release();
    await findErrorTitle();

    expect(getStatus()).toBeEmptyDOMElement();
  });

  it("날씨 로딩 알림이 있다가 고른 후보의 날씨 요청이 실패하면 알림 영역이 비워진다", async () => {
    const forecastGate = createGate();
    stubOpenMeteo({
      forecast: [reply("ok"), reply("http400", forecastGate.promise)],
    });
    const user = await renderAppLoaded();
    await search(user, "Berlin");
    await user.click(
      await screen.findByRole("option", {
        name: "Berlin, New Hampshire, United States",
      }),
    );
    await waitFor(() => expect(getStatus()).toHaveTextContent("Loading..."));

    forecastGate.release();
    await findErrorTitle();

    expect(getStatus()).toBeEmptyDOMElement();
  });
});
