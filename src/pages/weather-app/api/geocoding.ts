const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export type Place = {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
};

export async function searchPlaces(
  name: string,
  signal?: AbortSignal,
): Promise<Place[]> {
  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({
    name,
    count: "5",
    language: "en",
    format: "json",
  }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`);
  }
  const body: { results?: Place[] } = await response.json();
  return body.results ?? [];
}
