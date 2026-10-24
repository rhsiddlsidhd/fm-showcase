# 아키텍처

이 저장소의 디렉토리 구조는 [Feature-Sliced Design](https://feature-sliced.design/)(FSD)을 따른다. 이 README는 인덱스이자 공통 원칙이고, 상세는 아래 문서에 둔다.

FSD를 고른 이유는 취향이 아니다. 이 저장소는 경로를 기계가 읽어 규칙을 판정하려 한다([강제와 안내](../../README.md#강제와-안내)). 그러려면 경로 규약이 **외부에 명세되어 있고 린터가 검사할 수 있어야** 한다. FSD는 둘 다 갖췄다.

## 문서

| 문서 | 읽는 조건 | 다루는 내용 |
| ---- | --------- | ----------- |
| [`layers.md`](./layers.md) | 새 디렉토리를 만들 때. 코드를 어느 레이어에 둘지 정할 때 | 6개 레이어의 정의, 이 저장소에 들어가는 것, 만드는 시점 |
| [`segments.md`](./segments.md) | 레이어 안에 폴더를 만들 때. public API를 쓸 때 | 세그먼트 규약, 동결한 이름 집합, public API 규칙 |
| [`enforcement.md`](./enforcement.md) | 구조 규칙의 판정 방식을 확인할 때. Steiger가 막았을 때 | Steiger의 역할과 한계, 규칙 목록, CI에서의 위치 |

## 레이어 어휘

FSD가 정의한 레이어는 **7개**다. 공식 문서 원문:

> There are **7 layers** in total, arranged from most responsibility and dependency to least:
> 1. App 2. Processes (deprecated) 3. Pages 4. Widgets 5. Features 6. Entities 7. Shared

이 중 `processes`는 폐기됐다.

> This layer has been deprecated. The current version of the spec recommends avoiding it and moving its contents to `features` and `app` instead.

따라서 **현행 어휘는 6개**다. 어휘가 6개인 것과 디렉토리를 6개 만드는 것은 다른 문제다.

> You don't have to use all of the layers, but their names are important.

레이어는 필요할 때 만든다. 이름은 바꾸지 않는다.

> Adding new layers is _not recommended_ because their semantics are standardized.

## import 규칙

> A module (file) in a slice can only import other slices when they are located on layers strictly below.

위 레이어는 아래 레이어를 import한다. 반대 방향과 같은 레이어 안 슬라이스 간 import은 금지다. `app`과 `shared`는 예외다.

> Layers App and Shared are exceptions to this rule... they are both a layer and a slice at the same time.

판정은 `fsd/forbidden-imports`가 한다.

## 이 저장소의 적용

| 레이어 | 상태 | 들어가는 것 |
| ------ | ---- | ----------- |
| `app` | 쓴다 | 라우터 설정, 전역 스타일, 프로바이더 |
| `processes` | **쓰지 않는다** | 폐기된 레이어 |
| `pages` | 쓴다 | 챌린지 하나 = 슬라이스 하나. 쇼케이스 목록·상세 |
| `widgets` | 조건부 | 여러 페이지가 재사용하는 UI 블록이 생길 때 |
| `features` | 조건부 | 여러 페이지가 재사용하는 사용자 동작이 생길 때 |
| `entities` | 조건부 | 두 번째 소비자가 생길 때. 후보는 `challenge` 하나 |
| `shared` | 쓴다 | shadcn 복사본, `cn`, 라우트 상수 |

조건부 레이어를 미리 만들지 않는 이유는 [`layers.md`](./layers.md)에 있다. 요약하면 재사용이 없는 상태에서 만들면 `fsd/insignificant-slice`가 실패로 판정한다.

## 강제와 안내

[프로젝트 README](../../README.md#강제와-안내)의 구분을 따른다.

| 등급 | 규칙 | 판정 |
| ---- | ---- | ---- |
| 강제 | 레이어 이름이 FSD 어휘와 같다 | `fsd/typo-in-layer-name` |
| 강제 | import 방향이 아래로만 간다 | `fsd/forbidden-imports` |
| 강제 | 슬라이스에 public API가 있고, 바깥이 내부 파일을 직접 import하지 않는다 | `fsd/public-api`, `fsd/no-public-api-sidestep` |
| 강제 | 세그먼트 이름이 내용의 성질이 아니라 목적을 가리킨다 | `fsd/segments-by-purpose` |
| 강제 | 참조가 하나뿐인 슬라이스를 만들지 않는다 (`pages` 제외) | `fsd/insignificant-slice` |
| 안내 | 슬라이스 디렉토리 이름은 kebab-case 소문자 | 리뷰 |
| 안내 | 무엇을 한 슬라이스로 볼지 | 리뷰 |
| 안내 | 조건부 레이어를 만들 시점의 판단 | 리뷰 |

- 강제 항목의 전체 목록과 실행 방식은 [`enforcement.md`](./enforcement.md)에 있다.
- 슬라이스 이름은 FSD가 표준화하지 않았다("The names of slices are not standardized"). 대소문자 규칙을 검사하는 Steiger 규칙이 없으므로 안내다.

## 미결정

| 항목 | 현재 | 결정이 필요한 시점 |
| ---- | ---- | ------------------ |
| 테스트 파일의 배치 | FSD에 규약이 없다. 대상 파일 옆에 둔다 ([테스트 전략](../testing/README.md)) | TDD 게이트를 설계할 때 |
| 슬라이스 20개 초과 시 그룹화 | 정하지 않았다. `fsd/excessive-slicing`이 20개에서 실패한다 | 챌린지가 20개에 가까워질 때 |
| 기존 `src/components/`, `src/lib/`의 이전 | 하지 않았다. Steiger는 `src/lib`만 지적한다 | 첫 챌린지를 만들 때 |
