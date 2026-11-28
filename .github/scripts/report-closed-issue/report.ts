import { sendToDiscord } from "../discord.ts";
import { queryGitHub } from "../github.ts";
import {
  buildClosedMessage,
  type ClosedIssue,
  type MergedPullRequest,
} from "./message.ts";

const CLOSED_ISSUE_QUERY = `
  query ($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      issue(number: $number) {
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
                  number
                  title
                  url
                  headRefName
                }
              }
            }
          }
        }
      }
    }
  }
`;

const MERGED_PULL_REQUESTS_QUERY = `
  query ($owner: String!, $name: String!, $branch: String!) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: 100, baseRefName: $branch, states: MERGED) {
        nodes {
          number
          title
          url
          headRefName
        }
      }
    }
  }
`;

type BranchPullRequest = MergedPullRequest & { headRefName: string };

type Closer = BranchPullRequest & { __typename: string };

type ClosedIssueData = {
  repository: {
    issue: ClosedIssue & {
      stateReason: string | null;
      timelineItems: { nodes: { closer: Closer | null }[] };
    };
  };
};

type MergedPullRequestsData = {
  repository: { pullRequests: { nodes: BranchPullRequest[] } };
};

type ReportInput = {
  repository: string;
  issueNumber: number;
  githubToken: string;
  webhookUrl: string;
};

export async function reportClosedIssue({
  repository,
  issueNumber,
  githubToken,
  webhookUrl,
}: ReportInput) {
  const [owner, name] = repository.split("/");
  if (!owner || !name) {
    throw new Error(`저장소 이름 형식이 아니다: ${repository}`);
  }
  const { repository: found } = await queryGitHub<ClosedIssueData>(
    githubToken,
    CLOSED_ISSUE_QUERY,
    { owner, name, number: issueNumber },
  );
  const { issue } = found;
  if (issue.stateReason !== "COMPLETED") return;

  const closer = issue.timelineItems.nodes[0]?.closer;
  const pullRequests: BranchPullRequest[] = [];
  if (closer?.__typename === "PullRequest") {
    pullRequests.push(closer);
    // 작업 브랜치 아래 작업 브랜치로 merge된 PR까지 찾으려고 head 브랜치를 base로 다시 조회한다.
    const visited = new Set(["main", closer.headRefName]);
    const queue = [closer.headRefName];
    for (const branch of queue) {
      const merged = await queryGitHub<MergedPullRequestsData>(
        githubToken,
        MERGED_PULL_REQUESTS_QUERY,
        { owner, name, branch },
      );
      for (const pullRequest of merged.repository.pullRequests.nodes) {
        pullRequests.push(pullRequest);
        if (!visited.has(pullRequest.headRefName)) {
          visited.add(pullRequest.headRefName);
          queue.push(pullRequest.headRefName);
        }
      }
    }
  }

  await sendToDiscord(
    webhookUrl,
    buildClosedMessage({ repo: name, issue, pullRequests }),
  );
}
