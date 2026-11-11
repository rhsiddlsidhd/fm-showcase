/* ChallengeCard의 부유 애니메이션 값. motion은 이 값을 CSS 변수가 아닌 JS 값으로 받는다. */
export const CARD_FLOAT_Y: number[] = [0, -8, 0];
export const CARD_FLOAT_DURATION = 4.5;
export const CARD_FLOAT_EASE = "easeInOut" as const;
export const CARD_SHEEN_POSITIONS: string[] = [
  "0% 0%, 0 0",
  "100% 100%, 0 0",
  "0% 0%, 0 0",
];
