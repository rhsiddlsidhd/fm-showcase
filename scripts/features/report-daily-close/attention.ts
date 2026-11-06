import { IN_PROGRESS, SELECTED } from "../../shared/constants/labels.ts";
import type { OpenIssue } from "./query.ts";

export type AttentionItem = {
  issue: OpenIssue;
  reason: string;
};

function findReason({ labels, branches }: OpenIssue): string | null {
  const selected = labels.includes(SELECTED);
  const inProgress = labels.includes(IN_PROGRESS);

  if (selected && inProgress) return "상태 라벨 중복";
  if (branches.length > 0 && !inProgress) return "진행 중 표시 없음";
  if (branches.length === 0 && inProgress) return "Issue 브랜치 없음";
  return null;
}

export function findAttentionItems(openIssues: OpenIssue[]): AttentionItem[] {
  return openIssues.flatMap((issue) => {
    const reason = findReason(issue);
    return reason ? [{ issue, reason }] : [];
  });
}
