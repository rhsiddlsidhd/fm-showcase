import type { WeatherKind } from "../model/weather-icon";

export const LOGO = "/weather-app/images/logo.svg";
export const ICON_UNITS = "/weather-app/images/icon-units.svg";
export const ICON_DROPDOWN = "/weather-app/images/icon-dropdown.svg";
export const ICON_SEARCH = "/weather-app/images/icon-search.svg";
export const ICON_LOADING = "/weather-app/images/icon-loading.svg";
export const ICON_ERROR = "/weather-app/images/icon-error.svg";
export const ICON_RETRY = "/weather-app/images/icon-retry.svg";

const WEATHER_ICONS: Record<WeatherKind, string> = {
  sunny: "/weather-app/images/icon-sunny.webp",
  "partly-cloudy": "/weather-app/images/icon-partly-cloudy.webp",
  overcast: "/weather-app/images/icon-overcast.webp",
  fog: "/weather-app/images/icon-fog.webp",
  drizzle: "/weather-app/images/icon-drizzle.webp",
  rain: "/weather-app/images/icon-rain.webp",
  snow: "/weather-app/images/icon-snow.webp",
  storm: "/weather-app/images/icon-storm.webp",
};

export const weatherIconSrc = (kind: WeatherKind) => WEATHER_ICONS[kind];
