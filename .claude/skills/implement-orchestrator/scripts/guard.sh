#!/usr/bin/env bash
# 구현 오케스트레이터의 파일 소유권 검사.
# 에이전트 실행 전후의 작업 트리 상태를 기록·비교해 담당 밖 변경을 찾고, 실행 전 상태로 되돌린다.
#
#   guard.sh snapshot <out.tsv>            현재 상태 기록 (HEAD, 스테이징, HEAD와 다른 파일의 내용 해시)
#   guard.sh diff <before.tsv> <after.tsv> 두 기록 사이에 바뀐 경로 출력. '#'으로 시작하는 줄은 git 조작 흔적
#   guard.sh plan <spec.md>                spec.md "## 파일 배치" 표에서 역할과 경로가 맞지 않는 행 출력
#   guard.sh check <test|impl|none> [spec.md]
#                                          표준 입력의 경로 중 해당 역할의 담당 밖 경로 출력.
#                                          spec.md를 주면 배치 표에 그 역할로 적힌 경로만 허용한다
#   guard.sh restore <before.tsv>          표준 입력의 경로를 before 시점 상태로 되돌림
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# HEAD와 다른 경로(스테이징 포함, 삭제 포함)와 추적하지 않는 새 파일. .gitignore 대상(_workspace 등)은 제외된다.
changed_paths() {
  { git diff -z --name-only HEAD; git ls-files -z --others --exclude-standard; } | sort -zu
}

cmd_snapshot() {
  local out=$1
  {
    printf '#HEAD\t%s\n' "$(git rev-parse HEAD)"
    if git diff --cached --quiet; then printf '#INDEX\tclean\n'; else printf '#INDEX\tdirty\n'; fi
    changed_paths | while IFS= read -r -d '' p; do
      # -w로 내용을 git 객체에 저장해 두어야 restore가 실행 전 내용을 되살릴 수 있다.
      if [ -e "$p" ]; then printf '%s\t%s\n' "$(git hash-object -w -- "$p")" "$p"
      else printf -- '-\t%s\n' "$p"; fi
    done
  } > "$out"
}

cmd_diff() {
  local b=$1 a=$2
  if ! diff <(awk '/^#/' "$b") <(awk '/^#/' "$a") > /dev/null; then
    echo '#GIT 에이전트 실행 중 커밋 또는 스테이징이 바뀌었다'
  fi
  comm -3 <(awk '!/^#/' "$b" | sort) <(awk '!/^#/' "$a" | sort) | sed 's/^\t//' | cut -f2 | sort -u
}

is_test() {
  case $1 in
    *.test.* | *.spec.* | e2e/* | src/shared/test/*) return 0 ;;
  esac
  return 1
}

is_impl() {
  [[ $1 == src/* ]] && ! is_test "$1"
}

# "## 파일 배치" 섹션 표의 행을 "역할<TAB>경로"로 출력한다. 첫 칸은 경로, 둘째 칸은 역할(impl|test)이다.
plan_rows() {
  awk -F'|' '
    /^## / { in_plan = ($0 ~ /^## 파일 배치/); next }
    in_plan && /^\|/ {
      path = $2; role = $3
      gsub(/[ `]/, "", path); gsub(/ /, "", role)
      if (path == "경로" || path ~ /^-+$/ || path == "") next
      print role "\t" path
    }' "$1"
}

cmd_plan() {
  local rows role p
  rows=$(plan_rows "$1")
  [ -n "$rows" ] || { echo '#EMPTY 파일 배치 표가 없거나 비어 있다'; return; }
  while IFS=$'\t' read -r role p; do
    case $role in
      test) is_test "$p" || echo "$role $p" ;;
      impl) is_impl "$p" || echo "$role $p" ;;
      *) echo "$role $p" ;;
    esac
  done <<< "$rows"
}

cmd_check() {
  local role=$1 spec=${2:-} allowed='' p
  [ -n "$spec" ] && allowed=$(plan_rows "$spec" | awk -F'\t' -v r="$role" '$1 == r { print $2 }')
  while IFS= read -r p; do
    case $p in '#'*) echo "$p"; continue ;; esac
    case $role in
      test) is_test "$p" || { echo "$p"; continue; } ;;
      impl) is_impl "$p" || { echo "$p"; continue; } ;;
      *) echo "$p"; continue ;;
    esac
    if [ -n "$spec" ] && ! grep -qxF -- "$p" <<< "$allowed"; then echo "$p"; fi
  done
}

cmd_restore() {
  local b=$1 p h
  while IFS= read -r p; do
    case $p in '#'*) continue ;; esac  # 커밋·스테이징 변화는 자동으로 되돌리지 않는다. 오케스트레이터가 멈추고 보고한다.
    h=$(awk -F'\t' -v p="$p" '!/^#/ && $2 == p { print $1 }' "$b")
    if [ -z "$h" ]; then
      # 실행 전에는 HEAD와 같았다.
      if git cat-file -e "HEAD:$p" 2> /dev/null; then git restore --source=HEAD --staged --worktree -- "$p"
      else rm -f -- "$p"; fi
    elif [ "$h" = - ]; then
      rm -f -- "$p"
    else
      mkdir -p "$(dirname "$p")"
      git cat-file blob "$h" > "$p"
    fi
    echo "restored: $p"
  done
}

case ${1:-} in
  snapshot) cmd_snapshot "$2" ;;
  diff) cmd_diff "$2" "$3" ;;
  plan) cmd_plan "$2" ;;
  check) cmd_check "$2" "${3:-}" ;;
  restore) cmd_restore "$2" ;;
  *) echo "usage: guard.sh snapshot|diff|plan|check|restore ..." >&2; exit 2 ;;
esac
