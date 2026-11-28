import { describe, expect, it } from "vitest";
import {
  isBranchUpdate,
  validateCheckTarget,
  validatePushRef,
} from "./push.ts";

const ZERO = "0000000000000000000000000000000000000000";
const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

describe("validatePushRef", () => {
  it("규칙에 맞는 작업 브랜치의 push를 받아들인다", () => {
    expect(
      validatePushRef("refs/heads/feat/x", SHA_A, "refs/heads/feat/x", SHA_B),
    ).toBeNull();
  });

  it("원격에 새로 만드는 작업 브랜치의 push를 받아들인다", () => {
    expect(
      validatePushRef("refs/heads/feat/x", SHA_A, "refs/heads/feat/x", ZERO),
    ).toBeNull();
  });

  it("규칙에 맞지 않는 이름의 브랜치 push를 거부한다", () => {
    expect(
      validatePushRef(
        "refs/heads/Feature_X",
        SHA_A,
        "refs/heads/Feature_X",
        SHA_B,
      ),
    ).toMatch(/브랜치 이름/);
  });

  it("작업 브랜치 삭제는 이름이 규칙에 맞지 않아도 받아들인다", () => {
    expect(
      validatePushRef("(delete)", ZERO, "refs/heads/Feature_X", SHA_B),
    ).toBeNull();
  });

  it("main에 이미 있는 커밋 위로 직접 push하면 거부한다", () => {
    expect(
      validatePushRef("refs/heads/main", SHA_A, "refs/heads/main", SHA_B),
    ).toMatch(/main/);
  });

  it("main 삭제를 거부한다", () => {
    expect(validatePushRef("(delete)", ZERO, "refs/heads/main", SHA_B)).toMatch(
      /main/,
    );
  });

  it("원격에 main을 처음 만드는 push를 받아들인다", () => {
    expect(
      validatePushRef("refs/heads/main", SHA_A, "refs/heads/main", ZERO),
    ).toBeNull();
  });

  it("main이 없는 원격에 main 삭제를 요청하면 거부한다", () => {
    expect(validatePushRef("(delete)", ZERO, "refs/heads/main", ZERO)).toMatch(
      /main/,
    );
  });

  it("다른 이름의 로컬 브랜치를 원격 main으로 push하면 거부한다", () => {
    expect(
      validatePushRef("refs/heads/feat/x", SHA_A, "refs/heads/main", SHA_B),
    ).toMatch(/main/);
  });

  it("브랜치가 아닌 ref(태그)의 push는 검사하지 않는다", () => {
    expect(
      validatePushRef("refs/tags/v1", SHA_A, "refs/tags/v1", ZERO),
    ).toBeNull();
  });
});

describe("isBranchUpdate", () => {
  it("원격 브랜치에 커밋을 올리는 push는 품질 검사 대상이다", () => {
    expect(isBranchUpdate(SHA_A, "refs/heads/feat/x")).toBe(true);
  });

  it("원격에 새로 만드는 브랜치도 품질 검사 대상이다", () => {
    expect(isBranchUpdate(SHA_A, "refs/heads/main")).toBe(true);
  });

  it("원격 브랜치 삭제는 품질 검사 대상이 아니다", () => {
    expect(isBranchUpdate(ZERO, "refs/heads/feat/x")).toBe(false);
  });

  it("태그 push는 품질 검사 대상이 아니다", () => {
    expect(isBranchUpdate(SHA_A, "refs/tags/v1")).toBe(false);
  });
});

describe("validateCheckTarget", () => {
  it("작업 트리가 깨끗하고 push하는 커밋이 HEAD면 받아들인다", () => {
    expect(
      validateCheckTarget(false, SHA_A, [
        { localRef: "refs/heads/feat/x", localSha: SHA_A },
      ]),
    ).toBeNull();
  });

  it("작업 트리에 커밋하지 않은 변경이 있으면 커밋하거나 stash하라며 거부한다", () => {
    const reason = validateCheckTarget(true, SHA_A, [
      { localRef: "refs/heads/feat/x", localSha: SHA_A },
    ]);
    expect(reason).toMatch(/커밋/);
    expect(reason).toMatch(/stash/);
  });

  it("push하는 브랜치가 HEAD와 다르면 그 브랜치를 체크아웃하라며 거부한다", () => {
    const reason = validateCheckTarget(false, SHA_A, [
      { localRef: "refs/heads/feat/y", localSha: SHA_B },
    ]);
    expect(reason).toContain("refs/heads/feat/y");
    expect(reason).toMatch(/체크아웃/);
  });

  it("여러 브랜치 중 하나라도 HEAD와 다르면 거부한다", () => {
    expect(
      validateCheckTarget(false, SHA_A, [
        { localRef: "refs/heads/feat/x", localSha: SHA_A },
        { localRef: "refs/heads/feat/y", localSha: SHA_B },
      ]),
    ).toContain("refs/heads/feat/y");
  });
});
