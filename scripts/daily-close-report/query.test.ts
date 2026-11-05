import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { fetchDailyData } from "./query.ts";

const GRAPHQL_URL = "https://api.github.com/graphql";

const range = {
  date: "2026-11-05",
  start: new Date("2026-11-04T19:00:00Z"),
  end: new Date("2026-11-05T19:00:00Z"),
};

// GitHub GraphQL 응답 모양은 2026-11-05에 이 저장소의 search 조회로 확인했다.
const closedIssue = (
  number: number,
  closedAt: string,
  stateReason: string,
  headRefName?: string,
) => ({
  number,
  title: `chore: 작업 ${number}`,
  url: `https://github.com/o/r/issues/${number}`,
  closedAt,
  stateReason,
  timelineItems: {
    nodes: [
      {
        closer: headRefName ? { __typename: "PullRequest", headRefName } : null,
      },
    ],
  },
});

const mergedPullRequest = (
  number: number,
  mergedAt: string,
  baseRefName: string,
  headRefName: string,
  closingIssues = 0,
) => ({
  number,
  title: `chore: PR ${number}`,
  url: `https://github.com/o/r/pull/${number}`,
  mergedAt,
  baseRefName,
  headRefName,
  closingIssuesReferences: { totalCount: closingIssues },
});

const openIssue = {
  number: 70,
  title: "chore: 진행 중인 작업",
  url: "https://github.com/o/r/issues/70",
  labels: { nodes: [{ name: "chore" }, { name: "IN_PROGRESS" }] },
  linkedBranches: {
    nodes: [{ ref: { name: "chore/open-work" } }, { ref: null }],
  },
};

const server = setupServer();

function respondWith(
  closed: unknown[],
  merged: unknown[],
  open: unknown[] = [],
) {
  const requests: Record<string, unknown>[] = [];
  server.use(
    http.post(GRAPHQL_URL, async ({ request }) => {
      const { variables } = (await request.json()) as {
        variables: Record<string, unknown>;
      };
      requests.push(variables);
      return HttpResponse.json({
        data: {
          closed: { nodes: closed },
          merged: { nodes: merged },
          repository: { issues: { nodes: open } },
        },
      });
    }),
  );
  return requests;
}

const fetchData = () =>
  fetchDailyData({ repository: "o/r", githubToken: "token", range });

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("fetchDailyData", () => {
  it("그날 범위로 닫힌 Issue와 merge된 PR을 찾는다", async () => {
    const requests = respondWith([], []);

    await fetchData();

    expect(requests[0]).toMatchObject({
      owner: "o",
      name: "r",
      closedQuery:
        "repo:o/r is:issue is:closed closed:2026-11-04T19:00:00Z..2026-11-05T19:00:00Z",
      mergedQuery:
        "repo:o/r is:pr is:merged merged:2026-11-04T19:00:00Z..2026-11-05T19:00:00Z",
    });
  });

  it("범위 안에 완료로 닫힌 Issue만 완료로 본다", async () => {
    respondWith(
      [
        closedIssue(1, "2026-11-04T19:00:00Z", "COMPLETED"),
        closedIssue(2, "2026-11-05T10:00:00Z", "NOT_PLANNED"),
        closedIssue(3, "2026-11-05T19:00:00Z", "COMPLETED"),
      ],
      [],
    );

    const { completed } = await fetchData();

    expect(completed).toEqual([
      {
        number: 1,
        title: "chore: 작업 1",
        url: "https://github.com/o/r/issues/1",
      },
    ]);
  });

  it("안 끝난 Issue의 작업 PR과 Issue 브랜치 PR을 진행 PR로 본다", async () => {
    respondWith(
      [],
      [
        mergedPullRequest(10, "2026-11-05T01:00:00Z", "chore/open", "chore/a"),
        mergedPullRequest(11, "2026-11-05T02:00:00Z", "main", "chore/b", 1),
      ],
    );

    const { progressPullRequests } = await fetchData();

    expect(progressPullRequests.map(({ number }) => number)).toEqual([10, 11]);
  });

  it("Issue 없이 main으로 merge한 PR은 뺀다", async () => {
    respondWith(
      [],
      [mergedPullRequest(10, "2026-11-05T01:00:00Z", "main", "chore/a")],
    );

    const { progressPullRequests } = await fetchData();

    expect(progressPullRequests).toEqual([]);
  });

  it("그날 완료로 닫힌 Issue의 PR은 뺀다", async () => {
    respondWith(
      [closedIssue(1, "2026-11-05T03:00:00Z", "COMPLETED", "chore/done")],
      [
        mergedPullRequest(10, "2026-11-05T01:00:00Z", "chore/done", "chore/a"),
        mergedPullRequest(11, "2026-11-05T03:00:00Z", "main", "chore/done", 1),
      ],
    );

    const { progressPullRequests } = await fetchData();

    expect(progressPullRequests).toEqual([]);
  });

  it("범위가 끝난 뒤 닫힌 Issue의 PR은 진행 PR로 남는다", async () => {
    respondWith(
      [closedIssue(1, "2026-11-05T19:10:00Z", "COMPLETED", "chore/late")],
      [mergedPullRequest(10, "2026-11-05T01:00:00Z", "chore/late", "chore/a")],
    );

    const { progressPullRequests } = await fetchData();

    expect(progressPullRequests.map(({ number }) => number)).toEqual([10]);
  });

  it("범위 끝 시각에 merge된 PR은 다음 날로 넘긴다", async () => {
    respondWith(
      [],
      [mergedPullRequest(10, "2026-11-05T19:00:00Z", "chore/open", "chore/a")],
    );

    const { progressPullRequests } = await fetchData();

    expect(progressPullRequests).toEqual([]);
  });

  it("열린 Issue의 라벨과 Issue 브랜치를 이름 목록으로 돌려준다", async () => {
    respondWith([], [], [openIssue]);

    const { openIssues } = await fetchData();

    expect(openIssues).toEqual([
      {
        number: 70,
        title: "chore: 진행 중인 작업",
        url: "https://github.com/o/r/issues/70",
        labels: ["chore", "IN_PROGRESS"],
        branches: ["chore/open-work"],
      },
    ]);
  });
});
