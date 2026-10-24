# 레이어

FSD의 레이어 6개와 이 저장소에서의 적용이다. 공통 원칙은 [`README.md`](./README.md)를 따른다.

레이어는 `src/` 바로 아래의 디렉토리이고, 이름은 소문자다. 이름은 표준화되어 있어 바꾸거나 추가하지 않는다.

## 순서

의존 방향의 위에서 아래 순이다. 위는 아래를 import하고, 반대는 금지다.

| # | 레이어 | 슬라이스 | 이 저장소 |
| - | ------ | -------- | --------- |
| 1 | `app` | 없음 (세그먼트 직접) | 쓴다 |
| 2 | `processes` | 있음 | **쓰지 않는다** (폐기) |
| 3 | `pages` | 있음 | 쓴다 |
| 4 | `widgets` | 있음 | 조건부 |
| 5 | `features` | 있음 | 조건부 |
| 6 | `entities` | 있음 | 조건부 |
| 7 | `shared` | 없음 (세그먼트 직접) | 쓴다 |

`app`과 `shared`는 슬라이스가 없고 세그먼트가 바로 온다. 둘은 import 규칙의 예외이며, 내부 파일끼리 자유롭게 import한다.

## `app`

> All kinds of app-wide matters, both in the technical sense (e.g., context providers) and in the business sense (e.g., analytics).

관용 세그먼트: `routes`, `store`, `styles`, `entrypoint`.

이 저장소에 들어가는 것:

| 세그먼트 | 내용 |
| -------- | ---- |
| `routes` | React Router 설정. 페이지 슬라이스의 public API만 import한다 |
| `styles` | 전역 스타일 (`index.css`) |

- `ui` 세그먼트를 두지 않는다. `fsd/no-ui-in-app`이 막는다.
- 앱 전체 레이아웃은 여기 둔다. 특정 페이지의 레이아웃은 그 페이지 슬라이스에 둔다.

## `processes`

폐기된 레이어다. 만들지 않는다.

> This layer has been deprecated. The current version of the spec recommends avoiding it and moving its contents to `features` and `app` instead.

여러 페이지에 걸친 시나리오가 생기면 `features`와 `app`으로 나눈다. 판정은 `fsd/no-processes`가 한다.

## `pages`

> Pages are what makes up websites and applications (also known as screens or activities).

이 저장소의 주 축이다. **챌린지 하나가 슬라이스 하나**다. 쇼케이스 목록과 상세도 각각 슬라이스다.

페이지 슬라이스는 두꺼워도 된다. 공식 문서가 명시한다.

> There's no limit to how much code you can place in a page slice... If a UI block on a page is not reused, it's perfectly fine to keep it inside the page slice.

이게 Frontend Mentor 챌린지에 중요하다. 챌린지의 마크업은 재사용되지 않고 페이지 내용의 대부분이다. 그러므로 **챌린지의 UI 조각을 `widgets`로 올리지 않고 페이지 안에 둔다.**

페이지에 상태를 두는 것도 허용된다.

> It's not common for a page to have a dedicated data model, and tiny bits of state can be kept in the components themselves.

따라서 토글 하나를 위해 `model` 세그먼트를 만들지 않는다. 분기가 늘어나면 그때 내린다.

예:

```
src/pages/weather-app/
  index.ts          public API. app/routes가 여기만 본다
  ui/               페이지와 그 조각
  api/              네트워크 (있을 때)
  model/            상태·검증·변환 (있을 때)
```

- 슬라이스 디렉토리 이름은 kebab-case 소문자로 쓴다 (공식 예시가 `article-reader`, `sign-in`). 컴포넌트 이름은 PascalCase 그대로 쓴다.
- 페이지끼리 import하지 않는다. 챌린지 간 독립이 규칙으로 강제된다.
- `fsd/insignificant-slice`는 페이지를 면제한다. 참조가 라우터 하나뿐이어도 정상이다.

## `widgets`

