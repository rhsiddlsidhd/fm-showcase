# 구조 규칙의 판정

디렉토리 규약을 기계가 판정하는 방식이다. 공통 원칙은 [`README.md`](./README.md)를 따른다.

## Steiger는 린터이지만 ESLint가 아니다

ESLint는 파일 **내용**(코드)을 보고, Steiger는 파일 **구조**(폴더 이름, 폴더 간 import 방향, index 존재)를 본다. `npm run lint`가 Steiger를 덮지 않으므로 별도 스크립트(`lint:fsd`)로 돌린다.

import은 읽지만 코드 품질은 보지 않는다. 그리고 **파일시스템의 현재 상태만 본다.** diff도 커밋 이력도 보지 않는다. 그래서 "테스트를 구현보다 먼저 썼는가" 같은 시간 축 규칙은 Steiger로 판정할 수 없다. 그건 git 훅과 CI의 몫이다.

## 버전

Steiger는 베타이고 README가 API 변경 가능성을 명시한다. 그래서 `package.json`에 정확히 고정한다(`--save-exact`). 버전이 떠 있으면 도구 업데이트가 CI 실패로 나타난다.

## 규칙

켜진 규칙은 `steiger.config.js`가 `fsd.configs.recommended`를 쓰는 것으로 정해진다. 규칙을 나열하지 않는다. `recommended`가 끄는 규칙은 판정되지 않으므로 아래에 둔다.

| 규칙 | 내용 |
| ---- | ---- |
| `fsd/no-cross-imports` | `forbidden-imports`의 분리형 |
| `fsd/no-higher-level-imports` | `forbidden-imports`의 분리형 |
| `fsd/import-locality` | 같은 슬라이스는 상대, 다른 슬라이스는 절대 경로 |
| `fsd/no-wildcard-exports` | public API의 와일드카드 재export 금지 |

앞의 둘은 `forbidden-imports`가 이미 덮는다. 뒤의 둘은 [`segments.md`](./segments.md)에 규칙으로 적어 뒀지만 판정되지 않는다. 판정되지 않는 기준의 전체 목록은 [`README.md`](./README.md#설정과-문서)에 있다.

## 측정한 동작

도입 전에 탐침해 확인한 것이다. 문서의 주장이 아니라 실행 결과다.

| 상황 | 결과 |
| ---- | ---- |
| `src/lib`처럼 레이어 이름과 닮은 최상위 폴더 | `fsd/typo-in-layer-name` 에러 (`app`의 오타로 의심) |
| 레이어 이름과 닮지 않은 `src/` 최상위 폴더 | **걸리지 않는다.** FSD 구조로 보지 않는다. `src/components/`, `src/test/`가 그랬다 |
| 빈 레이어 디렉토리 (`widgets/`, `features/`) | **걸리지 않는다.** git도 빈 디렉토리를 추적하지 않는다 |
| `processes/`에 코드를 둠 | `fsd/no-processes` 에러 |
| `widgets`·`features` 슬라이스를 한 페이지만 참조 | `fsd/insignificant-slice` 에러 ("only one reference... Consider merging them") |
| `pages` 슬라이스를 라우터만 참조 | **에러 없음.** 페이지는 이 규칙에서 면제된다 |
| `entities` 슬라이스를 두 페이지가 참조 | 에러 없음 |
| `pages/<슬라이스>/components/` | `fsd/segments-by-purpose` 에러 |
| `@/` alias 설정이 없을 때 | 모든 슬라이스가 참조 0으로 보여 `insignificant-slice`가 오탐한다 |
| alias가 `tsconfig.app.json`에만 있을 때 | **정상 해석된다.** Steiger가 `tsconfig.json`의 `references`를 따라간다 |

## CI에서의 위치

**CI의 PR head에서만 돌린다. 로컬 `pre-commit` 훅에 넣지 않는다.**

이유는 TDD와 충돌하기 때문이다. 테스트를 먼저 쓰는 중간 상태는 구조가 미완인 상태이고, Steiger는 구조 완결성을 검사한다. 측정 결과:

| 테스트 우선 중간 상태 | 터지는 규칙 |
| --------------------- | ----------- |
| 슬라이스에 테스트 파일만 있음 | `fsd/no-segmentless-slices` |
| 세그먼트에 테스트만 있고 `index.ts`가 없음 | `fsd/public-api` |

`pre-commit`에 올리면 **테스트 선행 커밋 자체가 막힌다.** PR head는 Green이고 구조가 완결돼 있으므로 거기서만 검사하면 충돌이 없다. 이건 [프로젝트 README](../../README.md#파이프라인)의 "CI가 최종 권위다. 로컬 훅은 조기 피드백용이다"와 같은 방향이다.

귀결: **커밋 단위의 구조 검사는 하지 않는다.** 작업 브랜치의 중간 커밋은 FSD 위반 상태를 지나갈 수 있고, 그것을 허용한다.

## `--fix`를 쓰지 않는다

`fsd/public-api`는 자동 수정이 가능하다. 그러나 게이트에서 쓰지 않는다. 테스트만 있는 슬라이스에 `--fix`를 돌리면 테스트 파일을 재export하는 `index.ts`가 생길 수 있다. 사람이 고친다.

## 한계

- Steiger는 베타다. 버전을 고정해도 올릴 때마다 규칙이 바뀔 수 있다. 올리는 것은 별도 PR로 한다.
- 레이어 이름과 닮지 않은 최상위 폴더는 검사 범위 밖이다. `src/` 아래에 FSD 밖의 디렉토리를 만들면 조용히 통과한다. 이건 리뷰가 잡는다.
- 시간 축(테스트가 먼저 왔는가)은 판정 범위가 아니다.
