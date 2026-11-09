import { Link } from "react-router";
import type { Challenge } from "../model/challenge";
import { challengePath } from "../model/challenge-path";

interface ChallengeCardProps {
  challenge: Challenge;
}

export const ChallengeCard = ({ challenge }: ChallengeCardProps) => (
  <Link to={challengePath(challenge.slug)} aria-label={challenge.title}>
    <h2>{challenge.title}</h2>
    <span>{challenge.difficulty}</span>
    <ul>
      {challenge.stack.map((stack) => (
        <li key={stack}>{stack}</li>
      ))}
    </ul>
    <p>{challenge.description}</p>
  </Link>
);
