import { DEFAULT_BRANCH, validateBranchName } from "./naming.ts";

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
