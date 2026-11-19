import type { Challenge } from "../model/challenge";
import { ChallengeCard } from "./ChallengeCard";
import { EmptyChallengeCard } from "./EmptyChallengeCard";

interface ChallengeRailProps {
  challenges: readonly Challenge[];
}

export const ChallengeRail = ({ challenges }: ChallengeRailProps) => (
  <ul
    // 768px 미만에서 카드 2장이 한 번에 보이지 않도록 목록의 보이는 폭을 제한한다(max-w-96).
    className="mx-auto flex w-full max-w-96 snap-x snap-mandatory scroll-px-(--rail-inset) gap-5 overflow-x-auto p-(--rail-inset) md:grid md:max-w-none md:snap-none md:grid-cols-2 md:overflow-visible md:p-0 lg:grid-cols-3"
    onFocus={(event) =>
      event.target.scrollIntoView({ block: "nearest", inline: "nearest" })
    }
  >
    {challenges.length === 0 ? (
      <li className="w-(--card-width) flex-none md:w-full">
        <EmptyChallengeCard />
      </li>
    ) : (
      challenges.map((challenge) => (
        <li
          key={challenge.slug}
          className="w-(--card-width) flex-none snap-start md:w-full md:snap-align-none"
        >
          <ChallengeCard challenge={challenge} />
        </li>
      ))
    )}
  </ul>
);
