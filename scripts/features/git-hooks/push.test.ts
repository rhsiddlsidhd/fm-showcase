import { describe, expect, it } from "vitest";
import { validatePushRef } from "./push.ts";

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
