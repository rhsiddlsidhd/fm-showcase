import { KEBAB_PATTERN, PREFIXES, PREFIX_PATTERN } from "./naming.ts";

const MAX_SUBJECT = 72;
const SUBJECT = new RegExp(
  `^(?:${PREFIX_PATTERN})(?:\\((?<scope>[^)]*)\\))?!?: (?<message>.*)$`,
);
const KEBAB_ONLY = new RegExp(`^${KEBAB_PATTERN}$`);
const TRAILER_LINE = /^[A-Za-z][A-Za-z0-9-]*: \S/;
const CO_AUTHOR_KEY = /^Co-Authored-By:/i;
const CO_AUTHOR = /^Co-Authored-By: [^<>]+ <[^<>\s@]+@[^<>\s@]+>$/i;
const ASSISTED_KEY = /^AI-Assisted:/i;
const ASSISTED_NONE = /^AI-Assisted: none$/i;

// 마지막 문단이 모두 "Key: value" 줄이면 트레일러로 본다. 제목만 있는 메시지의 제목은 트레일러가 아니다.
function trailers(text: string): string[] {
  const paragraphs = text
    .split("\n")
    .filter((line) => !line.startsWith("#"))
    .join("\n")
    .trim()
    .split(/\n\s*\n/);
  if (paragraphs.length < 2) return [];
  const last = paragraphs[paragraphs.length - 1].split("\n");
  return last.every((line) => TRAILER_LINE.test(line)) ? last : [];
}

// AI 관여를 선언했는지만 본다. 어떤 에이전트나 모델인지는 가리지 않는다.
function validateAiDeclaration(text: string): string | null {
  const lines = trailers(text);
  const coAuthors = lines.filter((line) => CO_AUTHOR_KEY.test(line));
  const assisted = lines.filter((line) => ASSISTED_KEY.test(line));
  const badCoAuthor = coAuthors.find((line) => !CO_AUTHOR.test(line));
  if (badCoAuthor)
    return `Co-Authored-By 는 "이름 <이메일>" 형식이어야 한다: ${badCoAuthor}`;
  const badAssisted = assisted.find((line) => !ASSISTED_NONE.test(line));
  if (badAssisted) return `AI-Assisted 에는 none 만 쓸 수 있다: ${badAssisted}`;
  if (coAuthors.length > 0 && assisted.length > 0)
    return "Co-Authored-By 와 AI-Assisted: none 을 함께 쓸 수 없다";
  if (coAuthors.length === 0 && assisted.length === 0)
    return "AI 관여 표기가 없다. AI가 관여했으면 `Co-Authored-By: 이름 <이메일>`, 사람 단독이면 `AI-Assisted: none` 을 마지막 문단의 트레일러로 쓴다";
  return null;
}

// 메시지에서 주석(#)과 빈 줄을 건너뛴 첫 줄을 제목으로 보고 검사한다. 본문은 검사하지 않고 마지막 문단의 트레일러만 읽는다.
// 명령형 동사인지(과거형·명사구 금지)는 의미 판단이라 강제하지 않는다.
export function validateCommitMessage(text: string): string | null {
  const subject = text
    .split("\n")
    .find((line) => line.trim() !== "" && !line.startsWith("#"));
  if (subject === undefined) return "커밋 메시지가 비어 있다";
  if (subject.length > MAX_SUBJECT) {
    return `제목은 ${MAX_SUBJECT}자 이하여야 한다(현재 ${subject.length}자). 자세한 내용은 본문으로 옮겨라`;
  }
  const match = SUBJECT.exec(subject);
  if (!match?.groups) {
    return `제목은 "{prefix}: {message}" 또는 "{prefix}({scope}): {message}" 형식이어야 한다(prefix: ${PREFIXES.join(", ")}): ${subject}`;
  }
  const { scope, message } = match.groups;
  if (scope !== undefined && !KEBAB_ONLY.test(scope))
    return `scope 는 소문자 kebab-case 여야 한다: (${scope})`;
  if (message === "") return "콜론 뒤에 메시지가 있어야 한다";
  if (!/^[\x20-\x7E]+$/.test(message))
    return `메시지는 영어(ASCII)로 써야 한다: ${message}`;
  if (!/^[a-z]/.test(message))
    return `메시지는 소문자 영어 동사로 시작해야 한다: ${message}`;
  if (message.endsWith(".")) return "제목 끝에 마침표를 붙이지 않는다";
  return validateAiDeclaration(text);
}
