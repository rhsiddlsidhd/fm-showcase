import { execFileSync } from "node:child_process";

const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

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
