import type { Challenge } from "../model/challenge";
import { ChallengeCard } from "./ChallengeCard";
import { EmptyChallengeCard } from "./EmptyChallengeCard";

interface ChallengeRailProps {
  challenges: readonly Challenge[];
}

export const ChallengeRail = ({ challenges }: ChallengeRailProps) => (
  <ul
    className="showcase-rail mx-auto flex w-full max-w-(--showcase-rail-max-width) snap-x snap-mandatory scroll-px-(--showcase-rail-inset) gap-(--showcase-rail-gap) overflow-x-auto p-(--showcase-rail-inset) md:grid md:max-w-none md:snap-none md:grid-cols-2 md:overflow-visible md:p-0 lg:grid-cols-3"
    onFocus={(event) =>
      event.target.scrollIntoView({ block: "nearest", inline: "nearest" })
    }
  >
    {challenges.length === 0 ? (
      <li className="w-(--showcase-card-width) flex-none md:w-full">
        <EmptyChallengeCard />
      </li>
    ) : (
      challenges.map((challenge) => (
        <li
          key={challenge.slug}
          className="w-(--showcase-card-width) flex-none snap-start md:w-full md:snap-align-none"
        >
          <ChallengeCard challenge={challenge} />
        </li>
      ))
    )}
  </ul>
);
