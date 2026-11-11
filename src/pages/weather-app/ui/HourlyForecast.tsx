import type { Forecast } from "../api/forecast";
import { formatTemperature, formatWeekdayLong } from "../model/format";
import { todayHourlyRows } from "../model/hourly";
import { WeatherIconImage } from "./WeatherIconImage";

const ROWS = 8;

export const HourlyForecast = ({ forecast }: { forecast: Forecast | null }) => (
  <section>
    <h2>Hourly forecast</h2>
    {forecast ? (
      <>
        <button type="button">
          {formatWeekdayLong(forecast.daily.time[0])}
          <img src="/weather-app/images/icon-dropdown.svg" alt="" />
        </button>
        <ul>
          {todayHourlyRows(forecast).map((row) => (
            <li key={row.label}>
              <WeatherIconImage code={row.code} className="size-8" />
              <span>{row.label}</span>
              <span>{formatTemperature(row.temperature)}</span>
            </li>
          ))}
        </ul>
      </>
    ) : (
      <ul>
        {Array.from({ length: ROWS }, (_, i) => (
          <li key={i} data-testid="hourly-placeholder" className="h-12" />
        ))}
      </ul>
    )}
  </section>
);
