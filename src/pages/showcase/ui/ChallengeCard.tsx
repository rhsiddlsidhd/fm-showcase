import { useId } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/shared/ui/badge";
import type { Challenge } from "../model/challenge";
import { challengePath } from "../model/challenge-path";
import {
  CARD_FLOAT_DURATION,
  CARD_FLOAT_EASE,
  CARD_FLOAT_Y,
  CARD_SHEEN_POSITIONS,
} from "./card-motion";

interface ChallengeCardProps {
  challenge: Challenge;
}

const BADGE_CLASS =
  "h-auto rounded-(--showcase-chip-radius) px-(--showcase-badge-inline-padding) py-(--showcase-badge-block-padding) text-(length:--showcase-badge-size) leading-(--showcase-badge-leading) tracking-(--showcase-badge-tracking) uppercase";

const MotionLink = motion.create(Link);

export const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  const titleId = useId();
  const shouldReduceMotion = useReducedMotion();
  return (
    <MotionLink
      to={challengePath(challenge.slug)}
      aria-labelledby={titleId}
      className="showcase-card mx-auto w-full max-w-(--showcase-card-max-width) text-card-foreground outline-ring flex aspect-(--showcase-card-aspect-ratio) flex-col gap-(--showcase-card-content-gap) overflow-hidden rounded-(--showcase-card-radius) p-(--showcase-card-padding) shadow-(--showcase-card-shadow) outline-offset-(--showcase-focus-offset) focus-visible:outline-(length:--showcase-focus-width)"
      animate={
        shouldReduceMotion
          ? { y: 0, backgroundPosition: CARD_SHEEN_POSITIONS[0] }
          : { y: CARD_FLOAT_Y, backgroundPosition: CARD_SHEEN_POSITIONS }
      }
      transition={
        shouldReduceMotion
          ? undefined
          : {
              duration: CARD_FLOAT_DURATION,
              ease: CARD_FLOAT_EASE,
              repeat: Infinity,
              repeatType: "loop",
            }
      }
    >
      <h2
        id={titleId}
        className="line-clamp-(--showcase-card-title-lines) text-(length:--showcase-card-title-size) leading-(--showcase-card-title-leading) font-(--showcase-card-title-weight) tracking-(--showcase-card-title-tracking)"
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
    </MotionLink>
  );
};
