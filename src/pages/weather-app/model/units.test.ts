import { describe, expect, it } from "vitest";
import { IMPERIAL, METRIC, formatPrecipitation, formatWind } from "./units";

describe("강수량 표기", () => {
  it("Metric에서 강수량 0.3mm는 정수로 반올림해 0 mm로 표시된다", () => {
    expect(formatPrecipitation(0.3, METRIC)).toBe("0 mm");
  });

  it("Metric에서 소수점이 정확히 .5인 강수량 2.5mm는 큰 쪽으로 올려 3 mm로 표시된다", () => {
    expect(formatPrecipitation(2.5, METRIC)).toBe("3 mm");
  });

  it("Imperial로 전환하면 강수량 1.2mm는 인치로 환산해 정수로 반올림한 0 in으로 표시된다", () => {
    // 1.2 × 0.0393701 = 0.0472…
    expect(formatPrecipitation(1.2, IMPERIAL)).toBe("0 in");
  });

  it("Imperial로 전환하면 강수량 30mm는 인치로 환산해 정수로 반올림한 1 in으로 표시된다", () => {
    // 30 × 0.0393701 = 1.1811…
    expect(formatPrecipitation(30, IMPERIAL)).toBe("1 in");
  });

  it("강수량만 Inches로 고르면 38.4mm는 반올림 전 값으로 환산해 2 in으로 표시된다", () => {
    // 38.4 × 0.0393701 = 1.5118… → 2 (먼저 38로 반올림하면 1.496… → 1이 된다)
    expect(formatPrecipitation(38.4, { ...METRIC, precipitation: "in" })).toBe(
      "2 in",
    );
  });

  it("다른 단위가 Imperial이어도 강수량만 Millimeters로 고르면 1.6mm는 2 mm로 표시된다", () => {
    expect(formatPrecipitation(1.6, { ...IMPERIAL, precipitation: "mm" })).toBe(
      "2 mm",
    );
  });
});

describe("풍속 표기", () => {
  // mph = km/h ÷ 1.609344 (1 mile = 1.609344 km)
  it.each([
    { kmh: 0.4, expected: "0 km/h" },
    { kmh: 0.5, expected: "1 km/h" },
    { kmh: 2.5, expected: "3 km/h" },
    { kmh: 12.4, expected: "12 km/h" },
  ])(
    "Metric에서 풍속 $kmh km/h는 정수로 반올림하면 $expected 표기가 된다",
    ({ kmh, expected }) => {
      expect(formatWind(kmh, METRIC)).toBe(expected);
    },
  );

  it.each([
    // 0.5 mph = 1.609344 ÷ 2 = 0.804672 km/h, 정확히 .5
    { kmh: 0.804672, expected: "1 mph" },
    // 0.5 mph 바로 아래: 0.8 ÷ 1.609344 = 0.4971…
    { kmh: 0.8, expected: "0 mph" },
    // 0.5 mph 바로 위: 0.81 ÷ 1.609344 = 0.5033…
    { kmh: 0.81, expected: "1 mph" },
    // 1.5 mph 바로 위: 2.42 ÷ 1.609344 = 1.5037…
    { kmh: 2.42, expected: "2 mph" },
    // 1.5 mph 바로 아래: 2.41 ÷ 1.609344 = 1.4975…
    { kmh: 2.41, expected: "1 mph" },
    // 10 ÷ 1.609344 = 6.2137…
    { kmh: 10, expected: "6 mph" },
    // 8.4 ÷ 1.609344 = 5.2195…
    { kmh: 8.4, expected: "5 mph" },
  ])(
    "Imperial에서 풍속 $kmh km/h는 mph로 환산해 정수로 반올림하면 $expected 표기가 된다",
    ({ kmh, expected }) => {
      expect(formatWind(kmh, IMPERIAL)).toBe(expected);
    },
  );

  it("풍속만 Miles per hour로 고르면 다른 단위가 Metric이어도 환산해 표시된다", () => {
    // 16.09344 ÷ 1.609344 = 10
    expect(formatWind(16.09344, { ...METRIC, wind: "mph" })).toBe("10 mph");
  });

  it("다른 단위가 Imperial이어도 풍속만 km/h로 고르면 환산하지 않고 표시된다", () => {
    expect(formatWind(10, { ...IMPERIAL, wind: "kmh" })).toBe("10 km/h");
  });

  it("환산한 값을 먼저 반올림하지 않고 반올림 전 값으로 정수 반올림한다", () => {
    // 7.4 ÷ 1.609344 = 4.5981… → 5 (먼저 7로 반올림하면 7 ÷ 1.609344 = 4.3496… → 4)
    expect(formatWind(7.4, IMPERIAL)).toBe("5 mph");
  });
});
