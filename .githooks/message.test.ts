import { describe, expect, it } from "vitest";
import { validateCommitMessage } from "./message.ts";

const message = (...paragraphs: string[]) => paragraphs.join("\n\n") + "\n";

describe("validateCommitMessage의 제목 규칙", () => {
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
  ])("허용된 prefix를 받아들인다: %s", (prefix) => {
    expect(validateCommitMessage(message(`${prefix}: add foo`))).toBeNull();
  });

  it("kebab-case scope가 있는 제목을 받아들인다", () => {
    expect(
      validateCommitMessage(message("feat(user-login): add foo")),
    ).toBeNull();
  });

  it("breaking change 표시 !가 있는 제목을 받아들인다", () => {
    expect(validateCommitMessage(message("feat!: drop old api"))).toBeNull();
    expect(
      validateCommitMessage(message("feat(api)!: drop old api")),
    ).toBeNull();
  });

  it("정확히 72자인 제목을 받아들인다", () => {
    const subject = "chore: " + "a".repeat(72 - "chore: ".length);
    expect(subject).toHaveLength(72);
    expect(validateCommitMessage(message(subject))).toBeNull();
  });

  it("72자를 넘는 제목을 거부한다", () => {
    const subject = "chore: " + "a".repeat(73 - "chore: ".length);
    expect(validateCommitMessage(message(subject))).toMatch(/72자/);
  });

  it("빈 메시지를 거부한다", () => {
    expect(validateCommitMessage("")).toMatch(/비어/);
  });

  it("주석과 빈 줄뿐인 메시지를 거부한다", () => {
    expect(validateCommitMessage("\n# comment\n\n")).toMatch(/비어/);
  });

  it("앞의 주석과 빈 줄을 건너뛴 첫 줄을 제목으로 본다", () => {
    const text = "# comment\n\nfix: add foo\n";
    expect(validateCommitMessage(text)).toBeNull();
  });

  it.each([
    ["허용 목록에 없는 prefix", "wip: add foo"],
    ["대문자 prefix", "Feat: add foo"],
    ["prefix 없음", "add foo"],
    ["콜론 뒤 공백 없음", "feat:add foo"],
    ["콜론 앞 공백", "feat : add foo"],
  ])("형식이 틀린 제목을 거부한다: %s", (_name, subject) => {
    expect(validateCommitMessage(message(subject))).toMatch(/형식/);
  });

  it.each(["Api", "user_login", "a b", ""])(
    "kebab-case가 아닌 scope를 거부한다: (%s)",
    (scope) => {
      expect(validateCommitMessage(message(`feat(${scope}): add foo`))).toMatch(
        /scope/,
      );
    },
  );

  it("콜론 뒤 메시지가 비어 있는 제목을 거부한다", () => {
    expect(validateCommitMessage(message("feat: "))).toMatch(/메시지/);
  });

  it("영어(ASCII)가 아닌 메시지를 거부한다", () => {
    expect(validateCommitMessage(message("feat: 로그인 추가"))).toMatch(/영어/);
  });

  it("대문자로 시작하는 메시지를 거부한다", () => {
    expect(validateCommitMessage(message("feat: Add foo"))).toMatch(/소문자/);
  });

  it("마침표로 끝나는 제목을 거부한다", () => {
    expect(validateCommitMessage(message("feat: add foo."))).toMatch(/마침표/);
  });
});

describe("validateCommitMessage의 트레일러 무시", () => {
  const SUBJECT = "chore: add foo";

  it("트레일러 없이 제목만 맞으면 받아들인다", () => {
    expect(validateCommitMessage(message(SUBJECT))).toBeNull();
  });

  it("본문만 있고 트레일러가 없어도 받아들인다", () => {
    const text = message(SUBJECT, "Explain why the change is needed.");
    expect(validateCommitMessage(text)).toBeNull();
  });

  it.each([
    "Co-Authored-By: Any Agent <agent@example.com>",
    "Co-Authored-By: Claude",
    "AI-Assisted: yes",
  ])(
    "마지막 문단의 트레일러는 형식과 상관없이 검사하지 않는다: %s",
    (trailer) => {
      expect(validateCommitMessage(message(SUBJECT, trailer))).toBeNull();
    },
  );
});
