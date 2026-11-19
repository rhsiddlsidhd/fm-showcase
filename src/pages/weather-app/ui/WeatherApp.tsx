import { MotionConfig } from "motion/react";
import { useState } from "react";
import { placeLabel } from "../model/place";
import { METRIC, type Units } from "../model/units";
import { useWeatherApp } from "../model/use-weather-app";
import type { Announcement } from "../model/weather-app-state";
import { LOGO } from "./assets";
import { CurrentWeather } from "./CurrentWeather";
import { DailyForecast } from "./DailyForecast";
import { ErrorScreen } from "./ErrorScreen";
import { HourlyForecast } from "./HourlyForecast";
import { SearchBox } from "./SearchBox";
import { UnitsMenu } from "./UnitsMenu";

const NO_RESULT = "No search result found!";

const announcementText = (announcement: Announcement) => {
  switch (announcement.kind) {
    case "none":
      return "";
    case "searching":
      return "Search in progress";
    case "loading":
      return "Loading...";
    case "noResult":
      return NO_RESULT;
    case "weather":
      return `Weather for ${announcement.label}`;
  }
};

export const WeatherApp = () => {
  const { state, dispatch } = useWeatherApp();
  const [units, setUnits] = useState<Units>(METRIC);
  const { content, error } = state;

  return (
    <MotionConfig reducedMotion="user">
      <main className="theme-weather-app dark bg-background text-foreground min-h-dvh font-sans text-base">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-4 lg:gap-12 lg:px-8 lg:py-12">
          <header className="flex items-center justify-between">
            <img src={LOGO} alt="Weather Now" className="h-7 lg:h-10" />
            <UnitsMenu units={units} onChange={setUnits} />
          </header>
          {!error && (
            <h1 className="font-heading text-center text-5xl/tight font-bold lg:text-6xl">
              How&apos;s the sky looking today?
            </h1>
          )}
          {!error && (
            <SearchBox
              retry={state.retry}
              searching={state.searchingQuery !== null}
              onEvent={dispatch}
              onSelect={(place) => dispatch({ type: "placeSelected", place })}
            />
          )}
          <p role="status" className="sr-only">
            {announcementText(state.announcement)}
          </p>
          {error ? (
            <ErrorScreen onRetry={() => dispatch({ type: "retried" })} />
          ) : content.kind === "noResult" ? (
            <p className="pt-4 text-center text-2xl font-bold">{NO_RESULT}</p>
          ) : (
            content.kind === "place" && (
              <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                <div className="flex min-w-0 flex-col gap-8 lg:gap-12">
                  <CurrentWeather
                    label={placeLabel(content.place)}
                    current={content.forecast?.current ?? null}
                    units={units}
                  />
                  <DailyForecast
                    daily={content.forecast?.daily ?? null}
                    units={units}
                  />
                </div>
                <HourlyForecast forecast={content.forecast} units={units} />
              </div>
            )
          )}
        </div>
      </main>
    </MotionConfig>
  );
};
