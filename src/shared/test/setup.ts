import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// node 환경 테스트(@vitest-environment node)에는 웹 스토리지가 없다.
afterEach(() => {
  if (typeof window === "undefined") return;
  localStorage.clear();
  sessionStorage.clear();
});
