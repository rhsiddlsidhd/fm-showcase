import { Link } from "react-router";
import { Badge } from "@/shared/ui/badge";
import type { Challenge } from "../model/challenge";
import { challengePath } from "../model/challenge-path";

interface ChallengeCardProps {
  challenge: Challenge;
}

export const ChallengeCard = ({ challenge }: ChallengeCardProps) => (
  <Link to={challengePath(challenge.slug)} aria-label={challenge.title}>
    <h2>{challenge.title}</h2>
    <Badge>{challenge.difficulty}</Badge>
    <ul>
      {challenge.stack.map((stack) => (
        <li key={stack}>
          <Badge>{stack}</Badge>
        </li>
      ))}
    </ul>
    <p>{challenge.description}</p>
  </Link>
);
