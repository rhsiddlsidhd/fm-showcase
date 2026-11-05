import { sendToDiscord } from "../issue-closed-report/report.ts";
import { findAttentionItems } from "./attention.ts";
import { buildDailyMessage } from "./message.ts";
import { fetchDailyData } from "./query.ts";
import { resolveDayRange } from "./range.ts";

type ReportInput = {
  repository: string;
  githubToken: string;
  webhookUrl: string;
  now: Date;
  date?: string;
};

export async function reportDailyClose({
  repository,
  githubToken,
  webhookUrl,
  now,
  date,
}: ReportInput) {
  const range = resolveDayRange(now, date);
  const data = await fetchDailyData({ repository, githubToken, range });

  await sendToDiscord(
    webhookUrl,
    buildDailyMessage({
      ...data,
      date: range.date,
      attentionItems: findAttentionItems(data.openIssues),
    }),
  );
}
