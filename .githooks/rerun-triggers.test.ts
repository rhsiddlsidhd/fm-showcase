// pre-push 의 test:changed 는 import 그래프로 관련 테스트를 고른다. import 로 추적되지 않는 경로가
// 바뀌면 vitest 설정 test.forceRerunTriggers 가 전체 테스트로 승격해야 한다(docs/git/hooks.md).
// 패턴은 vitest 가 바뀐 파일의 절대 경로와 대조하므로, 저장소 루트 기준 절대 경로로 확인한다.
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfigFromFile } from "vite";
import { configDefaults } from "vitest/config";
import { describe, expect, it } from "vitest";

// vitest 가 쓰는 picomatch 를 vitest 의 위치에서 불러, vitest 와 같은 구현·옵션({ dot: true })으로 대조한다.
// 저장소의 직접 의존이 아니고 타입 선언도 없어 필요한 모양만 적는다.
const require = createRequire(import.meta.url);
const picomatch = createRequire(require.resolve("vitest/package.json"))(
  "picomatch",
) as (
  patterns: string[],
  options: { dot: boolean },
) => (path: string) => boolean;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const absolute = (path: string) => resolve(root, path).replaceAll("\\", "/");

// 설정 파일은 vitest 처럼 vite 로 불러온다. 테스트 안에서 import 하면 vite 변환이
// new URL(..., import.meta.url) 을 바꿔 설정 파일이 실행되지 않는다.
const loaded = await loadConfigFromFile(
  { command: "serve", mode: "test" },
  "vite.config.ts",
  root,
);
// 설정에 값이 없으면 vitest 는 기본값을 쓴다. 값이 있으면 기본값을 덮어쓴다.
const triggers =
  loaded?.config.test?.forceRerunTriggers ?? configDefaults.forceRerunTriggers;
const isTrigger = picomatch(triggers, { dot: true });

describe("vitest forceRerunTriggers", () => {
  it.each([
    ".githooks/index.ts",
    ".githooks/pre-push",
    "public/room-homepage/logo.svg",
    "src/shared/test/fixtures/a/b.json",
    "package-lock.json",
    "package.json",
    "vite.config.ts",
  ])("%s 가 바뀌면 전체 테스트로 승격한다", (path) => {
    expect(isTrigger(absolute(path))).toBe(true);
  });

  it.each(["src/shared/ui/button.tsx", "README.md"])(
    "%s 가 바뀌면 관련 테스트만 고른다",
    (path) => {
      expect(isTrigger(absolute(path))).toBe(false);
    },
  );
});
