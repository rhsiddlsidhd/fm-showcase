# 슬라이스와 세그먼트

레이어 안의 두 번째·세 번째 계층이다. 공통 원칙은 [`README.md`](./README.md)를 따른다.

## 슬라이스

> Slices are the second level in the organizational hierarchy of Feature-Sliced Design. Their main purpose is to group code by its meaning for the product, business, or just the application.

- 이름은 FSD가 표준화하지 않는다("The names of slices are not standardized"). 도메인이 정한다.
- 이 저장소는 **kebab-case 소문자**로 쓴다. 공식 예시가 그 형태다 (`article-reader`, `sign-in`, `home`). Steiger에 대소문자 규칙이 없다.
- `app`과 `shared`는 슬라이스가 없다.

## 세그먼트

> Segments are the third and final level in the organizational hierarchy, and their purpose is to group code by its technical nature.

FSD의 권장 이름:

| 세그먼트 | 의미 |
| -------- | ---- |
| `ui` | UI 컴포넌트, 포맷터, 스타일 |
| `api` | 백엔드 상호작용. 요청 함수, 데이터 타입, 매퍼 |
| `model` | 데이터 모델. 스키마, 인터페이스, 스토어, 비즈니스 로직 |
| `lib` | 그 슬라이스가 쓰는 라이브러리 코드 |
| `config` | 설정, 기능 플래그 |

이름은 고정 집합이 아니다. 공식 문서는 자유를 준다.

> Custom segments are permissible, particularly in App and Shared layers.

### 이 저장소가 동결하는 집합

FSD가 준 자유를 행사해 집합을 좁힌다. **아래 네 개만 쓴다.**

```
ui  model  api  lib
```

`config`는 쓰지 않는다. 설정 파일이 저장소 루트에 있다. `app`과 `shared`의 관용 세그먼트(`routes`, `styles`, `store` 등)는 예외로 허용한다.

예외가 하나 더 있다. 테스트 준비 코드는 `shared/test`에 둔다. FSD에 테스트 세그먼트 규약이 없어서 관용 이름을 쓸 수 없고, 커스텀 세그먼트는 `shared`에서 허용된다("Custom segments are permissible, particularly in App and Shared layers"). 이 세그먼트는 검증 대상이 아니라 검증을 준비하는 코드이므로 동결 집합의 판정표에 넣지 않는다.

동결하는 이유는 경로를 기계가 읽기 때문이다. 이 저장소는 세그먼트 이름으로 "이 코드가 어떤 검증을 받는가"를 판정하려 한다. 이름이 열려 있으면 판정표에 빈칸이 생기고, 분류되지 않은 경로가 조용히 검사를 빠져나간다. 집합 밖의 세그먼트가 나타나면 **검사 면제가 아니라 검사 대상으로 취급한다.**

이 동결은 FSD 위반이 아니다. 스펙이 이름을 제약하지 않았으므로, 저장소가 고르는 것이 스펙 준수다.

### 쓰지 않는 이름

> components, hooks, and types are bad segment names because they aren't that helpful when you're looking for code.

내용의 **성질**이 아니라 **목적**을 가리키는 이름을 쓴다.
- UI 컴포넌트는 `components/`가 아니라 `ui/`에 둔다.
- 훅은 `hooks/`가 아니라 그 훅이 다루는 대상에 따라 `model/`이나 `lib/`에 둔다.

## public API

> Every slice (and segment on layers that don't have slices) must contain a public API definition. Modules outside of this slice/segment can only reference the public API, not the internal file structure.

슬라이스마다 index 파일을 둔다. 바깥은 그것만 import한다. `pages`를 제외한 레이어의 index는 세그먼트 안의 것을 골라 내보내기만 한다.

```ts
// src/entities/challenge/index.ts
export { ChallengeCard } from "./ui/ChallengeCard";
```

`pages` 슬라이스의 index는 [`layers.md`](./layers.md#pages)가 정의한다. 내보내는 이름은 `<슬라이스>Page`의 named export다. `app/routes`가 여러 페이지 슬라이스를 한 파일에서 import하므로 이름이 겹치지 않게 하기 위해서다.

```tsx
// src/pages/weather-app/index.tsx
import { WeatherSearch } from "./ui/WeatherSearch";

export const WeatherAppPage = () => (
  <main>
    <WeatherSearch />
  </main>
);
```

- 와일드카드 재export(`export * from "./ui/Comment"`)를 쓰지 않는다. 슬라이스의 탐색성을 해치고 내부 구현을 노출한다.
- 세그먼트마다 index를 또 만들지 않는다. 슬라이스 index 하나면 된다. `shared/ui`와 `shared/lib`는 예외로, 모듈마다 index를 둬서 번들에 쓰지 않는 의존이 들어가는 것을 막는다.

## import 경로

> When they are in the same slice, always use _relative_ imports and write the full import path. When they are in different slices, always use _absolute_ imports.

| 범위 | 형태 | 예 |
| ---- | ---- | -- |
| 같은 슬라이스 안 | 상대 경로, 전체 경로 | `./ui/WeatherSearch` |
| 다른 슬라이스 | 절대 경로 (alias) | `@/entities/challenge` |

이 규칙의 판정 규칙(`fsd/import-locality`)은 Steiger의 `recommended`에 없다.
