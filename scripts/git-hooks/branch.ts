import { DEFAULT_BRANCH, validateBranchName } from "./naming.ts";

// 첫 커밋 전의 main 만 직접 커밋을 허용한다. 분리된 HEAD(브랜치 이름 없음, 리베이스 중 등)는 검사하지 않는다.
export function validateCommitBranch(
  branch: string,
  hasCommits: boolean,
): string | null {
  if (branch === "") return null;
  if (branch === DEFAULT_BRANCH) {
    return hasCommits
      ? `${DEFAULT_BRANCH} 에 직접 커밋하지 않는다. 작업 브랜치를 만들어 PR 로 합쳐라`
      : null;
  }
  return validateBranchName(branch);
}
