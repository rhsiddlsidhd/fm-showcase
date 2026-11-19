import { useEffect, useRef, useState } from "react";
import { searchPlaces, type Place } from "../api/geocoding";
import type { SearchEvent } from "./weather-app-state";

// 지역 검색 요청의 시점을 맡는다. 새 검색은 이전 요청을 취소하고, 언마운트될 때도 취소한다.
export const usePlaceSearch = (onEvent: (event: SearchEvent) => void) => {
  const [candidates, setCandidates] = useState<Place[]>([]);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const clearCandidates = () => setCandidates([]);

  const search = async (name: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    clearCandidates();
    onEvent({ type: "searchStarted", query: name });
    try {
      const places = await searchPlaces(name, controller.signal);
      if (controller.signal.aborted) return;
      if (places.length === 0) {
        onEvent({ type: "searchNoResult" });
        return;
      }
      setCandidates(places);
      onEvent({ type: "searchResults" });
    } catch {
      if (controller.signal.aborted) return;
      onEvent({ type: "searchFailed", query: name });
    }
  };

  return { candidates, search, clearCandidates };
};
