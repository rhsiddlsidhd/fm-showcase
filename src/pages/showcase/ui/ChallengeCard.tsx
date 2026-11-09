import { useId } from "react";
import { Link } from "react-router";
import { Badge } from "@/shared/ui/badge";
import type { Challenge } from "../model/challenge";
import { challengePath } from "../model/challenge-path";

interface ChallengeCardProps {
  challenge: Challenge;
}

const BADGE_CLASS =
  "h-auto rounded-(--showcase-chip-radius) px-(--showcase-badge-inline-padding) py-(--showcase-badge-block-padding) text-(length:--showcase-badge-size) leading-(--showcase-badge-leading)";

export const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  const titleId = useId();
  return (
    <Link
      to={challengePath(challenge.slug)}
      aria-labelledby={titleId}
      className="showcase-card text-card-foreground outline-ring flex aspect-(--showcase-card-aspect-ratio) flex-col gap-(--showcase-card-content-gap) overflow-hidden rounded-(--showcase-card-radius) p-(--showcase-card-padding) shadow-(--showcase-card-shadow) outline-offset-(--showcase-focus-offset) focus-visible:outline-(length:--showcase-focus-width)"
    >
      <h2
        id={titleId}
        className="line-clamp-(--showcase-card-title-lines) text-(length:--showcase-card-title-size) leading-(--showcase-card-title-leading) font-(--showcase-card-title-weight)"
      >
        {challenge.title}
      </h2>
      <Badge variant="secondary" className={`${BADGE_CLASS} self-start`}>
        {challenge.difficulty}
      </Badge>
      <ul className="flex flex-wrap gap-2">
        {challenge.stack.map((stack) => (
          <li key={stack}>
            <Badge variant="secondary" className={BADGE_CLASS}>
              {stack}
            </Badge>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground line-clamp-(--showcase-card-description-lines) text-(length:--showcase-body-size) leading-(--showcase-body-leading)">
        {challenge.description}
      </p>
    </Link>
  );
};
