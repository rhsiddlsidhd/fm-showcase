import type { Forecast } from "../api/forecast";
import { dailyRows } from "../model/daily";
import { formatTemperature, formatWeekdayShort } from "../model/format";
import { toTemperature, type Units } from "../model/units";
import { Cell } from "./Cell";
import { UnitValue } from "./UnitValue";
import { WeatherIconImage } from "./WeatherIconImage";

const DAYS = 7;

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
        ? dailyRows(daily).map(({ date, code, max, min }) => (
            <Cell
              key={date}
              className="flex flex-col items-center gap-4 px-2.5 py-4"
            >
              <span className="text-base">{formatWeekdayShort(date)}</span>
              <WeatherIconImage code={code} className="size-15" />
              <div className="flex w-full justify-between">
                <UnitValue
                  value={formatTemperature(toTemperature(max, units))}
                />
                <UnitValue
                  className="text-(--subtle-text)"
                  value={formatTemperature(toTemperature(min, units))}
                />
              </div>
            </Cell>
          ))
        : Array.from({ length: DAYS }, (_, i) => (
            <Cell key={i} data-testid="daily-placeholder" className="h-40" />
          ))}
    </ul>
  </section>
);
