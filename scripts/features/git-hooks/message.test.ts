import { describe, expect, it } from "vitest";
import { validateCommitMessage } from "./message.ts";

const AI = "Co-Authored-By: Any Agent <agent@example.com>";
const HUMAN = "AI-Assisted: none";

const message = (...paragraphs: string[]) => paragraphs.join("\n\n") + "\n";
const withAi = (subject: string) => message(subject, AI);

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
    expect(validateCommitMessage(withAi(`${prefix}: add foo`))).toBeNull();
  });

  it("kebab-case scope가 있는 제목을 받아들인다", () => {
    expect(
      validateCommitMessage(withAi("feat(user-login): add foo")),
    ).toBeNull();
  });

  it("breaking change 표시 !가 있는 제목을 받아들인다", () => {
    expect(validateCommitMessage(withAi("feat!: drop old api"))).toBeNull();
    expect(
      validateCommitMessage(withAi("feat(api)!: drop old api")),
    ).toBeNull();
  });

  it("정확히 72자인 제목을 받아들인다", () => {
    const subject = "chore: " + "a".repeat(72 - "chore: ".length);
    expect(subject).toHaveLength(72);
    expect(validateCommitMessage(withAi(subject))).toBeNull();
  });

  it("72자를 넘는 제목을 거부한다", () => {
    const subject = "chore: " + "a".repeat(73 - "chore: ".length);
    expect(validateCommitMessage(withAi(subject))).toMatch(/72자/);
  });

  it("빈 메시지를 거부한다", () => {
    expect(validateCommitMessage("")).toMatch(/비어/);
  });

  it("주석과 빈 줄뿐인 메시지를 거부한다", () => {
    expect(validateCommitMessage("\n# comment\n\n")).toMatch(/비어/);
  });

  it("앞의 주석과 빈 줄을 건너뛴 첫 줄을 제목으로 본다", () => {
    const text = "# comment\n\nfix: add foo\n\n" + AI + "\n";
    expect(validateCommitMessage(text)).toBeNull();
  });

  it.each([
    ["허용 목록에 없는 prefix", "wip: add foo"],
    ["대문자 prefix", "Feat: add foo"],
    ["prefix 없음", "add foo"],
    ["콜론 뒤 공백 없음", "feat:add foo"],
    ["콜론 앞 공백", "feat : add foo"],
  ])("형식이 틀린 제목을 거부한다: %s", (_name, subject) => {
    expect(validateCommitMessage(withAi(subject))).toMatch(/형식/);
  });

  it.each(["Api", "user_login", "a b", ""])(
    "kebab-case가 아닌 scope를 거부한다: (%s)",
    (scope) => {
      expect(validateCommitMessage(withAi(`feat(${scope}): add foo`))).toMatch(
        /scope/,
      );
    },
  );

  it("콜론 뒤 메시지가 비어 있는 제목을 거부한다", () => {
    expect(validateCommitMessage(withAi("feat: "))).toMatch(/메시지/);
  });

  it("영어(ASCII)가 아닌 메시지를 거부한다", () => {
    expect(validateCommitMessage(withAi("feat: 로그인 추가"))).toMatch(/영어/);
  });

  it("대문자로 시작하는 메시지를 거부한다", () => {
    expect(validateCommitMessage(withAi("feat: Add foo"))).toMatch(/소문자/);
  });

  it("마침표로 끝나는 제목을 거부한다", () => {
    expect(validateCommitMessage(withAi("feat: add foo."))).toMatch(/마침표/);
  });
});

describe("validateCommitMessage의 AI 관여 선언", () => {
  const SUBJECT = "chore: add foo";

  it("AI 공저 트레일러가 있는 커밋을 받아들인다", () => {
    expect(validateCommitMessage(message(SUBJECT, AI))).toBeNull();
  });

  it.each([
    "Claude Sonnet 5.5 <noreply@anthropic.com>",
    "Codex <codex@openai.com>",
    "my-local-model v2 <me@example.com>",
  ])("에이전트 이름과 이메일은 가리지 않는다: %s", (who) => {
    const text = message(SUBJECT, `Co-Authored-By: ${who}`);
    expect(validateCommitMessage(text)).toBeNull();
  });

  it("사람 단독 커밋은 AI-Assisted: none 으로 받아들인다", () => {
    expect(validateCommitMessage(message(SUBJECT, HUMAN))).toBeNull();
  });

  it("본문이 있어도 마지막 문단의 트레일러를 읽는다", () => {
    const text = message(SUBJECT, "Explain why the change is needed.", AI);
    expect(validateCommitMessage(text)).toBeNull();
  });

  it("에디터가 붙이는 # 주석 줄은 무시한다", () => {
    const text = message(SUBJECT, AI) + "\n# Please enter the commit message\n";
    expect(validateCommitMessage(text)).toBeNull();
  });

  it("표기가 없는 커밋을 거부한다", () => {
    expect(validateCommitMessage(message(SUBJECT))).toMatch(/AI 관여 표기/);
  });

  it("본문만 있고 트레일러가 없는 커밋을 거부한다", () => {
    const text = message(SUBJECT, "Explain why the change is needed.");
    expect(validateCommitMessage(text)).toMatch(/AI 관여 표기/);
  });

  it("마지막 문단이 아닌 곳의 트레일러는 선언으로 보지 않는다", () => {
    const text = message(SUBJECT, AI, "Explain why the change is needed.");
    expect(validateCommitMessage(text)).toMatch(/AI 관여 표기/);
  });

  it.each([
    "Co-Authored-By: Claude",
    "Co-Authored-By: <agent@example.com>",
    "Co-Authored-By: Any Agent <not-an-email>",
  ])("이름 <이메일> 형식이 아닌 공저 트레일러를 거부한다: %s", (trailer) => {
    expect(validateCommitMessage(message(SUBJECT, trailer))).toMatch(
      /Co-Authored-By/,
    );
  });

  it("AI-Assisted 에 none 이외의 값을 거부한다", () => {
    const text = message(SUBJECT, "AI-Assisted: yes");
    expect(validateCommitMessage(text)).toMatch(/AI-Assisted/);
  });

  it("공저 트레일러와 AI-Assisted: none 을 함께 쓰면 거부한다", () => {
    const text = message(SUBJECT, `${AI}\n${HUMAN}`);
    expect(validateCommitMessage(text)).toMatch(/함께/);
  });

  it("제목이 잘못되면 트레일러가 맞아도 제목 오류를 먼저 낸다", () => {
    const text = message("Add foo.", AI);
    expect(validateCommitMessage(text)).toMatch(/제목/);
  });
});
