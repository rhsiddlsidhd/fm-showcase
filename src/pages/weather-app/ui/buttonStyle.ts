export const BUTTON_RESET_CLASS =
  "focus-visible:ring-ring h-auto border-0 bg-clip-border leading-[inherit] font-normal whitespace-normal select-text focus-visible:ring-2 focus-visible:[outline-style:auto] active:not-aria-[haspopup]:translate-y-0";
// 글자 크기 클래스는 leading 앞에 와야 병합 시 leading이 살아남는다.
export const GHOST_BUTTON_CLASS = `text-[length:inherit] ${BUTTON_RESET_CLASS} hover:bg-accent justify-start text-inherit`;
