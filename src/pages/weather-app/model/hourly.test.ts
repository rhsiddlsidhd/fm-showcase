import { describe, expect, it } from "vitest";
import type { Forecast } from "../api/forecast";
import { dayHourlyRows } from "./hourly";

const hoursOf = (date: string) =>
  Array.from(
    { length: 24 },
    (_, hour) => `${date}T${String(hour).padStart(2, "0")}:00`,
  );

const forecastAt = (currentTime: string): Forecast => {
  const time = [
    ...hoursOf("2026-11-10"),
    ...hoursOf("2026-11-11"),
    ...hoursOf("2026-11-12"),
  ];
  return {
    current: {
      time: currentTime,
      temperature_2m: 0,
      apparent_temperature: 0,
      relative_humidity_2m: 0,
      wind_speed_10m: 0,
      precipitation: 0,
      weather_code: 0,
    },
    daily: {
      time: [],
      weather_code: [],
      temperature_2m_max: [],
      temperature_2m_min: [],
    },
    hourly: {
      time,
      temperature_2m: time.map((_, i) => i),
      weather_code: time.map(() => 0),
    },
  };
};

const labelsOf = (forecast: Forecast, date: string) =>
  dayHourlyRows(forecast, date).map((row) => row.label);

describe("시간별 예보 시각 표기", () => {
  it("오늘이 아닌 날은 0시를 12 AM으로 시작해 하루 24행이다", () => {
    const labels = labelsOf(forecastAt("2026-11-11T06:00"), "2026-11-12");

    expect(labels).toHaveLength(24);
    expect(labels[0]).toBe("12 AM");
  });

  it("오늘이 아닌 날은 12시를 12 PM으로, 23시를 11 PM으로 표시한다", () => {
    const labels = labelsOf(forecastAt("2026-11-11T06:00"), "2026-11-12");

    expect(labels[12]).toBe("12 PM");
    expect(labels[23]).toBe("11 PM");
  });

  it("오늘이 아닌 날은 1시를 1 AM, 11시를 11 AM, 13시를 1 PM으로 표시한다", () => {
    const labels = labelsOf(forecastAt("2026-11-11T06:00"), "2026-11-12");

    expect([labels[1], labels[11], labels[13]]).toEqual([
      "1 AM",
      "11 AM",
      "1 PM",
    ]);
  });

  it("지난 날도 오늘이 아니면 하루 전체를 표시한다", () => {
    expect(labelsOf(forecastAt("2026-11-11T06:00"), "2026-11-10")).toHaveLength(
      24,
    );
  });

  it("각 행은 해당 시각의 기온과 날씨 코드를 가진다", () => {
    const rows = dayHourlyRows(forecastAt("2026-11-11T06:00"), "2026-11-12");

    // hoursOf 순서상 2026-11-12 0시는 전체 배열의 48번째(인덱스 48)
    expect(rows[0]).toEqual({ label: "12 AM", temperature: 48, code: 0 });
  });
});

describe("시간별 예보 오늘의 시작 시점", () => {
  it("현재가 0시 정각이면 오늘은 12 AM부터 24행이다", () => {
    const labels = labelsOf(forecastAt("2026-11-11T00:00"), "2026-11-11");

    expect(labels).toHaveLength(24);
    expect(labels[0]).toBe("12 AM");
  });

  it("현재가 0시 30분이면 오늘은 12 AM부터 시작한다", () => {
    expect(labelsOf(forecastAt("2026-11-11T00:30"), "2026-11-11")[0]).toBe(
      "12 AM",
    );
  });

  it("현재가 11시 59분이면 오늘은 11 AM부터 13행이다", () => {
    const labels = labelsOf(forecastAt("2026-11-11T11:59"), "2026-11-11");

    expect(labels[0]).toBe("11 AM");
    expect(labels).toHaveLength(13);
  });

  it("현재가 정오 12시 정각이면 오늘은 12 PM부터 12행이다", () => {
    const labels = labelsOf(forecastAt("2026-11-11T12:00"), "2026-11-11");

    expect(labels[0]).toBe("12 PM");
    expect(labels).toHaveLength(12);
  });

  it("현재가 12시 45분이면 지나간 정시를 빼고 12 PM부터 시작한다", () => {
    expect(labelsOf(forecastAt("2026-11-11T12:45"), "2026-11-11")[0]).toBe(
      "12 PM",
    );
  });

  it("현재가 23시 45분이면 오늘은 11 PM 한 행만 남는다", () => {
    expect(labelsOf(forecastAt("2026-11-11T23:45"), "2026-11-11")).toEqual([
      "11 PM",
    ]);
  });

  it("오늘 행은 다음 날 0시를 포함하지 않는다", () => {
    const labels = labelsOf(forecastAt("2026-11-11T22:00"), "2026-11-11");

    expect(labels).toEqual(["10 PM", "11 PM"]);
  });
});
