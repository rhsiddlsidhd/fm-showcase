import { useEffect, useId, useRef, useState } from "react";
import { searchPlaces, type Place } from "../api/geocoding";
import { candidateLabel } from "../model/place";

type Props = {
  onSearching: () => void;
  onNoResult: () => void;
  onResults: () => void;
  onSelect: (place: Place) => void;
};

export const SearchBox = ({
  onSearching,
  onNoResult,
  onResults,
  onSelect,
}: Props) => {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<Place[]>([]);
  const [active, setActive] = useState(-1);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const open = candidates.length > 0;
  const optionId = (index: number) => `${listId}-option-${index}`;

  const close = () => {
    setCandidates([]);
    setActive(-1);
  };

  const choose = (place: Place) => {
    close();
    onSelect(place);
  };

  const search = async () => {
    const name = query.trim();
    if (!name) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    close();
    setSearching(true);
    onSearching();
    try {
      const places = await searchPlaces(name, controller.signal);
      if (controller.signal.aborted) return;
      setSearching(false);
      if (places.length === 0) {
        onNoResult();
        return;
      }
      setCandidates(places);
      onResults();
    } catch {
      if (!controller.signal.aborted) setSearching(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, candidates.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Escape") {
      close();
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(candidates[active]);
    }
  };

  return (
    <form
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        void search();
      }}
    >
      <img src="/weather-app/images/icon-search.svg" alt="" />
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={
          open && active >= 0 ? optionId(active) : undefined
        }
        aria-autocomplete="list"
        placeholder="Search for a place..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="submit">Search</button>
      {open && (
        <ul id={listId} role="listbox" aria-label="Search results">
          {candidates.map((place, index) => (
            <li
              key={`${place.latitude},${place.longitude}`}
              id={optionId(index)}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(place);
              }}
            >
              {candidateLabel(place)}
            </li>
          ))}
        </ul>
      )}
      {searching && (
        <p>
          <img src="/weather-app/images/icon-loading.svg" alt="" />
          Search in progress
        </p>
      )}
    </form>
  );
};
