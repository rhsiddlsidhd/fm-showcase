// ~/.codex/docs/GIT.md 의 Naming 규칙 중 기계가 판정할 수 있는 것만 담는다.
export const DEFAULT_BRANCH = "main";

export const PREFIXES = [
  "feat", "fix", "docs", "refactor", "perf", "test", "build", "ci", "chore", "revert",
] as const;

export const PREFIX_PATTERN = PREFIXES.join("|");
export const KEBAB_PATTERN = "[a-z0-9]+(?:-[a-z0-9]+)*";

const BRANCH = new RegExp(`^(?:${PREFIX_PATTERN})/${KEBAB_PATTERN}$`);

export function validateBranchName(name: string): string | null {
  if (BRANCH.test(name)) return null;
  return `브랜치 이름은 {prefix}/{소문자-kebab-case} 형식이어야 한다(prefix: ${PREFIXES.join(", ")}): ${name}`;
}
