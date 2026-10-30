#!/usr/bin/env bash
# 구현 오케스트레이터의 검사 실행기.
# .github/workflows/ci.yml 의 "- run: npm run X" 단계를 목록 원본으로 읽고, 에이전트별 제외 규칙을 적용해
# 직렬로 모두 실행한다. 실패해도 멈추지 않고, 끝나면 명령별 결과 표와 실패한 명령의 출력을 보여 준다.
#
#   checks.sh <test-engineer|executor|code-simplifier|verifier> [--e2e] [--log-dir DIR]
#
# 종료 코드: 모두 통과 0, 하나라도 실패 1, 사용법·설정 오류 2
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

CI=.github/workflows/ci.yml
TAIL=80  # 실패 출력은 마지막 이만큼만 화면에 보인다. 전체는 로그 파일에 남는다.

role=${1:-}
shift || true
e2e=0 log_dir=''
while [ $# -gt 0 ]; do
  case $1 in
    --e2e) e2e=1 ;;
    --log-dir) log_dir=$2; shift ;;
    *) echo "알 수 없는 옵션: $1" >&2; exit 2 ;;
  esac
  shift
done

# 에이전트별 제외 규칙. 하네스가 갖는 정책은 이것뿐이고, 명령 목록은 ci.yml에만 있다.
case $role in
  test-engineer) exclude='test typecheck build' ;;  # 구현이 없어 실패하는 것이 정상이다
  executor | code-simplifier | verifier) exclude='' ;;
  *) echo "사용법: checks.sh <test-engineer|executor|code-simplifier|verifier> [--e2e] [--log-dir DIR]" >&2; exit 2 ;;
esac
[ $e2e -eq 1 ] || exclude="$exclude test:e2e"  # 브라우저가 필요해 비용이 크다

mapfile -t all < <(sed -nE 's/^[[:space:]]*-[[:space:]]+run:[[:space:]]+npm run ([^[:space:]]+).*/\1/p' "$CI")
[ ${#all[@]} -gt 0 ] || { echo "$CI 에서 npm run 단계를 찾지 못했다" >&2; exit 2; }

# 제외 규칙의 이름이 ci.yml에 없으면 CI와 정책이 어긋난 것이다.
for x in $exclude; do
  printf '%s\n' "${all[@]}" | grep -qxF -- "$x" || echo "경고: 제외 규칙의 '$x'가 $CI 에 없다" >&2
done

[ -n "$log_dir" ] || log_dir=$(mktemp -d)
mkdir -p "$log_dir"

names=() codes=()
for name in "${all[@]}"; do
  case " $exclude " in *" $name "*) continue ;; esac
  log="$log_dir/${name//:/_}.log"
  echo "▶ npm run $name" >&2
  npm run --silent "$name" > "$log" 2>&1
  code=$?
  names+=("$name"); codes+=("$code")
done

failed=0
echo "## 검사 결과 ($role)"
echo
echo "| 명령 | 종료 코드 | 결과 |"
echo "| --- | --- | --- |"
for i in "${!names[@]}"; do
  if [ "${codes[$i]}" -eq 0 ]; then r='통과'; else r='**실패**'; failed=$((failed + 1)); fi
  echo "| \`npm run ${names[$i]}\` | ${codes[$i]} | $r |"
done
echo
excl=$(echo $exclude); echo "제외: ${excl:-없음} / 로그: $log_dir"

for i in "${!names[@]}"; do
  [ "${codes[$i]}" -eq 0 ] && continue
  log="$log_dir/${names[$i]//:/_}.log"
  echo
  echo "### 실패: \`npm run ${names[$i]}\` (종료 코드 ${codes[$i]})"
  echo
  echo '```'
  tail -n "$TAIL" "$log"
  echo '```'
  lines=$(wc -l < "$log")
  [ "$lines" -le "$TAIL" ] || echo "(전체 ${lines}줄 중 마지막 ${TAIL}줄. 전체: $log)"
done

echo
if [ $failed -eq 0 ]; then echo "전체: 통과"; exit 0; else echo "전체: 실패 ${failed}건"; exit 1; fi
