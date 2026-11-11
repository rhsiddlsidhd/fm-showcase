import { useEffect, useState } from "react";
import { fetchForecast, type Forecast } from "../api/forecast";
import type { Place } from "../api/geocoding";
import { BERLIN, placeLabel } from "../model/place";
import { CurrentWeather } from "./CurrentWeather";
import { DailyForecast } from "./DailyForecast";
import { HourlyForecast } from "./HourlyForecast";
import { SearchBox } from "./SearchBox";

const LOADING = "Loading...";

export const WeatherApp = () => {
  const [place, setPlace] = useState<Place | null>(BERLIN);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [noResult, setNoResult] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!place) return;
    const controller = new AbortController();
    fetchForecast(place, controller.signal)
      .then((result) => {
        setForecast(result);
        setStatus((current) =>
          current === LOADING ? `Weather for ${placeLabel(place)}` : current,
        );
      })
      .catch(() => {});
    return () => controller.abort();
  }, [place]);

  const select = (selected: Place) => {
    setNoResult(false);
    setForecast(null);
    setStatus(LOADING);
    setPlace(selected);
  };

  const showNoResult = () => {
    setPlace(null);
    setForecast(null);
    setNoResult(true);
    setStatus("No search result found!");
  };

  return (
    <main>
      <header className="flex items-center justify-between">
        <img src="/weather-app/images/logo.svg" alt="Weather Now" />
        <button type="button">
          <img src="/weather-app/images/icon-units.svg" alt="" />
          Units
          <img src="/weather-app/images/icon-dropdown.svg" alt="" />
        </button>
      </header>
      <SearchBox
        onSearching={() => setStatus("Search in progress")}
        onResults={() => setStatus("")}
        onNoResult={showNoResult}
        onSelect={select}
      />
      <p role="status" className="sr-only">
        {status}
      </p>
      {noResult ? (
        <p>No search result found!</p>
      ) : (
        <>
          <CurrentWeather
            label={place ? placeLabel(place) : ""}
            current={forecast?.current ?? null}
          />
          <DailyForecast daily={forecast?.daily ?? null} />
          <HourlyForecast forecast={forecast} />
        </>
      )}
    </main>
  );
};
