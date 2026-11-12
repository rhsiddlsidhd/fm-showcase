import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatCurrentDate,
  formatTemperature,
  formatWeekdayLong,
  formatWeekdayShort,
} from "./format";

describe("기온 표기", () => {
  it("반올림 결과가 0인 음수 기온은 -0°가 아니라 0°로 표시된다", () => {
    expect(formatTemperature(-0.4)).toBe("0°");
  });

  it("소수점이 정확히 .5인 양수 기온은 큰 쪽으로 올려 3°로 표시된다", () => {
    expect(formatTemperature(2.5)).toBe("3°");
  });

  it("소수점이 정확히 .5인 음수 기온은 큰 쪽으로 올려 -2°로 표시된다", () => {
    expect(formatTemperature(-2.5)).toBe("-2°");
  });
});

describe("날짜 표기", () => {
  it("현지 날짜 2026-11-11의 요일 약어는 실행 환경 시간대와 무관하게 Wed로 표시된다", () => {
    expect(formatWeekdayShort("2026-11-11")).toBe("Wed");
  });

  it("현지 날짜 2026-11-11의 요일 전체 이름은 실행 환경 시간대와 무관하게 Wednesday로 표시된다", () => {
    expect(formatWeekdayLong("2026-11-11")).toBe("Wednesday");
  });

  it("현재 날씨 카드의 날짜는 요일 전체, 월 약어, 일, 연도 형식으로 표시된다", () => {
    expect(formatCurrentDate("2026-11-11T06:00")).toBe(
      "Wednesday, Nov 11, 2026",
    );
  });
});

describe("날짜 표기: UTC보다 느린 시간대", () => {
  beforeEach(() => {
    vi.stubEnv("TZ", "America/Los_Angeles");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("실행 환경 시간대를 America/Los_Angeles로 바꿔도 2026-11-11의 요일 약어는 Wed로 표시된다", () => {
    expect(formatWeekdayShort("2026-11-11")).toBe("Wed");
  });

  it("실행 환경 시간대를 America/Los_Angeles로 바꿔도 2026-11-11의 요일 전체 이름은 Wednesday로 표시된다", () => {
    expect(formatWeekdayLong("2026-11-11")).toBe("Wednesday");
  });

  it("실행 환경 시간대를 America/Los_Angeles로 바꿔도 현재 날씨 카드의 날짜는 11일로 표시된다", () => {
    expect(formatCurrentDate("2026-11-11T06:00")).toBe(
      "Wednesday, Nov 11, 2026",
    );
  });
});
