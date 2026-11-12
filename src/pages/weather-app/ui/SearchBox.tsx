import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import { searchPlaces, type Place } from "../api/geocoding";
import { candidateLabel } from "../model/place";
import { PANEL_ENTER, SEARCH_SPIN } from "./motion";

const PANEL_CLASS =
  "absolute inset-x-0 top-full z-10 mt-2.5 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg";

type Props = {
  retry?: { query: string | null };
  onSearching: (query: string) => void;
  onError: (query: string) => void;
  onNoResult: () => void;
  onResults: () => void;
  onSelect: (place: Place) => void;
};

export const SearchBox = ({
  retry,
  onSearching,
  onError,
  onNoResult,
  onResults,
  onSelect,
}: Props) => {
  const listId = useId();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState(retry?.query ?? "");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<Place[]>([]);
  const [active, setActive] = useState(-1);
  const controllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const search = async (override?: string) => {
    const name = (override ?? query).trim();
    if (!name) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    close();
    setSearching(true);
    onSearching(name);
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
      if (controller.signal.aborted) return;
      setSearching(false);
      onError(name);
    }
  };

  useEffect(() => {
    if (!retry) return;
    inputRef.current?.focus();
    const { query: retryQuery } = retry;
    if (retryQuery) void Promise.resolve().then(() => search(retryQuery));
    // 다시 시도로 마운트될 때 한 번만 실행한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      className="mx-auto flex w-full max-w-2xl flex-col gap-3 lg:flex-row lg:gap-4"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onSubmit={(event) => {
        event.preventDefault();
        void search();
      }}
    >
      <div className="relative min-w-0 lg:flex-1">
        <img
          src="/weather-app/images/icon-search.svg"
          alt=""
          className="pointer-events-none absolute top-1/2 left-6 -translate-y-1/2"
        />
        <input
          className="bg-input hover:bg-accent focus-visible:ring-ring w-full rounded-xl py-4 pr-6 pl-15 text-(length:--weather-app-text-body) placeholder:text-(--weather-app-text-subtle) focus-visible:ring-2"
          ref={inputRef}
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
        {open && (
          <motion.ul
            key="candidates"
            id={listId}
            role="listbox"
            aria-label="Search results"
            className={`${PANEL_CLASS} flex flex-col gap-1`}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: PANEL_ENTER.offsetY }
            }
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={PANEL_ENTER.transition}
          >
            {candidates.map((place, index) => (
              <li
                key={`${place.latitude},${place.longitude}`}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                className="hover:bg-accent aria-selected:border-border aria-selected:bg-accent cursor-pointer rounded-lg px-2 py-2.5 aria-selected:border"
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(place);
                }}
              >
                {candidateLabel(place)}
              </li>
            ))}
          </motion.ul>
        )}
        {searching && (
          <p className={`${PANEL_CLASS} flex items-center gap-2.5 px-4 py-3`}>
            {reduceMotion ? (
              <img src="/weather-app/images/icon-loading.svg" alt="" />
            ) : (
              <motion.img
                src="/weather-app/images/icon-loading.svg"
                alt=""
                animate={{ rotate: 360 }}
                transition={SEARCH_SPIN.transition}
              />
            )}
            Search in progress
          </p>
        )}
      </div>
      <Button
        type="submit"
        className="bg-primary text-primary-foreground focus-visible:ring-ring h-auto rounded-xl border-0 bg-clip-border px-6 py-4 text-(length:--weather-app-text-body) leading-[inherit] font-normal whitespace-normal select-text hover:bg-(--weather-app-primary-hover) focus-visible:ring-2 focus-visible:[outline-style:auto] active:not-aria-[haspopup]:translate-y-0"
      >
        Search
      </Button>
    </form>
  );
};
