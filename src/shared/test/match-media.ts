import { vi } from "vitest";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// jsdom에는 matchMedia가 없다. 움직임 줄이기 설정만 결정하고 다른 미디어 쿼리는 모두 일치하지 않는다고 답한다.
// 테스트가 끝나면 vi.unstubAllGlobals()로 되돌린다.
export const stubPrefersReducedMotion = (reduce: boolean) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduce && query.trim() === REDUCED_MOTION_QUERY,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    })),
  );
};
