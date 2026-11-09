import type { Challenge } from "../model/challenge";
import { ChallengeRail } from "./ChallengeRail";
import { EmptyState } from "./EmptyState";

interface ShowcaseControllerProps {
  challenges: readonly Challenge[];
}

export const ShowcaseController = ({ challenges }: ShowcaseControllerProps) => {
  if (challenges.length === 0) return <EmptyState />;
  return <ChallengeRail challenges={challenges} />;
};
