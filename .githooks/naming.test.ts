import { describe, expect, it } from "vitest";
import { validateBranchName } from "./naming.ts";

describe("validateBranchName", () => {
  it.each([
    "feat",
    "fix",
    "docs",
    "refactor",
    "perf",
    "test",
    "build",
    "ci",
    "chore",
    "revert",
  ])("허용된 prefix의 브랜치 이름을 받아들인다: %s", (prefix) => {
    expect(validateBranchName(`${prefix}/user-login`)).toBeNull();
  });

  it.each(["feat/login", "fix/issue-87", "chore/a1-b2-c3"])(
    "소문자 kebab-case 이름을 받아들인다: %s",
    (name) => {
      expect(validateBranchName(name)).toBeNull();
    },
  );

  it.each([
    ["prefix 없음", "user-login"],
    ["허용 목록에 없는 prefix", "wip/user-login"],
    ["대문자 prefix", "Feat/user-login"],
    ["이름 없음", "feat/"],
    ["대문자가 있는 이름", "feat/User-Login"],
    ["언더스코어", "feat/user_login"],
    ["앞뒤 하이픈", "feat/-user-login"],
    ["연속 하이픈", "feat/user--login"],
    ["하위 경로", "feat/user/login"],
    ["공백", "feat/user login"],
    ["한글", "feat/로그인"],
  ])("형식이 틀린 이름을 거부한다: %s", (_name, branch) => {
    expect(validateBranchName(branch)).toMatch(/브랜치 이름/);
  });
});
