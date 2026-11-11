export function formatTemperature(value: number): string {
  return `${Math.round(value) + 0}°`;
}

function formatUtc(
  isoDate: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
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
