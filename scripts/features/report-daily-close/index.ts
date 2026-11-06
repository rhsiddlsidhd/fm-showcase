// `.github/workflows/report-daily-close.yml`이 호출한다.
import { requireEnv } from "../../shared/utils/env.ts";
import { reportDailyClose } from "./report.ts";

await reportDailyClose({
  repository: requireEnv("GITHUB_REPOSITORY"),
  githubToken: requireEnv("GH_TOKEN"),
  webhookUrl: requireEnv("DISCORD_WEBHOOK_URL"),
  now: new Date(),
  date: process.env.REPORT_DATE,
});
