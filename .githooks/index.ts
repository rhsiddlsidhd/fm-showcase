// git 훅(commit-msg, pre-commit, pre-push)이 호출한다. 사용법: index.ts <훅 이름> [훅 인자...]
// ~/.codex/docs/GIT.md 의 규칙 중 기계가 판정할 수 있는 것만 강제한다.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { validateCommitBranch } from "./branch.ts";
import {
  currentBranch,
  hasCommits,
  hasUncommittedChanges,
  headSha,
  isMerging,
} from "./git.ts";
import { validateCommitMessage } from "./message.ts";
import {
  isBranchUpdate,
  validateCheckTarget,
  validatePushRef,
} from "./push.ts";

// pre-push 가 이 순서로 실행한다. 빌드와 E2E 는 오래 걸려 CI 가 맡는다.
// 테스트는 바뀐 파일과 관련된 것만 돌린다. 전체 test 는 CI 가 맡는다.
const QUALITY_SCRIPTS = [
  "typecheck",
  "lint",
  "lint:fsd",
  "lint:css",
  "format:check",
  "test:changed",
];

function reject(hook: string, message: string): never {
  console.error(`[${hook}] 거부한다: ${message}`);
  process.exit(1);
}

const [hook, ...args] = process.argv.slice(2);

switch (hook) {
  case "commit-msg": {
    // 병합 중 git 이 만드는 메시지는 GIT.md 가 다루지 않으므로 검사하지 않는다.
    if (isMerging()) break;
    const file = args[0];
    if (!file) reject(hook, "메시지 파일 경로가 없다");
    const reason = validateCommitMessage(readFileSync(file, "utf8"));
    if (reason) reject(hook, reason);
    break;
  }
  case "pre-commit": {
    const reason = validateCommitBranch(currentBranch(), hasCommits());
    if (reason) reject(hook, reason);
    break;
  }
  case "pre-push": {
    // stdin 한 줄: <local ref> <local sha> <remote ref> <remote sha>
    const errors: string[] = [];
    const updates: { localRef: string; localSha: string }[] = [];
    for (const line of readFileSync(0, "utf8").split("\n")) {
      if (line.trim() === "") continue;
      const [localRef, localSha, remoteRef, remoteSha] = line.split(" ");
      if (!localRef || !localSha || !remoteRef || !remoteSha) {
        errors.push(`입력 형식이 아니다: ${line}`);
        continue;
      }
      const reason = validatePushRef(localRef, localSha, remoteRef, remoteSha);
      if (reason) errors.push(`${remoteRef}: ${reason}`);
      if (isBranchUpdate(localSha, remoteRef)) {
        updates.push({ localRef, localSha });
      }
    }
    if (errors.length > 0) reject(hook, errors.join("\n  "));
    if (updates.length === 0) break;
    const target = validateCheckTarget(
      hasUncommittedChanges(),
      headSha(),
      updates,
    );
    if (target) reject(hook, target);
    for (const script of QUALITY_SCRIPTS) {
      // Windows 의 npm 은 npm.cmd 라 셸을 거쳐야 실행된다. script 이름은 위 상수뿐이다.
      const result = spawnSync(`npm run ${script}`, {
        shell: true,
        stdio: ["ignore", "inherit", "inherit"],
      });
      if (result.error) {
        const error = result.error as NodeJS.ErrnoException;
        reject(
          hook,
          `npm run ${script} 실행 실패: ${error.code ?? error.message}`,
        );
      }
      if (result.status !== 0) {
        const cause = result.signal ?? `exit ${result.status}`;
        reject(hook, `npm run ${script} 실패(${cause})`);
      }
    }
    break;
  }
  default:
    reject(String(hook), "알 수 없는 훅이다");
}
