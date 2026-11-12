import type { Place } from "../api/geocoding";

export const BERLIN: Place = {
  name: "Berlin",
  country: "Germany",
  latitude: 52.52437,
  longitude: 13.41053,
};

export const placeLabel = (place: Place) =>
  [place.name, place.country].filter(Boolean).join(", ");

export const candidateLabel = (place: Place) =>
  [place.name, place.admin1, place.country].filter(Boolean).join(", ");
