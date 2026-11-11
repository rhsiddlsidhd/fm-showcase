import { describe, expect, it } from "vitest";
import { weatherIcon } from "./weather-icon";

const icon = (file: string, name: string) => ({
  src: `/weather-app/images/${file}.webp`,
  name,
});

const CLEAR = icon("icon-sunny", "Clear");
const PARTLY_CLOUDY = icon("icon-partly-cloudy", "Partly cloudy");
const OVERCAST = icon("icon-overcast", "Overcast");
const FOG = icon("icon-fog", "Fog");
const DRIZZLE = icon("icon-drizzle", "Drizzle");
const RAIN = icon("icon-rain", "Rain");
const SNOW = icon("icon-snow", "Snow");
const THUNDERSTORM = icon("icon-storm", "Thunderstorm");

const MAPPED_CODES: Array<[number, ReturnType<typeof icon>]> = [
  [0, CLEAR],
  [1, CLEAR],
  [2, PARTLY_CLOUDY],
  [3, OVERCAST],
  [45, FOG],
  [48, FOG],
  [51, DRIZZLE],
  [53, DRIZZLE],
  [55, DRIZZLE],
  [56, DRIZZLE],
  [57, DRIZZLE],
  [61, RAIN],
  [63, RAIN],
  [65, RAIN],
  [66, RAIN],
  [67, RAIN],
  [80, RAIN],
  [81, RAIN],
  [82, RAIN],
  [71, SNOW],
  [73, SNOW],
  [75, SNOW],
  [77, SNOW],
  [85, SNOW],
  [86, SNOW],
  [95, THUNDERSTORM],
  [96, THUNDERSTORM],
  [99, THUNDERSTORM],
];

const UNMAPPED_CODES = [4, 52, 54, 58, 62, 64, 70, 72, 74, 76, 90, 100, -1];

describe("날씨 아이콘과 대체 텍스트", () => {
  it("매핑표의 WMO 코드는 해당 날씨 아이콘과 상태 문구로, 표에 없는 코드는 Overcast 아이콘과 Overcast 문구로 표시된다", () => {
    for (const [code, expected] of MAPPED_CODES) {
      expect.soft(weatherIcon(code), `WMO 코드 ${code}`).toEqual(expected);
    }
    for (const code of UNMAPPED_CODES) {
      expect
        .soft(weatherIcon(code), `표에 없는 코드 ${code}`)
        .toEqual(OVERCAST);
    }
  });
});
