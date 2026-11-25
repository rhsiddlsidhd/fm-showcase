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
  const response = await fetch(url, { signal: signal ?? null });
  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`);
  }
  // 응답 형태는 Open-Meteo 계약을 믿는다. 런타임 검증은 하지 않는다.
  const body = (await response.json()) as { results?: Place[] };
  return body.results ?? [];
}
