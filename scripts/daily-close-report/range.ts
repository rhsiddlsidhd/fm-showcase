const DAY_MS = 24 * 60 * 60 * 1000;
// 하루 경계 04:00 KST는 19:00 UTC다. 5시간을 더하면 UTC 날짜 경계와 맞는다.
const BOUNDARY_OFFSET_MS = 5 * 60 * 60 * 1000;

export type DayRange = {
  date: string;
  start: Date;
  end: Date;
};

function dateOf(startMs: number): string {
  return new Date(startMs + BOUNDARY_OFFSET_MS).toISOString().slice(0, 10);
}

function rangeFrom(startMs: number): DayRange {
  return {
    date: dateOf(startMs),
    start: new Date(startMs),
    end: new Date(startMs + DAY_MS),
  };
}

function startOf(date: string): number {
  const startMs = Date.parse(`${date}T04:00:00+09:00`);
  // 2월 30일 같은 값은 파싱이 다음 달로 넘겨 버린다.
  if (Number.isNaN(startMs) || dateOf(startMs) !== date) {
    throw new Error(`날짜가 잘못됐다: ${date}`);
  }
  return startMs;
}

export function resolveDayRange(now: Date, date?: string): DayRange {
  if (date) return rangeFrom(startOf(date));

  const days = Math.floor((now.getTime() + BOUNDARY_OFFSET_MS) / DAY_MS);
  return rangeFrom((days - 1) * DAY_MS - BOUNDARY_OFFSET_MS);
}
