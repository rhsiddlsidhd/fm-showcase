// `.github/workflows/issue-start-label.yml`이 호출한다.
import { markIssueStarted } from "./label.ts";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수가 없다: ${name}`);
  return value;
}

await markIssueStarted({
  repository: requireEnv("GITHUB_REPOSITORY"),
  branch: requireEnv("BRANCH"),
  githubToken: requireEnv("GH_TOKEN"),
});
