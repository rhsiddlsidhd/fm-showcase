const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const BERLIN = { latitude: "52.52437", longitude: "13.41053" };

export type Forecast = {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    precipitation: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
};

export async function fetchBerlinForecast(
  signal?: AbortSignal,
): Promise<Forecast> {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    ...BERLIN,
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    hourly: "temperature_2m,weather_code",
    timezone: "auto",
    forecast_days: "7",
  }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Forecast request failed: ${response.status}`);
  }
  return response.json();
}
