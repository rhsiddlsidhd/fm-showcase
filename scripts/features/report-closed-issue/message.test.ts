import { describe, expect, it } from "vitest";
import { buildClosedMessage } from "./message.ts";

const repo = "fm-showcase";
const issue = {
  number: 27,
  title: "chore: 요청하지 않아도 작업 완료가 기록되게 하기",
  url: "https://github.com/o/fm-showcase/issues/27",
  closedAt: "2026-11-05T03:56:34Z",
};
const pullRequest = (number: number, title = `chore: 작업 ${number}`) => ({
  number,
  title,
  url: `https://github.com/o/fm-showcase/pull/${number}`,
});

describe("buildClosedMessage", () => {
  it("Issue와 merge된 PR을 고정 틀에 넣는다", () => {
    const message = buildClosedMessage({
      repo,
      issue,
      pullRequests: [pullRequest(44), pullRequest(56)],
    });

    expect(message).toBe(
      [
        "## ✅ fm-showcase · 2026-11-05 KST",
        "",
        "- [#27](<https://github.com/o/fm-showcase/issues/27>) **요청하지 않아도 작업 완료가 기록되게 하기**",
        "",
        "**PR**",
        "",
        "- [#44](<https://github.com/o/fm-showcase/pull/44>) chore: 작업 44",
        "- [#56](<https://github.com/o/fm-showcase/pull/56>) chore: 작업 56",
      ].join("\n"),
    );
  });

  it("PR이 없으면 PR 섹션을 쓰지 않는다", () => {
    const message = buildClosedMessage({ repo, issue, pullRequests: [] });

    expect(message).toBe(
      [
        "## ✅ fm-showcase · 2026-11-05 KST",
        "",
        "- [#27](<https://github.com/o/fm-showcase/issues/27>) **요청하지 않아도 작업 완료가 기록되게 하기**",
      ].join("\n"),
    );
  });

  it("PR을 번호순으로 쓴다", () => {
    const message = buildClosedMessage({
      repo,
      issue,
      pullRequests: [pullRequest(56), pullRequest(44)],
    });

    expect(message.indexOf("[#44]")).toBeLessThan(message.indexOf("[#56]"));
  });

  it.each([
    ["feat: 카드 목록", "**카드 목록**"],
    ["fix(auth): 로그인 오류", "**로그인 오류**"],
    ["메모: 접두사가 아니다", "**메모: 접두사가 아니다**"],
  ])("Issue 제목 %s의 종류 접두사만 뗀다", (title, expected) => {
    const message = buildClosedMessage({
      repo,
      issue: { ...issue, title },
      pullRequests: [],
    });

    expect(message).toContain(expected);
  });

  it("날짜를 한국 시간으로 쓴다", () => {
    const message = buildClosedMessage({
      repo,
      issue: { ...issue, closedAt: "2026-11-05T15:30:00Z" },
      pullRequests: [],
    });

    expect(message).toContain("· 2026-11-06 KST");
  });

  it("2000자를 넘으면 뒤쪽 PR을 외 N건으로 줄인다", () => {
    const longTitle = `chore: ${"가".repeat(200)}`;
    const pullRequests = Array.from({ length: 20 }, (_, index) =>
      pullRequest(index + 1, longTitle),
    );

    const message = buildClosedMessage({ repo, issue, pullRequests });
    const shown = message.match(/^- \[#\d+\]\(<.+\/pull\//gm)?.length ?? 0;

    expect(message.length).toBeLessThanOrEqual(2000);
    expect(shown).toBeGreaterThan(0);
    expect(message.endsWith(`- 외 ${20 - shown}건`)).toBe(true);
  });
});
