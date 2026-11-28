// pre-push 훅과 CI 가 npm run 으로 부르는 품질 검사 scripts 가 저장소 package.json 에 있는지 본다.
// 이름이 바뀌거나 빠지면 훅이나 CI 가 없는 script 를 불러 push 나 PR 검사가 막힌다.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
    "utf8",
  ),
) as { scripts: Record<string, string> };

describe("package.json 품질 검사 scripts", () => {
  it("pre-push 훅과 CI 가 부르는 scripts 가 모두 있다", () => {
    expect(Object.keys(packageJson.scripts)).toEqual(
      expect.arrayContaining([
        "typecheck",
        "lint",
        "lint:fsd",
        "lint:css",
        "format:check",
        "test",
        "test:changed",
        "build",
        "test:e2e",
      ]),
    );
  });
});
