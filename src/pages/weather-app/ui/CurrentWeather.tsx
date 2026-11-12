import type { Forecast } from "../api/forecast";
import { formatCurrentDate, formatTemperature } from "../model/format";
import {
  formatPrecipitation,
  formatWind,
  toTemperature,
  type Units,
} from "../model/units";
import { CELL_CLASS, SUBTLE_TEXT_CLASS } from "./surface";
import { LoadingDots } from "./LoadingDots";
import { UnitValue } from "./UnitValue";
import { WeatherIconImage } from "./WeatherIconImage";

const PENDING = "—";

const CARD_CLASS =
  "flex min-h-72 flex-col items-center justify-center gap-4 rounded-3xl p-6 text-center lg:flex-row lg:justify-between lg:text-left";

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
    <section className="flex flex-col gap-5 lg:gap-8">
      {current ? (
        <div
          className={`${CARD_CLASS} bg-(--weather-app-current-card-from) bg-(image:--weather-app-current-card-image-small) bg-cover bg-center bg-no-repeat sm:bg-(image:--weather-app-current-card-image-large)`}
        >
          <div className="flex flex-col gap-3">
            <p className="text-3xl font-bold">{label}</p>
            <p className={SUBTLE_TEXT_CLASS}>
              {formatCurrentDate(current.time)}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <WeatherIconImage code={current.weather_code} className="size-30" />
            <UnitValue
              className="text-8xl font-semibold italic"
              value={formatTemperature(
                toTemperature(current.temperature_2m, units),
              )}
            />
          </div>
        </div>
      ) : (
        <div className={`${CARD_CLASS} bg-card lg:justify-center`}>
          <div className="flex flex-col items-center gap-4">
            <LoadingDots />
            <p className={SUBTLE_TEXT_CLASS}>Loading...</p>
          </div>
        </div>
      )}
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {metrics.map(([name, value]) => (
          <li key={name} className={`${CELL_CLASS} flex flex-col gap-6 p-5`}>
            <span className={SUBTLE_TEXT_CLASS}>{name}</span>
            <UnitValue className="text-3xl font-light" value={value} />
          </li>
        ))}
      </ul>
    </section>
  );
};
