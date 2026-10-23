// @vitest-environment node
import { describe, expect, it } from "vitest";
import { validateCommitMessage } from "./message.ts";

const SUBJECT = "chore: add foo";
const AI = "Co-Authored-By: Any Agent <agent@example.com>";
const HUMAN = "AI-Assisted: none";

const message = (...paragraphs: string[]) => paragraphs.join("\n\n") + "\n";

describe("validateCommitMessage의 AI 관여 선언", () => {
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
