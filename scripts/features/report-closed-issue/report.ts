import { sendToDiscord } from "../../shared/services/discord.ts";
import { queryGitHub } from "../../shared/services/github.ts";
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
        }
      }
    }
  }
`;

type Closer = MergedPullRequest & {
  __typename: string;
  headRefName: string;
};

type ClosedIssueData = {
  repository: {
    issue: ClosedIssue & {
      stateReason: string | null;
      timelineItems: { nodes: { closer: Closer | null }[] };
    };
  };
};

type MergedPullRequestsData = {
  repository: { pullRequests: { nodes: MergedPullRequest[] } };
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
  const { repository: found } = await queryGitHub<ClosedIssueData>(
    githubToken,
    CLOSED_ISSUE_QUERY,
    { owner, name, number: issueNumber },
  );
  const { issue } = found;
  if (issue.stateReason !== "COMPLETED") return;

  const closer = issue.timelineItems.nodes[0]?.closer;
  const pullRequests: MergedPullRequest[] = [];
  if (closer?.__typename === "PullRequest") {
    const merged = await queryGitHub<MergedPullRequestsData>(
      githubToken,
      MERGED_PULL_REQUESTS_QUERY,
      { owner, name, branch: closer.headRefName },
    );
    pullRequests.push(closer, ...merged.repository.pullRequests.nodes);
  }

  await sendToDiscord(
    webhookUrl,
    buildClosedMessage({ repo: name, issue, pullRequests }),
  );
}
