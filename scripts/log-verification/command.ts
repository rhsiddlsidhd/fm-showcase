// 허용 목록: 파일을 바꾸지 않는 확인용 스크립트만 검증으로 본다(lint:fix, format 등은 제외).
// 단일 명령만 인식한다. `--` 뒤 인자에는 셸 연결 문자(; & | < > ` $ ( ))를 허용하지 않는다.
const VERIFICATION =
  /^npm run (?:test(?::[\w-]+)*|typecheck|lint|format:check|build)(?:\s+--(?:\s+[^;&|<>`$()\n]*)?)?$/;

export function isVerificationCommand(command: string): boolean {
  return VERIFICATION.test(command);
}
