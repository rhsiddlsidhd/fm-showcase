# 컴포넌트 규칙

- 원자 컴포넌트는 shadcn/ui를 먼저 쓴다.
- `className`과 shadcn/ui 부품의 합성으로 맞출 수 없으면 그 슬라이스의 `ui/`에 직접 만든다.
- `src/shared/ui/`의 shadcn 산출물은 손으로 고치지 않는다.
- 코드 위치는 [레이어](../architecture/layers.md)와 [세그먼트](../architecture/segments.md)를 따른다.
