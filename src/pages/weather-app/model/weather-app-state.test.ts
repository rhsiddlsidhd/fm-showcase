import { describe, expect, it } from "vitest";
import type { Forecast } from "../api/forecast";
import type { Place } from "../api/geocoding";
import {
  initialWeatherAppState,
  weatherAppReducer,
  type WeatherAppEvent,
} from "./weather-app-state";

// 회귀 테스트: 리팩터링 전 현재 동작을 고정한다. 상태는 초기 상태에서 이벤트를 흘려 만든다.
const paris: Place = {
  name: "Paris",
  country: "France",
  latitude: 48.85,
  longitude: 2.35,
};
const tokyo: Place = {
  name: "Tokyo",
  country: "Japan",
  latitude: 35.68,
  longitude: 139.69,
};
const forecast: Forecast = {
  current: {
    time: "2026-01-01T00:00",
    temperature_2m: 10,
    apparent_temperature: 9,
    relative_humidity_2m: 50,
    wind_speed_10m: 3,
    precipitation: 0,
    weather_code: 0,
  },
  daily: {
    time: [],
    weather_code: [],
    temperature_2m_max: [],
    temperature_2m_min: [],
  },
  hourly: { time: [], temperature_2m: [], weather_code: [] },
};

const run = (...events: WeatherAppEvent[]) =>
  events.reduce(weatherAppReducer, initialWeatherAppState);

const selected = (place: Place): WeatherAppEvent => ({
  type: "placeSelected",
  place,
});
const loaded = (place: Place): WeatherAppEvent => ({
  type: "forecastLoaded",
  place,
  forecast,
});
const searchStarted = (query: string): WeatherAppEvent => ({
  type: "searchStarted",
  query,
});
const WEATHER_PARIS = { kind: "weather", label: "Paris, France" };

