import type { Forecast } from "../api/forecast";
import { formatCurrentDate, formatTemperature } from "../model/format";
import { WeatherIconImage } from "./WeatherIconImage";

export const CurrentWeather = ({
  current,
}: {
  current: Forecast["current"];
}) => {
  const metrics: Array<[string, string]> = [
    ["Feels Like", formatTemperature(current.apparent_temperature)],
    ["Humidity", `${Math.round(current.relative_humidity_2m)}%`],
    ["Wind", `${Math.round(current.wind_speed_10m)} km/h`],
    ["Precipitation", `${current.precipitation} mm`],
  ];
  return (
    <section>
      <div className="flex items-center justify-between rounded-2xl p-6">
        <div>
          <p>Berlin, Germany</p>
          <p>{formatCurrentDate(current.time)}</p>
        </div>
        <WeatherIconImage code={current.weather_code} className="size-20" />
        <p className="text-6xl">{formatTemperature(current.temperature_2m)}</p>
      </div>
      <ul className="grid grid-cols-2 gap-4">
        {metrics.map(([label, value]) => (
          <li key={label}>
            <span>{label}</span>
            <span>{value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
