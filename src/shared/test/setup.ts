import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { stubPrefersReducedMotion } from "./match-media";

beforeEach(() => {
  stubPrefersReducedMotion(false);
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
