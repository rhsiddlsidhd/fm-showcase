// git 훅(commit-msg, pre-commit, pre-push)이 호출한다. 사용법: index.ts <훅 이름> [훅 인자...]
// ~/.codex/docs/GIT.md 의 규칙 중 기계가 판정할 수 있는 것만 강제한다.
import { readFileSync } from "node:fs";
import { validateCommitBranch } from "./branch.ts";
import { currentBranch, hasCommits, isMerging } from "./git.ts";
import { validateCommitMessage } from "./message.ts";
import { validatePushRef } from "./push.ts";

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
    for (const line of readFileSync(0, "utf8").split("\n")) {
      if (line.trim() === "") continue;
      const [localRef, localSha, remoteRef, remoteSha] = line.split(" ");
      const reason = validatePushRef(localRef, localSha, remoteRef, remoteSha);
      if (reason) errors.push(`${remoteRef}: ${reason}`);
    }
    if (errors.length > 0) reject(hook, errors.join("\n  "));
    break;
  }
  default:
    reject(String(hook), "알 수 없는 훅이다");
}
