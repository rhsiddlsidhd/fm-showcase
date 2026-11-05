import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { reportDailyClose } from "./report.ts";

const GRAPHQL_URL = "https://api.github.com/graphql";
const WEBHOOK_URL = "https://discord.test/webhook";

// GitHub GraphQL 응답 모양은 2026-11-05에 이 저장소의 search 조회로 확인했다.
// Discord webhook 응답은 https://docs.discord.com/developers/resources/webhook#execute-webhook 기준이다.
const dailyData = {
  data: {
    closed: { nodes: [] },
    merged: { nodes: [] },
    repository: {
      issues: {
        nodes: [
          {
            number: 70,
            title: "chore: 어긋난 작업",
            url: "https://github.com/o/r/issues/70",
            labels: { nodes: [{ name: "IN_PROGRESS" }] },
            linkedBranches: { nodes: [] },
          },
        ],
      },
    },
  },
};

const server = setupServer();
const sent: Record<string, unknown>[] = [];

function respondWith(githubBody: object, webhookStatus = 200) {
  server.use(
    http.post(GRAPHQL_URL, () => HttpResponse.json(githubBody)),
    http.post(WEBHOOK_URL, async ({ request }) => {
      sent.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({ id: "1" }, { status: webhookStatus });
    }),
  );
}

const report = (date?: string) =>
  reportDailyClose({
    repository: "o/r",
    githubToken: "token",
    webhookUrl: WEBHOOK_URL,
    now: new Date("2026-11-05T19:07:00Z"),
    date,
  });

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  server.resetHandlers();
  sent.length = 0;
});
afterAll(() => server.close());

describe("reportDailyClose", () => {
  it("조회한 작업과 어긋난 상태를 하루 마감 하나로 보낸다", async () => {
    respondWith(dailyData);

    await report();

    expect(sent).toHaveLength(1);
    expect(sent[0].content).toContain("하루마감 · 2026-11-05 KST");
    expect(sent[0].content).toContain("🔄 진행 중");
    expect(sent[0].content).toContain("Issue 브랜치 없음");
  });

  it("날짜를 받으면 그 날짜의 마감을 보낸다", async () => {
    respondWith(dailyData);

    await report("2026-11-03");

    expect(sent[0].content).toContain("하루마감 · 2026-11-03 KST");
  });

  it("날짜가 잘못되면 보내지 않고 실패한다", async () => {
    respondWith(dailyData);

    await expect(report("2026-02-30")).rejects.toThrow("날짜가 잘못됐다");
    expect(sent).toHaveLength(0);
  });

  it("GitHub 조회가 실패하면 보내지 않고 실패한다", async () => {
    respondWith({ errors: [{ message: "조회 실패" }] });

    await expect(report()).rejects.toThrow("조회 실패");
    expect(sent).toHaveLength(0);
  });

  it("전송이 실패하면 다시 보내지 않고 실패한다", async () => {
    respondWith(dailyData, 500);

    await expect(report()).rejects.toThrow("Discord 전송 실패: HTTP 500");
    expect(sent).toHaveLength(1);
  });
});
