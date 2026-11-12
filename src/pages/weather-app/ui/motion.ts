// 움직임 값은 디자인 토큰이 아니라 motion에 넘기는 JS 값이다(docs/ui/animation.md).
// 값은 이 파일이 기준이다. 움직임 줄이기 설정에 따른 분기는 각 컴포넌트에 있다.

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
