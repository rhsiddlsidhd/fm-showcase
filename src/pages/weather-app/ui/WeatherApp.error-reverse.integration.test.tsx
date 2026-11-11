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

type ReplyKind = "ok" | "http400";

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
) =>
  kind === "ok"
    ? HttpResponse.json(okBody)
    : HttpResponse.json(errorBody, { status: 400 });

// Forecast·Geocoding 대역을 등록하고 받은 요청을 모은다.
// 요청이 들어온 순서대로 replies의 응답을 하나씩 쓰고, 다 쓰면 성공 응답을 준다.
// forecastServed에는 요청마다 대역이 응답을 돌려준 시점에 풀리는 약속이 쌓인다.
const stubOpenMeteo = ({
  forecast = [],
  geocoding = [],
}: { forecast?: Reply[]; geocoding?: Reply[] } = {}) => {
  const forecastRequests: URL[] = [];
  const geocodingRequests: URL[] = [];
  const forecastServed: Promise<void>[] = [];
  server.use(
    http.get(FORECAST_URL, ({ request }) => {
      forecastRequests.push(new URL(request.url));
      const next = forecast.shift() ?? reply("ok");
      const response = (async () => {
        await next.wait;
        return respond(next.kind, forecastBerlin1d, FORECAST_400_BODY);
      })();
      forecastServed.push(response.then(() => undefined));
      return response;
    }),
    http.get(GEOCODING_URL, async ({ request }) => {
      const url = new URL(request.url);
      geocodingRequests.push(url);
      const next = geocoding.shift() ?? reply("ok");
      await next.wait;
      const okBody =
        url.searchParams.get("name") === "Berlin"
          ? geocodingBerlin
          : geocodingNoResults;
      return respond(next.kind, okBody, GEOCODING_400_BODY);
    }),
  );
  return { forecastRequests, geocodingRequests, forecastServed };
};

const getRetryButton = () => screen.getByRole("button", { name: "Retry" });

// 알림 영역(role="status")을 뺀 화면 글자를 찾는다.
const OUTSIDE_STATUS = { ignore: '[role="status"]' };

const findErrorTitle = () => screen.findByText(ERROR_TITLE, OUTSIDE_STATUS);

// 대역이 응답을 돌려준 뒤 앱이 응답을 처리할 시간을 준다.
const settle = async (served: Promise<void>) => {
  await served;
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
};

// 최초 Berlin 날씨 응답을 붙잡아 둔 채 검색을 실행하고, 검색이 HTTP 400으로 실패한 뒤에 날씨 응답이 도착하게 한다.
const failSearchWhileLoadingWeather = async (retryForecast: Reply[] = []) => {
  const forecastGate = createGate();
  const stub = stubOpenMeteo({
    forecast: [reply("ok", forecastGate.promise), ...retryForecast],
    geocoding: [reply("http400")],
  });
  const user = userEvent.setup();
  render(<WeatherAppPage />);
  await waitFor(() => expect(stub.forecastRequests).toHaveLength(1));
  await user.type(screen.getByRole("combobox"), "Berlin{Enter}");

  await findErrorTitle();
  forecastGate.release();
  await settle(stub.forecastServed[0]);

  return { ...stub, user };
};

describe("날씨를 불러오는 중 검색 실패", () => {
  it("검색이 실패한 뒤 도착한 날씨 응답은 무시해 오류 화면을 유지하고, Retry를 누르면 검색과 날씨를 같은 입력으로 다시 요청해 날씨와 후보 목록을 보여준다", async () => {
    const { user, forecastRequests, geocodingRequests } =
      await failSearchWhileLoadingWeather();

    expect(screen.getByText(ERROR_TITLE, OUTSIDE_STATUS)).toBeInTheDocument();
    expect(
      screen.queryByText("Berlin, Germany", OUTSIDE_STATUS),
    ).not.toBeInTheDocument();

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

  it("그 상태에서 Retry 때 날씨 요청이 다시 실패하면 오류 화면이 다시 나온다", async () => {
    const { user, forecastRequests, forecastServed } =
      await failSearchWhileLoadingWeather([reply("http400")]);

    await user.click(getRetryButton());
    await waitFor(() => expect(forecastRequests).toHaveLength(2));
    await settle(forecastServed[1]);

    expect(await findErrorTitle()).toBeInTheDocument();
  });
});
