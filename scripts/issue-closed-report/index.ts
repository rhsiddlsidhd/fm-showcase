// `.github/workflows/issue-closed-report.yml`이 호출한다.
import { reportClosedIssue } from "./report.ts";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수가 없다: ${name}`);
  return value;
}

await reportClosedIssue({
  repository: requireEnv("GITHUB_REPOSITORY"),
  issueNumber: Number(requireEnv("ISSUE_NUMBER")),
  githubToken: requireEnv("GH_TOKEN"),
  webhookUrl: requireEnv("DISCORD_WEBHOOK_URL"),
});
