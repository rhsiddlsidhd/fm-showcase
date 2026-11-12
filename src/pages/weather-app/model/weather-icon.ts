export type WeatherIcon = { src: string; name: string };

const icon = (file: string, name: string): WeatherIcon => ({
  src: `/weather-app/images/icon-${file}.webp`,
  name,
});

const CATEGORIES: { file: string; name: string; codes: number[] }[] = [
  { file: "sunny", name: "Clear", codes: [0, 1] },
  { file: "partly-cloudy", name: "Partly cloudy", codes: [2] },
  { file: "overcast", name: "Overcast", codes: [3] },
  { file: "fog", name: "Fog", codes: [45, 48] },
  { file: "drizzle", name: "Drizzle", codes: [51, 53, 55, 56, 57] },
  { file: "rain", name: "Rain", codes: [61, 63, 65, 66, 67, 80, 81, 82] },
  { file: "snow", name: "Snow", codes: [71, 73, 75, 77, 85, 86] },
  { file: "storm", name: "Thunderstorm", codes: [95, 96, 99] },
];

export function weatherIcon(code: number): WeatherIcon {
  const category = CATEGORIES.find(({ codes }) => codes.includes(code));
  if (category) return icon(category.file, category.name);
  return icon("overcast", "Overcast");
}
