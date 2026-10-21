import { appendFileSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface LogDirs {
  dir: string;
  outDir: string;
}

export function prepareDirs(root: string, branch: string): LogDirs {
  const dir = join(root, "_workspace", "verification-logs", branch.replaceAll("/", "-"));
  const outDir = join(dir, "verification-output");
  mkdirSync(outDir, { recursive: true });
  return { dir, outDir };
}

export function findSessionFile(dir: string, session: string, iso: string): string {
  return (
    readdirSync(dir).find((f) => f.endsWith(`-${session}.jsonl`)) ??
    `${iso.slice(0, 10).replaceAll("-", "")}-${iso.slice(11, 16).replace(":", "")}-${session}.jsonl`
  );
}

// 출력 원문은 배타 생성으로 쓴다(동시 실행에서 번호가 겹치지 않게).
export function writeOutput(outDir: string, session: string, output: string): string {
  let n = readdirSync(outDir).filter((f) => f.startsWith(`${session}-`)).length + 1;
  for (;;) {
    const outName = `${session}-${String(n).padStart(4, "0")}.log`;
    try {
      writeFileSync(join(outDir, outName), output, { flag: "wx" });
      return outName;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      n++;
    }
  }
}

export function appendRecord(dir: string, sessionFile: string, record: object): void {
  appendFileSync(join(dir, sessionFile), JSON.stringify(record) + "\n");
}
