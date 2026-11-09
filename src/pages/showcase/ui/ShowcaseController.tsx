import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import type { Challenge, FilterSelection } from "../model/challenge";
import { filterChallenges } from "../model/filter";
import { parseSelection, toSearchParams } from "../model/query";
import { getStackOptions } from "../model/stack-options";
import { ChallengeRail } from "./ChallengeRail";
import { EmptyState } from "./EmptyState";
import { ChallengeFilters } from "./ChallengeFilters";

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
  const hasResults = filtered.length > 0;
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
  const handleReset = () => setSearchParams(new URLSearchParams());
  const hasSelection = selection.difficulty.length + selection.stack.length > 0;
  const resetButton = (
    <button type="button" onClick={handleReset}>
      필터 초기화
    </button>
  );
  return (
    <>
      <ChallengeFilters
        stackOptions={getStackOptions([...challenges])}
        selection={selection}
        onChange={handleChange}
        showReset={hasSelection && hasResults}
        onReset={handleReset}
      />
      <p>{countText}</p>
      <div role="status" className="sr-only">
        {announcement}
      </div>
      {!hasResults && (
        <>
          <p>조건에 맞는 챌린지가 없습니다.</p>
          {resetButton}
        </>
      )}
      <ChallengeRail challenges={filtered} />
    </>
  );
};
