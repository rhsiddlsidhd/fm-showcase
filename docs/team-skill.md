# Team 스킬 (한국어 번역)

> 원본: `oh-my-claudecode:team` v5.7.5
> 경로: `~/.claude/plugins/cache/omc/oh-my-claudecode/5.7.5/skills/team/SKILL.md`

## 메타데이터

| 항목 | 값 |
| --- | --- |
| name | `team` |
| description | Claude Code 암묵적(implicit) 에이전트 팀을 사용해, 공유 작업 목록 위에서 N개의 에이전트를 조율 |
| argument-hint | `[N:agent-type] [ralph] <작업 설명>` |
| aliases | 없음 |
| level | 4 |

---

# Team 스킬

Claude Code의 암묵적 에이전트 팀을 사용해, 공유 작업 목록에서 일하는 N개의 조율된 에이전트를 스폰한다. Claude Code 2.1.178+는 네이티브 `TeamCreate`/`TeamDelete`를 제거했다. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`이면 각 세션은 하나의 암묵적 팀을 가지며, 팀원(teammate)은 서로 다른 `name` 값을 주고 Agent/Task 도구로 직접 스폰한다. 이 스킬은 문서화된 범위에서 OMC의 기존(legacy) tmux/CLI 워커 오케스트레이션(`omc team` / `/omc-teams`)도 그대로 유지한다. 암묵적 팀과 `omc team`은 결과를 공유하지 않는다. 한쪽이 끝났다고 다른 쪽이 성공한 것이 아니다.

`swarm` 호환 별칭은 #1131에서 제거되었다.

## 사용법

```
/oh-my-claudecode:team N:agent-type "task description"
/oh-my-claudecode:team "task description"
/oh-my-claudecode:team ralph "task description"
```

### 파라미터

- **N** - 팀원 에이전트 수 (1-20). 선택. 기본값은 작업 분해 결과에 따른 자동 크기 산정.
- **agent-type** - `team-exec` 스테이지에서 스폰할 OMC 에이전트 (예: executor, debugger, designer, codex, gemini, antigravity). 선택. 기본값은 스테이지 인지형 라우팅. Codex CLI 워커는 `codex`, Gemini CLI 워커(엔터프라이즈/API 키 티어)는 `gemini`, Antigravity CLI(`agy`) 워커(Google의 Gemini CLI 후속)는 `antigravity`를 사용한다. 해당 CLI가 설치되어 있어야 한다. 아래 "스테이지 에이전트 라우팅" 참고.
- **task** - 팀원들에게 분해하여 분배할 상위 수준 작업
- **ralph** - 선택적 수식어. 있으면 team 파이프라인을 Ralph의 지속성 루프(실패 시 재시도, 완료 전 architect 검증)로 감싼다. 아래 "Team + Ralph 조합" 참고.

### 예시

```bash
/team 5:executor "fix all TypeScript errors across the project"
/team 3:debugger "fix build errors in src/"
/team 4:designer "implement responsive layouts for all page components"
/team "refactor the auth module with security review"
/team ralph "build a complete REST API for user management"
# Codex CLI 워커 사용 (필요: npm install -g @openai/codex)
/team 2:codex "review architecture and suggest improvements"
# Gemini CLI 워커 사용 (필요: npm install -g @google/gemini-cli)
/team 2:gemini "redesign the UI components"
# Antigravity CLI 워커 사용 (필요: https://antigravity.google 안내에 따라 설치)
/team 2:antigravity "redesign the UI components"
# 혼합: 백엔드 분석은 Codex, 프론트엔드는 Gemini/Antigravity (작업별 위임은 /oh-my-claudecode:ask 사용)
```

## 아키텍처

```
User: "/team 3:executor fix all TypeScript errors"
              |
              v
      [TEAM ORCHESTRATOR (Lead)]
              |
              +-- 세션의 암묵적 Claude Code 팀을 사용
              |       -> TeamCreate 호출 없음. lead는 현재 세션 그대로
              |
              +-- 작업을 분석하고 하위 작업으로 분해
              |       -> explore/architect가 하위 작업 목록 생성
              |
              +-- 구현 계획으로부터 작업 목록 항목 생성
              |       -> 의존 관계를 가진 TODO/작업 항목 #1, #2, #3
              |
              +-- 작업 목록 항목 갱신 (소유자 사전 할당)
              |       -> task #1 owner=worker-1 등
              |
              +-- Task(name="worker-1") x 3
              |       -> 팀원을 팀에 스폰
              |
              +-- 모니터 루프
              |       <- 팀원 메시지 (활성 팀 인터페이스가 자동 전달)
              |       -> 진행 상황을 task-list/TodoWrite로 점검
              |       -> 활성 팀 인터페이스로 팀원에게 메시지를 보내 차단 해소/조율
              |
              +-- 완료
                      -> 활성 팀 인터페이스로 각 팀원에게 종료 요청
                      <- 팀원의 종료 승인 응답
                      -> state_clear(mode="team", session_id="<current_session_id>")
                      -> 공유/legacy 상태는 명시적 --all 정리를 위해 보존
```

**네이티브 Claude Code 팀 모델 (2.1.178+):**

```
- 이 스킬은 팀별 ~/.claude/teams/<name>/ 디렉터리를 만들지 않는다.
- TeamCreate/TeamDelete 호출은 사용할 수 없다.
- `team_name`은 네이티브 Claude Code에서 무시되는 legacy 메타데이터로만 허용된다. 라우팅에 의존하지 말 것.
- 팀원은 Agent/Task에 `name="worker-N"`을 지정해 직접 스폰한다.
```

## Goal 워크플로와의 관계

Team은 병렬·단계적 실행에 대한 OMC의 권위(authority)이다. 비결정적인 경고 처리 대신 결정적 충돌 정책 `refuse`, `adopt_existing`, `artifact_only`를 사용한다. 작업이 Claude Code `/goal`, Ralph, 또는 artifact-only Ultragoal을 언급하더라도, leader가 명시적으로 넘기지 않는 한 Team이 기본 루프 권위를 유지한다. `/goal`은 문서화된 네이티브 Claude Code 핸드오프 대상으로, 또는 lead 세션이 보여주는 증거로만 사용한다. `/goal` 평가자가 독립적으로 명령을 실행하거나 파일을 읽는다거나 `team-verify` / `team-fix`를 대체한다고 주장하지 않는다. artifact-only Ultragoal 참조는 내구성 있는 목표 원장/체크포인트/증거 산출물로 취급하며, 그 자체로 워커 실행이 되지는 않는다.

## 단계적 파이프라인 (정식 Team 런타임)

Team 실행은 단계적 파이프라인을 따른다.

`team-plan -> team-prd -> team-exec -> team-verify -> team-fix (루프)`

### 스테이지 에이전트 라우팅

각 파이프라인 스테이지는 executor만이 아니라 **전문화된 에이전트**를 사용한다. lead가 스테이지와 작업 특성에 따라 에이전트를 선택한다.

| 스테이지 | 필수 에이전트 | 선택 에이전트 | 선택 기준 |
| --- | --- | --- | --- |
| **team-plan** | `explore` (haiku), `planner` (opus) | `analyst` (opus), `architect` (opus) | 요구사항이 불명확하면 `analyst`. 경계가 복잡한 시스템이면 `architect`. |
| **team-prd** | `analyst` (opus) | `critic` (opus) | 범위에 이의를 제기하려면 `critic`. |
| **team-exec** | `executor` (sonnet) | `executor` (opus), `debugger` (sonnet), `designer` (sonnet), `writer` (haiku), `test-engineer` (sonnet) | 하위 작업 유형에 맞는 에이전트를 선택. 복잡한 자율 작업은 `executor` (model=opus), UI는 `designer`, 컴파일 문제는 `debugger`, 문서는 `writer`, 테스트 작성은 `test-engineer`. |
| **team-verify** | `verifier` (sonnet) | `test-engineer` (sonnet), `security-reviewer` (sonnet), `code-reviewer` (opus) | `verifier`는 항상 실행. 인증/암호화 변경에는 `security-reviewer` 추가. 파일 20개 초과 또는 아키텍처 변경에는 `code-reviewer` 추가. `code-reviewer`는 스타일/포맷 검사도 포함. |
| **team-fix** | `executor` (sonnet) | `debugger` (sonnet), `executor` (opus) | 타입/빌드 에러와 회귀 격리에는 `debugger`. 복잡한 다중 파일 수정에는 `executor` (model=opus). |

**라우팅 규칙:**

1. **에이전트는 사용자가 아니라 lead가 스테이지별로 선택한다.** 사용자의 `N:agent-type` 파라미터는 `team-exec` 스테이지의 워커 유형만 덮어쓴다. 다른 모든 스테이지는 스테이지에 맞는 전문가를 쓴다.
2. **전문가 에이전트는 executor를 보완한다.** 분석/리뷰는 architect/critic Claude 에이전트로, UI 작업은 designer 에이전트로 라우팅한다. tmux CLI 워커는 Claude의 네이티브 팀 메시징에 참여하지 않는다.
3. **비용 모드가 모델 티어에 영향을 준다.** 다운그레이드 시: 품질이 허용하는 범위에서 `opus` 에이전트는 `sonnet`으로, `sonnet`은 `haiku`로. `team-verify`는 항상 최소 `sonnet`을 쓴다.
4. **위험 수준이 리뷰를 상향한다.** 보안에 민감하거나 파일 20개를 초과하는 변경은 `team-verify`에 `security-reviewer` + `code-reviewer` (opus)를 반드시 포함한다.

### 스테이지 진입/종료 기준

- **team-plan**
  - 진입: Team 호출이 파싱되고 오케스트레이션이 시작됨.
  - 에이전트: `explore`가 코드베이스를 스캔, `planner`가 작업 그래프를 생성, 복잡한 작업이면 `analyst`/`architect`를 선택적으로 추가.
  - 종료: 분해가 완료되고 실행 가능한 작업 그래프가 준비됨.
- **team-prd**
  - 진입: 범위가 모호하거나 인수 기준이 없음.
  - 에이전트: `analyst`가 요구사항을 추출, 선택적으로 `critic`.
  - 종료: 인수 기준과 경계가 명시됨.
- **team-exec**
  - 진입: 작업 목록 할당과 워커 스폰이 완료됨.
  - 에이전트: 하위 작업별로 적절한 전문가 유형으로 워커를 스폰 (라우팅 표 참고).
  - 종료: 이번 패스의 실행 작업이 종료 상태에 도달함.
- **team-verify**
  - 진입: 실행 패스가 끝남.
  - 에이전트: `verifier` + 작업에 맞는 리뷰어 (라우팅 표 참고).
  - 종료(통과): 검증 게이트를 통과했고 필요한 후속 작업이 없음.
  - 종료(실패): fix 작업이 생성되고 제어가 `team-fix`로 이동.
- **team-fix**
  - 진입: 검증에서 결함/회귀/미완료 기준이 발견됨.
  - 에이전트: 결함 유형에 따라 `executor`/`debugger`.
  - 종료: 수정이 완료되고 흐름이 `team-exec`로 돌아간 뒤 `team-verify`로 이어짐.

### 검증/수정 루프와 중단 조건

`team-exec -> team-verify -> team-fix`를 다음 중 하나가 될 때까지 계속한다.

1. 검증이 통과하고 필요한 fix 작업이 남아 있지 않음, 또는
2. 증거와 함께 명시적인 종료 상태(차단/실패)에 도달함.

`team-fix`는 최대 시도 횟수로 제한된다. fix 시도가 설정된 한도를 넘으면 종료 상태 `failed`로 전환한다 (무한 루프 금지).

**실행 closeout (두 종료 결과 모두).** `/oh-my-claudecode:cancel` 상태 정리 전에, `.omc/notepads/team/problems.md`에 사실 위주의 줄을 최대 3줄 추가한다(차단 요인은 `.omc/notepads/team/issues.md`에도 추가). 무엇이 깨졌는지(수정 라운드를 견딘 결함, 3회 연속 중단)와 무엇이 발목을 잡았는지(워커 환경 마찰, 누락된 검사, 접근 불가한 정보)를 기록한다. 기존 항목은 보존하며, 추가만 하고 공유 파일을 덮어쓰지 않는다. 관찰한 내용이 없으면 아무것도 추가하지 않는다. 비어 있는 closeout도 유효하므로 "교훈 없음"이라고 쓰지 않는다. 관찰만 기록하며, 이를 저장소 문서에 반영하는 것은 사용자 승인 하에 `refit`이 담당한다. 종료 상태가 `failed`이면 실패 시그니처·증거 포인터·재개 경로를 담은 인시던트 작업 항목 초안도 작성해 로컬 `.omc/notepads/team/issues.md`에 추가한다. 트래커에 게시하는 것은 사용자 또는 모드 호출이 그 외부 동작을 명시적으로 허용한 경우에만 한다.

### 스테이지 핸드오프 규약

스테이지 간 전환 시, 내린 결정·기각한 대안·식별한 위험 같은 중요한 맥락은 lead의 대화 히스토리에만 존재한다. lead의 컨텍스트가 압축되거나 에이전트가 재시작되면 이 지식이 사라진다.

**완료되는 각 스테이지는 전환 전에 반드시 핸드오프 문서를 작성해야 한다.**

lead는 핸드오프를 `.omc/handoffs/<stage-name>.md`에 쓴다.

#### 핸드오프 형식

```markdown
## Handoff: <current-stage> → <next-stage>

