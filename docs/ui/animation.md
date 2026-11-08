# 애니메이션 규칙

- 우리가 만드는 애니메이션은 `motion` 라이브러리로만 구현한다. CSS `transition`, `@keyframes`, `tw-animate-css`를 직접 쓰지 않는다. 방식이 섞이면 움직임 줄이기 처리를 방식마다 따로 확인해야 한다.
- shadcn/ui 부품 안에 들어 있는 효과는 건드리지 않는다. `src/shared/ui/`의 산출물을 고치지 않는다는 [컴포넌트 규칙](component.md)과 같은 이유다.
- 움직임의 거리, 시간, 이징은 디자인 토큰이 아니다. `motion`은 이 값을 CSS 변수가 아닌 JS 값으로 받는다. 슬라이스 `ui/`의 상수로 두고, 컴포넌트에 숫자를 직접 쓰지 않는다.

## 성능

- 레이아웃을 바꾸는 속성(`width`, `height`, `top`, `left`, `margin`, `padding` 등)은 움직이지 않는다. 매 프레임 주변 요소까지 다시 계산해 끊긴다.
- 같은 결과는 transform 계열(`x`, `y`, `scale`, `rotate`)과 `opacity`로 낸다. 이 둘은 보통 합성 단계에서 처리된다.
- 색, 그림자처럼 페인트만 다시 하는 속성은 움직여도 된다.
- `backdrop-filter`는 움직이지 않는다. 매 프레임 뒤 배경을 다시 흐려 비용이 크다.
- 크기가 바뀔 때 주변 요소가 함께 움직여야 하면 `layout`을 쓴다. 그 요소만 바뀌면 `scale`을 쓴다.
- 비율이 바뀌는 `scale`은 내용을 왜곡한다. 내용이 있는 요소는 자식에도 `layout`을 줘 보정하거나, 내용이 없는 요소만 늘린다.
- 사라지는 요소는 트리에서 빼고 `AnimatePresence`의 `exit`으로 움직인다. `opacity: 0`으로 남겨 두지 않는다. 남은 요소는 자리를 차지하고 포커스를 받는다.
- 이 규칙으로 표현할 수 없는 움직임은 이유를 설계안에 쓰고 [`(미결정)`](../spec/README.md#작성-규칙)으로 둔다.

## 움직임 줄이기

움직임 줄이기를 `motion`으로 구현하는 방법이다.

- `MotionConfig reducedMotion="user"`만으로는 hover·focus 효과와 진입 `opacity`가 남는다.
- `useReducedMotion` 값으로 `initial`, `whileHover`, `whileFocus`, `layout`을 직접 끈다.
