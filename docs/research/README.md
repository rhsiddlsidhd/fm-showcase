# OMC 조사 문서

이 저장소가 가져다 쓰는 OMC(oh-my-claudecode)를 조사한 문서와 OMC 문서의 한국어 번역이다. 대상은 로컬 설치본 v5.7.5다.

이 README는 인덱스다. 본문은 아래 문서에 둔다.

## 조사

| 문서                                                                     | 읽는 조건                                         | 다루는 내용                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------- |
| [`omc-usage.md`](./omc-usage.md)                                         | OMC 위에 TDD 파이프라인을 얹을 지점을 정할 때     | Red/Green 증거 파이프라인을 얹을 지점과 제약 |
| [`omc-agents.md`](./omc-agents.md)                                       | 서브에이전트 운용 방식을 정할 때                  | OMC 에이전트 운용 권장 사항                  |
| [`omc-executor-test-write-block.md`](./omc-executor-test-write-block.md) | executor가 테스트 파일을 못 쓰는 이유를 확인할 때 | executor의 test 파일 쓰기 권한 차단          |

## 에이전트 정의 번역

원본은 OMC의 `agents/*.md`다. 다루는 내용은 각 문서 머리말의 `description`이다.

| 문서                                                               | 읽는 조건                               | 다루는 내용                                                             |
| ------------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------- |
| [`omc-agent-analyst.ko.md`](./omc-agent-analyst.ko.md)             | analyst의 역할과 제약을 확인할 때       | 계획 수립 전 요구사항 분석을 맡는 컨설턴트 (Opus)                       |
| [`omc-agent-architect.ko.md`](./omc-agent-architect.ko.md)         | architect의 역할과 제약을 확인할 때     | 전략적 아키텍처 및 디버깅 자문가 (Opus, 읽기 전용)                      |
| [`omc-agent-critic.ko.md`](./omc-agent-critic.ko.md)               | critic의 역할과 제약을 확인할 때        | 작업 계획 및 코드 리뷰 전문가 (Opus)                                    |
| [`omc-agent-executor.ko.md`](./omc-agent-executor.ko.md)           | executor의 역할과 제약을 확인할 때      | 구현 작업을 맡는 집중형 태스크 실행자 (Sonnet)                          |
| [`omc-agent-explore.ko.md`](./omc-agent-explore.ko.md)             | explore의 역할과 제약을 확인할 때       | 파일과 코드 패턴을 찾는 코드베이스 검색 전문가                          |
| [`omc-agent-planner.ko.md`](./omc-agent-planner.ko.md)             | planner의 역할과 제약을 확인할 때       | 인터뷰 워크플로를 갖춘 전략 기획 컨설턴트 (Opus)                        |
| [`omc-agent-test-engineer.ko.md`](./omc-agent-test-engineer.ko.md) | test-engineer의 역할과 제약을 확인할 때 | 테스트 전략, 통합/e2e 커버리지, 불안정(flaky) 테스트 보강, TDD 워크플로 |

## 스킬 번역

| 문서                                         | 읽는 조건                           | 다루는 내용                                   |
| -------------------------------------------- | ----------------------------------- | --------------------------------------------- |
| [`autopilot-skill.md`](./autopilot-skill.md) | `autopilot` 스킬의 동작을 확인할 때 | `oh-my-claudecode:autopilot` 스킬 문서의 번역 |
| [`team-skill.md`](./team-skill.md)           | `team` 스킬의 동작을 확인할 때      | `oh-my-claudecode:team` 스킬 문서의 번역      |
