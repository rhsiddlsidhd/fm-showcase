import type { ComponentProps, CSSProperties } from "react";
import type { Forecast } from "../api/forecast";
import { formatCurrentDate, formatTemperature } from "../model/format";
import {
  formatPrecipitation,
  formatWind,
  toTemperature,
  type Units,
} from "../model/units";
import { BG_TODAY_LARGE, BG_TODAY_SMALL } from "./assets";
import { Cell } from "./Cell";
import { LoadingDots } from "./LoadingDots";
import { UnitValue } from "./UnitValue";
import { WeatherIconImage } from "./WeatherIconImage";

const PENDING = "—";

const TodayCard = ({ className = "", ...props }: ComponentProps<"div">) => (
  <div
    className={`flex min-h-72 flex-col items-center justify-center gap-4 rounded-3xl p-6 text-center lg:flex-row lg:justify-between lg:text-left ${className}`}
    {...props}
  />
);

// Tailwind 클래스에는 TS 상수를 넣을 수 없어, 반응형 배경 이미지를 CSS 변수로 넘긴다.
const TODAY_BACKGROUND = {
  "--today-image-small": `url(${BG_TODAY_SMALL})`,
  "--today-image-large": `url(${BG_TODAY_LARGE})`,
} as CSSProperties;

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
        <TodayCard
          style={TODAY_BACKGROUND}
          className="bg-(--current-card-from) bg-(image:--today-image-small) bg-cover bg-center bg-no-repeat sm:bg-(image:--today-image-large)"
        >
          <div className="flex flex-col gap-3">
            <p className="text-3xl font-bold">{label}</p>
            <p className="text-(--subtle-text)">
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
        </TodayCard>
      ) : (
        <TodayCard className="bg-card lg:justify-center">
          <div className="flex flex-col items-center gap-4">
            <LoadingDots />
            <p className="text-(--subtle-text)">Loading...</p>
          </div>
        </TodayCard>
      )}
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {metrics.map(([name, value]) => (
          <Cell key={name} className="flex flex-col gap-6 p-5">
            <span className="text-(--subtle-text)">{name}</span>
            <UnitValue className="text-3xl font-light" value={value} />
          </Cell>
        ))}
      </ul>
    </section>
  );
};
