import { expect, test, type Page } from "@playwright/test";
import { holdOpenMeteo, routeOpenMeteoToBerlin } from "./open-meteo-route.ts";

// 움직임 줄이기 분기(ux-design.md 「인터랙션과 애니메이션」의 움직임 줄이기 열)를 본다.
// 애니메이션 진행 과정은 검증 대상이 아니라서(test-boundaries.md) 보간값은 보지 않고,
// 대상이 보이는 동안 매 프레임 변형 값을 기록해 처음 값에서 바뀌지 않는지만 본다.
// 변형은 요소 자신과 조상의 계산된 transform(그리고 같은 효과를 내는 translate·rotate·scale)을 모은 것이다.
// 움직임을 감싼 요소에 걸어도 잡히도록 조상까지 읽는다.

test.use({ reducedMotion: "reduce" });

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

async function openWithBerlin(page: Page) {
  await routeOpenMeteoToBerlin(page);
  await page.goto("/weather-app");
  await expect(page.getByText("Berlin, Germany").first()).toBeVisible();
}

const searchInput = (page: Page) => page.getByRole("combobox");

test("움직임 줄이기에서 검색하면 진행 중 아이콘이 보이고 시간이 지나도 회전하지 않는다", async ({
  page,
}) => {
  await openWithBerlin(page);
  await holdOpenMeteo(page, "geocoding", "geocoding-berlin.json");
  await startRecording(page, searchSpinner);

  await searchInput(page).fill("Berlin");
  await searchInput(page).press("Enter");
  await expect(page.locator(searchSpinner)).toBeVisible();
  // 일반 모션의 한 바퀴(800ms)보다 길게 지켜본다.
  await page.waitForTimeout(1000);
  await expect(page.locator(searchSpinner)).toBeVisible();

  expectTransformsUnchanged(await recordedSamples(page), 1, 800);
});

test("움직임 줄이기에서 검색 결과를 받으면 후보 목록 패널이 세로 이동 없이 나타난다", async ({
  page,
}) => {
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
  // 일반 모션의 열림 시간(150ms)보다 길게 지켜본다.
  await page.waitForTimeout(400);

  expectTransformsUnchanged(await recordedSamples(page), 1, 300);
});

test("움직임 줄이기에서 날씨를 불러오는 동안 점 3개가 보이고 시간이 지나도 움직이지 않는다", async ({
  page,
}) => {
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
  // 일반 모션의 한 주기(600ms)와 점 사이 지연(150ms × 2)보다 길게 지켜본다.
  await page.waitForTimeout(1000);
  await expect(page.locator(loadingDot)).toHaveCount(3);

  expectTransformsUnchanged(await recordedSamples(page), 3, 900);
});
