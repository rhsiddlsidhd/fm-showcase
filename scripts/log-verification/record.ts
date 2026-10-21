import type { HookPayload } from "./payload.ts";

export interface RecordInput {
  iso: string;
  branch: string;
  command: string;
  exitCode: number | null;
  head: string | null;
  outName: string;
}

// agent_id, agent_type 은 훅 payload 에 있을 때만 적는다(없으면 서브에이전트 밖의 호출).
export function buildRecord(payload: HookPayload, input: RecordInput) {
  return {
    time: input.iso,
    branch: input.branch,
    ...(payload.agent_id !== undefined && { agent_id: payload.agent_id }),
    ...(payload.agent_type !== undefined && { agent_type: payload.agent_type }),
    command: input.command,
    exit_code: input.exitCode,
    head: input.head,
    output: { path: `verification-output/${input.outName}` },
  };
}
