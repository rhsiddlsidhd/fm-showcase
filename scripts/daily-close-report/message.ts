import { TITLE_PREFIX } from "../issue-closed-report/message.ts";
import type { AttentionItem } from "./attention.ts";
import type { DailyData, WorkItem } from "./query.ts";

// Discord가 한 메시지에 허용하는 길이다.
const MAX_LENGTH = 2000;

type DailyMessageInput = DailyData & {
  date: string;
  attentionItems: AttentionItem[];
};

type Section = {
  title: string;
  lines: string[];
  shown: number;
  showEmpty: boolean;
};

function byNumber(a: WorkItem, b: WorkItem): number {
  return a.number - b.number;
}

function link({ number, url }: WorkItem): string {
  return `[#${number}](<${url}>)`;
}

function issueLine(issue: WorkItem): string {
  return `- ${link(issue)} ${issue.title.replace(TITLE_PREFIX, "")}`;
}

function section(title: string, lines: string[], showEmpty = false): Section {
  return { title, lines, shown: lines.length, showEmpty };
}

function renderSection({ title, lines, shown, showEmpty }: Section): string[] {
  if (lines.length === 0 && !showEmpty) return [];

  const body = lines.slice(0, shown);
  if (lines.length === 0) body.push("- 없음");
  if (shown < lines.length) body.push(`- 외 ${lines.length - shown}건`);
  return ["", `**${title}**`, "", ...body];
}

export function buildDailyMessage({
  date,
  completed,
  openIssues,
  progressPullRequests,
  attentionItems,
}: DailyMessageInput): string {
  const unfinished = openIssues.filter(
    ({ labels }) =>
      labels.includes("SELECTED") || labels.includes("IN_PROGRESS"),
  );

  const completedSection = section(
    "✅ 완료",
    completed.toSorted(byNumber).map(issueLine),
    true,
  );
  const unfinishedSection = section(
    "⏳ 미완료",
    unfinished
      .toSorted(byNumber)
      .map(
        (issue) =>
          issueLine(issue) +
          (issue.labels.includes("IN_PROGRESS") ? " · 🔄 진행 중" : ""),
      ),
    true,
  );
  const pullRequestSection = section(
    "🔀 오늘 merge한 PR",
    progressPullRequests
      .toSorted(byNumber)
      .map((pullRequest) => `- ${link(pullRequest)} ${pullRequest.title}`),
  );
  const attentionSection = section(
    "⚠️ 확인 필요",
    attentionItems
      .toSorted((a, b) => byNumber(a.issue, b.issue))
      .map(({ issue, reason }) => `${issueLine(issue)} · ${reason}`),
  );

  const render = () =>
    [
      `## 🌙 하루마감 · ${date} KST`,
      "",
      `완료 ${completed.length} · 미완료 ${unfinished.length} · PR ${progressPullRequests.length}`,
      ...[
        completedSection,
        unfinishedSection,
        pullRequestSection,
        attentionSection,
      ].flatMap(renderSection),
    ].join("\n");

  // 다른 기록에서 찾기 어려운 것을 끝까지 남기도록 PR부터 줄인다.
  for (const target of [
    pullRequestSection,
    completedSection,
    unfinishedSection,
    attentionSection,
  ]) {
    while (target.shown > 0 && render().length > MAX_LENGTH) target.shown--;
  }

  return render();
}
