export function formatTemperature(value: number): string {
  return `${Math.round(value) + 0}°`;
}

function formatUtc(
  isoDate: string,
  options: Intl.DateTimeFormatOptions,
): string {
  // YYYY-MM-DD만 있는 문자열은 UTC 자정으로 해석된다.
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(isoDate.slice(0, 10)));
}

export function formatWeekdayShort(isoDate: string): string {
  return formatUtc(isoDate, { weekday: "short" });
}

export function formatWeekdayLong(isoDate: string): string {
  return formatUtc(isoDate, { weekday: "long" });
}

export function formatCurrentDate(isoDateTime: string): string {
  return formatUtc(isoDateTime, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
