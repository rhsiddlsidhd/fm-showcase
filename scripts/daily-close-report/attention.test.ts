import { describe, expect, it } from "vitest";
import { findAttentionItems } from "./attention.ts";

const openIssue = (labels: string[], branches: string[]) => ({
  number: 70,
  title: "chore: 작업",
  url: "https://github.com/o/r/issues/70",
  labels,
  branches,
});

describe("findAttentionItems", () => {
  it.each([
    ["고르지 않은 Issue", ["chore"], []],
    ["고르기만 한 Issue", ["chore", "SELECTED"], []],
    ["브랜치가 있는 진행 중 Issue", ["IN_PROGRESS"], ["chore/a"]],
  ])("%s는 어긋나지 않았다", (_, labels, branches) => {
    expect(findAttentionItems([openIssue(labels, branches)])).toEqual([]);
  });

  it.each([
    ["상태 라벨 중복", ["SELECTED", "IN_PROGRESS"], ["chore/a"]],
    ["진행 중 표시 없음", ["SELECTED"], ["chore/a"]],
    ["진행 중 표시 없음", [], ["chore/a"]],
    ["Issue 브랜치 없음", ["IN_PROGRESS"], []],
  ])("%s를 찾는다", (reason, labels, branches) => {
    const issue = openIssue(labels, branches);

    expect(findAttentionItems([issue])).toEqual([{ issue, reason }]);
  });

  it("여러 경우에 맞으면 라벨 중복 하나로 알린다", () => {
    const issue = openIssue(["SELECTED", "IN_PROGRESS"], []);

    expect(findAttentionItems([issue])).toEqual([
      { issue, reason: "상태 라벨 중복" },
    ]);
  });
});
