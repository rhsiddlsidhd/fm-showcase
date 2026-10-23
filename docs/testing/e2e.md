# E2E 테스트 전략

빌드된 앱을 **실제 브라우저**로 열어 사용자 흐름을 검증한다. 공통 규칙은 [`README.md`](./README.md)를 따른다.

> **상태: 미도입.** 이 문서는 도입할 때의 전략이며, 도구(Playwright)는 아직 설치하지 않았다. 도입 결정은 [README 미결정](./README.md#미결정)에 있다.

## 목적

단위·통합(jsdom)이 잡지 못하는 것만 검증한다.

| E2E로 보는 것 | jsdom이 못 잡는 이유 |
| ------------- | -------------------- |
| 반응형 레이아웃 (모바일/데스크톱 뷰포트에서 요소가 보이는지) | jsdom은 레이아웃을 계산하지 않는다 |
| 키보드 포커스 이동, 포커스 트랩, Tab 순서 | jsdom의 포커스 모델은 단순화되어 있다 |
| 실제 라우팅과 새로고침 후 상태 (딥링크) | 빌드 결과물과 서버 설정(`vercel.json`)이 필요하다 |
| 빌드 산출물이 실제로 동작하는가 | 개발 서버와 빌드 결과가 다를 수 있다 |
| 브라우저 고유 동작 (`<dialog>`, 스크롤, 클립보드) | jsdom이 구현하지 않거나 다르다 |

## 대상이 아닌 것

- 화면 내용·검증 로직의 세부 — 통합·단위에서 끝낸다.
- 모든 요구사항의 반복 — E2E는 **챌린지당 핵심 흐름 한두 개**만 둔다.
- 픽셀 단위 시각 일치 — 시각 회귀는 하지 않는다 ([README 미결정](./README.md#미결정)).

## 도구

| 항목 | 선택 | 이유 |
| ---- | ---- | ---- |
| 실행기 | Playwright (`@playwright/test`) | 뷰포트·브라우저 조합, 자동 대기, 트레이스를 기본 제공 |
| 브라우저 | Chromium 하나로 시작 | 쇼케이스 용도에서 크로스 브라우저는 우선순위가 낮다 |
| 대상 서버 | `vite preview` (빌드 산출물) | 개발 서버가 아니라 배포물과 같은 형태를 검증한다 |

## 위치와 이름

| 항목 | 규칙 |
| ---- | ---- |
| 디렉토리 | 저장소 루트의 `e2e/` |
| 파일 이름 | `*.spec.ts` (Vitest가 줍는 `*.test.ts`와 구분) |
| 설정 | 루트 `playwright.config.ts`. `webServer`로 `npm run build && npm run preview`를 띄운다 |
| Vitest 제외 | `vite.config.ts`의 `test.exclude`에 `e2e/**`를 추가한다 (도입 시) |

## 작성 규칙

- 선택자는 통합과 같다: `getByRole`, `getByLabel`, `getByText`. CSS 선택자·XPath는 쓰지 않는다.
- Playwright의 자동 대기를 쓴다. `page.waitForTimeout`으로 고정 대기하지 않는다.
- 테스트는 서로 독립이다. 상태는 테스트마다 새 컨텍스트에서 시작한다.
- 외부 네트워크(실제 제3자 API)는 부르지 않는다. 경로를 가로채(`page.route`) 응답을 고정한다.
- 뷰포트는 `test.use({ viewport })` 또는 프로젝트 설정으로 명시한다. 모바일·데스크톱 두 값만 쓴다.

```ts
import { expect, test } from "@playwright/test";

test("모바일에서 메뉴가 접혔다가 열린다", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/challenges/navigation");

  await expect(page.getByRole("navigation")).toBeHidden();
  await page.getByRole("button", { name: /menu/i }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
});
```

## TDD 적용

E2E는 통합 테스트처럼 매 행동마다 Red/Green을 돌리지 않는다. 느리고 구현 전에 쓰기 어렵다.

1. 챌린지의 통합 테스트가 모두 통과한 뒤, 통합이 못 잡는 항목(위 목적 표)이 해당 챌린지에 있는지 확인한다.
2. 있으면 그 흐름만 E2E로 쓴다. 이때 구현이 이미 있으므로 **일부러 구현을 깨서 실패를 한 번 확인**해 테스트가 실제로 검증하는지 본다.
3. 없으면 E2E를 쓰지 않는다.

## 실행

| 시점 | 방식 |
| ---- | ---- |
| 로컬 | `npx playwright test` (필요 시 `--ui`) |
| CI | 도입 시 `verify` 잡에 추가하거나 별도 잡으로 분리한다. 결정은 도입 때 한다 |
| 실패 분석 | 트레이스(`trace: "on-first-retry"`)와 스크린샷을 산출물로 남긴다 |

- CI에서 재시도(`retries`)를 켜면 불안정한 테스트가 가려진다. 재시도는 1회 이하로 두고, 재시도로 통과한 테스트는 불안정으로 보고 고친다.

## 도입 체크리스트

도입을 결정하면 아래를 하나씩 확인한다.

1. `@playwright/test` 설치, 브라우저 설치 (`npx playwright install chromium`)
2. `playwright.config.ts` 작성, `webServer` 설정
3. `vite.config.ts`의 `test.exclude`에 `e2e/**` 추가 후 `npm run test`가 E2E를 줍지 않는지 확인
4. `package.json`에 `test:e2e` 스크립트 추가
5. CI 반영 여부 결정, `.gitignore`에 `test-results/`, `playwright-report/` 추가
6. 이 문서의 "미도입" 표시와 README의 상태 표를 갱신

## 완료 기준

- 핵심 흐름마다 E2E가 하나 있고, 통합과 같은 내용을 반복하지 않는다.
- 고정 대기와 CSS 선택자가 없다.
- 로컬에서 연속 3회 실행해 모두 통과한다 (불안정성 확인).