- **Decided**: [이 스테이지에서 내린 핵심 결정]
- **Rejected**: [검토했다가 기각한 대안과 그 이유]
- **Risks**: [다음 스테이지를 위한 식별된 위험]
- **Files**: [생성 또는 수정한 핵심 파일]
- **Remaining**: [다음 스테이지가 처리해야 할 남은 항목]
```

#### 핸드오프 규칙

1. **lead는 다음 스테이지의 에이전트를 스폰하기 전에 이전 핸드오프를 읽는다.** 핸드오프 내용은 다음 스테이지 에이전트의 스폰 프롬프트에 포함되어, 에이전트가 전체 맥락을 가지고 시작하게 한다.
2. **핸드오프는 누적된다.** verify 스테이지는 이전의 모든 핸드오프(plan → prd → exec)를 읽어 전체 결정 이력을 볼 수 있다.
3. **팀이 취소되어도 핸드오프는 `.omc/handoffs/`에 남아** 세션 재개에 사용된다. 네이티브 Claude Code 팀 정리로 삭제되지 않는다. Claude Code 2.1.178+에는 `TeamDelete` 호출이 없다.
4. **핸드오프는 가볍다.** 최대 10-20줄. 결정과 근거만 담고, 전체 명세는 담지 않는다(명세는 DESIGN.md 같은 산출 파일에 둔다).

#### 예시

```markdown
## Handoff: team-plan → team-exec

- **Decided**: 3개 서비스(auth, api, worker)의 마이크로서비스 아키텍처. 영속성은 PostgreSQL. 인증 토큰은 JWT.
- **Rejected**: 모놀리스(확장성 우려), MongoDB(팀 전문성이 SQL), 세션 쿠키(API 우선 설계).
- **Risks**: worker 서비스가 작업 큐용 Redis를 필요로 하는데 아직 프로비저닝되지 않음. auth 서비스의 초기 설계에는 rate limiting이 없음.
- **Files**: DESIGN.md, TEST_STRATEGY.md
- **Remaining**: DB 마이그레이션 스크립트, CI/CD 파이프라인 설정, Redis 프로비저닝.
```

### 재개 및 취소 의미론

- **재개(Resume):** 단계별 상태와 실시간 작업 상태를 사용해 마지막 비종료 스테이지부터 다시 시작한다. 스테이지 전환 맥락을 복구하려면 `.omc/handoffs/`를 읽는다.
- **취소(Cancel):** `skills/cancel/SKILL.md`의 정식 흐름을 사용한다. 그 플래그, 범위, 상태 정리 규칙을 여기에 중복해서 쓰지 않는다. `.omc/handoffs/`의 핸드오프 파일은 재개를 위해 보존된다.
- 종료 상태는 `complete`, `failed`, `cancelled`이다.

## Windows psmux tmux 호환 게이트

네이티브 Windows에서는 실제 tmux 호환 바이너리를 확인하기 전에는 `/team`이 WSL을 요구한다거나 tmux를 쓸 수 없다고 사용자에게 **말하지 않는다**. 네이티브 [psmux](https://github.com/psmux/psmux)는 `tmux` 호환 명령(보통 `tmux` / `tmux.cmd`)을 설치하며 지원되는 Team 멀티플렉서이다.

Windows에서 차단하거나 대체 경로로 넘어가기 전에:

1. `tmux -V`(또는 `where tmux` 다음 `tmux -V` 같은 플랫폼별 대응 명령)를 확인한다.
2. psmux 기반 `tmux -V`가 성공하면 tmux를 사용할 수 있는 것으로 본다.
3. psmux/tmux가 있으면 일반 Team 흐름을 계속한다. WSL 필요 안내를 내보내지 않는다.
4. tmux 호환 바이너리가 없을 때만, 네이티브 Windows 지원을 위해 psmux를 설치하거나 대안으로 WSL2를 사용하라고 안내한다.

## 워크플로

### 재개 확인 (초기화 전)

Team 상태를 건드리기 전에 호출 컨텍스트에서 현재 세션 식별자를 확인한다. CLI 컨텍스트에서는 `OMC_SESSION_ID`가 권위 있고, 훅 컨텍스트에서는 페이로드의 `session_id`가 권위 있다. 식별자가 있으면 명시적이고 일관되게 전달한다.

```
state_read(mode="team", session_id="<current_session_id>")
```

`session_id` 없는 `state_read`는 legacy/집계 상태를 읽으며 다른 세션이 포함될 수 있다. 범위 지정 없는 집계 응답에서 Team을 선택하거나 재개하지 않는다. 식별자가 없으면 명시적으로 식별된 legacy 상태만 사용하며, 집계 응답의 세션 항목으로부터 소유권을 추정하지 않는다.

slug를 만들거나, 작업을 분해하거나, 상태를 쓰거나 초기화하기 전에 기존 세션 상태를 읽는다. `active=true`이고 `current_phase`가 비종료 상태이면, 해당 Team의 기존 핸드오프와 작업 목록 상태를 사용해 기록된 스테이지를 재개한다. `team_name`, `current_phase`, `fix_loop_count`, `max_fix_loops`, `stage_history`와, 워커/작업/실행 시도 기록을 포함한 기존의 모든 Team 상태 필드를 보존한다. 이후의 모든 `state_write`와 `state_clear`에 같은 `session_id`를 사용하고, 기존 상태 락 아래에서 부분 업데이트만 적용한다. 아래의 새 팀 초기화를 실행하지 않고, 대체 slug를 만들지 않으며, 중복 작업을 만들거나 중복 워커를 스폰하거나 실행 시도를 반복하지 않는다.

상태가 잘못되었거나, 읽을 수 없거나, 손상된 경우에는 진단 결과를 보고하고 원본 바이트를 보존한다. 교체하거나, 지우거나, 초기화하거나, 새 실행으로 취급하지 않는다.

아래 초기화 단계는 활성·범위 지정 상태가 없는 새 실행에만 적용된다.

### Phase 1: 입력 파싱

- **N**(에이전트 수) 추출, 1-20 검증
- **agent-type** 추출, 알려진 OMC 서브에이전트에 대응하는지 검증
- **task** 설명 추출

### Phase 2: 분석 및 분해

`explore` 또는 `architect`(MCP 또는 에이전트 경유)를 사용해 코드베이스를 분석하고 작업을 N개의 하위 작업으로 나눈다.

- 각 하위 작업은 충돌을 피하도록 **파일 단위** 또는 **모듈 단위**여야 한다.
- 하위 작업은 서로 독립적이거나 명확한 의존 순서를 가져야 한다.
- 각 하위 작업에는 간결한 `subject`와 상세한 `description`이 필요하다.
- 하위 작업 간 의존성을 식별한다 (예: "공유 타입을 먼저 고쳐야 소비자 코드를 고칠 수 있음").

### Phase 3: Team 상태 초기화

세션의 암묵적 Claude Code 팀을 사용한다. `TeamCreate`를 호출하지 **않는다**. Claude Code 2.1.178+가 해당 도구를 제거했으며, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`이 켜져 있으면 세션에 암묵적 팀 하나가 자동으로 부여된다.

