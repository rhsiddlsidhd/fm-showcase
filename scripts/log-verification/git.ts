import { execFileSync } from "node:child_process";

const gitIn = (dir: string, ...args: string[]) =>
  execFileSync("git", args, {
    cwd: dir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

export function findRoot(cwd: string): string {
  return gitIn(cwd, "rev-parse", "--show-toplevel").trim();
}

export function currentBranch(root: string): string {
  const branch = gitIn(root, "branch", "--show-current").trim();
  if (!branch) throw new Error("브랜치 이름이 없다(분리된 HEAD)");
  return branch;
}

// 커밋이 없거나 읽을 수 없으면 null.
export function headCommit(root: string): string | null {
  try {
    return gitIn(root, "rev-parse", "--verify", "HEAD").trim();
  } catch {
    return null;
  }
}
