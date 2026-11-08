# 용어집

용어의 정의는 그 용어를 쓰는 문서에 있다. 이 문서는 정의한 곳을 가리키고, 헷갈리기 쉬운 용어를 구분한다. 정의를 여기에 다시 쓰지 않는다.

## 용어와 정의한 곳

| 용어 | 정의한 곳 |
| --- | --- |
| 설정, 검증 코드, CI, 문서 | [`docs/README.md`](README.md#용어) |
| 증거 | [`README.md`](../README.md#증거) |
| 도메인 | [`spec/README.md`](spec/README.md) |
| 설계안 | [`spec/README.md`](spec/README.md#산출-위치) |
| 결정 기록(ADR) | [`spec/adr.md`](spec/adr.md) |
| 검증 시나리오 | [`spec/verification.md`](spec/verification.md#검증-시나리오) |
| 슬라이스, 세그먼트 | [`architecture/segments.md`](architecture/segments.md) |
| 페이지 컴포넌트 | [`architecture/layers.md`](architecture/layers.md#pages) |
| 시스템 경계 | [`architecture/boundary.md`](architecture/boundary.md) |
| 표시 컴포넌트, 동작 컴포넌트 | [`testing/test-boundaries.md`](testing/test-boundaries.md#컴포넌트-분류) |
| 디자인 토큰, 공통 토큰, 페이지 변수 | [`ui/theme.md`](ui/theme.md) |
| 종류 라벨, 상태 라벨 | [`git/issue.md`](git/issue.md#템플릿과-라벨) |
| Issue 브랜치, 작업 브랜치 | [`git/branch.md`](git/branch.md) |

## 헷갈리기 쉬운 용어

| 용어 | 구분 |
| --- | --- |
| 루트 `api/` ↔ `api/` 세그먼트 | 루트 `api/`는 서버에서 도는 Vercel Functions다([시스템 경계](architecture/boundary.md#vercel-functions)). `api/` 세그먼트는 슬라이스 안에서 브라우저가 실행하는 요청 코드다 |
| 테스트 경계 ↔ 시스템 경계 | 테스트 경계는 층마다 무엇을 진짜로 쓰는지다([`test-boundaries.md`](testing/test-boundaries.md)). 시스템 경계는 앱이 무엇을 두지 않는지다([`boundary.md`](architecture/boundary.md)) |
| Issue 완료 조건 ↔ 요구사항 충족 | Issue 완료 조건은 Issue를 닫는 기준이다. 요구사항 충족은 요구사항 하나의 기준이다([`requirements.md`](spec/requirements.md#섹션)) |
| 도메인 ↔ 슬라이스 ↔ 라우트 | 도메인의 단위와 라우트 관계는 [`spec/README.md`](spec/README.md), 슬라이스의 의미는 [`architecture/segments.md`](architecture/segments.md#슬라이스)를 따른다 |
| `docs/ui/` ↔ `ui/` 세그먼트 | `docs/ui/`는 화면 규칙 문서다. `ui/` 세그먼트는 슬라이스의 화면 코드다 |
| 설계안 ↔ 결정 기록 | 설계안은 `.sdd/`의 작업본이라 저장소에 남지 않는다. 결정 기록은 `adr/`에 남는다 |
| 검증 코드 ↔ 검증 문서 | 검증 코드는 테스트와 git 훅이다. 검증 문서는 테스트할 시나리오를 구현 전에 정한 설계안이다 |
