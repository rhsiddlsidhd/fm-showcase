import { describe, expect, it } from "vitest";

// shared/test는 전역 테스트 준비 코드만 둔다(docs/architecture/segments.md).
// 챌린지 전용 fixture는 그 챌린지 슬라이스의 api 세그먼트에 둔다.
// fixture는 JSON이라 ESLint 경로 규칙이 닿지 않아 파일 목록으로 판정한다.
describe("shared/test/fixtures", () => {
  it("챌린지별 하위 폴더를 두지 않는다", () => {
    const nested = Object.keys(import.meta.glob("./fixtures/*/**"));

    expect(nested).toEqual([]);
  });
});
