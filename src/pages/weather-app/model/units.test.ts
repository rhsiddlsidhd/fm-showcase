import { describe, expect, it } from "vitest";
import { IMPERIAL, METRIC, formatPrecipitation } from "./units";

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
