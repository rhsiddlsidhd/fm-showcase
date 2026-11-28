// git 이 .githooks 의 sh 래퍼를 실행하고, 래퍼가 node index.ts 를 거쳐 거부할 때
// 커밋과 push 가 실제로 중단되는지 본다. 판정 규칙 자체는 각 *.test.ts(Unit)가 검증한다.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const HOOKS_PATH = dirname(fileURLToPath(import.meta.url)).replaceAll(
  "\\",
  "/",
);

// 바깥 git(예: 이 테스트를 부른 훅)이 넘긴 GIT_DIR 같은 값이 임시 저장소를 가리키지 않게 뺀다.
const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
);

// 테스트마다 git 과 node 를 여러 번 띄운다. Windows 에서는 프로세스 생성이 느려 기본 5초를 넘는다.
const SLOW = { timeout: 60_000 };

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
  }
});

function git(cwd: string, ...args: string[]) {
  const result = spawnSync("git", args, { cwd, env, encoding: "utf8" });
  return {
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr,
  };
}

// 준비 단계의 git 호출은 실패하면 바로 멈춘다. 훅이 아니라 준비가 틀렸다는 뜻이다.
function gitOk(cwd: string, ...args: string[]): string {
  const result = git(cwd, ...args);
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} 실패:\n${result.stderr}`);
  }
  return result.stdout;
}

// 원격 main 에 첫 커밋이 push 된 작업 저장소를 만든다. 훅은 아직 연결하지 않는다.
function createRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "githooks-"));
  tempDirs.push(root);
  const remote = join(root, "remote.git");
  const work = join(root, "work");
  gitOk(root, "init", "--bare", "-b", "main", remote);
  gitOk(root, "init", "-b", "main", work);
  gitOk(work, "config", "user.name", "Test User");
  gitOk(work, "config", "user.email", "test@example.com");
  gitOk(work, "config", "commit.gpgsign", "false");
  gitOk(work, "config", "core.hooksPath", join(root, "no-hooks"));
  gitOk(work, "remote", "add", "origin", remote);
  gitOk(work, "commit", "--allow-empty", "-m", "chore: add first commit");
  gitOk(work, "push", "origin", "main");
  return work;
}

function enableHooks(work: string) {
  gitOk(work, "config", "core.hooksPath", HOOKS_PATH);
}

function commit(work: string, ...paragraphs: string[]) {
  return git(
    work,
    "commit",
    "--allow-empty",
    ...paragraphs.flatMap((p) => ["-m", p]),
  );
}

function push(work: string, branch: string) {
  return git(work, "push", "origin", branch);
}

const commitCount = (work: string) =>
  gitOk(work, "rev-list", "--count", "HEAD");

const remoteRef = (work: string, branch: string) =>
  gitOk(work, "ls-remote", "origin", `refs/heads/${branch}`);

describe("pre-commit 훅 연결", SLOW, () => {
  it("첫 커밋 이후 main 에서 커밋하면 커밋이 만들어지지 않는다", () => {
    const work = createRepo();
    enableHooks(work);

    const result = commit(work, "chore: add foo");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("[pre-commit] 거부한다:");
    expect(commitCount(work)).toBe("1");
  });

  it("작업 브랜치에서는 커밋이 만들어진다", () => {
    const work = createRepo();
    gitOk(work, "switch", "-c", "feat/x");
    enableHooks(work);

    const result = commit(
      work,
      "chore: add foo",
      "Co-Authored-By: Test Agent <agent@example.com>",
    );

    expect(result.status, result.stderr).toBe(0);
    expect(commitCount(work)).toBe("2");
  });
});

describe("commit-msg 훅 연결", SLOW, () => {
  it("형식이 틀린 제목이면 커밋이 만들어지지 않는다", () => {
    const work = createRepo();
    gitOk(work, "switch", "-c", "feat/x");
    enableHooks(work);

    const result = commit(work, "Add foo.");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("[commit-msg] 거부한다:");
    expect(commitCount(work)).toBe("1");
  });

  it("트레일러 없이 제목만 맞으면 커밋이 만들어진다", () => {
    const work = createRepo();
    gitOk(work, "switch", "-c", "feat/x");
    enableHooks(work);

    const result = commit(work, "chore: add foo");

    expect(result.status, result.stderr).toBe(0);
    expect(commitCount(work)).toBe("2");
  });
});

describe("pre-push 훅 연결", SLOW, () => {
  it("원격 main 에 커밋이 있으면 main push 가 원격에 반영되지 않는다", () => {
    const work = createRepo();
    const before = remoteRef(work, "main");
    gitOk(work, "commit", "--allow-empty", "-m", "chore: add foo");
    enableHooks(work);

    const result = push(work, "main");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("[pre-push] 거부한다:");
    expect(remoteRef(work, "main")).toBe(before);
  });

  it("작업 브랜치 push 는 원격에 반영된다", () => {
    const work = createRepo();
    gitOk(work, "switch", "-c", "feat/x");
    gitOk(work, "commit", "--allow-empty", "-m", "chore: add foo");
    enableHooks(work);

    const result = push(work, "feat/x");

    expect(result.status, result.stderr).toBe(0);
    expect(remoteRef(work, "feat/x")).not.toBe("");
  });
});
