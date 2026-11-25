import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import type { Place } from "../api/geocoding";
import { candidateLabel } from "../model/place";
import { usePlaceSearch } from "../model/use-place-search";
import type { SearchEvent } from "../model/weather-app-state";
import { ICON_LOADING, ICON_SEARCH } from "./assets";
import { BareButton } from "./BareButton";
import { PANEL_ENTER, SEARCH_SPIN } from "./motion";

type Props = {
  retry?: { query: string | null } | undefined;
  searching: boolean;
  onEvent: (event: SearchEvent) => void;
  onSelect: (place: Place) => void;
};

export const SearchBox = ({ retry, searching, onEvent, onSelect }: Props) => {
  const listId = useId();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState(retry?.query ?? "");
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    candidates,
    search: searchPlace,
    clearCandidates,
  } = usePlaceSearch(onEvent);

  const open = candidates.length > 0;
  const optionId = (index: number) => `${listId}-option-${index}`;

  const close = () => {
    clearCandidates();
    setActive(-1);
  };

  const choose = (place: Place) => {
    close();
    onSelect(place);
  };

  const search = async (override?: string) => {
    const name = (override ?? query).trim();
    if (!name) return;
    setActive(-1);
    await searchPlace(name);
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
    } else if (event.key === "Enter") {
      const candidate = candidates[active];
      if (candidate === undefined) return;
      event.preventDefault();
      choose(candidate);
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
          src={ICON_SEARCH}
          alt=""
          className="pointer-events-none absolute top-1/2 left-6 -translate-y-1/2"
        />
        <input
          className="w-full rounded-xl bg-input py-4 pr-6 pl-15 text-base placeholder:text-(--subtle-text) hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
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
            className="absolute inset-x-0 top-full z-10 mt-2.5 flex flex-col gap-1 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
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
                className="cursor-pointer rounded-lg px-2 py-2.5 hover:bg-accent aria-selected:border aria-selected:border-border aria-selected:bg-accent"
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
          <p className="absolute inset-x-0 top-full z-10 mt-2.5 flex items-center gap-2.5 rounded-xl border border-border bg-popover px-4 py-3 text-popover-foreground shadow-lg">
            <motion.img
              src={ICON_LOADING}
              alt=""
              animate={{ rotate: 360 }}
              transition={SEARCH_SPIN.transition}
            />
            Search in progress
          </p>
        )}
      </div>
      <BareButton
        type="submit"
        className="rounded-xl bg-primary px-6 py-4 text-base text-primary-foreground hover:bg-(--primary-hover)"
      >
        Search
      </BareButton>
    </form>
  );
};
