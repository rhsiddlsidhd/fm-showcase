export type WeatherKind =
  | "sunny"
  | "partly-cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm";

export type WeatherIcon = { kind: WeatherKind; name: string };

const CATEGORIES: { kind: WeatherKind; name: string; codes: number[] }[] = [
  { kind: "sunny", name: "Clear", codes: [0, 1] },
  { kind: "partly-cloudy", name: "Partly cloudy", codes: [2] },
  { kind: "overcast", name: "Overcast", codes: [3] },
  { kind: "fog", name: "Fog", codes: [45, 48] },
  { kind: "drizzle", name: "Drizzle", codes: [51, 53, 55, 56, 57] },
  { kind: "rain", name: "Rain", codes: [61, 63, 65, 66, 67, 80, 81, 82] },
  { kind: "snow", name: "Snow", codes: [71, 73, 75, 77, 85, 86] },
  { kind: "storm", name: "Thunderstorm", codes: [95, 96, 99] },
];

export function weatherIcon(code: number): WeatherIcon {
  const category = CATEGORIES.find(({ codes }) => codes.includes(code));
  if (category) return { kind: category.kind, name: category.name };
  return { kind: "overcast", name: "Overcast" };
}
