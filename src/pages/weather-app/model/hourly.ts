import type { Forecast } from "../api/forecast";

export type HourlyRow = { label: string; temperature: number; code: number };

export function hourLabel(isoDateTime: string): string {
  const hour = Number(isoDateTime.slice(11, 13));
  return `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "AM" : "PM"}`;
}

// 오늘은 현재 시각의 정시부터, 하루의 끝까지.
export function todayHourlyRows(forecast: Forecast): HourlyRow[] {
  const { current, hourly } = forecast;
  const today = current.time.slice(0, 10);
  const startHour = current.time.slice(0, 13);
  return hourly.time.flatMap((time, i) =>
    time.slice(0, 10) === today && time.slice(0, 13) >= startHour
      ? [
          {
            label: hourLabel(time),
            temperature: hourly.temperature_2m[i],
            code: hourly.weather_code[i],
          },
        ]
      : [],
  );
}

// 오늘이 아닌 날은 12 AM부터 11 PM까지 하루 전체.
export function dayHourlyRows(forecast: Forecast, date: string): HourlyRow[] {
  if (date === forecast.current.time.slice(0, 10)) {
    return todayHourlyRows(forecast);
  }
  const { hourly } = forecast;
  return hourly.time.flatMap((time, i) =>
    time.slice(0, 10) === date
      ? [
          {
            label: hourLabel(time),
            temperature: hourly.temperature_2m[i],
            code: hourly.weather_code[i],
          },
        ]
      : [],
  );
}
