import { DEFAULT_BRANCH } from "./rules.ts";
import { validateBranchName } from "./naming.ts";

const isZero = (sha: string) => /^0+$/.test(sha);

// pre-push 가 stdin 으로 받는 한 줄(local ref, local sha, remote ref, remote sha)을 검사한다.
export function validatePushRef(
  _localRef: string,
  localSha: string,
  remoteRef: string,
  remoteSha: string,
): string | null {
  const heads = "refs/heads/";
  if (!remoteRef.startsWith(heads)) return null;
  const name = remoteRef.slice(heads.length);
  if (name === DEFAULT_BRANCH) {
    if (isZero(remoteSha) && !isZero(localSha)) return null; // 원격에 처음 만드는 push
    return `${DEFAULT_BRANCH} 에 직접 push 하거나 삭제하지 않는다. 작업 브랜치를 push 하고 PR 로 합쳐라`;
  }
  if (isZero(localSha)) return null; // 작업 브랜치 삭제
  return validateBranchName(name);
}

// 원격 브랜치에 커밋을 올리는 줄인지 본다. 삭제와 태그는 새 코드를 내보내지 않으므로 품질 검사 대상이 아니다.
export function isBranchUpdate(localSha: string, remoteRef: string): boolean {
  return remoteRef.startsWith("refs/heads/") && !isZero(localSha);
}

// 품질 검사는 작업 트리에서 돈다. 작업 트리가 push 하는 커밋과 같을 때만 검사 결과가 그 커밋을 대변한다.
export function validateCheckTarget(
  dirty: boolean,
  headSha: string | null,
  updates: { localRef: string; localSha: string }[],
): string | null {
  if (dirty) {
    return "작업 트리에 커밋하지 않은 변경이 있다. 품질 검사는 작업 트리에서 돌므로 커밋하거나 stash 한 뒤 push 하라";
  }
  if (headSha === null) {
    return "HEAD 에 커밋이 없다. 품질 검사는 작업 트리에서 돌므로 push 하는 브랜치를 체크아웃한 상태에서 push 하라";
  }
  const other = updates.find((update) => update.localSha !== headSha);
  if (other) {
    return `${other.localRef} 가 지금 체크아웃한 커밋과 다르다. 품질 검사는 작업 트리에서 돌므로 그 브랜치를 체크아웃한 상태에서 push 하라`;
  }
  return null;
}
