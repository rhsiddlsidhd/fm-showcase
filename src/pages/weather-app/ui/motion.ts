// 움직임 값은 디자인 토큰이 아니라 motion에 넘기는 JS 값이다(docs/ui/animation.md).
// 값의 출처는 .sdd/weather-app/ux-design.md 「인터랙션과 애니메이션」 표다.

export const PANEL_ENTER = {
  offsetY: 8,
  transition: { duration: 0.15, ease: "easeOut" },
} as const;

export const UNIT_FADE = {
  transition: { duration: 0.1, ease: "easeOut" },
} as const;

export const LOADING_DOT = {
  liftY: -4,
  transition: {
    duration: 0.6,
    ease: "easeInOut",
    repeat: Infinity,
  },
  staggerSeconds: 0.15,
} as const;

export const SEARCH_SPIN = {
  transition: { duration: 0.8, ease: "linear", repeat: Infinity },
} as const;
