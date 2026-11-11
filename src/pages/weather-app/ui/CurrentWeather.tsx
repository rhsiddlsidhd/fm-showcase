import type { Forecast } from "../api/forecast";
import { formatCurrentDate, formatTemperature } from "../model/format";
import { WeatherIconImage } from "./WeatherIconImage";

const PENDING = "—";

export const CurrentWeather = ({
  label,
  current,
}: {
  label: string;
  current: Forecast["current"] | null;
}) => {
  const metrics: Array<[string, string]> = [
    [
      "Feels Like",
      current ? formatTemperature(current.apparent_temperature) : PENDING,
    ],
    [
      "Humidity",
      current ? `${Math.round(current.relative_humidity_2m)}%` : PENDING,
    ],
    ["Wind", current ? `${Math.round(current.wind_speed_10m)} km/h` : PENDING],
    ["Precipitation", current ? `${current.precipitation} mm` : PENDING],
  ];
  return (
    <section>
      <div className="flex items-center justify-between rounded-2xl p-6">
        {current ? (
          <>
            <div>
              <p>{label}</p>
              <p>{formatCurrentDate(current.time)}</p>
            </div>
            <WeatherIconImage code={current.weather_code} className="size-20" />
            <p className="text-6xl">
              {formatTemperature(current.temperature_2m)}
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
      <ul className="grid grid-cols-2 gap-4">
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
