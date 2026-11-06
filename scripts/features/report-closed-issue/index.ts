// `.github/workflows/report-closed-issue.yml`이 호출한다.
import { requireEnv } from "../../shared/utils/env.ts";
import { reportClosedIssue } from "./report.ts";

await reportClosedIssue({
  repository: requireEnv("GITHUB_REPOSITORY"),
  issueNumber: Number(requireEnv("ISSUE_NUMBER")),
  githubToken: requireEnv("GH_TOKEN"),
  webhookUrl: requireEnv("DISCORD_WEBHOOK_URL"),
});
