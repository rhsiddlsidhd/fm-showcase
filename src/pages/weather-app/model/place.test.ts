import { describe, expect, it } from "vitest";
import type { Place } from "../api/geocoding";
import { placeLabel } from "./place";

describe("지역명 표기", () => {
  it("국가 정보가 없는 지역은 국가 없이 지역명만, 국가 정보가 있는 지역은 지역명과 국가로 표시되고 undefined가 보이지 않는다", () => {
    const nowhere = {
      name: "Nowhere",
      latitude: 0,
      longitude: 0,
    } as Place;
    const berlin: Place = {
      name: "Berlin",
      country: "Germany",
      latitude: 52.52,
      longitude: 13.41,
    };

    const nowhereLabel = placeLabel(nowhere);
    const berlinLabel = placeLabel(berlin);

    expect(nowhereLabel).toBe("Nowhere");
    expect(berlinLabel).toBe("Berlin, Germany");
    expect(nowhereLabel).not.toContain("undefined");
    expect(berlinLabel).not.toContain("undefined");
  });
});
