import type { Forecast } from "../api/forecast";
import { formatCurrentDate, formatTemperature } from "../model/format";
import {
  formatPrecipitation,
  formatWind,
  toTemperature,
  type Units,
} from "../model/units";
import { WeatherIconImage } from "./WeatherIconImage";

const PENDING = "—";

export const CurrentWeather = ({
  label,
  current,
  units,
}: {
  label: string;
  current: Forecast["current"] | null;
  units: Units;
}) => {
  const metrics: Array<[string, string]> = [
    [
      "Feels Like",
      current
        ? formatTemperature(toTemperature(current.apparent_temperature, units))
        : PENDING,
    ],
    [
      "Humidity",
      current ? `${Math.round(current.relative_humidity_2m)}%` : PENDING,
    ],
    ["Wind", current ? formatWind(current.wind_speed_10m, units) : PENDING],
    [
      "Precipitation",
      current ? formatPrecipitation(current.precipitation, units) : PENDING,
    ],
  ];
  return (
    <section>
      <div className="flex flex-col items-center justify-between gap-2 rounded-2xl p-6 sm:flex-row">
        {current ? (
          <>
            <div>
              <p>{label}</p>
              <p>{formatCurrentDate(current.time)}</p>
            </div>
            <WeatherIconImage code={current.weather_code} className="size-20" />
            <p className="text-6xl">
              {formatTemperature(toTemperature(current.temperature_2m, units))}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  data-testid="loading-dot"
                  className="size-2 rounded-full bg-current"
                />
              ))}
            </div>
            <p>Loading...</p>
          </div>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map(([name, value]) => (
          <li key={name}>
            <span>{name}</span>
            <span>{value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
