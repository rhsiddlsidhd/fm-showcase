import type { WeatherKind } from "../model/weather-icon";

const IMAGES = "/weather-app/images";

export const LOGO = `${IMAGES}/logo.svg`;
export const ICON_UNITS = `${IMAGES}/icon-units.svg`;
export const ICON_DROPDOWN = `${IMAGES}/icon-dropdown.svg`;
export const ICON_SEARCH = `${IMAGES}/icon-search.svg`;
export const ICON_LOADING = `${IMAGES}/icon-loading.svg`;
export const ICON_ERROR = `${IMAGES}/icon-error.svg`;
export const ICON_RETRY = `${IMAGES}/icon-retry.svg`;

export const weatherIconSrc = (kind: WeatherKind) =>
  `${IMAGES}/icon-${kind}.webp`;
