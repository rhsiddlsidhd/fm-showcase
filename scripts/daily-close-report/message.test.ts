import { describe, expect, it } from "vitest";
import { buildDailyMessage } from "./message.ts";

const workItem = (number: number, title = `chore: 작업 ${number}`) => ({
  number,
  title,
  url: `https://github.com/o/r/issues/${number}`,
});
const openIssue = (number: number, labels: string[], title?: string) => ({
  ...workItem(number, title),
  labels,
  branches: [],
});
const empty = {
  date: "2026-11-05",
  completed: [],
  openIssues: [],
  progressPullRequests: [],
  attentionItems: [],
};

describe("buildDailyMessage", () => {
  it("완료, 미완료, 진행 PR, 확인 필요를 고정 틀에 넣는다", () => {
    const selected = openIssue(71, ["chore", "SELECTED"]);
    const message = buildDailyMessage({
      ...empty,
      completed: [workItem(70)],
      openIssues: [selected, openIssue(72, ["IN_PROGRESS"])],
      progressPullRequests: [workItem(80, "chore: 진행 PR")],
      attentionItems: [{ issue: selected, reason: "진행 중 표시 없음" }],
    });

    expect(message).toBe(
      [
        "## 🌙 하루마감 · 2026-11-05 KST",
        "",
        "완료 1 · 미완료 2 · PR 1",
        "",
        "**✅ 완료**",
        "",
        "- [#70](<https://github.com/o/r/issues/70>) 작업 70",
        "",
        "**⏳ 미완료**",
        "",
        "- [#71](<https://github.com/o/r/issues/71>) 작업 71",
        "- [#72](<https://github.com/o/r/issues/72>) 작업 72 · 🔄 진행 중",
        "",
        "**🔀 오늘 merge한 PR**",
        "",
        "- [#80](<https://github.com/o/r/issues/80>) chore: 진행 PR",
        "",
        "**⚠️ 확인 필요**",
        "",
        "- [#71](<https://github.com/o/r/issues/71>) 작업 71 · 진행 중 표시 없음",
      ].join("\n"),
    );
  });

  it("기록할 작업이 없는 날도 틀을 쓴다", () => {
    expect(buildDailyMessage(empty)).toBe(
      [
        "## 🌙 하루마감 · 2026-11-05 KST",
        "",
        "완료 0 · 미완료 0 · PR 0",
        "",
        "**✅ 완료**",
        "",
        "- 없음",
        "",
        "**⏳ 미완료**",
        "",
        "- 없음",
      ].join("\n"),
    );
  });

  it("상태 라벨이 없는 열린 Issue는 미완료에 쓰지 않는다", () => {
    const message = buildDailyMessage({
      ...empty,
      openIssues: [openIssue(71, ["chore"])],
    });

    expect(message).toContain("미완료 0");
    expect(message).not.toContain("#71");
  });

  it("각 목록을 번호순으로 쓴다", () => {
    const message = buildDailyMessage({
      ...empty,
      completed: [workItem(72), workItem(71)],
    });

    expect(message.indexOf("[#71]")).toBeLessThan(message.indexOf("[#72]"));
  });

  it("2000자를 넘으면 PR부터 외 N건으로 줄이고 요약 줄은 전체 수를 쓴다", () => {
    const longTitle = `chore: ${"가".repeat(200)}`;
    const message = buildDailyMessage({
      ...empty,
      completed: [workItem(1)],
      progressPullRequests: Array.from({ length: 20 }, (_, index) =>
        workItem(index + 100, longTitle),
      ),
    });

    expect(message.length).toBeLessThanOrEqual(2000);
    expect(message).toContain("완료 1 · 미완료 0 · PR 20");
    expect(message).toContain("[#1]");
    expect(message).toMatch(/- 외 \d+건/);
  });

  it("PR을 다 줄여도 넘으면 다른 목록도 줄인다", () => {
    const longTitle = `chore: ${"가".repeat(200)}`;
    const message = buildDailyMessage({
      ...empty,
      completed: Array.from({ length: 20 }, (_, index) =>
        workItem(index + 1, longTitle),
      ),
    });

    expect(message.length).toBeLessThanOrEqual(2000);
    expect(message).toContain("완료 20");
    expect(message).toMatch(/- 외 \d+건/);
  });
});
