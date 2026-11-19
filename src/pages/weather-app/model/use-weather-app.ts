import { useEffect, useReducer } from "react";
import { fetchForecast } from "../api/forecast";
import {
  initialWeatherAppState,
  placeOf,
  weatherAppReducer,
} from "./weather-app-state";

// 화면 상태와 날씨 요청 시점을 묶는다. 지역이 바뀌거나 다시 시도할 때 날씨를 요청한다.
export const useWeatherApp = () => {
  const [state, dispatch] = useReducer(
    weatherAppReducer,
    initialWeatherAppState,
  );
  const place = placeOf(state.content);
  const { forecastAttempt } = state;

  useEffect(() => {
    if (!place) return;
    const controller = new AbortController();
    fetchForecast(place, controller.signal)
      .then((forecast) => dispatch({ type: "forecastLoaded", place, forecast }))
      .catch(() => {
        if (controller.signal.aborted) return;
        dispatch({ type: "forecastFailed" });
      });
    return () => controller.abort();
  }, [place, forecastAttempt]);

  return { state, dispatch };
};
