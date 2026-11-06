import { IN_PROGRESS, SELECTED } from "../../shared/constants/labels.ts";
import { queryGitHub } from "../../shared/services/github.ts";

const OPEN_ISSUES_QUERY = `
  query ($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      issues(states: OPEN, first: 100) {
        nodes {
          number
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

type OpenIssuesData = {
  repository: {
    issues: {
      nodes: {
        number: number;
        labels: { nodes: { name: string }[] };
        linkedBranches: { nodes: { ref: { name: string } | null }[] };
      }[];
    };
  };
};

type MarkInput = {
  repository: string;
  branch: string;
  githubToken: string;
};

async function requestLabels(
  token: string,
  path: string,
  method: "POST" | "DELETE",
  body?: unknown,
) {
  const response = await fetch(`https://api.github.com/repos/${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`라벨 변경 실패: HTTP ${response.status}`);
  }
}

export async function markIssueStarted({
  repository,
  branch,
  githubToken,
}: MarkInput) {
  const [owner, name] = repository.split("/");
  const { repository: found } = await queryGitHub<OpenIssuesData>(
    githubToken,
    OPEN_ISSUES_QUERY,
    { owner, name },
  );
  const issue = found.issues.nodes.find(({ linkedBranches }) =>
    linkedBranches.nodes.some(({ ref }) => ref?.name === branch),
  );
  if (!issue) return;

  // 먼저 붙인다. 떼기가 실패해도 상태가 사라지지 않고 라벨 중복으로 드러난다.
  const labelsPath = `${repository}/issues/${issue.number}/labels`;
  await requestLabels(githubToken, labelsPath, "POST", {
    labels: [IN_PROGRESS],
  });
  if (issue.labels.nodes.some((label) => label.name === SELECTED)) {
    await requestLabels(githubToken, `${labelsPath}/${SELECTED}`, "DELETE");
  }
}
