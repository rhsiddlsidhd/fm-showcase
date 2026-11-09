import type { Challenge } from "../model/challenge";
import { ChallengeCard } from "./ChallengeCard";

interface ChallengeRailProps {
  challenges: readonly Challenge[];
}

export const ChallengeRail = ({ challenges }: ChallengeRailProps) => (
  <ul>
    {challenges.map((challenge) => (
      <li key={challenge.slug}>
        <ChallengeCard challenge={challenge} />
      </li>
    ))}
  </ul>
);
