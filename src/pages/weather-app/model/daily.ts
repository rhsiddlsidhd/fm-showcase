import type { Forecast } from "../api/forecast";

export type DailyRow = { date: string; code: number; max: number; min: number };

// 응답은 날짜별 값을 평행 배열로 준다. 같은 위치의 값이 하나라도 빠진 날은 건너뛴다.
export function dailyRows(daily: Forecast["daily"]): DailyRow[] {
  return daily.time.flatMap((date, i) => {
    const code = daily.weather_code[i];
    const max = daily.temperature_2m_max[i];
    const min = daily.temperature_2m_min[i];
    return code === undefined || max === undefined || min === undefined
      ? []
      : [{ date, code, max, min }];
  });
}
