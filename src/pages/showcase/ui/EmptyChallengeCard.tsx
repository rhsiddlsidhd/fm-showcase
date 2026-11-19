import cardSurface from "./card-surface.module.css";

export const EmptyChallengeCard = () => (
  <div
    role="status"
    className={`${cardSurface.surface} text-card-foreground flex aspect-(--card-aspect-ratio) scroll-my-(--rail-inset) flex-col items-center justify-center gap-(--card-content-gap) overflow-hidden rounded-(--card-radius) p-(--card-padding) text-center`}
  >
    <p className="text-muted-foreground">챌린지들 등록해주세요.</p>
  </div>
);
