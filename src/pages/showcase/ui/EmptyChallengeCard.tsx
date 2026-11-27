export const EmptyChallengeCard = () => (
  <div
    role="status"
    className="flex aspect-(--card-aspect-ratio) scroll-my-(--rail-inset) flex-col items-center justify-center gap-(--card-content-gap) overflow-hidden rounded-(--card-radius) border border-(--card-border-color) bg-(--card-surface) bg-(image:--card-texture) bg-size-(--card-texture-size) p-(--card-padding) text-center text-card-foreground shadow-(--card-shadow) backdrop-filter-(--card-backdrop-filter) [&:is(:hover,:focus-visible)]:bg-(--card-highlight-surface)"
  >
    <p className="text-muted-foreground">챌린지들 등록해주세요.</p>
  </div>
);
