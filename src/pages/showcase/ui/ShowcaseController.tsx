import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import type { Challenge, FilterSelection } from "../model/challenge";
import { filterChallenges } from "../model/filter";
import { parseSelection, toSearchParams } from "../model/query";
import { getStackOptions } from "../model/stack-options";
import { ChallengeRail } from "./ChallengeRail";
import { EmptyState } from "./EmptyState";
import { FilterPanel } from "./FilterPanel";

interface ShowcaseControllerProps {
  challenges: readonly Challenge[];
}

export const ShowcaseController = ({ challenges }: ShowcaseControllerProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [announcement, setAnnouncement] = useState("");
  const isFirstRender = useRef(true);
  const query = searchParams.toString();
  const selection = parseSelection(searchParams);
  const filtered = filterChallenges([...challenges], selection);
  const countText = `${filtered.length}개의 챌린지`;
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setAnnouncement(countText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  if (challenges.length === 0) return <EmptyState />;
  const handleChange = (next: FilterSelection) =>
    setSearchParams(toSearchParams(next));
  return (
    <>
      <FilterPanel
        stackOptions={getStackOptions([...challenges])}
        selection={selection}
        onChange={handleChange}
      />
      <p>{countText}</p>
      <div role="status" className="sr-only">
        {announcement}
      </div>
      <ChallengeRail challenges={filtered} />
    </>
  );
};
