import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import type { Challenge, FilterSelection } from "../model/challenge";
import { filterChallenges } from "../model/filter";
import { parseSelection, toSearchParams } from "../model/query";
import { getStackOptions } from "../model/stack-options";
import { ChallengeFilters } from "./ChallengeFilters";
import type { ToggleHandler } from "./ChallengeFilters";
import { ChallengeRail } from "./ChallengeRail";
import { EmptyState } from "./EmptyState";
import { ResultSummary } from "./ResultSummary";

interface ShowcaseControllerProps {
  challenges: readonly Challenge[];
}

export const ShowcaseController = ({ challenges }: ShowcaseControllerProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [announcement, setAnnouncement] = useState("");
  const newbieButtonRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocus = useRef(false);
  const isFirstRender = useRef(true);
  const query = searchParams.toString();
  const selection = parseSelection(searchParams);
  const filtered = filterChallenges(challenges, selection);
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

  useEffect(() => {
    if (!restoreFocus.current || query) return;
    restoreFocus.current = false;
    newbieButtonRef.current?.focus();
  }, [query]);

  if (challenges.length === 0) return <EmptyState kind="unregistered" />;

  const handleToggle: ToggleHandler = (group, value, checked) => {
    const current: readonly string[] = selection[group];
    const next: FilterSelection = {
      ...selection,
      [group]: checked
        ? [...current, value]
        : current.filter((item) => item !== value),
    };
    setSearchParams(toSearchParams(next));
  };
  const handleReset = () => {
    restoreFocus.current = true;
    setSearchParams(new URLSearchParams());
  };
  const hasSelection = selection.difficulty.length + selection.stack.length > 0;
  return (
    <>
      <ChallengeFilters
        stackOptions={getStackOptions(challenges)}
        selection={selection}
        onToggle={handleToggle}
        showReset={hasSelection && hasResults}
        onReset={handleReset}
        newbieButtonRef={(element) => {
          newbieButtonRef.current = element;
        }}
      />
      <ResultSummary
        visibleCount={filtered.length}
        announcement={announcement}
      />
      {!hasResults && <EmptyState kind="no-results" onReset={handleReset} />}
      <ChallengeRail challenges={filtered} />
    </>
  );
};
