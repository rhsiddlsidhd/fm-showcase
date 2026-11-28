import { execFileSync } from "node:child_process";

const git = (...args: string[]) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();

export function currentBranch(): string {
  return git("branch", "--show-current");
}

export function hasCommits(): boolean {
  try {
    git("rev-parse", "--verify", "HEAD");
    return true;
  } catch {
    return false;
  }
}

export function isMerging(): boolean {
  try {
    git("rev-parse", "-q", "--verify", "MERGE_HEAD");
    return true;
  } catch {
    return false;
  }
}

export function headSha(): string {
  return git("rev-parse", "HEAD");
}

// 추적 파일의 변경과 ignore 되지 않은 새 파일을 모두 센다.
export function hasUncommittedChanges(): boolean {
  return git("status", "--porcelain") !== "";
}
