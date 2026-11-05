// `.github/workflows/daily-close-report.yml`이 호출한다.
import { reportDailyClose } from "./report.ts";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수가 없다: ${name}`);
  return value;
}

await reportDailyClose({
  repository: requireEnv("GITHUB_REPOSITORY"),
  githubToken: requireEnv("GH_TOKEN"),
  webhookUrl: requireEnv("DISCORD_WEBHOOK_URL"),
  now: new Date(),
  date: process.env.REPORT_DATE,
});
