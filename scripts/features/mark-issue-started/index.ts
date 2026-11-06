// `.github/workflows/mark-issue-started.yml`이 호출한다.
import { requireEnv } from "../../shared/utils/env.ts";
import { markIssueStarted } from "./label.ts";

await markIssueStarted({
  repository: requireEnv("GITHUB_REPOSITORY"),
  branch: requireEnv("BRANCH"),
  githubToken: requireEnv("GH_TOKEN"),
});
