# 단위 테스트 전략

한 조각의 동작을 협력 대상에서 떼어 검증한다. 공통 규칙은 [`README.md`](./README.md)를 따른다.

## 대상

| 대상 | 예 | 단위로 보는 이유 |
| ---- | -- | ---------------- |
| 순수 함수 | 폼 검증, 값 변환, 날짜·금액 계산, 필터·정렬 | 입력과 출력만으로 판정된다. 가장 싸고 빠르다 |
| 커스텀 훅 | 토글·카운터·폼 상태를 다루는 훅 | 화면 없이 상태 전이를 확인한다 |
| 상태 로직 | reducer, 상태 기계 | 상태와 이벤트의 조합이 많아 표로 검증한다 |
| 표현 컴포넌트 | props를 받아 그리는 작은 컴포넌트 (`Button`, 카드) | props → 출력의 대응을 확인한다 |

## 대상이 아닌 것

| 대상 | 검증할 층 |
| ---- | --------- |
| 여러 컴포넌트가 묶인 화면의 흐름 | [통합](./integration.md) |
| 라우팅, 페이지 이동 | [통합](./integration.md) |
| 실제 브라우저에서만 드러나는 것 (레이아웃, 반응형, 포커스 이동) | [E2E](./e2e.md) |
| `src/components/ui/`의 shadcn 컴포넌트 자체 | 하지 않는다. 라이브러리가 보장한다. 우리가 얹은 조합만 통합에서 본다 |
| 스타일(Tailwind 클래스) | 하지 않는다 |

## 도구

| 도구 | 용도 |
| ---- | ---- |
| Vitest | 실행기, 단언, 대역 (`vi.fn`, `vi.useFakeTimers`) |
| `@testing-library/react` | 컴포넌트 렌더, `renderHook` |
| `@testing-library/user-event` | 사용자 입력 (`fireEvent`보다 우선) |
| `@testing-library/jest-dom` | `toBeInTheDocument` 등 DOM 단언 (`src/test/setup.ts`에서 등록됨) |

## 작성 규칙

### 순수 함수

- 경계값과 대표값을 표로 나열한다. 값마다 `it`을 늘리지 말고 `it.each`를 쓴다.
- 입력을 바꾸지 않는지(불변성)가 중요한 함수만 그것을 검증한다.

```ts
describe("isValidEmail", () => {
  it.each([
    ["a@b.co", true],
    ["a@b", false],
    ["", false],
    [" a@b.co ", false],
  ])("%j → %s", (input, expected) => {
    expect(isValidEmail(input)).toBe(expected);
  });
});
```

### 훅

- `renderHook`으로 렌더하고, 상태를 바꾸는 호출은 `act`로 감싼다.
- 훅이 외부 값(타이머, `localStorage`)을 쓰면 그 값을 통제한 상태에서 검증한다.

### 컴포넌트

- 내부 state를 보지 않고 **렌더된 결과와 호출된 콜백**을 본다.
- 콜백은 `vi.fn()`으로 받아 호출 인자를 확인한다.
- 사용자 입력은 `userEvent.setup()`으로 만든 인스턴스를 쓴다.

```tsx
it("눌렀을 때 onSelect를 호출한다", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<PlanCard name="Pro" onSelect={onSelect} />);

  await user.click(screen.getByRole("button", { name: /select pro/i }));

  expect(onSelect).toHaveBeenCalledOnce();
});
```

## 대역(test double) 규칙

- 대역은 **테스트 대상 바깥의 협력 대상**에만 쓴다. 대상 자신의 내부 함수를 대역으로 바꾸지 않는다.
- 같은 모듈 안의 함수를 부분 대역으로 바꾸는 테스트는 구현에 묶인다. 필요해 보이면 대상 분리를 먼저 검토한다.
- `vi.mock`은 모듈 경계(네트워크, 저장소, 날짜)에만 쓴다.
- 대역이 현실과 다르게 동작할 위험이 있는 경계는 통합 또는 E2E에서 진짜로 한 번 확인한다.

## TDD 적용

1. 함수 시그니처(이름, 입출력)만 정하고, 빈 구현 또는 `throw new Error("not implemented")`를 둔다.
2. 대표 입력 하나의 테스트를 쓰고 실패 이유가 "기대값 불일치"인지 확인한다.
3. 통과시키는 가장 단순한 구현을 쓴다. 입력을 하나씩 늘리며 반복한다.
4. 반복이 끝나 로직이 확정되면 경계값·오류 입력을 `it.each`로 정리한다.

## 완료 기준

- 새 순수 로직은 정상 입력, 경계값, 잘못된 입력을 각각 하나 이상 가진다.
- 훅·컴포넌트는 관찰 가능한 동작마다 테스트가 있고, 구현을 바꿔도(동작이 같으면) 테스트가 깨지지 않는다.
- `npm run test`가 통과한다.