OMC 상태, 프롬프트 레이블, 핸드오프, 사람이 읽는 보고에만 쓸 `fix-ts-errors` 같은 slug를 만든다. 네이티브 Claude Code는 `team_name`을 legacy 메타데이터로 받을 수 있지만 라우팅에서는 무시된다.

올바른 세션 범위 영속성을 위해 `state_write` MCP 도구로 OMC 상태를 기록한다.

재개 확인에서 확인한 동일한 `session_id`를 이 호출과 이후 모든 Team 상태 호출에 사용한다. 식별자가 없으면 위에서 설명한 명시적으로 식별된 legacy 상태만 사용한다.

```
state_write(mode="team", session_id="<current_session_id>", active=true, current_phase="team-plan", state={
  "team_name": "fix-ts-errors",
  "agent_count": 3,
  "agent_types": "executor",
  "task": "fix all TypeScript errors",
  "fix_loop_count": 0,
  "max_fix_loops": 3,
  "linked_ralph": false,
  "stage_history": "team-plan"
})
```

> **참고:** MCP `state_write` 도구는 모든 값을 문자열로 전달한다. 소비자는 상태를 읽을 때 `agent_count`, `fix_loop_count`, `max_fix_loops`를 숫자로, `linked_ralph`를 불리언으로 변환해야 한다.

**상태 스키마 필드:**

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `active` | boolean | team 모드가 활성인지 여부 |
| `current_phase` | string | 현재 파이프라인 스테이지: `team-plan`, `team-prd`, `team-exec`, `team-verify`, `team-fix` |
| `team_name` | string | 상태·핸드오프·보고용 OMC slug. 네이티브 Claude Code 라우팅에서는 무시됨 |
| `agent_count` | number | 워커 에이전트 수 |
| `agent_types` | string | team-exec에서 사용한 에이전트 유형(쉼표 구분) |
| `task` | string | 원래 작업 설명 |
| `fix_loop_count` | number | 현재 수정 반복 횟수 |
| `max_fix_loops` | number | 실패 처리 전 최대 수정 반복 횟수 (기본값: 3) |
| `linked_ralph` | boolean | team이 ralph 지속성 루프에 연결되어 있는지 여부 |
| `stage_history` | string | 타임스탬프가 포함된 스테이지 전환 목록(쉼표 구분) |

**모든 스테이지 전환마다 상태를 갱신한다:**

```
state_write(mode="team", session_id="<current_session_id>", current_phase="team-exec", state={
  "stage_history": "team-plan:2026-02-07T12:00:00Z,team-prd:2026-02-07T12:01:00Z,team-exec:2026-02-07T12:02:00Z"
})
```

### Phase 4: 작업 생성

TodoWrite 또는 활성 작업 목록 인터페이스를 사용해 각 하위 작업에 대한 작업 목록 항목을 만든다. 작업 목록 도구는 추적용일 뿐이며 네이티브 팀을 만들지 않는다.

```json
// 하위 작업 1의 작업 목록 항목
{
  "subject": "Fix type errors in src/auth/",
  "description": "Fix all TypeScript errors in src/auth/login.ts, src/auth/session.ts, and src/auth/types.ts. Run tsc --noEmit to verify.",
  "activeForm": "Fixing auth type errors"
}
```

**응답은 작업 파일(예: `1.json`)을 저장한다:**

```json
{
  "id": "1",
  "subject": "Fix type errors in src/auth/",
  "description": "Fix all TypeScript errors in src/auth/login.ts...",
  "activeForm": "Fixing auth type errors",
  "owner": "",
  "status": "pending",
  "blocks": [],
  "blockedBy": []
}
```

의존성이 있는 작업은 생성 후 활성 작업 목록 항목을 갱신한다.

```json
// Task #3은 task #1에 의존 (공유 타입을 먼저 고쳐야 함)
{
  "taskId": "3",
  "addBlockedBy": ["1"]
}
```

경합 상태를 피하기 위해(원자적 선점이 없음) **lead가 소유자를 사전 할당한다**.

```json
// Task #1을 worker-1에 할당
{
  "taskId": "1",
  "owner": "worker-1"
}
```

### Phase 5: 팀원 스폰

Agent/Task 도구에 서로 다른 `name` 값을 지정해 N명의 팀원을 직접 스폰한다. 각 팀원에게는 팀 워커 프리앰블(아래 참고)과 자신의 구체적 할당을 준다. `TeamCreate`를 호출하지 말고 `team_name`에 의존하지도 않는다. Claude Code 2.1.178+는 네이티브 라우팅에서 이를 무시한다.

```json
{
  "subagent_type": "oh-my-claudecode:executor",
  "name": "worker-1",
  "prompt": "<worker-preamble + assigned tasks>"
}
```

**응답:**

```json
{
  "agent_id": "worker-1",
  "name": "worker-1"
}
```

**부수 효과:**

- 팀원이 세션의 암묵적 Claude Code 팀에 스폰된다.
- 에이전트 수명주기를 추적하는 **내부 작업(internal task)** 이 자동 생성된다 (`metadata._internal: true`).
- 내부 작업은 작업 목록 출력에 나타날 수 있다. 실제 작업을 셀 때는 걸러낸다.

**중요:** 모든 팀원을 병렬로 스폰한다(백그라운드 에이전트이다). 하나가 끝나길 기다렸다가 다음을 스폰하지 않는다.

### Phase 6: 모니터링

lead 오케스트레이터는 두 채널로 진행 상황을 모니터링한다.

1. **수신 메시지** -- 팀원은 작업을 완료하거나 도움이 필요하면 `team-lead`에게 메시지를 보낸다. 이 메시지는 활성 팀/대화 인터페이스로 도착한다.

2. **작업 목록 폴링/점검** -- TodoWrite 또는 활성 작업 목록 인터페이스에서 전체 진행 상황을 주기적으로 확인한다.
   ```
   #1 [completed] Fix type errors in src/auth/ (worker-1)
   #3 [in_progress] Fix type errors in src/api/ (worker-2)
   #5 [pending] Fix type errors in src/utils/ (worker-3)
   ```
   형식: `#ID [status] subject (owner)`

**lead가 취할 수 있는 조율 동작:**

- **팀원 차단 해소:** 활성 팀 인터페이스로 안내나 부족한 맥락을 메시지로 보낸다.
- **작업 재할당:** 팀원이 일찍 끝나면 작업 목록 항목을 갱신해 대기 중인 작업을 할당하고 활성 팀 인터페이스로 알린다.
- **실패 처리:** 팀원이 실패를 보고하면 작업을 재할당하거나 대체 팀원을 스폰한다.

#### 작업 워치독 정책

멈췄거나 실패한 팀원을 모니터링한다.

- **최대 in-progress 경과 시간**: 작업이 메시지 없이 5분 넘게 `in_progress` 상태면 상태 확인 메시지를 보낸다.
- **죽은 워커 의심**: 메시지가 없고 작업이 10분 이상 멈춰 있으면 → 다른 워커에게 작업을 재할당한다.
- **재할당 임계치**: 워커가 2개 이상의 작업에 실패하면 그 워커에게 새 작업 할당을 중단한다.

### Phase 6.5: 스테이지 전환 (상태 영속화)

모든 스테이지 전환 시 OMC 상태를 갱신한다.

```
// 계획 후 team-exec 진입
state_write(mode="team", session_id="<current_session_id>", current_phase="team-exec", state={
  "stage_history": "team-plan:T1,team-prd:T2,team-exec:T3"
})

// 실행 후 team-verify 진입
state_write(mode="team", session_id="<current_session_id>", current_phase="team-verify")

// verify 실패 후 team-fix 진입
state_write(mode="team", session_id="<current_session_id>", current_phase="team-fix", state={
  "fix_loop_count": 1
})
```

이렇게 하면 다음이 가능하다.

- **재개**: lead가 크래시해도 `state_read(mode="team", session_id="<current_session_id>")`로 마지막 스테이지와 팀 이름을 알아내 복구할 수 있다.
- **취소**: cancel 스킬이 `current_phase`를 읽어 필요한 정리를 파악한다.
- **Ralph 연동**: Ralph가 team 상태를 읽어 파이프라인이 완료되었는지 실패했는지 알 수 있다.

