import type { Forecast } from "../api/forecast";
import { formatTemperature, formatWeekdayShort } from "../model/format";
import { toTemperature, type Units } from "../model/units";
import { UnitValue } from "./UnitValue";
import { WeatherIconImage } from "./WeatherIconImage";

const DAYS = 7;
const CELL_CLASS = "rounded-xl border border-border bg-card";

export const DailyForecast = ({
  daily,
  units,
}: {
  daily: Forecast["daily"] | null;
  units: Units;
}) => (
  <section className="flex flex-col gap-5">
    <h2 className="text-xl font-semibold">Daily forecast</h2>
    <ul className="grid grid-cols-3 gap-4 lg:grid-cols-7">
      {daily
        ? daily.time.map((date, i) => (
            <li
              key={date}
              className={`${CELL_CLASS} flex flex-col items-center gap-4 px-2.5 py-4`}
            >
              <span className="text-(length:--weather-app-text-body)">
                {formatWeekdayShort(date)}
              </span>
              <WeatherIconImage
                code={daily.weather_code[i]}
                className="size-15"
              />
              <div className="flex w-full justify-between">
                <UnitValue
                  value={formatTemperature(
                    toTemperature(daily.temperature_2m_max[i], units),
                  )}
                />
                <UnitValue
                  className="text-(--weather-app-text-subtle)"
                  value={formatTemperature(
                    toTemperature(daily.temperature_2m_min[i], units),
                  )}
                />
              </div>
            </li>
          ))
        : Array.from({ length: DAYS }, (_, i) => (
            <li
              key={i}
              data-testid="daily-placeholder"
              className={`${CELL_CLASS} h-40`}
            />
          ))}
    </ul>
  </section>
);
