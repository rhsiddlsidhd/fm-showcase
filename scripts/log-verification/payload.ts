export type HookPayload = Record<string, any>;

export function readCommand(payload: HookPayload): string {
  return String(payload.tool_input?.command ?? "").trim();
}

export function readSession(payload: HookPayload): string {
  const sessionId: string | undefined =
    payload.session_id ?? process.env.CLAUDE_CODE_SESSION_ID;
  if (!sessionId) throw new Error("세션 ID가 없다");
  return sessionId.slice(0, 8);
}

export function readOutcome(payload: HookPayload): {
  exitCode: number | null;
  output: string;
} {
  const failed = payload.hook_event_name === "PostToolUseFailure";
  const interrupted =
    payload.is_interrupt === true ||
    payload.tool_response?.interrupted === true;
  let exitCode: number | null = 0;
  let output: string;
  if (failed) {
    const error = String(payload.error ?? "");
    // 출력이 없는 실패는 "Exit code N" 뒤에 개행이 없다.
    const prefix = /^Exit code (\d+)(?:\n\n?|$)/.exec(error);
    exitCode = prefix ? Number(prefix[1]) : null;
    output = prefix ? error.slice(prefix[0].length) : error;
  } else {
    output =
      String(payload.tool_response?.stdout ?? "") +
      String(payload.tool_response?.stderr ?? "");
  }
  if (interrupted) exitCode = null;
  return { exitCode, output };
}