### Phase 7: 완료

모든 실제(내부가 아닌) 작업이 완료되거나 실패하면:

1. **결과 검증** -- TodoWrite 또는 활성 작업 목록 인터페이스에서 모든 실제(내부가 아닌) 작업이 `completed`로 표시되었는지 확인한다.
2. **팀원 종료** -- 활성 팀 인터페이스를 통해 각 활성 팀원에게 `shutdown_request`를 보낸다.
   ```json
   {
     "type": "shutdown_request",
     "recipient": "worker-1",
     "content": "All work complete, shutting down team"
   }
   ```
3. **응답 대기** -- 각 팀원이 `shutdown_response(approve: true)`로 응답하고 종료한다.
4. **정리** -- 정상 종료 패스 이후, 선택된 세션과 연결된 Ralph에 대해 `skills/cancel/SKILL.md`의 Team 흐름을 따른다. 네이티브 Claude Code 2.1.178+에는 `TeamDelete`가 없다.
5. **요약 보고** -- 결과를 사용자에게 제시한다.

## 에이전트 프리앰블

팀원을 스폰할 때 작업 프로토콜을 확립하기 위해 이 프리앰블을 프롬프트에 포함한다. 팀원별 구체적인 작업 할당에 맞게 조정한다.

```
You are a TEAM WORKER in OMC team "{team_name}". Your name is "{worker_name}".
You report to the team lead ("team-lead").
You are not the leader and must not perform leader orchestration actions.

== WORK PROTOCOL ==

1. CLAIM: Check TodoWrite or the active task-list surface for tasks assigned to you (owner = "{worker_name}").
   Pick the first task with status "pending" that is assigned to you.
   Mark it `in_progress` using the active task-list surface:
   {"taskId": "ID", "status": "in_progress", "owner": "{worker_name}"}

2. WORK: Execute the task using your tools (Read, Write, Edit, Bash).
   Do NOT spawn sub-agents. Do NOT delegate. Work directly.

3. COMPLETE: When done, mark the task completed:
   {"taskId": "ID", "status": "completed"}

4. REPORT: Notify the lead through the active team/conversation surface:
   {"type": "message", "recipient": "team-lead", "content": "Completed task #ID: <summary of what was done>", "summary": "Task #ID complete"}

5. NEXT: Check TodoWrite or the active task-list surface for more assigned tasks. If you have more pending tasks, go to step 1.
   If no more tasks are assigned to you, notify the lead through the active team/conversation surface:
   {"type": "message", "recipient": "team-lead", "content": "All assigned tasks complete. Standing by.", "summary": "All tasks done, standing by"}

6. SHUTDOWN: When you receive a shutdown_request, respond with:
   {"type": "shutdown_response", "request_id": "<from the request>", "approve": true}

== BLOCKED TASKS ==
If a task has blockedBy dependencies, skip it until those tasks are completed.
Check TodoWrite or the active task-list surface periodically to see if blockers have been resolved.

== ERRORS ==
If you cannot complete a task, report the failure to the lead:
{"type": "message", "recipient": "team-lead", "content": "FAILED task #ID: <reason>", "summary": "Task #ID failed"}
Do NOT mark the task as completed. Leave it in_progress so the lead can reassign.

== RULES ==
- NEVER spawn sub-agents or use the Task tool
- NEVER run tmux pane/session orchestration commands (for example `tmux split-window`, `tmux new-session`)
- NEVER run team spawning/orchestration skills or commands (for example `$team`, `$autopilot`, `$ralph`, `omc team ...`, `omx team ...`)
- ALWAYS use absolute file paths
- ALWAYS report progress to "team-lead" through the active team/conversation surface
- Use direct team/conversation messages with type "message" only -- never "broadcast"
```

> 위 프리앰블은 팀원에게 그대로 전달되는 프롬프트이므로 원문(영어)을 유지했다. 요지는 다음과 같다.
> 1. **CLAIM**: 자신에게 할당된(owner) `pending` 작업 중 첫 번째를 `in_progress`로 표시.
> 2. **WORK**: 도구로 직접 작업. 서브에이전트 스폰·위임 금지.
> 3. **COMPLETE**: 끝나면 `completed`로 표시.
> 4. **REPORT**: `team-lead`에게 완료 메시지 전송.
> 5. **NEXT**: 더 할당된 작업이 있으면 1로, 없으면 "대기 중"이라고 lead에게 알림.
> 6. **SHUTDOWN**: `shutdown_request`를 받으면 요청의 `request_id`를 담아 `approve: true`로 응답.
> - 차단된 작업(`blockedBy`)은 해소될 때까지 건너뜀. 실패하면 `FAILED`를 보고하고 작업을 `in_progress`로 남겨 lead가 재할당하게 함.
> - 규칙: 서브에이전트/Task 도구 금지, tmux 오케스트레이션 명령 금지, 팀 스폰/오케스트레이션 스킬·명령 금지, 항상 절대 경로 사용, 항상 `team-lead`에게 보고, `message`만 사용하고 `broadcast` 금지.

### 에이전트 유형별 프롬프트 주입 (워커별 부록)

팀원 프롬프트를 구성할 때 워커 유형에 따라 짧은 부록을 덧붙인다.

- `claude_worker`: 엄격한 TodoWrite/작업 목록 갱신, 활성 팀/대화 메시지, 오케스트레이션 명령 금지를 강조.
- `codex_worker`: CLI API 수명주기(`omc team api ... --json`)와 stderr를 포함한 명시적 실패 ACK를 강조.
- `gemini_worker`: 한정된 파일 소유권과 하위 단계 완료마다의 마일스톤 ACK를 강조.
- `antigravity_worker`: `gemini_worker`와 같은 기대치. 한정된 파일 소유권과 하위 단계 완료마다의 마일스톤 ACK를 강조.

이 부록은 핵심 규칙을 보존해야 한다: **워커 = 실행자일 뿐, 절대 leader/오케스트레이터가 아니다.**

## 커뮤니케이션 패턴

### 팀원 → Lead (작업 완료 보고)

```json
{
  "type": "message",
  "recipient": "team-lead",
  "content": "Completed task #1: Fixed 3 type errors in src/auth/login.ts and 2 in src/auth/session.ts. All files pass tsc --noEmit.",
  "summary": "Task #1 complete"
}
```

### Lead → 팀원 (재할당 또는 안내)

```json
{
  "type": "message",
  "recipient": "worker-2",
  "content": "Task #3 is now unblocked. Also pick up task #5 which was originally assigned to worker-1.",
  "summary": "New task assignment"
}
```

### 브로드캐스트 (아껴서 사용 -- N개의 개별 메시지가 전송됨)

```json
{
  "type": "broadcast",
  "content": "STOP: shared types in src/types/index.ts have changed. Pull latest before continuing.",
  "summary": "Shared types changed"
}
```

### 종료 프로토콜 (BLOCKING)

**정상 경로에서 매우 중요:** 이 단계들을 순서대로 실행한다. 종료가 확인되거나 타임아웃되기 전에는 OMC Team 상태를 절대 지우지 않는다. `--force`와 `--force --all` 호출은 대기를 건너뛰는 명시적 경로이다. 이 경로도 정식의 보호된 세션 범위 clear를 사용하고, 락/소유권을 존중하며, 실패를 보고한다. `--force` 단독으로는 범위가 절대 넓어지지 않는다.

**Step 1: 완료 확인**

```
TodoWrite 또는 활성 작업 목록 인터페이스로 확인 — 모든 실제(내부가 아닌) 작업이 completed 또는 failed인지.
```

**Step 2: 각 팀원에게 종료 요청**

**Lead가 보내는 메시지:**

```json
{
  "type": "shutdown_request",
  "recipient": "worker-1",
  "content": "All work complete, shutting down team"
}
```

**Step 3: 응답 대기 (BLOCKING)**

- 정식 cancel 흐름을 따른다: 팀원당 최대 15초 동안 `shutdown_response`를 기다린 뒤, 5초 더 조정(reconcile)한다.
- 어떤 팀원이 확인했고 어떤 팀원이 타임아웃되었는지 추적한다.
- 해당 대기 후에도 팀원이 응답하지 않으면: 경고를 기록하고 응답 없음(unresponsive)으로 표시한다.

**팀원이 받아서 응답:**

```json
{
  "type": "shutdown_response",
  "request_id": "shutdown-1770428632375@worker-1",
  "approve": true
}
```

승인 후 팀원은 종료되거나 새 작업 수락을 중단한다. Claude Code 2.1.178+는 팀별 config 멤버십이나 TeamDelete 정리를 노출하지 않으므로, 승인 응답은 OMC 상태/보고에서 추적한다.

**Step 4: 보호된 정리 완료**

정상 종료 패스 이후 `skills/cancel/SKILL.md`의 Team 취소 흐름을 따른다. 이 흐름이 선택된 세션을 지우고 연결된 Ralph를 처리한다. Claude Code 2.1.178+에는 `TeamDelete`가 없다.

**Step 5: OMC tmux/CLI 워커 전용 고아 프로세스 스캔**

