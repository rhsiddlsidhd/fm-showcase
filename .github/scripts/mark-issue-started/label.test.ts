import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { markIssueStarted } from "./label.ts";

const GRAPHQL_URL = "https://api.github.com/graphql";
const LABELS_URL = "https://api.github.com/repos/o/r/issues/64/labels";

// GitHub GraphQL 응답 모양은 2026-11-05에 이 저장소의 create 이벤트 시험으로 확인했다.
// 라벨 응답은 https://docs.github.com/en/rest/issues/labels 기준이다.
const openIssues = (labels: string[]) => ({
  data: {
    repository: {
      issues: {
        nodes: [
          {
            number: 55,
            labels: { nodes: [{ name: "chore" }] },
            linkedBranches: { nodes: [] },
          },
          {
            number: 64,
            labels: { nodes: labels.map((name) => ({ name })) },
            linkedBranches: {
              nodes: [{ ref: { name: "chore/issue-start-label" } }],
            },
          },
        ],
      },
    },
  },
});

const server = setupServer();
const added: unknown[] = [];
const removed: string[] = [];

function respondWith(issuesBody: unknown, addStatus = 200) {
  server.use(
    http.post(GRAPHQL_URL, () => HttpResponse.json(issuesBody as object)),
    http.post(LABELS_URL, async ({ request }) => {
      if (addStatus !== 200)
        return new HttpResponse(null, { status: addStatus });
      added.push(await request.json());
      return HttpResponse.json([]);
    }),
    http.delete(`${LABELS_URL}/:name`, ({ params }) => {
      removed.push(params.name as string);
      return HttpResponse.json([]);
    }),
  );
}

const mark = (branch = "chore/issue-start-label") =>
  markIssueStarted({ repository: "o/r", branch, githubToken: "token" });

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  server.resetHandlers();
  added.length = 0;
  removed.length = 0;
});
afterAll(() => server.close());

describe("markIssueStarted", () => {
  it("고른 Issue의 브랜치가 생기면 진행 중으로 바꾼다", async () => {
    respondWith(openIssues(["chore", "SELECTED"]));

    await mark();

    expect(added).toEqual([{ labels: ["IN_PROGRESS"] }]);
    expect(removed).toEqual(["SELECTED"]);
  });

  it("고르지 않은 Issue도 진행 중으로 바꾼다", async () => {
    respondWith(openIssues(["chore"]));

    await mark();

    expect(added).toEqual([{ labels: ["IN_PROGRESS"] }]);
    expect(removed).toEqual([]);
  });

  it("Issue에 연결되지 않은 브랜치는 무시한다", async () => {
    respondWith(openIssues(["chore", "SELECTED"]));

    await mark("chore/work-branch");

    expect(added).toEqual([]);
    expect(removed).toEqual([]);
  });

  it("GitHub 조회가 실패하면 라벨을 바꾸지 않고 실패한다", async () => {
    respondWith({ errors: [{ message: "조회 실패" }] });

    await expect(mark()).rejects.toThrow("조회 실패");
    expect(added).toEqual([]);
    expect(removed).toEqual([]);
  });

  it("진행 중 라벨을 못 붙이면 고른 상태를 유지하고 실패한다", async () => {
    respondWith(openIssues(["chore", "SELECTED"]), 500);

    await expect(mark()).rejects.toThrow("HTTP 500");
    expect(removed).toEqual([]);
  });
});
