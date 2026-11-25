import type { Forecast } from "../api/forecast";

export type HourlyRow = { label: string; temperature: number; code: number };

function hourLabel(isoDateTime: string): string {
  const hour = Number(isoDateTime.slice(11, 13));
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${hour < 12 ? "AM" : "PM"}`;
}

// 오늘은 현재 시각의 정시부터 하루의 끝까지.
// 오늘이 아닌 날은 12 AM부터 11 PM까지 하루 전체.
// 응답은 시각별 값을 평행 배열로 준다. 같은 위치의 기온이나 날씨 코드가 빠진 시각은 건너뛴다.
export function dayHourlyRows(forecast: Forecast, date: string): HourlyRow[] {
  const { current, hourly } = forecast;
  const isToday = date === current.time.slice(0, 10);
  const startHour = isToday ? current.time.slice(0, 13) : "";
  return hourly.time.flatMap((time, i) => {
    const temperature = hourly.temperature_2m[i];
    const code = hourly.weather_code[i];
    return time.slice(0, 10) === date &&
      time.slice(0, 13) >= startHour &&
      temperature !== undefined &&
      code !== undefined
      ? [{ label: hourLabel(time), temperature, code }]
      : [];
  });
}
