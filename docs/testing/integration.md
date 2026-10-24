# 통합 테스트 전략

여러 조각(컴포넌트, 훅, 라우터, 상태)을 **진짜로 묶어** 한 화면·기능의 사용자 행동을 검증한다. 공통 규칙은 [`README.md`](./README.md)를 따른다.

챌린지 구현에서는 통합 테스트가 TDD의 **주된 출발점**이다. 요구사항이 "사용자가 ~하면 ~가 보인다"는 문장이라 이 층과 가장 잘 맞는다.

## 대상

| 대상 | 예 |
| ---- | -- |
| 페이지 하나의 행동 | 폼에 입력하고 제출하면 성공 메시지가 보인다 |
| 입력 검증 흐름 | 빈 값으로 제출하면 오류 문구가 뜨고, 고치면 사라진다 |
| 목록의 조작 | 필터를 고르면 카드 목록이 줄어든다 |
| 라우팅 | 카드를 누르면 상세 경로로 이동해 해당 내용이 보인다 |
| 서버 응답에 따른 화면 | 로딩 → 성공 / 실패 화면 전환 |

## 단위와의 경계

| | 단위 | 통합 |
| --- | ---- | ---- |
| 렌더 범위 | 한 컴포넌트 | 페이지 또는 기능 묶음 |
| 자식 컴포넌트 | 대역 가능 | **진짜로 쓴다** |
| 훅·상태 | 따로 검증 | 화면을 통해 간접 검증 |
| 바깥 경계 (네트워크, 저장소, 시간) | 대역 | 대역 (같다) |
| 단언 대상 | 출력, 콜백 | 사용자가 보는 화면 |

- 통합에서 대역으로 바꾸는 것은 **프로세스 바깥**(네트워크, 저장소, 시간)뿐이다. 화면 안의 컴포넌트를 대역으로 바꾸면 통합이 아니다.
- 한 통합 테스트가 단위 테스트를 대신하지 않는다. 분기가 많은 로직은 단위로 내려서 검증한다.

## 도구

| 도구 | 용도 |
| ---- | ---- |
| Vitest | 실행기, 가짜 타이머 |
| `@testing-library/react` | 렌더, `screen`, `waitFor`, `findBy*` |
| `@testing-library/user-event` | 실제 사용자 입력 순서(포커스, 키 입력, 클릭)를 흉내 |
| React Router | `createMemoryRouter` + `RouterProvider`, 또는 `MemoryRouter`로 경로를 지정해 렌더 |

## 작성 규칙

### 렌더 헬퍼

- 라우터 등 공통 감싸기는 `src/shared/test/`에 `renderWithRouter` 같은 헬퍼 하나로 모은다. 테스트마다 같은 감싸기를 반복하지 않는다.
- 헬퍼는 처음 두 번째 쓰임이 생길 때 만든다. 쓰임이 하나뿐일 때 미리 만들지 않는다.

### 행동 중심

- 사용자가 하는 순서대로 쓴다: 렌더 → 입력·클릭 → 화면 단언.
- 비동기 결과는 `findBy*` 또는 `waitFor`로 기다린다. `setTimeout`으로 기다리지 않는다.
- 단언은 사용자가 보는 것(텍스트, 역할, 레이블, `aria-*` 상태)으로 한다.

```tsx
it("이메일이 잘못되면 오류를 보이고, 고치면 제출된다", async () => {
  const user = userEvent.setup();
  render(<Newsletter />);

  await user.type(screen.getByLabelText(/email/i), "not-an-email");
  await user.click(screen.getByRole("button", { name: /subscribe/i }));
  expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);

  await user.clear(screen.getByLabelText(/email/i));
  await user.type(screen.getByLabelText(/email/i), "a@b.co");
  await user.click(screen.getByRole("button", { name: /subscribe/i }));
  expect(await screen.findByText(/thanks for subscribing/i)).toBeInTheDocument();
});
```

### 라우터

- 시작 경로를 `initialEntries`로 정하고, 이동 결과는 **화면 내용**으로 단언한다. `location.pathname` 직접 검사는 이동 자체가 요구사항일 때만 쓴다.
- 존재하지 않는 경로(404)의 화면도 한 번 확인한다.

### 네트워크

- 코드가 쓰는 `fetch` 경계에서 대역을 둔다. 서버를 흉내 내는 응답을 테스트마다 명시한다.
- 성공, 실패(4xx/5xx), 네트워크 오류, 로딩 중 상태를 각각 확인한다.
- 대역 도구는 아직 정하지 않았다 ([README 미결정](./README.md#미결정)). API를 부르는 챌린지가 처음 생길 때 정한다. 정해지기 전에는 `vi.stubGlobal("fetch", vi.fn())`로 최소한만 쓴다.
- 요청 객체의 모양(URL, 헤더)을 지나치게 검증하지 않는다. 필요한 것은 "이 응답이 오면 화면이 이렇다"이다.

### 브라우저 API

- jsdom이 지원하지 않는 API(`matchMedia`, `IntersectionObserver`, `ResizeObserver` 등)는 `src/shared/test/setup.ts`에서 최소 대체를 등록한다. 테스트마다 따로 만들지 않는다.
- 대체가 필요해지는 시점에 추가한다. 쓰지 않는 대체를 미리 넣지 않는다.

## 챌린지 하나의 TDD 순서

1. 챌린지의 요구사항(README, 디자인 설명)을 사용자 행동 문장으로 나눈다.
2. 문장마다 `it.todo`로 테스트 목록을 먼저 만든다.
3. 하나씩 `it.todo`를 실제 테스트로 바꿔 Red를 확인하고, 최소 구현으로 Green을 만든다.
4. 구현 중 분기가 생긴 로직은 단위 테스트로 내려서 먼저 쓴다.
5. 모든 `it.todo`가 사라지면 챌린지의 기능이 끝난 것이다.

## 완료 기준

- 챌린지의 요구사항 문장마다 대응하는 통합 테스트가 있다.
- `it.todo`가 남아 있지 않다.
- 오류·빈 상태·로딩 상태 중 해당 챌린지에 있는 것이 모두 검증된다.
- 쿼리가 `getByRole`·`getByLabelText` 위주다. `data-testid`를 쓴 곳에는 이유가 있다.
- `npm run test`가 통과한다.
