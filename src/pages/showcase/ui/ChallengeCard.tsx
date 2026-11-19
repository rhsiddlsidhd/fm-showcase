import { useId, type ComponentProps } from "react";
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
import cardSurface from "./card-surface.module.css";

interface ChallengeCardProps {
  challenge: Challenge;
}

const ChipBadge = ({
  className = "",
  ...props
}: ComponentProps<typeof Badge>) => (
  <Badge
    variant="secondary"
    className={`h-auto rounded-[999px] px-2.5 py-1 tracking-[0.06em] uppercase ${className}`}
    {...props}
  />
);

const MotionLink = motion.create(Link);

export const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  const titleId = useId();
  const shouldReduceMotion = useReducedMotion();
  return (
    <MotionLink
      to={challengePath(challenge.slug)}
      aria-labelledby={titleId}
      // 카드 높이가 포커스 표시 여유를 포함해 화면 높이를 넘지 않도록 폭을 제한한다.
      className={`${cardSurface.surface} text-card-foreground outline-ring mx-auto flex aspect-(--card-aspect-ratio) w-full max-w-[calc((100dvh-2*(var(--focus-offset)+var(--focus-width)))/var(--card-height-ratio))] scroll-my-(--rail-inset) flex-col gap-(--card-content-gap) overflow-hidden rounded-(--card-radius) p-(--card-padding) shadow-(--card-shadow) outline-offset-(--focus-offset) focus-visible:outline-(length:--focus-width)`}
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
        className="line-clamp-2 text-xl font-bold tracking-[-0.015em]"
      >
        {challenge.title}
      </h2>
      <ChipBadge className="self-start">{challenge.difficulty}</ChipBadge>
      <ul className="flex flex-wrap gap-2">
        {challenge.stack.map((stack) => (
          <li key={stack}>
            <ChipBadge>{stack}</ChipBadge>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground line-clamp-3">
        {challenge.description}
      </p>
    </MotionLink>
  );
};
