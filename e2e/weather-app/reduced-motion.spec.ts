import { expect, test, type Page } from "@playwright/test";
import { holdOpenMeteo, routeOpenMeteoToBerlin } from "./open-meteo-route.ts";

// 움직임 줄이기 설정에 따른 분기(docs/ui/animation.md「애니메이션 동작 줄이기 설정 대응」)를 본다.
// 애니메이션 진행 과정은 검증 대상이 아니라서(docs/testing/test-boundaries.md) 보간값은 보지 않고,
// 대상이 보이는 동안 매 프레임 변형 값을 기록해 처음 값에서 바뀌지 않는지(줄이기)
// 또는 바뀌는지(일반 모션)만 본다. 두 쪽이 짝이라야 애니메이션이 아예 없는 구현을 가려낸다
// (docs/testing/test-policy.md「작성 규칙」). 일반 모션 쪽은 처음부터 통과하는 회귀 테스트다.
// 변형은 요소 자신과 조상의 계산된 transform(그리고 같은 효과를 내는 translate·rotate·scale)을 모은 것이다.
// 움직임을 감싼 요소에 걸어도 잡히도록 조상까지 읽는다.

const searchSpinner = 'img[src="/weather-app/images/icon-loading.svg"][alt=""]';
const loadingDot = '[data-testid="loading-dot"]';
const candidateList = '[role="listbox"]';

type Sample = { time: number; transforms: string[] };

