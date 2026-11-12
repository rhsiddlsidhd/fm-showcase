import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  forecastBerlin7d,
  geocodingNoCountry,
  setupTestServer,
} from "@/shared/test";
import { WeatherAppPage } from "../index";

const server = setupTestServer();

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

// 알림 영역(role="status")을 뺀 화면 글자를 찾는다.
const OUTSIDE_STATUS = { ignore: '[role="status"]' };

// 지역 검색은 국가 정보가 없는 후보 하나만 돌려준다.
const stubOpenMeteo = () => {
  server.use(
    http.get(FORECAST_URL, () => HttpResponse.json(forecastBerlin7d)),
    http.get(GEOCODING_URL, () => HttpResponse.json(geocodingNoCountry)),
  );
};

// 최초 진입 날씨가 표시된 뒤 Nowhere를 검색해 하나뿐인 후보를 고른다.
const selectNowhere = async () => {
  stubOpenMeteo();
  const user = userEvent.setup();
  render(<WeatherAppPage />);
  await screen.findByText("Berlin, Germany");

  await user.type(screen.getByRole("combobox"), "Nowhere{Enter}");
  const listbox = await screen.findByRole("listbox");
  const options = within(listbox).getAllByRole("option");
  expect(options).toHaveLength(1);

  await user.click(options[0]);
  await waitFor(() =>
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
  );
};

describe("국가 정보가 없는 지역 선택", () => {
  it("현재 날씨 카드가 국가 없이 지역명 Nowhere만 보여주고 undefined는 화면에 없다", async () => {
    await selectNowhere();

    expect(
      await screen.findByText("Nowhere", OUTSIDE_STATUS),
    ).toBeInTheDocument();
    expect(screen.queryByText("Berlin, Germany")).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it("날씨 응답이 도착하면 알림 영역이 Weather for Nowhere를 알린다", async () => {
    await selectNowhere();

    const status = screen.getByRole("status");
    await waitFor(() =>
      expect(status.textContent?.trim()).toBe("Weather for Nowhere"),
    );
  });
});
