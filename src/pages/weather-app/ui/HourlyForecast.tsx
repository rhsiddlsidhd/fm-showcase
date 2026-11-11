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
import { WeatherIconImage } from "./WeatherIconImage";

const ROWS = 8;

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
        <DropdownMenuTrigger>
          {formatWeekdayLong(date)}
          <img src="/weather-app/images/icon-dropdown.svg" alt="" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {forecast.daily.time.map((day) => (
            <DropdownMenuItem key={day} onClick={() => setDate(day)}>
              {formatWeekdayLong(day)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ul>
        {dayHourlyRows(forecast, date).map((row) => (
          <li key={row.label}>
            <WeatherIconImage code={row.code} className="size-8" />
            <span>{row.label}</span>
            <span>
              {formatTemperature(toTemperature(row.temperature, units))}
            </span>
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
  <section>
    <h2>Hourly forecast</h2>
    {forecast ? (
      <HourlyContent
        key={forecast.daily.time[0]}
        forecast={forecast}
        units={units}
      />
    ) : (
      <ul>
        {Array.from({ length: ROWS }, (_, i) => (
          <li key={i} data-testid="hourly-placeholder" className="h-12" />
        ))}
      </ul>
    )}
  </section>
);