// 지금부터 매 프레임, selector에 맞는 보이는 요소들의 변형 값을 기록한다.
async function startRecording(page: Page, selector: string) {
  await page.evaluate((target) => {
    const samples: Sample[] = [];
    const readChain = (element: Element) => {
      const chain: string[] = [];
      for (
        let node: Element | null = element;
        node;
        node = node.parentElement
      ) {
        const style = getComputedStyle(node);
        chain.push(
          `${style.transform} ${style.translate} ${style.rotate} ${style.scale}`,
        );
      }
      return chain.join(" | ");
    };
    const record = (time: number) => {
      const visible = [...document.querySelectorAll(target)].filter(
        (element) => element.getBoundingClientRect().width > 0,
      );
      if (visible.length > 0) {
        samples.push({ time, transforms: visible.map(readChain) });
      }
      requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
    (window as unknown as { __samples: Sample[] }).__samples = samples;
  }, selector);
}

async function recordedSamples(page: Page) {
  return page.evaluate(
    () => (window as unknown as { __samples: Sample[] }).__samples,
  );
}

// 대상이 보인 뒤 durationMs 넘게 여러 번 기록됐고, 모든 기록이 처음과 같다.
function expectTransformsUnchanged(
  samples: Sample[],
  expectedCount: number,
  durationMs: number,
) {
  expect(
    samples.length,
    "대상이 보이는 동안 두 번 이상 기록됐다",
  ).toBeGreaterThan(1);
  const [first] = samples;
  const last = samples[samples.length - 1];
  expect(
    last.time - first.time,
    `기록이 ${durationMs}ms 넘게 이어졌다`,
  ).toBeGreaterThanOrEqual(durationMs);
  expect(first.transforms, `대상 ${expectedCount}개가 보였다`).toHaveLength(
    expectedCount,
  );
  for (const sample of samples) {
    expect(
      sample.transforms,
      `${Math.round(sample.time - first.time)}ms 뒤에도 처음과 같다`,
    ).toEqual(first.transforms);
  }
}

// 대상이 보인 동안 요소마다 변형 값이 처음 기록과 달라진 적이 있다.
function transformsChanged(samples: Sample[], expectedCount: number) {
  if (samples.length === 0 || samples[0].transforms.length !== expectedCount) {
    return false;
  }
  const [first] = samples;
  return first.transforms.every((initial, index) =>
    samples.some((sample) => sample.transforms[index] !== initial),
  );
}

// 일반 모션에서는 시간이 지나면 변형이 달라진다. 고정 대기 없이 달라질 때까지 다시 확인한다.
async function expectTransformsToChange(page: Page, expectedCount: number) {
  await expect
    .poll(
      async () => transformsChanged(await recordedSamples(page), expectedCount),
      {
        message: `대상 ${expectedCount}개의 변형이 모두 시간이 지나며 달라졌다`,
      },
    )
    .toBe(true);
}

async function openWithBerlin(page: Page) {
  await routeOpenMeteoToBerlin(page);
  await page.goto("/weather-app");
  await expect(page.getByText("Berlin, Germany").first()).toBeVisible();
}

const searchInput = (page: Page) => page.getByRole("combobox");

// 세 장면: 대상이 보이는 순간부터 변형을 기록하기 시작하고, 대상 개수를 돌려준다.
async function showSearchSpinner(page: Page) {
  await openWithBerlin(page);
  await holdOpenMeteo(page, "geocoding", "geocoding-berlin.json");
  await startRecording(page, searchSpinner);

  await searchInput(page).fill("Berlin");
  await searchInput(page).press("Enter");
  await expect(page.locator(searchSpinner)).toBeVisible();
  return 1;
}

async function showCandidatePanel(page: Page) {
  await openWithBerlin(page);
  const release = await holdOpenMeteo(
    page,
    "geocoding",
    "geocoding-berlin.json",
  );
  await searchInput(page).fill("Berlin");
  await searchInput(page).press("Enter");
  await expect(page.getByText("Search in progress").first()).toBeVisible();
  // 목록이 처음 그려지는 프레임부터 기록한다.
  await startRecording(page, candidateList);

  release();
  await expect(page.getByRole("listbox")).toBeVisible();
  return 1;
}

async function showLoadingDots(page: Page) {
  await openWithBerlin(page);
  await searchInput(page).fill("Berlin");
  await searchInput(page).press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await holdOpenMeteo(page, "forecast", "forecast-berlin-1d.json");
  await startRecording(page, loadingDot);

  await page
    .getByRole("option", { name: "Berlin, State of Berlin, Germany" })
    .click();
  await expect(page.locator(loadingDot)).toHaveCount(3);
  for (const dot of await page.locator(loadingDot).all()) {
    await expect(dot).toBeVisible();
  }
  return 3;
}

test.describe("움직임 줄이기", () => {
  test.use({ reducedMotion: "reduce" });

  test("검색하면 진행 중 아이콘이 보이고 시간이 지나도 회전하지 않는다", async ({
    page,
  }) => {
    const count = await showSearchSpinner(page);
    // 일반 모션의 한 바퀴(800ms)보다 길게 지켜본다.
    await page.waitForTimeout(1000);
    await expect(page.locator(searchSpinner)).toBeVisible();

    expectTransformsUnchanged(await recordedSamples(page), count, 800);
  });

  test("검색 결과를 받으면 후보 목록 패널이 세로 이동 없이 나타난다", async ({
    page,
  }) => {
    const count = await showCandidatePanel(page);
    // 일반 모션의 열림 시간(150ms)보다 길게 지켜본다.
    await page.waitForTimeout(400);

    expectTransformsUnchanged(await recordedSamples(page), count, 300);
  });

  test("날씨를 불러오는 동안 점 3개가 보이고 시간이 지나도 움직이지 않는다", async ({
    page,
  }) => {
    const count = await showLoadingDots(page);
    // 일반 모션의 한 주기(600ms)와 점 사이 지연(150ms × 2)보다 길게 지켜본다.
    await page.waitForTimeout(1000);
    await expect(page.locator(loadingDot)).toHaveCount(3);

    expectTransformsUnchanged(await recordedSamples(page), count, 900);
  });
});

// 위 줄이기 단언의 짝이다. 같은 장면에서 일반 모션이면 변형이 달라진다.
test.describe("일반 모션", () => {
  test.use({ reducedMotion: "no-preference" });

  test("검색하면 진행 중 아이콘이 시간이 지나며 회전한다", async ({ page }) => {
    const count = await showSearchSpinner(page);

    await expectTransformsToChange(page, count);
  });

  test("검색 결과를 받으면 후보 목록 패널이 세로로 이동하며 나타난다", async ({
    page,
  }) => {
    const count = await showCandidatePanel(page);

    await expectTransformsToChange(page, count);
  });

  test("날씨를 불러오는 동안 점 3개가 시간이 지나며 움직인다", async ({
    page,
  }) => {
    const count = await showLoadingDots(page);

    await expectTransformsToChange(page, count);
  });
});
