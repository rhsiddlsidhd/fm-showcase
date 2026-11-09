import type { Challenge } from "../model/challenge";
import { ChallengeCard } from "./ChallengeCard";

interface ChallengeRailProps {
  challenges: readonly Challenge[];
}

export const ChallengeRail = ({ challenges }: ChallengeRailProps) => (
  <ul className="flex snap-x snap-mandatory scroll-px-(--showcase-rail-inset) gap-(--showcase-rail-gap) overflow-x-auto p-(--showcase-rail-inset)">
    {challenges.map((challenge) => (
      <li
        key={challenge.slug}
        className="w-(--showcase-card-width) flex-none snap-start md:w-(--showcase-card-width-md) lg:w-(--showcase-card-width-lg)"
      >
        <ChallengeCard challenge={challenge} />
      </li>
    ))}
  </ul>
);
