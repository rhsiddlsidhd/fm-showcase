import { useEffect, useState } from "react";
import { fetchBerlinForecast, type Forecast } from "../api/forecast";
import { CurrentWeather } from "./CurrentWeather";
import { DailyForecast } from "./DailyForecast";
import { HourlyForecast } from "./HourlyForecast";

export const WeatherApp = () => {
  const [forecast, setForecast] = useState<Forecast | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchBerlinForecast(controller.signal)
      .then(setForecast)
      .catch(() => {});
    return () => controller.abort();
  }, []);

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
      <div className="relative">
        <img src="/weather-app/images/icon-search.svg" alt="" />
        <input type="search" placeholder="Search for a place..." />
      </div>
      <p role="status" className="sr-only" />
      {forecast ? (
        <>
          <CurrentWeather current={forecast.current} />
          <DailyForecast daily={forecast.daily} />
          <HourlyForecast forecast={forecast} />
        </>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
};