legacy OMC tmux/CLI 워커 실행(`omc team` / `/omc-teams`)에서는 정리 후에도 살아남은 워커 프로세스가 있는지 확인한다.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/cleanup-orphans.mjs" --team-name fix-ts-errors
```

팀 이름과 일치하는 OMC 워커 프로세스를 스캔하고 오래된 고아를 종료한다 (SIGTERM → 5초 대기 → SIGKILL). 점검용 `--dry-run`을 지원한다.

정상 clear를 하려면 모든 팀원이 확인(`approve: true`인 `shutdown_response`)하거나 타임아웃되어야 한다. `request_id`는 요청에서 가져오며, 팀원은 그것을 그대로 반환해야 하고 절대 지어내서는 안 된다.

## CLI 워커 (Codex와 Gemini)

team 스킬은 Claude 에이전트 팀원과 외부 CLI 워커(Codex CLI, Gemini CLI)를 결합한 **하이브리드 실행**을 지원한다. 두 유형 모두 코드를 변경할 수 있으며 능력과 비용이 다르다. 이들은 MCP 서버가 아니라 독립 실행형 CLI 도구이다.

### 실행 모드

작업은 분해 중에 실행 모드로 태그된다.

| 실행 모드 | 제공자 | 능력 |
| --- | --- | --- |
| `claude_worker` | Claude 에이전트 | Claude Code 도구 전체 접근(Read/Write/Edit/Bash/Task). Claude의 추론 + 반복적 도구 사용이 필요한 작업에 최적. |
| `codex_worker` | Codex CLI (tmux 페인) | working_directory 안에서 전체 파일시스템 접근. tmux 페인에서 자율 실행. 코드 리뷰, 보안 분석, 리팩터링, 아키텍처에 최적. `npm install -g @openai/codex` 필요. |
| `gemini_worker` | Gemini CLI (tmux 페인) | working_directory 안에서 전체 파일시스템 접근. tmux 페인에서 자율 실행. UI/디자인 작업, 문서화, 대용량 컨텍스트 작업에 최적. `npm install -g @google/gemini-cli` 필요(엔터프라이즈/API 키 티어). |
| `antigravity_worker` | Antigravity CLI (tmux 페인) | working_directory 안에서 전체 파일시스템 접근. tmux 페인에서 자율 실행. gemini_worker와 같은 강점. Gemini CLI의 Google 후속 제품. [공식 안내](https://antigravity.google)에 따라 설치(`agy` 바이너리). |

### CLI 워커의 동작 방식

tmux CLI 워커는 파일시스템 접근이 가능한 전용 tmux 페인에서 실행된다. 이들은 단순한 분석가가 아니라 **자율 실행자**이다.

1. lead가 작업 지시를 프롬프트 파일에 쓴다.
2. lead가 `working_directory`를 프로젝트 루트로 설정해 tmux CLI 워커를 스폰한다.
3. 워커가 파일을 읽고, 변경하고, 명령을 실행한다 -- 모두 작업 디렉터리 안에서.
4. 결과/요약이 출력 파일에 기록된다.
5. lead가 출력을 읽고, 작업을 완료로 표시하며, 결과를 의존 작업에 넘긴다.

**Claude 팀원과의 핵심 차이:**

- CLI 워커는 Claude Code의 도구 시스템이 아니라 tmux로 동작한다.
- Claude Code의 네이티브 작업 목록이나 팀 메시징 인터페이스를 사용할 수 없다.
- Codex, Gemini, Grok, Antigravity, Claude CLI 워커는 할당된 작업의 종료 상태를 기록하고 종료한다.
- Cursor 워커는 대화형 세션에 머물며 메일박스 메시지를 기다리고, 명시적 종료에서만 종료한다. Cursor 리뷰어의 작업 전환은 leader가 담당한다.
- lead가 이들의 수명주기(스폰, 모니터링, 결과 수집)를 관리한다.

### Cursor/Codex 시작 증거 타임아웃

v2 런타임은 현재 시도(current-attempt)의 작업/상태 증거를 최대 30초 기다린다. 증거가 없으면 읽기 전용 페인 활동 프로브가 바쁜(busy) Cursor/Codex 워커에게 추가로 30초의 증거 대기 창을 줄 수 있다. 유휴, 죽은, 확인되지 않은 페인은 일반적인 1초짜리 최종 재확인만 받는다. 트리거는 재전송되지 않으며, 페인 활동만으로는 시작 성공으로 인정되지 않는다. 현재 시도 증거가 없는 바쁜 페인은 `worker_startup_evidence_missing_pane_busy`로 실패하고, 그 외의 누락은 모두 `worker_startup_evidence_missing`으로 남는다. 시작 실패 시 소유 페인을 한 번 읽고 줄바꿈된 tmux 줄을 이어 붙여, 캡처에 있으면 claim-task 에러 줄 하나를 보존한다. 그 줄은 시작 증거가 아니며, 다른 누락 상황에서는 페인을 읽지 않는다.

따라서 기본 busy 워커 증거 예산은 60초에 프로브 및 증거 읽기 오버헤드를 더한 값이다(대략 1분이며, 61초라는 엄격한 벽시계 한계는 아니다). 페인 생성, 준비, 정리는 별도의 시간이 추가된다. 시작은 직렬이므로 이 대기들은 워커마다 누적될 수 있다. `OMC_TEAM_ENGAGED_PANE_RECHECK_MS`는 추가 창을 밀리초 단위로 덮어쓴다. 양수 값은 120000으로 상한이 걸리고, 잘못되었거나 양수가 아닌 값은 기본값을 유지한다.

### 어디로 라우팅할까

| 작업 유형 | 최적 경로 | 이유 |
| --- | --- | --- |
| 반복적 다단계 작업 | Claude 팀원 | 도구 매개 반복 + 팀 커뮤니케이션이 필요 |
| 코드 리뷰 / 보안 감사 | CLI 워커 또는 전문가 에이전트 | 자율 실행, 구조화된 분석에 강함 |
| 아키텍처 분석 / 계획 | architect Claude 에이전트 | 코드베이스 접근을 갖춘 강한 분석적 추론 |
| 리팩터링 (범위가 명확한 경우) | CLI 워커 또는 executor 에이전트 | 자율 실행, 구조화된 변환에 강함 |
| UI/프론트엔드 구현 | designer Claude 에이전트 | 디자인 전문성, 프레임워크 관용구 |
| 대규모 문서화 | writer Claude 에이전트 | 글쓰기 전문성 + 일관성을 위한 대용량 컨텍스트 |
| 빌드/테스트 반복 루프 | Claude 팀원 | Bash 도구 + 반복적 수정 사이클이 필요 |
| 팀 조율이 필요한 작업 | Claude 팀원 | 팀/대화 상태 갱신이 필요 |

### 예시: CLI 워커를 포함한 하이브리드 팀

```
/team 3:executor "refactor auth module with security review"

작업 분해:
#1 [codex_worker] 현재 auth 코드 보안 리뷰 -> 출력은 .omc/research/auth-security.md
#2 [codex_worker] auth/login.ts와 auth/session.ts 리팩터링 (#1의 결과 사용)
#3 [claude_worker:designer] auth UI 컴포넌트 재설계 (로그인 폼, 세션 표시기)
#4 [claude_worker] auth 테스트 갱신 + 통합 문제 수정
#5 [gemini_worker] 모든 변경에 대한 최종 코드 리뷰
```

lead는 #1(Codex 보안 분석)을 실행하고, 이어서 #2와 #3을 병렬로(Codex가 백엔드를 리팩터링하고 designer 에이전트가 프론트엔드를 재설계), 그다음 #4(Claude 팀원이 테스트 반복 처리), 마지막으로 #5(Gemini 최종 리뷰)를 실행한다.

### 사전 분석 (선택)

크고 모호한 작업은 팀 생성 전에 분석을 실행한다.

1. 작업 설명 + 코드베이스 맥락과 함께 `Task(subagent_type="oh-my-claudecode:planner", ...)`를 스폰한다.
2. 분석 결과를 사용해 더 나은 작업 분해를 만든다.
3. 풍부해진 맥락으로 팀과 작업을 만든다.

작업 범위가 불명확하고 특정 분해에 확정하기 전에 외부 추론의 도움을 받을 때 특히 유용하다.

## 모니터 강화: Outbox 자동 수집

lead는 outbox 리더 유틸리티를 사용해 CLI 워커의 outbox 메시지를 선제적으로 수집할 수 있어, 네이티브 팀/대화 전달과 함께 이벤트 기반 모니터링이 가능하다.

### Outbox 리더 함수

**`readNewOutboxMessages(teamName, workerName)`** -- 바이트 오프셋 커서를 사용해 단일 워커의 새 outbox 메시지를 읽는다. 호출할 때마다 커서가 전진하므로, 이후 호출은 마지막 읽기 이후에 기록된 메시지만 반환한다. `readNewInboxMessages()`의 inbox 커서 패턴과 동일하다.

**`readAllTeamOutboxMessages(teamName)`** -- 팀의 모든 워커로부터 새 outbox 메시지를 읽는다. `{ workerName, messages }` 항목 배열을 반환하며 새 메시지가 없는 워커는 건너뛴다. 모니터 루프의 일괄 폴링에 유용하다.

**`resetOutboxCursor(teamName, workerName)`** -- 워커의 outbox 커서를 바이트 0으로 되돌린다. lead 재시작 후 과거 메시지를 다시 읽거나 디버깅할 때 유용하다.

### 모니터 단계에서 `getTeamStatus()` 사용

`getTeamStatus(teamName, workingDirectory, heartbeatMaxAgeMs?)` 함수는 다음을 결합한 통합 스냅샷을 제공한다.

- **워커 등록** -- 어떤 MCP 워커가 등록되어 있는지(섀도 레지스트리 / config.json 기준)
- **하트비트 신선도** -- 하트비트 경과 시간 기준으로 각 워커가 살아 있는지
- **작업 진행** -- 워커별/팀 전체 작업 수(pending, in_progress, completed)
- **현재 작업** -- 각 워커가 활발히 실행 중인 작업
- **최근 outbox 메시지** -- 마지막 상태 확인 이후의 새 메시지

모니터 루프에서의 사용 예:

```typescript
const status = getTeamStatus("fix-ts-errors", workingDirectory);

