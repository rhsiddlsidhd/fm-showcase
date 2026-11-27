import { describe, expect, it } from "vitest";

// 슬라이스가 참조하는 자산은 public/<슬라이스>/에 있어야 한다(docs/ui/static-assets.md).
// 경로 문자열 테스트는 가리키는 파일이 실제로 있는지 확인하지 못하고, jsdom은 이미지를
// 불러오지 않아 없는 파일도 통과한다. 그래서 소스의 경로를 public/ 파일 목록과 대조한다.
// 보간하거나 이어 붙인 경로는 무엇을 가리키는지 판정할 수 없으므로 그 자체를 실패로 둔다.
// 주석을 걸러내지 않으므로 주석 안의 경로도 검사한다.
const sources = import.meta.glob<string>(
  ["/src/pages/*/**/*.{ts,tsx,css}", "!**/*.test.*"],
  { query: "?raw", import: "default", eager: true },
);
const publicFiles = new Set(
  Object.keys(import.meta.glob("/public/**/*")).map((file) =>
    file.slice("/public".length),
  ),
);

const sliceOf = (file: string) => file.split("/")[3];
const slices = [...new Set(Object.keys(sources).map(sliceOf))].join("|");
const extensions = "svg|png|jpe?g|webp|gif|avif|ico";

// 따옴표, 백틱, url( 바로 뒤에서 자산 확장자로 끝나는 경로.
const assetReference = new RegExp(
  `(?<=["'\`(])(?:/|\\$\\{|(?:${slices})/)[^"'\`()\\s]*\\.(?:${extensions})(?=["'\`)])`,
  "gi",
);
// 따옴표나 백틱 바로 뒤에서 /<슬라이스>/ 또는 <슬라이스>/로 시작하는 문자열.
// 확장자로 끝나지 않아도 잡는다. 슬라이스 소스에서 이 형태는 자산 경로뿐이라
// 하위 라우트 같은 다른 문자열도 위반으로 둔다.
const sliceLiteral = new RegExp(`(?<=["'\`])/?(?:${slices})/[^"'\`\\n]*`, "g");
const completePath = new RegExp(`^/[^"'\`()\\s$]*\\.(?:${extensions})$`, "i");

const INCOMPLETE = "완전한 문자열이 아닌 경로";

function findAssetViolations(
  files: Record<string, string>,
  existing: Set<string>,
) {
  const violations: string[] = [];
  let referenceCount = 0;

  for (const [file, source] of Object.entries(files)) {
    const slice = sliceOf(file);
    const checked = new Set<number>();

    for (const match of source.matchAll(assetReference)) {
      const [reference] = match;
      referenceCount += 1;
      checked.add(match.index);
      if (reference.includes("${")) {
        violations.push(`${file}: ${INCOMPLETE} ${reference}`);
      } else if (!reference.startsWith("/")) {
        violations.push(`${file}: 상대 경로 ${reference}`);
      } else if (!reference.startsWith(`/${slice}/`)) {
        violations.push(`${file}: 슬라이스 밖 경로 ${reference}`);
      } else if (!existing.has(reference)) {
        violations.push(`${file}: 없는 파일 ${reference}`);
      }
    }

    for (const match of source.matchAll(sliceLiteral)) {
      const [literal] = match;
      if (checked.has(match.index) || completePath.test(literal)) continue;
      violations.push(`${file}: ${INCOMPLETE} ${literal}`);
    }
  }

  return { violations, referenceCount };
}

const check = (line: string) =>
  findAssetViolations({ "/src/pages/weather-app/ui/X.tsx": line }, publicFiles)
    .violations;

describe("정적 자산 참조", () => {
  it("슬라이스의 자산 경로는 public/<슬라이스>/에 있는 파일을 가리킨다", () => {
    const { violations, referenceCount } = findAssetViolations(
      sources,
      publicFiles,
    );

    expect(referenceCount).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  it.each([
    ["없는 파일", '"/weather-app/images/lgo.svg"', "없는 파일"],
    ["다른 슬라이스의 파일", '"/room-homepage/logo.svg"', "슬라이스 밖 경로"],
    ["상대 경로", '"weather-app/images/logo.svg"', "상대 경로"],
    ["보간한 파일 이름", "`/weather-app/images/icon-${kind}.webp`", INCOMPLETE],
    ["보간한 폴더", "`${IMAGES}/logo.svg`", INCOMPLETE],
    ["확장자까지 보간한 경로", "`/weather-app/images/${file}`", INCOMPLETE],
    ["선두 /가 없는 보간 경로", "`weather-app/images/${file}`", INCOMPLETE],
    [
      "함수 호출을 보간한 경로",
      "`/weather-app/images/icon-${toSlug(kind)}.webp`",
      INCOMPLETE,
    ],
    [
      "조건식을 보간한 경로",
      '`/weather-app/images/icon-${a ? "x" : "y"}.webp`',
      INCOMPLETE,
    ],
    ["이어 붙인 경로", '"/weather-app/images/" + name + ".webp"', INCOMPLETE],
  ])("%s는 위반이다", (_, line, reason) => {
    expect(check(line)).toEqual([expect.stringContaining(reason)]);
  });

  it.each([
    ["작은따옴표 경로", "'/weather-app/images/logo.svg'"],
    ["CSS 배경 경로", "bg-[url(/weather-app/images/bg-today-small.svg)]"],
    ["public/로 시작하는 설명", "(public/weather-app/images/logo.svg)"],
    ["슬라이스 라우트", '"/weather-app"'],
  ])("%s는 위반이 아니다", (_, line) => {
    expect(check(line)).toEqual([]);
  });
});
