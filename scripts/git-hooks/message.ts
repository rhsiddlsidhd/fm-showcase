import { KEBAB_PATTERN, PREFIXES, PREFIX_PATTERN } from "./naming.ts";

const MAX_SUBJECT = 72;
const SUBJECT = new RegExp(`^(?:${PREFIX_PATTERN})(?:\\((?<scope>[^)]*)\\))?!?: (?<message>.*)$`);
const KEBAB_ONLY = new RegExp(`^${KEBAB_PATTERN}$`);

// 메시지에서 주석(#)과 빈 줄을 건너뛴 첫 줄을 제목으로 보고 검사한다. 본문은 검사하지 않는다.
// 명령형 동사인지(과거형·명사구 금지)는 의미 판단이라 강제하지 않는다.
export function validateCommitMessage(text: string): string | null {
  const subject = text.split("\n").find((line) => line.trim() !== "" && !line.startsWith("#"));
  if (subject === undefined) return "커밋 메시지가 비어 있다";
  if (subject.length > MAX_SUBJECT) {
    return `제목은 ${MAX_SUBJECT}자 이하여야 한다(현재 ${subject.length}자). 자세한 내용은 본문으로 옮겨라`;
  }
  const match = SUBJECT.exec(subject);
  if (!match?.groups) {
    return `제목은 "{prefix}: {message}" 또는 "{prefix}({scope}): {message}" 형식이어야 한다(prefix: ${PREFIXES.join(", ")}): ${subject}`;
  }
  const { scope, message } = match.groups;
  if (scope !== undefined && !KEBAB_ONLY.test(scope)) return `scope 는 소문자 kebab-case 여야 한다: (${scope})`;
  if (message === "") return "콜론 뒤에 메시지가 있어야 한다";
  if (!/^[\x20-\x7E]+$/.test(message)) return `메시지는 영어(ASCII)로 써야 한다: ${message}`;
  if (!/^[a-z]/.test(message)) return `메시지는 소문자 영어 동사로 시작해야 한다: ${message}`;
  if (message.endsWith(".")) return "제목 끝에 마침표를 붙이지 않는다";
  return null;
}
