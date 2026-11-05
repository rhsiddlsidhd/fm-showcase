import { describe, expect, it } from "vitest";
import { resolveDayRange } from "./range.ts";

describe("resolveDayRange", () => {
  it("실행 시각 직전의 04:00 KST로 끝나는 24시간을 고른다", () => {
    const range = resolveDayRange(new Date("2026-11-05T19:07:00Z"));

    expect(range).toEqual({
      date: "2026-11-05",
      start: new Date("2026-11-04T19:00:00Z"),
      end: new Date("2026-11-05T19:00:00Z"),
    });
  });

  it("같은 날 안에서는 늦게 실행해도 범위가 같다", () => {
    const late = resolveDayRange(new Date("2026-11-06T18:59:59Z"));

    expect(late.date).toBe("2026-11-05");
  });

  it("04:00 KST 정각에 실행하면 방금 끝난 날을 고른다", () => {
    const range = resolveDayRange(new Date("2026-11-05T19:00:00Z"));

    expect(range.date).toBe("2026-11-05");
  });

  it("날짜를 받으면 실행 시각과 관계없이 그 날짜 범위를 고른다", () => {
    const range = resolveDayRange(
      new Date("2026-11-20T00:00:00Z"),
      "2026-11-03",
    );

    expect(range).toEqual({
      date: "2026-11-03",
      start: new Date("2026-11-02T19:00:00Z"),
      end: new Date("2026-11-03T19:00:00Z"),
    });
  });

  it("빈 날짜는 입력이 없는 것으로 본다", () => {
    const range = resolveDayRange(new Date("2026-11-05T19:07:00Z"), "");

    expect(range.date).toBe("2026-11-05");
  });

  it.each(["2026-02-30", "2026-13-01", "2026-11-5", "어제"])(
    "없는 날짜 %s는 거부한다",
    (date) => {
      expect(() => resolveDayRange(new Date(), date)).toThrow(
        `날짜가 잘못됐다: ${date}`,
      );
    },
  );
});
