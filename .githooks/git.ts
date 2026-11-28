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

// 커밋이 없는 HEAD(새 저장소, orphan 브랜치)면 null 이다.
export function headSha(): string | null {
  try {
    return git("rev-parse", "--verify", "HEAD");
  } catch {
    return null;
  }
}

// 추적 파일의 변경과 ignore 되지 않은 새 파일을 모두 센다.
export function hasUncommittedChanges(): boolean {
  return git("status", "--porcelain") !== "";
}
