import { useState, type ComponentProps } from "react";
import { DropdownMenu, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import type { Forecast } from "../api/forecast";
import { formatTemperature, formatWeekdayLong } from "../model/format";
import { dayHourlyRows } from "../model/hourly";
import { toTemperature, type Units } from "../model/units";
import { ICON_DROPDOWN } from "./assets";
import { GhostButton } from "./BareButton";
import { MenuItem, MenuPanel } from "./Menu";
import { UnitValue } from "./UnitValue";
import { WeatherIconImage } from "./WeatherIconImage";

const ROWS = 8;

const HourlyList = (props: ComponentProps<"ul">) => (
  <ul
    className="col-span-2 flex flex-col gap-4 lg:max-h-150 lg:overflow-y-auto"
    {...props}
  />
);

const HourlyRow = ({ className = "", ...props }: ComponentProps<"li">) => (
  <li
    className={`border-border bg-secondary rounded-lg border ${className}`}
    {...props}
  />
);

const HourlyContent = ({
  forecast,
  units,
}: {
  forecast: Forecast;
  units: Units;
}) => {
  // 처음에는 오늘을 보여준다. 오늘은 dayHourlyRows와 같은 기준(현재 시각의 날짜)으로 정한다.
  const [date, setDate] = useState(forecast.current.time.slice(0, 10));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <GhostButton className="flex items-center gap-3 rounded-lg bg-(--day-selector) px-4 py-2" />
          }
        >
          {formatWeekdayLong(date)}
          <img src={ICON_DROPDOWN} alt="" />
        </DropdownMenuTrigger>
        <MenuPanel align="end">
          {forecast.daily.time.map((day) => (
            <MenuItem key={day} onClick={() => setDate(day)}>
              {formatWeekdayLong(day)}
            </MenuItem>
          ))}
        </MenuPanel>
      </DropdownMenu>
      <HourlyList>
        {dayHourlyRows(forecast, date).map((row) => (
          <HourlyRow
            key={row.label}
            className="flex items-center gap-2 px-3 py-2.5"
          >
            <WeatherIconImage code={row.code} className="size-10" />
            <span className="flex-1 text-xl">{row.label}</span>
            <UnitValue
              value={formatTemperature(toTemperature(row.temperature, units))}
            />
          </HourlyRow>
        ))}
      </HourlyList>
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
        <span
          aria-hidden="true"
          className="flex items-center gap-3 rounded-lg bg-(--day-selector) px-4 py-2"
        >
          –
        </span>
        <HourlyList>
          {Array.from({ length: ROWS }, (_, i) => (
            <HourlyRow
              key={i}
              data-testid="hourly-placeholder"
              className="h-15"
            />
          ))}
        </HourlyList>
      </>
    )}
  </section>
);
