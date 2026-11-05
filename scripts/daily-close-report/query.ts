import { queryGitHub } from "../issue-closed-report/report.ts";
import type { DayRange } from "./range.ts";

const DEFAULT_BRANCH = "main";

const DAILY_QUERY = `
  query ($owner: String!, $name: String!, $closedQuery: String!, $mergedQuery: String!) {
    closed: search(query: $closedQuery, type: ISSUE, first: 100) {
      nodes {
        ... on Issue {
          number
          title
          url
          closedAt
          stateReason
          timelineItems(last: 1, itemTypes: [CLOSED_EVENT]) {
            nodes {
              ... on ClosedEvent {
                closer {
                  __typename
                  ... on PullRequest {
                    headRefName
                  }
                }
              }
            }
          }
        }
      }
    }
    merged: search(query: $mergedQuery, type: ISSUE, first: 100) {
      nodes {
        ... on PullRequest {
          number
          title
          url
          mergedAt
          baseRefName
          headRefName
          closingIssuesReferences(first: 1) {
            totalCount
          }
        }
      }
    }
    repository(owner: $owner, name: $name) {
      issues(states: OPEN, first: 100) {
        nodes {
          number
          title
          url
          labels(first: 20) {
            nodes {
              name
            }
          }
          linkedBranches(first: 10) {
            nodes {
              ref {
                name
              }
            }
          }
        }
      }
    }
  }
`;

export type WorkItem = {
  number: number;
  title: string;
  url: string;
};

export type OpenIssue = WorkItem & {
  labels: string[];
  branches: string[];
};

export type DailyData = {
  completed: WorkItem[];
  openIssues: OpenIssue[];
  progressPullRequests: WorkItem[];
};

type ClosedIssueNode = WorkItem & {
  closedAt: string;
  stateReason: string | null;
  timelineItems: {
    nodes: {
      closer: { __typename: string; headRefName?: string } | null;
    }[];
  };
};

type MergedPullRequestNode = WorkItem & {
  mergedAt: string;
  baseRefName: string;
  headRefName: string;
  closingIssuesReferences: { totalCount: number };
};

type OpenIssueNode = WorkItem & {
  labels: { nodes: { name: string }[] };
  linkedBranches: { nodes: { ref: { name: string } | null }[] };
};

type DailyQueryData = {
  closed: { nodes: ClosedIssueNode[] };
  merged: { nodes: MergedPullRequestNode[] };
  repository: { issues: { nodes: OpenIssueNode[] } };
};

type FetchInput = {
  repository: string;
  githubToken: string;
  range: DayRange;
};

function toSearchRange({ start, end }: DayRange): string {
  const format = (date: Date) => date.toISOString().replace(".000Z", "Z");
  return `${format(start)}..${format(end)}`;
}

function isWithin(iso: string, { start, end }: DayRange): boolean {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function toWorkItem({ number, title, url }: WorkItem): WorkItem {
  return { number, title, url };
}

export async function fetchDailyData({
  repository,
  githubToken,
  range,
}: FetchInput): Promise<DailyData> {
  const [owner, name] = repository.split("/");
  const searchRange = toSearchRange(range);
  const data = await queryGitHub<DailyQueryData>(githubToken, DAILY_QUERY, {
    owner,
    name,
    closedQuery: `repo:${repository} is:issue is:closed closed:${searchRange}`,
    mergedQuery: `repo:${repository} is:pr is:merged merged:${searchRange}`,
  });

  // search의 범위는 끝 시각을 포함하므로 범위를 여기서 다시 확인한다.
  const completed = data.closed.nodes.filter(
    ({ closedAt, stateReason }) =>
      stateReason === "COMPLETED" && isWithin(closedAt, range),
  );

  // 작업 PR은 Issue에 직접 연결되지 않아, Issue를 닫은 PR의 브랜치로 되짚는다.
  const completedBranches = new Set(
    completed.flatMap(
      ({ timelineItems }) => timelineItems.nodes[0]?.closer?.headRefName ?? [],
    ),
  );

  const progressPullRequests = data.merged.nodes.filter(
    ({ mergedAt, baseRefName, headRefName, closingIssuesReferences }) =>
      isWithin(mergedAt, range) &&
      (baseRefName !== DEFAULT_BRANCH ||
        closingIssuesReferences.totalCount > 0) &&
      !completedBranches.has(baseRefName) &&
      !completedBranches.has(headRefName),
  );

  return {
    completed: completed.map(toWorkItem),
    openIssues: data.repository.issues.nodes.map((issue) => ({
      ...toWorkItem(issue),
      labels: issue.labels.nodes.map((label) => label.name),
      branches: issue.linkedBranches.nodes.flatMap(
        ({ ref }) => ref?.name ?? [],
      ),
    })),
    progressPullRequests: progressPullRequests.map(toWorkItem),
  };
}
