export type WeatherIcon = { src: string; name: string };

const icon = (file: string, name: string): WeatherIcon => ({
  src: `/weather-app/images/icon-${file}.webp`,
  name,
});

export function weatherIcon(code: number): WeatherIcon {
  if (code === 0 || code === 1) return icon("sunny", "Clear");
  if (code === 2) return icon("partly-cloudy", "Partly cloudy");
  if (code === 3) return icon("overcast", "Overcast");
  if (code === 45 || code === 48) return icon("fog", "Fog");
  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57)
    return icon("drizzle", "Drizzle");
  if (
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 66 ||
    code === 67 ||
    (code >= 80 && code <= 82)
  ) {
    return icon("rain", "Rain");
  }
  if (
    code === 71 ||
    code === 73 ||
    code === 75 ||
    code === 77 ||
    code === 85 ||
    code === 86
  ) {
    return icon("snow", "Snow");
  }
  if (code === 95 || code === 96 || code === 99) {
    return icon("storm", "Thunderstorm");
  }
  return icon("overcast", "Overcast");
}