> The Widgets layer is intended for large self-sufficient blocks of UI... most useful when they are reused across multiple pages.

만드는 조건이 공식 문서에 있다.

> If a block of UI makes up most of the interesting content on a page, and is never reused, it should not be a widget.

챌린지 UI는 이 문장에 그대로 걸린다. 재사용되지 않고, 페이지 내용의 대부분이다. 그래서 **챌린지를 widget으로 만들지 않는다.**

만들 수 있는 경우는 쇼케이스 쪽이다. 목록 페이지와 상세 페이지가 같은 UI 블록(챌린지 카드, 헤더)을 쓰게 되면 그때 올린다. 소비자가 하나뿐인 상태에서 만들면 `fsd/insignificant-slice`가 실패로 판정한다.

## `features`

> This layer is for the main interactions in your app, things that your users care to do.

올리는 기준이 재사용이다.

> A crucial principle for using the Features layer effectively is: not everything needs to be a feature... A good indicator that something needs to be a feature is the fact that it is reused on several pages.

쇼케이스의 필터는 목록 페이지에서만 쓰므로 그 페이지 슬라이스에 둔다. 챌린지의 상호작용(폼 검증, 계산, 토글)도 그 챌린지 안에서만 쓰므로 올리지 않는다.

## `entities`

> Slices on this layer represent concepts from the real world that the project is working with.

관용 세그먼트: `model`, `api`, `ui`.

이 저장소의 후보는 **`challenge` 하나**다. 챌린지 메타데이터(제목, 난이도, 스택, 링크, 증거 문서 링크)는 쇼케이스 목록과 상세가 함께 쓴다.

만드는 시점은 **두 번째 소비자가 생길 때**다. 목록 페이지만 있는 동안은 참조가 하나여서 `fsd/insignificant-slice`가 실패로 판정한다. 이 기준은 [`docs/testing/integration.md`](../testing/integration.md)의 헬퍼 규칙과 같다. 쓰임이 하나뿐일 때 미리 만들지 않는다.

엔티티끼리는 서로 모른다.

> Entities in FSD are slices, and by default, slices cannot know about each other... the business logic of these interactions is preferably kept in higher layers.

## `shared`

> This layer forms a foundation for the rest of the app. It's a place to create connections with the external world, for example, backends, third-party libraries, the environment.

관용 세그먼트: `api`, `ui`, `lib`, `config`, `routes`, `i18n`.

이 저장소에 들어가는 것:

| 세그먼트 | 내용 | 위치 |
| -------- | ---- | ---- |
| `ui` | shadcn 복사본 | `src/shared/ui/` |
| `lib` | `cn` 재export | `src/shared/lib/cn.ts` |
| `test` | 테스트 준비 코드 | `src/shared/test/` |
| `routes` | 라우트 상수·패턴 | 아직 없음 |

- `shared`는 슬라이스가 없다. 세그먼트가 바로 온다. 내부 파일끼리 자유롭게 import한다.
- `shared/ui`와 `shared/lib`는 컴포넌트·모듈마다 index를 두는 쪽이 낫다. 버튼 하나를 쓸 때 쓰지 않는 의존까지 번들에 들어가는 것을 막기 위해서다.
- `lib`는 잡동사니가 아니다. 각 폴더는 하나의 관심사를 가진다.

## 레이어를 고르는 순서

새 코드를 어디 둘지는 아래 순서로 답한다. 위에서 걸리면 거기서 멈춘다.

1. 라우터·전역 설정·전역 스타일인가 → `app`
2. 특정 페이지에서만 쓰는가 → 그 `pages` 슬라이스 안
3. 여러 페이지가 쓰는 **동작**인가 → `features`
4. 여러 페이지가 쓰는 **UI 블록**인가 → `widgets`
5. 여러 곳이 쓰는 **도메인 개념**인가 → `entities`
6. 비즈니스와 무관하게 재사용되는가 → `shared`

2번에서 멈추는 경우가 가장 많다. 이 저장소에서는 그게 정상이다.
