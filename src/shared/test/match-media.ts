import { vi } from "vitest";

// motion은 "(prefers-reduced-motion)"을 묻고, 읽은 값을 모듈 안에 담아 두며 change 이벤트로만 갱신한다.
// 그래서 같은 대역 객체를 테스트 전체에서 재사용하고, 값을 바꿀 때 change 이벤트를 보낸다.
const REDUCED_MOTION_QUERY = /^\(prefers-reduced-motion(: reduce)?\)$/;

let reduced = false;
const listeners = new Set<() => void>();

const createMediaQueryList = (query: string) => {
  const isReducedMotionQuery = REDUCED_MOTION_QUERY.test(query.trim());
  return {
    get matches() {
      return reduced && isReducedMotionQuery;
    },
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
    dispatchEvent: vi.fn(() => false),
  };
};

const installMatchMedia = () => {
  vi.stubGlobal("matchMedia", vi.fn(createMediaQueryList));
};

// jsdom에는 matchMedia가 없다. 움직임 줄이기 설정만 결정하고 다른 미디어 쿼리는 모두 일치하지 않는다고 답한다.
// 컴포넌트를 렌더링하기 전에 부른다. 모든 테스트 전에 setup.ts가 false로 되돌려 설치한다(motion이 첫 렌더링에서 변경 알림을 구독하게 한다).
export const stubPrefersReducedMotion = (reduce: boolean) => {
  reduced = reduce;
  installMatchMedia();
  listeners.forEach((listener) => listener());
};
