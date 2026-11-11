import { useEffect, useRef, useState } from "react";
import { fetchForecast, type Forecast } from "../api/forecast";
import type { Place } from "../api/geocoding";
import { BERLIN, placeLabel } from "../model/place";
import { METRIC, type Units } from "../model/units";
import { CurrentWeather } from "./CurrentWeather";
import { DailyForecast } from "./DailyForecast";
import { ErrorScreen } from "./ErrorScreen";
import { HourlyForecast } from "./HourlyForecast";
import { SearchBox } from "./SearchBox";
import { UnitsMenu } from "./UnitsMenu";

const LOADING = "Loading...";

type Retry = { query: string | null };
type AppError = { kind: "search" | "weather"; query: string | null };

export const WeatherApp = () => {
  const [place, setPlace] = useState<Place | null>(BERLIN);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [noResult, setNoResult] = useState(false);
  const [status, setStatus] = useState("");
  const [units, setUnits] = useState<Units>(METRIC);
  const [error, setError] = useState<AppError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [retry, setRetry] = useState<Retry | undefined>(undefined);
  const searchingQuery = useRef<string | null>(null);
  const searchFailed = useRef(false);

  useEffect(() => {
    if (!place) return;
    const controller = new AbortController();
    fetchForecast(place, controller.signal)
      .then((result) => {
        if (searchFailed.current) return;
        setForecast(result);
        setStatus((current) =>
          current === LOADING ? `Weather for ${placeLabel(place)}` : current,
        );
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError(
          (current) =>
            current ?? { kind: "weather", query: searchingQuery.current },
        );
        setStatus("");
      });
    return () => controller.abort();
  }, [place, attempt]);

  const select = (selected: Place) => {
    searchingQuery.current = null;
    setNoResult(false);
    setForecast(null);
    setStatus(LOADING);
    setPlace(selected);
  };

  const showNoResult = () => {
    searchingQuery.current = null;
    setPlace(null);
    setForecast(null);
    setNoResult(true);
    setStatus("No search result found!");
  };

  const retryAfterError = () => {
    if (!error) return;
    searchFailed.current = false;
    if (error.kind === "weather" || !forecast) setAttempt((count) => count + 1);
    setRetry({ query: error.query });
    setError(null);
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
      <header className="flex items-center justify-between">
        <img src="/weather-app/images/logo.svg" alt="Weather Now" />
        <UnitsMenu units={units} onChange={setUnits} />
      </header>
      {!error && <h1>How&apos;s the sky looking today?</h1>}
      {!error && (
        <SearchBox
          retry={retry}
          onSearching={(query) => {
            searchingQuery.current = query;
            setStatus("Search in progress");
          }}
          onResults={() => {
            searchingQuery.current = null;
            setStatus("");
          }}
          onError={(query) => {
            searchingQuery.current = null;
            searchFailed.current = true;
            setError({ kind: "search", query });
            setStatus("");
          }}
          onNoResult={showNoResult}
          onSelect={select}
        />
      )}
      <p role="status" className="sr-only">
        {status}
      </p>
      {error ? (
        <ErrorScreen onRetry={retryAfterError} />
      ) : noResult ? (
        <p className="text-center">No search result found!</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex min-w-0 flex-col gap-6">
            <CurrentWeather
              label={place ? placeLabel(place) : ""}
              current={forecast?.current ?? null}
              units={units}
            />
            <DailyForecast daily={forecast?.daily ?? null} units={units} />
          </div>
          <HourlyForecast forecast={forecast} units={units} />
        </div>
      )}
    </main>
  );
};
