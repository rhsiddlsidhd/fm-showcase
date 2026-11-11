import type { Forecast } from "../api/forecast";
import { formatTemperature, formatWeekdayShort } from "../model/format";
import { WeatherIconImage } from "./WeatherIconImage";

const DAYS = 7;

export const DailyForecast = ({
  daily,
}: {
  daily: Forecast["daily"] | null;
}) => (
  <section>
    <h2>Daily forecast</h2>
    <ul className="grid grid-cols-7 gap-2">
      {daily
        ? daily.time.map((date, i) => (
            <li key={date}>
              <span>{formatWeekdayShort(date)}</span>
              <WeatherIconImage
                code={daily.weather_code[i]}
                className="size-10"
              />
              <span>{formatTemperature(daily.temperature_2m_max[i])}</span>
              <span>{formatTemperature(daily.temperature_2m_min[i])}</span>
            </li>
          ))
        : Array.from({ length: DAYS }, (_, i) => (
            <li key={i} data-testid="daily-placeholder" className="h-24" />
          ))}
    </ul>
  </section>
);
