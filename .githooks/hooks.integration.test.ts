// git 이 .githooks 의 sh 래퍼를 실행하고, 래퍼가 node index.ts 를 거쳐 거부할 때
// 커밋과 push 가 실제로 중단되는지 본다. 판정 규칙 자체는 각 *.test.ts(Unit)가 검증한다.
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, describe, expect, it } from "vitest";

const HOOKS_PATH = dirname(fileURLToPath(import.meta.url)).replaceAll(
  "\\",
  "/",
);

// 사용자 전역·시스템 git 설정(push.gpgSign, core.fsmonitor 등)이 끼어들지 않게 한다.
// 전역 설정은 이 디렉토리 안의 없는 파일을 가리키게 해 빈 설정으로 읽힌다.
const configDir = mkdtempSync(join(tmpdir(), "githooks-config-"));

// 바깥 git(예: 이 테스트를 부른 훅)이 넘긴 GIT_DIR 같은 값이 임시 저장소를 가리키지 않게 뺀다.
const env = {
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
  ),
  GIT_CONFIG_GLOBAL: join(configDir, "gitconfig"),
  GIT_CONFIG_NOSYSTEM: "1",
};

afterAll(() => {
  rmSync(configDir, { recursive: true, force: true, maxRetries: 3 });
});

// 테스트마다 git 과 node 를 여러 번 띄운다. Windows 에서는 프로세스 생성이 느려 기본 5초를 넘는다.
// pre-push 안에서 전체 테스트와 병렬로 돌면 품질 검사 통과 케이스(npm 6번)가 단독 실행(약 27초)의 두 배를 넘는다.
const SLOW = { timeout: 150_000 };
// spawnSync 는 이벤트 루프를 막아 SLOW 의 테스트 timeout 이 발동하지 못한다. git 호출이 멈추면 이 값으로 끝낸다.
// SLOW 보다 짧아야 멈춘 명령이 테스트 실패로 드러난다. Windows 에서는 git 만 끝나고 훅이 띄운 node·npm 은 남을 수 있다.
const SPAWN_TIMEOUT = 120_000;

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
    } catch (error) {
      console.warn(`임시 디렉토리를 지우지 못했다: ${dir}`, error);
    }
  }
});

function git(cwd: string, ...args: string[]) {
  const result = spawnSync("git", args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: SPAWN_TIMEOUT,
  });
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

// pre-push 가 실행하는 품질 검사 scripts. 실행 순서는 훅이 정한 순서다.
const QUALITY_SCRIPTS = [
  "typecheck",
  "lint",
  "lint:fsd",
  "lint:css",
  "format:check",
  "test:changed",
];

// 작업 저장소 바깥(임시 루트)에 둔다. 작업 트리 안에 쓰면 dirty 판정에 걸린다.
const markerPath = (work: string) => join(work, "..", "ran.log");

// 각 script 가 자기 이름을 표식 파일에 남기고, failing 으로 고른 script 만 실패하는 package.json 을 커밋한다.
// 훅을 켜기 전에 부른다. 표식으로 scripts 가 실제로 어떤 순서로 실행됐는지 확인한다.
function commitPackageJson(work: string, failing?: string) {
  const scripts = Object.fromEntries(
    QUALITY_SCRIPTS.map((name) => [
      name,
      `node -e "require('fs').appendFileSync('../ran.log','${name} ');process.exit(${name === failing ? 1 : 0})"`,
    ]),
  );
  writeFileSync(
    join(work, "package.json"),
    JSON.stringify({ name: "fixture", private: true, scripts }, null, 2),
  );
  gitOk(work, "add", "package.json");
  gitOk(work, "commit", "-m", "chore: add package json");
}

const ranScripts = (work: string) =>
  existsSync(markerPath(work))
    ? readFileSync(markerPath(work), "utf8").trim()
    : "";

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
    expect(result.stderr).toContain(
      "[pre-commit] 거부한다: main 에 직접 커밋하지 않는다",
    );
    expect(commitCount(work)).toBe("1");
  });

  it("작업 브랜치에서는 커밋이 만들어진다", () => {
    const work = createRepo();
    gitOk(work, "switch", "-c", "feat/x");
    enableHooks(work);

    // 트레일러를 붙여 두면 commit-msg 의 트레일러 규칙과 상관없이 pre-commit 연결만 본다.
    // 트레일러 강제를 없앤 뒤에는 트레일러가 있어도 무시된다는 확인을 겸한다.
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
    expect(result.stderr).toMatch(
      /\[commit-msg\] 거부한다: 제목은 .*형식이어야 한다/,
    );
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
    expect(result.stderr).toMatch(
      /\[pre-push\] 거부한다: .*main 에 직접 push 하거나 삭제하지 않는다/,
    );
    expect(remoteRef(work, "main")).toBe(before);
  });

  it("품질 검사가 모두 통과하면 차례로 실행한 뒤 작업 브랜치 push 가 원격에 반영된다", () => {
    const work = createRepo();
    gitOk(work, "switch", "-c", "feat/x");
    commitPackageJson(work);
    enableHooks(work);

    const result = push(work, "feat/x");

    expect(result.status, result.stderr).toBe(0);
    expect(ranScripts(work)).toBe(QUALITY_SCRIPTS.join(" "));
    expect(remoteRef(work, "feat/x")).not.toBe("");
  });

  it("품질 검사 하나가 실패하면 그 자리에서 멈추고 push 가 원격에 반영되지 않는다", () => {
    const work = createRepo();
    gitOk(work, "switch", "-c", "feat/x");
    commitPackageJson(work, "lint");
    enableHooks(work);

    const result = push(work, "feat/x");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "[pre-push] 거부한다: npm run lint 실패(exit 1)",
    );
    expect(ranScripts(work)).toBe("typecheck lint");
    expect(remoteRef(work, "feat/x")).toBe("");
  });

  it("작업 트리에 커밋하지 않은 파일이 있으면 품질 검사 없이 push 가 거부된다", () => {
    const work = createRepo();
    gitOk(work, "switch", "-c", "feat/x");
    commitPackageJson(work);
    writeFileSync(join(work, "draft.txt"), "draft");
    enableHooks(work);

    const result = push(work, "feat/x");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/\[pre-push\] 거부한다: .*stash/);
    expect(ranScripts(work)).toBe("");
    expect(remoteRef(work, "feat/x")).toBe("");
  });

  it("push 하는 브랜치를 체크아웃하지 않았으면 품질 검사 없이 push 가 거부된다", () => {
    const work = createRepo();
    gitOk(work, "switch", "-c", "feat/x");
    commitPackageJson(work);
    gitOk(work, "switch", "main");
    enableHooks(work);

    const result = push(work, "feat/x");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/\[pre-push\] 거부한다: .*체크아웃/);
    expect(ranScripts(work)).toBe("");
    expect(remoteRef(work, "feat/x")).toBe("");
  });

  it("원격 작업 브랜치 삭제는 품질 검사 없이 반영된다", () => {
    const work = createRepo();
    gitOk(work, "switch", "-c", "feat/x");
    commitPackageJson(work, "typecheck");
    gitOk(work, "push", "origin", "feat/x");
    enableHooks(work);

    const result = git(work, "push", "origin", "--delete", "feat/x");

    expect(result.status, result.stderr).toBe(0);
    expect(ranScripts(work)).toBe("");
    expect(remoteRef(work, "feat/x")).toBe("");
  });
});
