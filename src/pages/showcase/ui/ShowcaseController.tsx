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
  if (challenges.length === 0) return <EmptyState />;
  const selection = parseSelection(searchParams);
  const handleChange = (next: FilterSelection) =>
    setSearchParams(toSearchParams(next));
  return (
    <>
      <FilterPanel
        stackOptions={getStackOptions([...challenges])}
        selection={selection}
        onChange={handleChange}
      />
      <ChallengeRail
        challenges={filterChallenges([...challenges], selection)}
      />
    </>
  );
};
