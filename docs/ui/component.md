# 컴포넌트 규칙

- 원자 컴포넌트는 `src/shared/ui/`의 shadcn/ui 산출물 중 적합한 부품을 먼저 쓴다.
- 적합한 산출물이 없으면 shadcn/ui 공식 컴포넌트 목록과 레지스트리에서 설치 여부와 관계없이 후보를 찾고, Context7·공식 문서·CLI 등으로 실제 구성과 API를 확인해 요구사항과 대조한다. 채택한 부품은 프로젝트 설정 경로에 추가한다.
- 검토한 shadcn/ui 부품의 `className` 조정과 조합으로 요구사항을 충족할 수 없으면 그 슬라이스의 `ui/`에 직접 만든다.
- `src/shared/ui/`의 shadcn 산출물은 손으로 고치지 않는다.
- 코드 위치는 [레이어](../architecture/layers.md)와 [세그먼트](../architecture/segments.md)를 따른다.
