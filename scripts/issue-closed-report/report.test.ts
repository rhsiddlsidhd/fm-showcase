import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { reportClosedIssue } from "./report.ts";

const GRAPHQL_URL = "https://api.github.com/graphql";
const WEBHOOK_URL = "https://discord.test/webhook";

// GitHub GraphQL 응답 모양은 2026-11-05에 이 저장소의 #29, #53, base 조회로 확인했다.
// Discord webhook 응답은 https://docs.discord.com/developers/resources/webhook#execute-webhook 기준이다.
const closedIssue = (
  stateReason: string,
  closer: Record<string, unknown> | null,
) => ({
  data: {
    repository: {
      issue: {
        number: 27,
        title: "chore: 작업 완료 기록",
        url: "https://github.com/o/r/issues/27",
        closedAt: "2026-11-05T03:56:34Z",
        stateReason,
        timelineItems: { nodes: [{ closer }] },
      },
    },
  },
});

const closingPullRequest = {
  __typename: "PullRequest",
  number: 60,
  title: "chore: main에 합친다",
  url: "https://github.com/o/r/pull/60",
  headRefName: "chore/issue-branch",
};

const mergedChildren = {
  data: {
    repository: {
      pullRequests: {
        nodes: [
          {
            number: 44,
            title: "chore: 하위 작업",
            url: "https://github.com/o/r/pull/44",
          },
        ],
      },
    },
  },
};

const server = setupServer();
const sent: Record<string, unknown>[] = [];
const waits: (string | null)[] = [];

function respondWith(issueBody: unknown) {
  server.use(
    http.post(GRAPHQL_URL, async ({ request }) => {
      const { query } = (await request.json()) as { query: string };
      return HttpResponse.json(
        query.includes("baseRefName") ? mergedChildren : (issueBody as object),
      );
    }),
    http.post(WEBHOOK_URL, async ({ request }) => {
      sent.push((await request.json()) as Record<string, unknown>);
      waits.push(new URL(request.url).searchParams.get("wait"));
      return HttpResponse.json({ id: "1" });
    }),
  );
}

const report = () =>
  reportClosedIssue({
    repository: "o/r",
    issueNumber: 27,
    githubToken: "token",
    webhookUrl: WEBHOOK_URL,
  });

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  server.resetHandlers();
  sent.length = 0;
  waits.length = 0;
});
afterAll(() => server.close());

describe("reportClosedIssue", () => {
  it("완료로 닫히면 닫은 PR과 그 브랜치로 merge된 PR을 함께 보낸다", async () => {
    respondWith(closedIssue("COMPLETED", closingPullRequest));

    await report();

    expect(sent).toHaveLength(1);
    expect(sent[0].content).toContain("**작업 완료 기록**");
    expect(sent[0].content).toContain("[#44]");
    expect(sent[0].content).toContain("[#60]");
  });

  it("PR 없이 닫힌 Issue도 보낸다", async () => {
    respondWith(closedIssue("COMPLETED", null));

    await report();

    expect(sent).toHaveLength(1);
    expect(sent[0].content).not.toContain("**PR**");
  });

  it("완료가 아닌 사유로 닫히면 보내지 않는다", async () => {
    respondWith(closedIssue("NOT_PLANNED", null));

    await report();

    expect(sent).toHaveLength(0);
  });

  it("제목의 멘션이 알림을 보내지 않게 막는다", async () => {
    respondWith(closedIssue("COMPLETED", null));

    await report();

    expect(sent[0].allowed_mentions).toEqual({ parse: [] });
  });

  it("저장되지 않은 메시지도 실패로 알도록 전송 결과를 기다린다", async () => {
    respondWith(closedIssue("COMPLETED", null));

    await report();

    expect(waits).toEqual(["true"]);
  });

  it("GitHub 조회가 실패하면 보내지 않고 실패한다", async () => {
    respondWith({ errors: [{ message: "조회 실패" }] });

    await expect(report()).rejects.toThrow("조회 실패");
    expect(sent).toHaveLength(0);
  });

  it("Discord가 오류로 응답하면 실패한다", async () => {
    respondWith(closedIssue("COMPLETED", null));
    server.use(
      http.post(WEBHOOK_URL, () => new HttpResponse(null, { status: 500 })),
    );

    await expect(report()).rejects.toThrow("500");
  });
});
