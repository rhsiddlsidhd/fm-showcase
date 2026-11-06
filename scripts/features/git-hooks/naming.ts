import {
  KEBAB_PATTERN,
  PREFIXES,
  PREFIX_PATTERN,
} from "../../shared/constants/git.ts";

const BRANCH = new RegExp(`^(?:${PREFIX_PATTERN})/${KEBAB_PATTERN}$`);

export function validateBranchName(name: string): string | null {
  if (BRANCH.test(name)) return null;
  return `브랜치 이름은 {prefix}/{소문자-kebab-case} 형식이어야 한다(prefix: ${PREFIXES.join(", ")}): ${name}`;
}
