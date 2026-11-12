import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import type { Forecast } from "../api/forecast";
import { formatTemperature, formatWeekdayLong } from "../model/format";
import { dayHourlyRows } from "../model/hourly";
import { toTemperature, type Units } from "../model/units";
import { UnitValue } from "./UnitValue";
import { WeatherIconImage } from "./WeatherIconImage";

const ROWS = 8;
const SELECTOR_CLASS =
  "flex items-center gap-3 rounded-lg bg-(--weather-app-day-selector) px-4 py-2";
const ROW_CLASS = "rounded-lg border border-border bg-secondary";
const LIST_CLASS =
  "col-span-2 flex flex-col gap-4 lg:max-h-150 lg:overflow-y-auto";

const HourlyContent = ({
  forecast,
  units,
}: {
  forecast: Forecast;
  units: Units;
}) => {
  const [date, setDate] = useState(forecast.daily.time[0]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={`${SELECTOR_CLASS} hover:bg-accent focus-visible:ring-ring focus-visible:ring-2`}
        >
          {formatWeekdayLong(date)}
          <img src="/weather-app/images/icon-dropdown.svg" alt="" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="theme-weather-app bg-popover w-56 p-2"
        >
          {forecast.daily.time.map((day) => (
            <DropdownMenuItem
              key={day}
              className="focus:ring-ring px-2 py-2.5 text-(length:--weather-app-text-body) focus:ring-2"
              onClick={() => setDate(day)}
            >
              {formatWeekdayLong(day)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ul className={LIST_CLASS}>
        {dayHourlyRows(forecast, date).map((row) => (
          <li
            key={row.label}
            className={`${ROW_CLASS} flex items-center gap-2 px-3 py-2.5`}
          >
            <WeatherIconImage code={row.code} className="size-10" />
            <span className="flex-1 text-xl">{row.label}</span>
            <UnitValue
              value={formatTemperature(toTemperature(row.temperature, units))}
            />
          </li>
        ))}
      </ul>
    </>
  );
};

export const HourlyForecast = ({
  forecast,
  units,
}: {
  forecast: Forecast | null;
  units: Units;
}) => (
  <section className="bg-card grid grid-cols-[1fr_auto] content-start items-center gap-4 rounded-3xl p-6">
    <h2 className="text-xl font-semibold">Hourly forecast</h2>
    {forecast ? (
      <HourlyContent
        key={forecast.daily.time[0]}
        forecast={forecast}
        units={units}
      />
    ) : (
      <>
        <span aria-hidden="true" className={SELECTOR_CLASS}>
          –
        </span>
        <ul className={LIST_CLASS}>
          {Array.from({ length: ROWS }, (_, i) => (
            <li
              key={i}
              data-testid="hourly-placeholder"
              className={`${ROW_CLASS} h-15`}
            />
          ))}
        </ul>
      </>
    )}
  </section>
);
