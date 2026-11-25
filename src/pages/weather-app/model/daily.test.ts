import { describe, expect, it } from "vitest";
import type { Forecast } from "../api/forecast";
import { dailyRows } from "./daily";

const dailyOf = (
  overrides: Partial<Forecast["daily"]> = {},
): Forecast["daily"] => ({
  time: ["2026-11-10", "2026-11-11", "2026-11-12"],
  weather_code: [0, 3, 61],
  temperature_2m_max: [10, 12, 8],
  temperature_2m_min: [1, 4, 2],
  ...overrides,
});

describe("일별 예보 행", () => {
  it("각 날짜에 같은 위치의 날씨 코드와 최고·최저 기온을 묶는다", () => {
    expect(dailyRows(dailyOf())).toEqual([
      { date: "2026-11-10", code: 0, max: 10, min: 1 },
      { date: "2026-11-11", code: 3, max: 12, min: 4 },
      { date: "2026-11-12", code: 61, max: 8, min: 2 },
    ]);
  });

  it("날씨 코드나 기온이 빠진 날은 건너뛴다", () => {
    const rows = dailyRows(
      dailyOf({ weather_code: [0, 3], temperature_2m_min: [1] }),
    );

    expect(rows.map((row) => row.date)).toEqual(["2026-11-10"]);
  });
});
