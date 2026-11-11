export type Units = {
  temperature: "celsius" | "fahrenheit";
  wind: "kmh" | "mph";
  precipitation: "mm" | "in";
};

export const METRIC: Units = {
  temperature: "celsius",
  wind: "kmh",
  precipitation: "mm",
};

export const IMPERIAL: Units = {
  temperature: "fahrenheit",
  wind: "mph",
  precipitation: "in",
};

export const isImperial = (units: Units) =>
  units.temperature === IMPERIAL.temperature &&
  units.wind === IMPERIAL.wind &&
  units.precipitation === IMPERIAL.precipitation;

export const toTemperature = (celsius: number, units: Units) =>
  units.temperature === "fahrenheit" ? (celsius * 9) / 5 + 32 : celsius;

export const formatWind = (kmh: number, units: Units) =>
  units.wind === "mph"
    ? `${Math.round(kmh / 1.609344)} mph`
    : `${Math.round(kmh)} km/h`;

export const formatPrecipitation = (mm: number, units: Units) =>
  units.precipitation === "in"
    ? `${Math.round(mm / 25.4)} in`
    : `${Math.round(mm)} mm`;
