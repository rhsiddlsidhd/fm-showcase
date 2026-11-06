// ~/.codex/docs/GIT.md 의 Naming 규칙 중 기계가 판정할 수 있는 것만 담는다.
export const DEFAULT_BRANCH = "main";

export const PREFIXES = [
  "feat",
  "fix",
  "docs",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
] as const;

export const PREFIX_PATTERN = PREFIXES.join("|");
export const KEBAB_PATTERN = "[a-z0-9]+(?:-[a-z0-9]+)*";