for (const worker of status.workers) {
  if (!worker.isAlive) {
    // 워커가 죽음 -- 진행 중이던 작업을 재할당
  }
  for (const msg of worker.recentMessages) {
    if (msg.type === "task_complete") {
      // 작업을 완료로 표시하고 의존 작업의 차단을 해제
    } else if (msg.type === "task_failed") {
      // 실패 처리, 재시도 또는 재할당 가능
    } else if (msg.type === "error") {
      // 에러를 기록하고 워커에 개입이 필요한지 확인
    }
  }
}

if (status.taskSummary.pending === 0 && status.taskSummary.inProgress === 0) {
  // 모든 작업 완료 -- 종료로 진행
}
```

### Outbox 메시지 기반 이벤트 동작

| 메시지 유형 | 동작 |
| --- | --- |
| `task_complete` | 작업을 완료로 표시하고, 차단된 작업이 풀렸는지 확인하며, 의존 워커에게 알림 |
| `task_failed` | 실패 사이드카를 증가시키고 재시도·재할당·건너뛰기 중 결정 |
| `idle` | 워커에 할당된 작업이 없음 -- 대기 작업을 할당하거나 종료를 시작 |
| `error` | 에러를 기록하고 하트비트의 `consecutiveErrors`가 격리(quarantine) 임계치에 도달했는지 확인 |
| `shutdown_ack` | 워커가 종료를 승인함 -- 팀에서 안전하게 제거 가능 |
| `heartbeat` | 활성 추적을 갱신 (하트비트 파일과 중복이지만 지연 모니터링에 유용) |

이 방식은 Claude Code의 팀 메시징 도구를 쓸 수 없는 MCP 워커를 위한 풀(pull) 기반 메커니즘을 제공해 네이티브 팀/대화 메시징을 보완한다.

## 에러 처리

### 팀원이 작업에 실패한 경우

1. 팀원이 활성 팀/대화 인터페이스로 lead에게 실패를 보고한다.
2. lead가 재시도(같은 또는 다른 워커에게 같은 작업 재할당)할지 건너뛸지 결정한다.
3. 재할당하려면: 활성 작업 목록 항목에 새 소유자를 갱신한 뒤, 활성 팀 인터페이스로 새 소유자에게 메시지를 보낸다.

### 팀원이 멈춘 경우 (메시지 없음)

1. lead가 TodoWrite 또는 활성 작업 목록 인터페이스에서 작업이 너무 오래 `in_progress`에 머무는 것을 감지한다.
2. lead가 활성 팀 인터페이스로 팀원에게 상태를 묻는 메시지를 보낸다.
3. 응답이 없으면 팀원이 죽은 것으로 간주한다.
4. 활성 작업 목록 인터페이스를 통해 작업을 다른 워커에게 재할당한다.

### 의존성 차단

1. 차단하는 작업이 실패하면 lead는 다음 중 결정해야 한다.
   - 차단 작업을 재시도
   - 활성 작업 목록 항목의 `blockedBy` 메타데이터를 갱신해 의존성을 제거
   - 차단된 작업을 아예 건너뛰기
2. 결정은 활성 팀 인터페이스를 통해 영향받는 팀원에게 전달한다.

### 팀원 크래시

1. 해당 팀원의 내부 추적이 예기치 않은 상태를 보인다.
2. lead가 고아가 된 작업을 남은 워커에게 재할당한다.
3. 필요하면 `Task(name="worker-N", subagent_type="...")`로 대체 팀원을 스폰한다.

## Team + Ralph 조합

사용자가 `/team ralph`를 호출하거나, "team ralph"라고 말하거나, 두 키워드를 결합하면 team 모드는 Ralph의 지속성 루프로 자신을 감싼다. 이로써 다음이 제공된다.

- **Team 오케스트레이션** -- 스테이지별 전문 에이전트를 쓰는 다중 에이전트 단계적 파이프라인
- **Ralph 지속성** -- 실패 시 재시도, 완료 전 architect 검증, 반복 추적

### 활성화

Team+Ralph는 다음 경우에 활성화된다.

1. 사용자가 `/team ralph "task"` 또는 `/oh-my-claudecode:team ralph "task"`를 호출
2. 키워드 감지기가 프롬프트에서 `team`과 `ralph`를 모두 발견
3. 훅이 team 맥락과 함께 `MAGIC KEYWORD: RALPH`를 감지

### 상태 연결

두 모드는 서로 참조하는 별도의 상태 파일을 쓴다.

```
// Team 상태 (state_write 경유)
state_write(mode="team", session_id="<current_session_id>", active=true, current_phase="team-plan", state={
  "team_name": "build-rest-api",
  "linked_ralph": true,
  "task": "build a complete REST API"
})

