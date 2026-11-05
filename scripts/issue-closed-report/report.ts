import {
  buildClosedMessage,
  type ClosedIssue,
  type MergedPullRequest,
} from "./message.ts";

const GRAPHQL_URL = "https://api.github.com/graphql";

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

async function queryGitHub<Data>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<Data> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`GitHub 조회 실패: HTTP ${response.status}`);
  }

  const { data, errors } = (await response.json()) as {
    data: Data;
    errors?: { message: string }[];
  };
  if (errors) {
    throw new Error(errors.map(({ message }) => message).join(", "));
  }
  return data;
}

async function sendToDiscord(webhookUrl: string, content: string) {
  // wait 없이 보내면 저장되지 않은 메시지도 오류 없이 성공으로 끝난다.
  const url = new URL(webhookUrl);
  url.searchParams.set("wait", "true");

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    // 제목은 외부 입력이라 @everyone 같은 멘션이 알림으로 가지 않게 막는다.
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
  if (!response.ok) {
    throw new Error(`Discord 전송 실패: HTTP ${response.status}`);
  }
}

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
