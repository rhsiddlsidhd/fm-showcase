import type { Forecast } from "../api/forecast";
import type { Place } from "../api/geocoding";
import { BERLIN, placeLabel } from "./place";

// 화면 본문에 무엇을 보일지. 결과 없음과 지역 날씨는 함께 참이 될 수 없다.
export type Content =
  | { kind: "empty" }
  | { kind: "noResult" }
  | { kind: "place"; place: Place; forecast: Forecast | null };

// 알림 영역(role="status")이 알리는 내용.
export type Announcement =
  | { kind: "none" }
  | { kind: "searching" }
  | { kind: "loading" }
  | { kind: "noResult" }
  | { kind: "weather"; label: string };

export type AppError = { kind: "search" | "weather"; query: string | null };

// 검색창이 알리는 검색 한 번의 진행 단계.
export type SearchEvent =
  | { type: "searchStarted"; query: string }
  | { type: "searchResults" }
  | { type: "searchNoResult" }
  | { type: "searchFailed"; query: string };

export type WeatherAppEvent =
  | SearchEvent
  | { type: "placeSelected"; place: Place }
  | { type: "forecastLoaded"; place: Place; forecast: Forecast }
  | { type: "forecastFailed" }
  | { type: "retried" };

export type WeatherAppState = {
  content: Content;
  announcement: Announcement;
  error: AppError | null;
  // 날씨를 다시 요청할 때마다 늘어난다.
  forecastAttempt: number;
  // 오류 화면 뒤 검색창을 다시 띄울 때 넘기는 검색어.
  retry: { query: string | null } | undefined;
  // 진행 중인 검색의 검색어. 검색 중이 아니면 null.
  searchingQuery: string | null;
  // 다음 날씨 응답이 도착하면 알림 영역에 그 지역 날씨를 알린다.
  announceWeather: boolean;
  // 진행 중인 검색이 후보를 받으면 알릴 내용.
  pendingAnnouncement: Announcement | null;
};

export const initialWeatherAppState: WeatherAppState = {
  content: { kind: "place", place: BERLIN, forecast: null },
  announcement: { kind: "none" },
  error: null,
  forecastAttempt: 0,
  retry: undefined,
  searchingQuery: null,
  announceWeather: false,
  pendingAnnouncement: null,
};

const NONE: Announcement = { kind: "none" };

const weatherOf = (place: Place): Announcement => ({
  kind: "weather",
  label: placeLabel(place),
});

export const placeOf = (content: Content) =>
  content.kind === "place" ? content.place : null;

export const weatherAppReducer = (
  state: WeatherAppState,
  event: WeatherAppEvent,
): WeatherAppState => {
  switch (event.type) {
    case "searchStarted":
      return {
        ...state,
        searchingQuery: event.query,
        announcement: { kind: "searching" },
      };
    case "searchResults":
      return {
        ...state,
        searchingQuery: null,
        announcement: state.pendingAnnouncement ?? NONE,
        pendingAnnouncement: null,
        content:
          state.content.kind === "noResult" ? { kind: "empty" } : state.content,
      };
    case "searchNoResult":
      return {
        ...state,
        searchingQuery: null,
        announceWeather: false,
        pendingAnnouncement: null,
        content: { kind: "noResult" },
        announcement: { kind: "noResult" },
      };
    case "searchFailed":
      return {
        ...state,
        searchingQuery: null,
        error: { kind: "search", query: event.query },
        announcement: NONE,
      };
    case "placeSelected":
      return {
        ...state,
        searchingQuery: null,
        announceWeather: true,
        pendingAnnouncement: null,
        content: { kind: "place", place: event.place, forecast: null },
        announcement: { kind: "loading" },
      };
    case "forecastLoaded": {
      // 검색이 실패한 동안 도착한 날씨는 버리고 다시 시도 때 다시 요청한다.
      if (state.error?.kind === "search") return state;
      if (state.content.kind !== "place") return state;
      const weather = weatherOf(event.place);
      const announce = state.announceWeather;
      const { announcement } = state;
      return {
        ...state,
        content: { ...state.content, forecast: event.forecast },
        announceWeather: false,
        pendingAnnouncement:
          announce && state.searchingQuery !== null
            ? weather
            : state.pendingAnnouncement,
        announcement:
          announcement.kind === "loading" ||
          (announce && announcement.kind === "none")
            ? weather
            : announcement,
      };
    }
    case "forecastFailed":
      return {
        ...state,
        error: state.error ?? { kind: "weather", query: state.searchingQuery },
        searchingQuery: null,
        announcement: NONE,
      };
    case "retried": {
      const { error, content } = state;
      if (!error) return state;
      const forecast = content.kind === "place" ? content.forecast : null;
      const refetch = error.kind === "weather" || !forecast;
      return {
        ...state,
        announceWeather: refetch ? true : state.announceWeather,
        forecastAttempt: refetch
          ? state.forecastAttempt + 1
          : state.forecastAttempt,
        pendingAnnouncement:
          !refetch && content.kind === "place"
            ? weatherOf(content.place)
            : state.pendingAnnouncement,
        retry: { query: error.query },
        error: null,
      };
    }
  }
};
