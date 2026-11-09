import type { Challenge } from "../model/challenge";
import { getStackOptions } from "../model/stack-options";
import { ChallengeRail } from "./ChallengeRail";
import { EmptyState } from "./EmptyState";
import { FilterPanel } from "./FilterPanel";

interface ShowcaseControllerProps {
  challenges: readonly Challenge[];
}

export const ShowcaseController = ({ challenges }: ShowcaseControllerProps) => {
  if (challenges.length === 0) return <EmptyState />;
  return (
    <>
      <FilterPanel stackOptions={getStackOptions([...challenges])} />
      <ChallengeRail challenges={challenges} />
    </>
  );
};
