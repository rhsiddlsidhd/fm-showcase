import { describe, expect, it } from "vitest";
import { validateCommitBranch } from "./branch.ts";

describe("validateCommitBranch", () => {
  it("첫 커밋 전의 main에는 직접 커밋을 받아들인다", () => {
    expect(validateCommitBranch("main", false)).toBeNull();
  });

  it("첫 커밋이 있는 main에 직접 커밋을 거부한다", () => {
    expect(validateCommitBranch("main", true)).toMatch(/main/);
  });

  it("규칙에 맞는 작업 브랜치에는 커밋을 받아들인다", () => {
    expect(validateCommitBranch("feat/user-login", true)).toBeNull();
  });

  it("규칙에 맞지 않는 브랜치 이름에는 커밋을 거부한다", () => {
    expect(validateCommitBranch("Feature_X", true)).toMatch(/브랜치 이름/);
  });

  it("첫 커밋 전이어도 main이 아닌 브랜치는 이름 규칙을 검사한다", () => {
    expect(validateCommitBranch("Feature_X", false)).toMatch(/브랜치 이름/);
  });

  it("분리된 HEAD(브랜치 이름 없음)는 검사하지 않는다", () => {
    expect(validateCommitBranch("", true)).toBeNull();
  });
});
