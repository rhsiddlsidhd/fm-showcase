// Bash 도구의 PostToolUse/PostToolUseFailure 훅이 호출한다(stdin: 훅 JSON).
// 단일 검증 명령(npm run test 등)이면 검증 기록 한 줄을 쓴다. 명세: docs/verification-log-spec.md
import { readFileSync } from "node:fs";
import { isVerificationCommand } from "./command.ts";
import { currentBranch, findRoot, headCommit } from "./git.ts";
import { readCommand, readOutcome, readSession } from "./payload.ts";
import { buildRecord } from "./record.ts";
import { appendRecord, findSessionFile, prepareDirs, writeOutput } from "./storage.ts";

try {
  const payload = JSON.parse(readFileSync(0, "utf8"));
  const command = readCommand(payload);
  if (!isVerificationCommand(command)) process.exit(0);

  const { exitCode, output } = readOutcome(payload);
  const session = readSession(payload);

  const root = findRoot(payload.cwd ?? process.cwd());
  const branch = currentBranch(root);
  const { dir, outDir } = prepareDirs(root, branch);

  const iso = new Date().toISOString();
  const sessionFile = findSessionFile(dir, session, iso);
  const outName = writeOutput(outDir, session, output);

  const record = buildRecord(payload, { iso, branch, command, exitCode, head: headCommit(root), outName });
  appendRecord(dir, sessionFile, record);
} catch (e) {
  // 훅 실패가 세션을 막으면 안 된다.
  console.error(`[log-verification] ${e instanceof Error ? e.message : String(e)}`);
}
process.exit(0);