// Ralph 상태 (state_write 경유)
state_write(mode="ralph", session_id="<current_session_id>", active=true, iteration=1, max_iterations=10, current_phase="execution", state={
  "linked_team": true,
  "team_name": "build-rest-api"
})
```

### 실행 흐름

1. Ralph 외부 루프 시작 (반복 1)
2. Team 파이프라인 실행: `team-plan -> team-prd -> team-exec -> team-verify`
3. `team-verify`가 통과하면: Ralph가 architect 검증 실행 (최소 STANDARD 티어)
4. architect가 승인하면: 두 모드 모두 완료, `/oh-my-claudecode:cancel` 실행
5. `team-verify`가 실패하거나 architect가 거절하면: team이 `team-fix`에 진입한 뒤 `team-exec -> team-verify`로 되돌아감
6. fix 루프가 `max_fix_loops`를 초과하면: Ralph가 반복 횟수를 올리고 전체 파이프라인을 재시도
7. Ralph가 `max_iterations`를 초과하면: 종료 상태 `failed`

## 멱등 복구

lead가 실행 도중 크래시하면 team 스킬은 기존 OMC 상태를 감지해 재개해야 한다.

1. `state_read(mode="team", session_id="<current_session_id>")`를 읽어 활성 OMC 팀 slug, 스테이지, 워커 레이블을 얻는다.
2. OMC 핸드오프와 작업 목록/TodoWrite 상태로 현재 진행 상황을 판단한다.
3. 중복 팀원을 스폰하는 대신 모니터 모드를 재개한다.
4. 마지막으로 기록된 스테이지부터 계속한다.

이로써 중복 워커 스폰을 막고 lead 장애에서 안전하게 복구할 수 있다.

## 비교: Team vs 레거시 Swarm

| 항목 | Team (네이티브 Claude Code 2.1.178+) | Swarm (레거시 SQLite) |
| --- | --- | --- |
| **저장소** | OMC 상태/핸드오프 + Claude Code의 현재 작업 목록 인터페이스 | `.omc/state/swarm.db`의 SQLite |
| **의존성** | `better-sqlite3` 불필요 | `better-sqlite3` npm 패키지 필요 |
| **작업 선점** | lead가 작업 목록/TodoWrite 상태로 이름 붙은 워커에 사전 할당 | SQLite IMMEDIATE 트랜잭션 -- 원자적 |
| **경합 상태** | 두 에이전트가 같은 작업을 선점할 수 있음 (사전 할당으로 완화) | 없음 (SQLite 트랜잭션) |
| **커뮤니케이션** | 네이티브 암묵적 팀 메시지 / 대화 턴 | 없음 (fire-and-forget 에이전트) |
| **작업 의존성** | 작업 목록/TodoWrite 상태에서 lead가 관리 | 지원 안 됨 |
| **하트비트** | lead가 메시지/상태 누락으로 감지 | 수동 하트비트 테이블 + 폴링 |
| **종료** | 정상 요청/응답 프로토콜 + OMC 상태 clear | 시그널 기반 종료 |
| **에이전트 수명주기** | 이름 붙은 Agent/Task 스폰과 OMC 상태로 추적 | 하트비트 테이블을 통한 수동 추적 |
| **진행 가시성** | 이름 붙은 워커 소유권이 있는 작업 목록/TodoWrite 상태 | tasks 테이블에 대한 SQL 쿼리 |
| **충돌 방지** | 소유자 레이블 (lead 할당) | 타임아웃이 있는 리스(lease) 기반 선점 |
| **크래시 복구** | lead가 메시지 누락을 감지하고 재할당 | 5분 리스 타임아웃 후 자동 해제 |
| **상태 정리** | 팀원 종료 후 OMC team 상태 clear | SQLite 데이터베이스를 수동 `rm` |

**Swarm 대신 Team을 쓸 때:** 새로운 네이티브 Claude Code 작업에는 항상 `/team`을 우선한다. Claude Code의 암묵적 에이전트 팀을 사용하고, 외부 의존성이 필요 없으며, 에이전트 간 조율과 작업 의존성 관리를 지원한다.

## 취소

Team 취소는 오직 `skills/cancel/SKILL.md`의 흐름으로만 정의된다. 그 흐름이 플래그 매트릭스, 식별자/fail-closed 규칙, 정상 및 강제 대기, 세션 범위 보호 clear, Team 우선 연결 Ralph 처리, 전체 세션 권한 부여, 미해결 세션 게이트를 소유한다. 핸드오프는 취소 후에도 보존되며, 캡처되지 않은 Team 루트는 계속 보호된다.

### 연결 모드 취소 (Team + Ralph)

연결된 Ralph 의존성도 같은 정식 흐름에서 다룬다. 두 번째 세션 작업 절차를 여기에 다시 쓰지 않는다.

## 런타임 V2 (이벤트 기반)

기본적으로 team 런타임은 legacy done.json 폴링 워치독 대신 이벤트 기반 아키텍처를 사용한다.

- **done.json 없음**: 작업 완료는 CLI API 수명주기 전환(claim-task, transition-task-status)으로 감지한다.
- **스냅샷 기반 모니터링**: 각 폴링 주기마다 작업과 워커의 시점 스냅샷을 찍고, 델타를 계산해 이벤트를 발행한다.
- **이벤트 로그**: 모든 팀 이벤트는 `.omc/state/team/{teamName}/events.jsonl`에 추가된다.
- **워커 상태 파일**: 워커는 `.omc/state/team/{teamName}/workers/{name}/status.json`에 상태를 쓴다.
- **보존되는 것**: 센티널 게이트(조기 완료 차단), 서킷 브레이커(죽은 워커 감지), 실패 사이드카

네이티브 CLI 팀 작업은 인스턴스에 바인딩된 v2 런타임이 필요하다. 시작 전에 비활성화하는 `OMC_RUNTIME_V2` 값(`0`, `false`, `no`, `off`)을 해제한다. 페인 전용 legacy 정리 폴백은 없다. 종료에는 `--force`가 있어도 일치하는 인스턴스 및 워커 실행 증거가 필요하다. 세션 `state_clear`는 네이티브 런타임 트리를 제거하지 않으며 네이티브 팀 종료를 대체하지 못한다.

## 동적 스케일링

`OMC_TEAM_SCALING_ENABLED=1`이 설정되면 team은 세션 중 스케일링을 지원한다.

- **scale_up**: 실행 중인 팀에 워커 추가 (max_workers 한도 준수)
- **scale_down**: 정상 드레인으로 유휴 워커 제거 (워커가 현재 작업을 마친 뒤 제거)
- 파일 기반 스케일링 락이 동시 스케일 작업을 막는다.
- 단조 증가하는 워커 인덱스 카운터가 스케일 이벤트 전반에서 워커 이름의 고유성을 보장한다.

## 설정

선택적 설정은 `.claude/omc.jsonc`(프로젝트) 또는 `~/.config/claude-omc/config.jsonc`(사용자)에 둔다. 프로젝트 값이 사용자 값을 덮어쓰며, `OMC_TEAM_ROLE_OVERRIDES`(환경 변수 JSON)가 둘 다보다 우선한다.

```jsonc
{
  "team": {
    "ops": {
      "maxAgents": 20,
      "defaultAgentType": "claude",
      "monitorIntervalMs": 30000,
      "shutdownTimeoutMs": 15000,
    },
  },
}
```

- **ops.maxAgents** - 최대 팀원 수 (기본값: 20)
- **ops.defaultAgentType** - `/team` 호출이 제공자를 지정하지 않을 때의 CLI 제공자 (`claude` | `codex` | `gemini` | `antigravity` | `grok` | `cursor`, 기본값: `claude`)
- **ops.monitorIntervalMs** - TodoWrite 또는 활성 작업 목록 인터페이스를 점검하는 주기 (기본값: 30초)
- **ops.shutdownTimeoutMs** - 종료 응답을 기다리는 시간 (기본값: 15초)

> **참고:** 네이티브 Claude Code 팀원에게는 하드코딩된 모델 기본값이 없다. 각 팀원은 역할별로 덮어쓰지 않는 한 lead 세션에 설정된 모델을 상속한다. OMC의 legacy CLI 워커는 별도 프로세스이며, 제공자와 모델은 네이티브 팀원 상속이 아니라 OMC의 team 라우팅에서 결정된다.
>
> **중첩 (Claude Code 2.1.217+):** Claude 팀원은 세션의 암묵적 팀(Phase 5 참고)에 속한 완전하고 독립적인 Claude Code 세션이다. 팀원이 중첩 서브에이전트를 스폰할 수 있다/없다고 단정하지 않는다. Claude Code 2.1.217–2.1.218은 `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` 기본값이 1이었고 2.1.219+는 기본값이 3이며, 현재 설정이 메인 대화 아래의 서브에이전트 계층 수를 제어한다. 중첩 위임이 의도적이고 활성 런타임이 지원하는 경우가 아니라면, 각 팀원을 실제로 작업을 수행하는 단위로 계획한다. OMC CLI 워커(`ops.defaultAgentType`을 통한 `claude`, `codex`, `gemini`, `grok`, `cursor`, `antigravity`)는 Claude Code 서브에이전트가 아닌 별도 프로세스이며 Claude의 서브에이전트 깊이 설정의 영향을 받지 않는다.
>
> **동시성:** 현재 OMC team CLI는 워커 팬아웃을 20(`MAX_WORKER_COUNT`)으로 제한한다. `ops.maxAgents`가 설정 스키마에 존재하지만 현재 런처는 이를 참조하지 않는다. Claude Code의 `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`도 기본값이 20이지만 그 한도는 Agent로 스폰한 서브에이전트에 적용되며, Claude Code는 에이전트 팀 팀원이 자체 한도를 따른다고 문서화하고 있다. 두 값을 공유 상한으로 취급하거나, 최대 크기의 OMC 팀이 일반 서브에이전트의 여유를 정확히 0으로 남긴다고 가정하지 않는다. lead도 Agent로 스폰한 작업이 필요하다면 OMC 팀 규모를 보수적으로 잡는다.

## 역할별 제공자 및 모델 라우팅

> **범위:** `/team`에만 적용된다. 작업 기반 위임은 `delegationRouting`(별도 문서 참고)을 사용한다. 두 시스템은 의도적으로 공존한다.

정식 역할마다 어떤 제공자(`claude`, `codex`, `gemini`, `antigravity`, `grok`, `cursor`)와 어떤 모델 티어가 뒷받침할지 선언한다. 라우팅은 팀 생성 시 **한 번** 결정되어 `TeamConfig.resolved_routing`에 영속화된다. 스폰, 스케일업, 재시작은 모두 이 스냅샷을 읽으므로, 역할의 워커 CLI와 모델은 팀 수명 동안 안정적이다.

### 예시 — 사용자 목표 매핑

```jsonc
// .claude/omc.jsonc
{
  "team": {
    "roleRouting": {
      "orchestrator": { "model": "inherit" },
      "planner": { "provider": "claude", "model": "HIGH" },
      "analyst": { "provider": "claude", "model": "HIGH" },
      "executor": { "provider": "claude", "model": "MEDIUM" },
      "debugger": { "provider": "cursor" },
      "critic": { "provider": "codex" },
      "code-reviewer": { "provider": "gemini" },
      "test-engineer": { "provider": "gemini", "model": "MEDIUM" },
    },
  },
}
```

| 역할 | 제공자 | 모델 |
| --- | --- | --- |
| `orchestrator` | claude (고정) | 호출한 세션을 상속 |
| `planner` | claude | `HIGH` (opus) |
| `analyst` | claude | `HIGH` (opus) |
| `executor` | claude | `MEDIUM` (sonnet) |
| `debugger` | cursor | cursor-agent 기본값 |
| `critic` | codex | codex 기본값 |
| `code-reviewer` | gemini | gemini 기본값 |
| `test-engineer` | antigravity | antigravity 기본값 |

> 원문의 위 설정 예시(`test-engineer`는 `gemini`/`MEDIUM`)와 표(`test-engineer`는 `antigravity`)는 서로 일치하지 않는다. 원문 그대로 옮겼다.

### 정식 역할

`orchestrator`, `planner`, `analyst`, `architect`, `executor`, `debugger`, `critic`, `code-reviewer`, `security-reviewer`, `test-engineer`, `designer`, `writer`, `code-simplifier`, `explore`, `document-specialist`.

사용자 친화적 별칭은 `normalizeDelegationRole()`로 정규화된다. 예: `reviewer` → `code-reviewer`, `quality-reviewer` → `code-reviewer`, `harsh-critic` → `critic`, `build-fixer` → `debugger`. 허용되는 별칭 키는 검증뿐 아니라 해석된 스냅샷 생성과 이후 스테이지 라우팅에서도 적용된다. 알 수 없는 역할은 파싱 시점에 검증 실패한다.

### 스펙 필드 (`TeamRoleAssignmentSpec`)

- **provider** — `"claude" | "codex" | "gemini" | "antigravity" | "grok" | "cursor"`. 생략하면 `claude`가 기본값.
- **model** — 티어 이름(`"HIGH" | "MEDIUM" | "LOW"`) 또는 명시적 모델 ID. 티어는 `routing.tierModels`를 통해 해석된다.
- **agent** — 선택적 Claude 에이전트 이름(예: `"critic"`, `"executor"`). 해석된 제공자가 `claude`일 때만 적용된다.

`orchestrator`는 `claude`로 고정되며 `model`만 사용자가 설정할 수 있다. `orchestrator`의 다른 키는 검증기가 거부한다.

`cursor`는 `cursor-agent`를 대화형 워커로 실행한다. 리뷰어/verdict 역할(`critic`, `code-reviewer`, `security-reviewer`, `test-engineer`)을 지원하며 다른 비-Claude 제공자와 동일한 구조화된 verdict 출력 계약을 받는다. leader가 verdict를 소비한 뒤 종료 작업 전환을 담당하며, 최종 승인은 lead 세션의 책임으로 남는다.

### 환경 변수 덮어쓰기

```bash
OMC_TEAM_ROLE_OVERRIDES='{"critic":{"provider":"codex"},"code-reviewer":{"provider":"gemini"}}'
```

우선순위: `OMC_TEAM_ROLE_OVERRIDES` > `.claude/omc.jsonc`(프로젝트) > `~/.config/claude-omc/config.jsonc`(사용자) > 내장 기본값. 잘못된 JSON은 경고를 기록하고 무시된다. 환경 변수 덮어쓰기는 최선 노력(best-effort)이며 실행을 중단시키지 않는다.

### 누락된 CLI 사전 점검

Team 시작은 초기 워커에 실제로 유효한 제공자(유휴 워커 할당과 명시적 역할 경로 포함)만 엄격히 사전 점검한다. 역할 라우팅은 각 워커의 초기 시작 제공자를 선택하며, 기존 페인에 이후 전달되는 작업은 해당 워커의 제공자를 유지하고 작업 역할에 따라 다시 라우팅되지 않는다. 선택된 제공자의 바이너리가 없거나, 상대 경로이거나, 신뢰할 수 없으면 팀 상태나 멀티플렉서 부수 효과가 생성되기 전에 실패한다. 라우팅 스냅샷이나 선언된 에이전트 목록에 있기만 한 제공자(실행에 선택되지 않은 역할의 제공자 포함)는 프로브하지 않는다. 라우팅이 권위를 가진다. 제공자를 쓸 수 없다고 해서 런타임이 선택된 역할을 조용히 Claude로 바꾸는 일은 절대 없다. 스케일업과 워커 복구는 각자 실행하려는 제공자를 독립적으로 사전 점검하며, 쓸 수 없으면 fail-closed 한다. 제공자 가용성은 `omc doctor --team-routing`으로 확인한다.

### 고정성 — 한 번 해석해 어디서나 재사용

해석된 라우팅은 팀마다 불변이다. 각 워커의 초기 시작 할당을 선택하며, 기존 페인의 이후 작업은 작업 역할에 따른 제공자 재라우팅 없이 그 워커의 제공자에 머문다. 팀 수명 중에 설정을 편집해도 실행 중인 팀에는 영향이 없다. 새 `/team` 호출이 새 매핑을 적용한다. 스폰, 스케일업, 워커 재시작은 자신이 실행하는 워커에 같은 스냅샷을 사용하며, worktree 분리 과정에서도 마찬가지다(스냅샷은 `TeamConfig`와 함께 이동한다).

### 무설정 동작

비어 있는 `team.roleRouting`은 패치 이전의 동작을 유지한다. 모든 워커는 Claude이고, 모델 티어는 `routing.tierModels`를 따르며, `/team 3:executor ...`는 여전히 Claude Sonnet executor 3개를 스폰한다.

## 상태 정리

Team과 연결된 Ralph의 정리는 `/oh-my-claudecode:cancel`을 사용한다. 그 정식 흐름이 세션 식별, 락/소유권, 정상 대 강제 대기, legacy 런타임 정리를 처리한다. 네이티브 Claude Code 2.1.178+에는 `TeamDelete`가 없다. 정상 완료에서는 종료 프로토콜 이후에 이를 호출한다. 캡처되지 않은 Team 루트와 핸드오프는 보존된다.

## Git Worktree 통합

MCP 워커는 동시 워커 간 파일 충돌을 막기 위해 격리된 git worktree에서 동작할 수 있다.

### 동작 방식

1. **Worktree 생성**: 워커를 스폰하기 전에 `createWorkerWorktree(teamName, workerName, repoRoot)`를 호출해 `.omc/worktrees/{team}/{worker}`에 브랜치 `omc-team/{teamName}/{workerName}`로 격리된 worktree를 만든다.

2. **워커 격리**: worktree 경로를 워커 `BridgeConfig`의 `workingDirectory`로 전달한다. 워커는 자신의 worktree 안에서만 동작한다.

3. **병합 조율**: 워커가 작업을 마치면 `checkMergeConflicts()`로 브랜치가 깔끔하게 병합될 수 있는지 확인하고, `mergeWorkerBranch()`로 `--no-ff` 병합을 수행해 이력을 명확히 한다.

4. **팀 정리**: 팀 종료 시 `cleanupTeamWorktrees(teamName, repoRoot)`를 호출해 모든 worktree와 해당 브랜치를 제거한다.

### API 레퍼런스

| 함수 | 설명 |
| --- | --- |
| `createWorkerWorktree(teamName, workerName, repoRoot, baseBranch?)` | 격리된 worktree 생성 |
| `removeWorkerWorktree(teamName, workerName, repoRoot)` | worktree와 브랜치 제거 |
| `listTeamWorktrees(teamName, repoRoot)` | 모든 팀 worktree 목록 |
| `cleanupTeamWorktrees(teamName, repoRoot)` | 모든 팀 worktree 제거 |
| `checkMergeConflicts(workerBranch, baseBranch, repoRoot)` | 비파괴 충돌 확인 |
| `mergeWorkerBranch(workerBranch, baseBranch, repoRoot)` | 워커 브랜치 병합 (--no-ff) |
| `mergeAllWorkerBranches(teamName, repoRoot, baseBranch?)` | 완료된 모든 워커 병합 |

### 중요 사항

- `tmux-session.ts`의 `createSession()`은 worktree 생성을 처리하지 **않는다**. worktree 수명주기는 `git-worktree.ts`에서 별도로 관리된다.
- worktree는 개별 워커 종료 시 정리되지 **않고** 팀 종료 시에만 정리된다. 사후 점검(post-mortem)을 할 수 있게 하기 위해서다.
- 브랜치 이름은 인젝션을 막기 위해 `sanitizeName()`으로 정제된다.
- 모든 경로는 디렉터리 순회(traversal)에 대해 검증된다.

## 주의사항 (Gotchas)

1. **내부/수명주기 작업 항목이 작업 목록 출력을 오염시킬 수 있다** -- Claude Code가 스폰된 팀원에 대한 내부 수명주기 항목을 보고하면, 실제 작업 진행을 셀 때 걸러낸다. 내부 작업의 subject는 흔히 팀원의 이름이다.

2. **원자적 선점이 없다** -- SQLite swarm과 달리 네이티브 작업 목록/TodoWrite 상태는 트랜잭션 선점을 제공하지 않는다. 두 팀원이 같은 작업을 선점하려고 경합할 수 있다. **완화책:** lead가 팀원을 스폰하기 전에 소유자를 사전 할당한다. 팀원은 자신에게 할당된 작업만 수행한다.

3. **작업 목록 도구가 노출할 때 작업 ID는 문자열이다** -- ID는 정수가 아니라 자동 증가 문자열("1", "2", "3")일 수 있다. 작업 목록 도구를 쓸 때 `taskId` 필드에는 항상 문자열 값을 전달한다.

4. **TeamDelete 정리가 없다** -- Claude Code 2.1.178+는 `TeamDelete`를 제거했다. 종료 메시지와 OMC 상태 정리를 사용한다.

5. **메시지는 자동 전달된다** -- 팀원 메시지는 lead에게 새 대화 턴으로 도착한다. 수신 메시지에 대한 폴링이나 inbox 확인이 필요 없다. 다만 lead가 턴 처리 중이면 메시지는 대기열에 쌓였다가 턴이 끝나면 전달된다.

6. **팀원 프롬프트에 비밀 정보를 넣지 말 것** -- 프롬프트는 로그, 상태, 대화 히스토리에 보존될 수 있다. 자격 증명과 민감 데이터는 팀원 프롬프트에 넣지 않는다.

7. **종료 승인 응답은 상태/보고 이벤트이다** -- 팀원이 종료를 승인하고 종료된 후, 그 승인 응답은 OMC 상태/보고에서 추적한다. Claude Code 팀 멤버십 config가 갱신되기를 기대하지 않는다.

8. **shutdown_response에는 request_id가 필요하다** -- 팀원은 들어온 종료 요청 JSON에서 `request_id`를 추출해 되돌려 보내야 한다. 형식은 `shutdown-{timestamp}@{worker-name}`이다. 이 ID를 지어내면 종료가 조용히 실패한다.

9. **팀 이름은 유효한 slug여야 한다** -- 소문자, 숫자, 하이픈을 사용한다. 작업 설명에서 도출한다 (예: "fix TypeScript errors" → "fix-ts-errors").

10. **브로드캐스트는 비싸다** -- 브로드캐스트는 모든 팀원에게 개별 메시지를 보낸다. 기본으로는 `message`(DM)를 사용하고, 정말 팀 전체의 치명적 경보에만 브로드캐스트한다.

11. **CLI 워커의 수명은 제공자를 따른다** -- "CLI 워커의 동작 방식"을 참고. tmux CLI 워커는 Claude Code의 네이티브 작업 목록이나 팀 메시징 인터페이스를 사용하지 않는다.

## 병렬 세션 주의사항

- **멀티 레포 워크스페이스 앵커:** 상위 디렉터리에 `.omc-workspace` 마커를 두면 여러 하위 레포에 걸친 세션들이 하나의 `.omc/`를 공유한다. 해석 우선순위: `OMC_STATE_DIR > .omc-workspace > git > cwd`. `docs/REFERENCE.md` 참고.
- **세션 ID 출처:** CLI 컨텍스트에서는 `OMC_SESSION_ID` 환경 변수가 우선하고, 훅 컨텍스트에서는 훅 페이로드의 `data.session_id`가 우선한다.
- **플랜 ID (해당하는 경우):** Team 상태는 세션 범위이다. `.omc/handoffs/`의 Team 핸드오프는 설계상 공유된다 (워크스페이스 계획의 Wave G 참고).
- **병렬 판정:** 지원됨 (세션 범위 + 설계상 공유되는 핸드오프)