describe("날씨 앱 상태 전이", () => {
  describe("초기 상태", () => {
    it("베를린 본문, 알림 없음, 오류 없음, 검색 중 아님으로 시작한다", () => {
      expect(initialWeatherAppState.content).toMatchObject({
        kind: "place",
        place: { name: "Berlin" },
        forecast: null,
      });
      expect(initialWeatherAppState.announcement).toEqual({ kind: "none" });
      expect(initialWeatherAppState.error).toBeNull();
      expect(initialWeatherAppState.searchingQuery).toBeNull();
      expect(initialWeatherAppState.forecastAttempt).toBe(0);
    });
  });

  describe("지역 선택 뒤 날씨 도착", () => {
    it("지역을 고르면 날씨를 비우고 불러오는 중을 알린다", () => {
      const state = run(searchStarted("par"), selected(paris));

      expect(state.content).toEqual({
        kind: "place",
        place: paris,
        forecast: null,
      });
      expect(state.announcement).toEqual({ kind: "loading" });
      expect(state.searchingQuery).toBeNull();
    });

    it("지역을 고른 뒤 날씨가 도착하면 그 지역 날씨를 알린다", () => {
      const state = run(selected(paris), loaded(paris));

      expect(state.announcement).toEqual(WEATHER_PARIS);
      expect(state.content).toEqual({ kind: "place", place: paris, forecast });
    });

    it("이미 알린 뒤 다른 날씨가 도착해도 알림을 바꾸지 않는다", () => {
      const state = run(selected(paris), loaded(paris), loaded(tokyo));

      expect(state.announcement).toEqual(WEATHER_PARIS);
    });

    it("지역을 다시 고르면 대기 중이던 날씨 알림을 버리고 새 지역 날씨를 알린다", () => {
      const state = run(
        selected(paris),
        searchStarted("tok"),
        loaded(paris),
        selected(tokyo),
        loaded(tokyo),
      );

      expect(state.announcement).toEqual({
        kind: "weather",
        label: "Tokyo, Japan",
      });
    });
  });

  describe("선택 없이 날씨 도착", () => {
    it("지역 선택 없이 날씨가 도착하면 날씨만 채우고 알리지 않는다", () => {
      const state = run(loaded(paris));

      expect(state.announcement).toEqual({ kind: "none" });
      expect(state.content).toMatchObject({ kind: "place", forecast });
    });

    it("검색 중에 선택 없이 날씨가 도착해도 검색 결과가 오면 알림이 없다", () => {
      const state = run(searchStarted("par"), loaded(paris), {
        type: "searchResults",
      });

      expect(state.announcement).toEqual({ kind: "none" });
    });

    it("날씨가 알려진 뒤 날씨가 다시 도착해도 알리지 않는다", () => {
      const state = run(loaded(paris), loaded(paris));

      expect(state.announcement).toEqual({ kind: "none" });
    });
  });

  describe("검색 중 날씨와 검색 결과의 도착 순서", () => {
    it("검색을 시작하면 검색 중을 알리고 검색어를 기억한다", () => {
      const state = run(searchStarted("par"));

      expect(state.announcement).toEqual({ kind: "searching" });
      expect(state.searchingQuery).toBe("par");
    });

    it("검색 결과보다 날씨가 먼저 오면 검색 결과가 올 때까지 검색 중 알림을 유지하고, 결과가 오면 날씨를 알린다", () => {
      const afterForecast = run(
        selected(paris),
        searchStarted("tok"),
        loaded(paris),
      );
      const afterResults = weatherAppReducer(afterForecast, {
        type: "searchResults",
      });

      expect(afterForecast.announcement).toEqual({ kind: "searching" });
      expect(afterResults.announcement).toEqual(WEATHER_PARIS);
      expect(afterResults.searchingQuery).toBeNull();
    });

    it("날씨보다 검색 결과가 먼저 오면 알림을 비우고, 날씨가 오면 날씨를 알린다", () => {
      const afterResults = run(selected(paris), searchStarted("tok"), {
        type: "searchResults",
      });
      const afterForecast = weatherAppReducer(afterResults, loaded(paris));

      expect(afterResults.announcement).toEqual({ kind: "none" });
      expect(afterForecast.announcement).toEqual(WEATHER_PARIS);
    });

    it("날씨를 이미 알린 뒤 새 검색의 결과가 오면 알림을 비운다", () => {
      const state = run(selected(paris), loaded(paris), searchStarted("tok"), {
        type: "searchResults",
      });

      expect(state.announcement).toEqual({ kind: "none" });
    });

    it("검색 결과가 오면 대기 중이던 날씨 알림은 한 번만 쓰이고 다음 검색 결과는 알리지 않는다", () => {
      const state = run(
        selected(paris),
        searchStarted("tok"),
        loaded(paris),
        { type: "searchResults" },
        searchStarted("osa"),
        { type: "searchResults" },
      );

      expect(state.announcement).toEqual({ kind: "none" });
    });
  });

  describe("검색 결과 없음", () => {
    it("결과가 없으면 본문과 알림을 결과 없음으로 바꾸고 검색 중을 끝낸다", () => {
      const state = run(searchStarted("zzz"), { type: "searchNoResult" });

      expect(state.content).toEqual({ kind: "noResult" });
      expect(state.announcement).toEqual({ kind: "noResult" });
      expect(state.searchingQuery).toBeNull();
    });

    it("결과 없음 뒤에 날씨가 도착해도 상태를 바꾸지 않는다", () => {
      const before = run(searchStarted("zzz"), { type: "searchNoResult" });

      expect(weatherAppReducer(before, loaded(paris))).toEqual(before);
    });

    it("결과 없음은 대기 중이던 날씨 알림을 버린다", () => {
      const state = run(
        selected(paris),
        searchStarted("zzz"),
        loaded(paris),
        { type: "searchNoResult" },
        searchStarted("tok"),
        { type: "searchResults" },
      );

      expect(state.announcement).toEqual({ kind: "none" });
    });

    it("결과 없음 뒤 다음 검색에 결과가 오면 본문을 빈 화면으로 되돌린다", () => {
      const state = run(
        searchStarted("zzz"),
        { type: "searchNoResult" },
        searchStarted("par"),
        { type: "searchResults" },
      );

      expect(state.content).toEqual({ kind: "empty" });
      expect(state.announcement).toEqual({ kind: "none" });
    });

    it("결과 없음 뒤 지역을 고르면 날씨 알림이 다시 켜진다", () => {
      const state = run(
        searchStarted("zzz"),
        { type: "searchNoResult" },
        selected(paris),
        loaded(paris),
      );

      expect(state.announcement).toEqual(WEATHER_PARIS);
    });
  });

  describe("검색 실패", () => {
    it("검색이 실패하면 검색어를 담은 검색 오류를 두고 알림을 비우며 검색 중을 끝낸다", () => {
      const state = run(searchStarted("par"), {
        type: "searchFailed",
        query: "par",
      });

      expect(state.error).toEqual({ kind: "search", query: "par" });
      expect(state.announcement).toEqual({ kind: "none" });
      expect(state.searchingQuery).toBeNull();
    });

    it("검색 오류 동안 도착한 날씨는 버린다", () => {
      const before = run(searchStarted("par"), {
        type: "searchFailed",
        query: "par",
      });

      expect(weatherAppReducer(before, loaded(paris))).toEqual(before);
    });
  });

  describe("날씨 실패", () => {
    it("검색 중 날씨가 실패하면 검색어를 오류에 담고 검색 중과 알림을 끝낸다", () => {
      const state = run(searchStarted("par"), { type: "forecastFailed" });

      expect(state.error).toEqual({ kind: "weather", query: "par" });
      expect(state.searchingQuery).toBeNull();
      expect(state.announcement).toEqual({ kind: "none" });
    });

    it("검색 중이 아닐 때 날씨가 실패하면 검색어 없는 날씨 오류를 둔다", () => {
      const state = run(selected(paris), { type: "forecastFailed" });

      expect(state.error).toEqual({ kind: "weather", query: null });
      expect(state.announcement).toEqual({ kind: "none" });
    });

    it("이미 검색 오류가 있으면 날씨가 실패해도 검색 오류를 유지한다", () => {
      const state = run(
        searchStarted("par"),
        { type: "searchFailed", query: "par" },
        { type: "forecastFailed" },
      );

      expect(state.error).toEqual({ kind: "search", query: "par" });
    });
  });

  describe("다시 시도", () => {
    it("오류가 없으면 상태를 바꾸지 않는다", () => {
      const before = run(selected(paris), loaded(paris));

      expect(weatherAppReducer(before, { type: "retried" })).toBe(before);
    });

    it("날씨 오류 뒤 다시 시도하면 날씨를 다시 요청하고 검색어를 넘기며, 도착한 날씨를 알린다", () => {
      const failed = run(searchStarted("par"), { type: "forecastFailed" });
      const retried = weatherAppReducer(failed, { type: "retried" });
      const arrived = weatherAppReducer(retried, loaded(paris));

      expect(retried.error).toBeNull();
      expect(retried.forecastAttempt).toBe(1);
      expect(retried.retry).toEqual({ query: "par" });
      expect(arrived.announcement).toEqual(WEATHER_PARIS);
    });

    it("날씨가 없는 상태의 검색 오류 뒤 다시 시도하면 날씨를 다시 요청한다", () => {
      const failed = run(selected(paris), searchStarted("tok"), {
        type: "searchFailed",
        query: "tok",
      });
      const retried = weatherAppReducer(failed, { type: "retried" });

      expect(retried.error).toBeNull();
      expect(retried.forecastAttempt).toBe(1);
      expect(retried.retry).toEqual({ query: "tok" });
    });

    it("날씨가 있는 상태의 검색 오류 뒤 다시 시도하면 날씨를 다시 요청하지 않고, 검색 결과가 오면 그 날씨를 알린다", () => {
      const failed = run(selected(paris), loaded(paris), searchStarted("tok"), {
        type: "searchFailed",
        query: "tok",
      });
      const retried = weatherAppReducer(failed, { type: "retried" });
      const afterResults = weatherAppReducer(retried, {
        type: "searchResults",
      });

      expect(retried.error).toBeNull();
      expect(retried.forecastAttempt).toBe(0);
      expect(retried.retry).toEqual({ query: "tok" });
      expect(afterResults.announcement).toEqual(WEATHER_PARIS);
    });

    it("검색 오류 뒤 다시 시도한 직후에는 알림이 비어 있다", () => {
      const failed = run(selected(paris), loaded(paris), searchStarted("tok"), {
        type: "searchFailed",
        query: "tok",
      });

      expect(
        weatherAppReducer(failed, { type: "retried" }).announcement,
      ).toEqual({ kind: "none" });
    });
  });
});
