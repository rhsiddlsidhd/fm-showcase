import { expect, test, type Locator, type Page } from "@playwright/test";

const titles = [
  "Discover innovative ways to decorate",
  "We are available all across the globe",
  "Manufactured with the best materials",
] as const;
const widths = [320, 375, 767, 768, 1440];
const hero = (page: Page) => page.locator('img[src*="-image-hero-"]');
const darkPhoto = (page: Page) =>
  page.locator('img[src$="/image-about-dark.jpg"]');
const lightPhoto = (page: Page) =>
  page.locator('img[src$="/image-about-light.jpg"]');
const heading = (page: Page) => page.getByRole("heading", { level: 1 });
const aboutHeading = (page: Page) =>
  page.getByRole("heading", { name: "About our furniture", exact: true });
const nextButton = (page: Page) =>
  page.getByRole("button", { name: "다음 슬라이드", exact: true });
const menuButton = (page: Page) =>
  page.getByRole("button", { name: "메뉴 열기", exact: true });

type Box = { x: number; y: number; width: number; height: number };
const bottom = (box: Box) => box.y + box.height;
const right = (box: Box) => box.x + box.width;
const sameRow = (a: Box, b: Box) => a.y < bottom(b) && b.y < bottom(a);

async function box(target: Locator) {
  await expect(target).toBeVisible();
  const bounds = await target.boundingBox();
  expect(bounds, "대상이 실제 화면에 배치된다").not.toBeNull();
  return bounds!;
}

async function expectLoadedImage(target: Locator) {
  await expect(target).toBeVisible();
  await expect
    .poll(() =>
      target.evaluate(
        (element) =>
          element instanceof HTMLImageElement &&
          element.complete &&
          element.naturalWidth > 0,
      ),
    )
    .toBe(true);
}

async function expectNoOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth, "문서에 가로 넘침이 없다").toBeLessThanOrEqual(
    dimensions.width,
  );
}

for (const width of widths) {
  test(`${width}px에서 소개와 하단 사진이 겹치거나 잘리지 않고 가로 넘침 없이 배치된다`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/room-homepage");
    await expect(heading(page)).toHaveText(titles[0]);

    const shop = page.getByText(/^shop now$/i);
    const description = page.getByText(/^We provide unmatched quality/);
    const aboutDescription = page.getByText(/^Our multifunctional collection/);
    const targets = [
      hero(page),
      heading(page),
      description,
      shop,
      darkPhoto(page),
      aboutHeading(page),
      aboutDescription,
      lightPhoto(page),
    ];
    const bounds = await Promise.all(targets.map(box));
    await expectNoOverflow(page);
    for (const [index, rect] of bounds.entries()) {
      expect(
        rect.x,
        `콘텐츠 ${index + 1}의 왼쪽이 잘리지 않는다`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        right(rect),
        `콘텐츠 ${index + 1}의 오른쪽이 잘리지 않는다`,
      ).toBeLessThanOrEqual(width);
    }
    const [image, title, body, action, dark, about, aboutBody, light] = bounds;
    if (
      !image ||
      !title ||
      !body ||
      !action ||
      !dark ||
      !about ||
      !aboutBody ||
      !light
    ) {
      throw new Error("배치를 잴 요소 8개를 모두 찾지 못했다");
    }
    expect(body.y, "제목과 본문이 겹치지 않는다").toBeGreaterThanOrEqual(
      bottom(title),
    );
    expect(action.y, "본문과 Shop now가 겹치지 않는다").toBeGreaterThanOrEqual(
      bottom(body),
    );
    expect(
      aboutBody.y,
      "가구 소개 제목과 본문이 겹치지 않는다",
    ).toBeGreaterThanOrEqual(bottom(about));

    if (width < 768) {
      expect(
        title.y,
        "대표 이미지 아래에 본문이 놓인다",
      ).toBeGreaterThanOrEqual(bottom(image));
      expect(
        dark.y,
        "대표 소개 아래에 어두운 사진이 놓인다",
      ).toBeGreaterThanOrEqual(bottom(action));
      expect(
        about.y,
        "어두운 사진 아래에 가구 소개가 놓인다",
      ).toBeGreaterThanOrEqual(bottom(dark));
      expect(
        light.y,
        "가구 소개 아래에 밝은 사진이 놓인다",
      ).toBeGreaterThanOrEqual(bottom(aboutBody));
    } else {
      expect(sameRow(image, title), "대표 이미지와 본문이 같은 행이다").toBe(
        true,
      );
      expect(
        title.x,
        "대표 이미지 오른쪽에 본문이 놓인다",
      ).toBeGreaterThanOrEqual(right(image));
      expect(
        dark.y,
        "상단 이미지 아래에 하단 행이 놓인다",
      ).toBeGreaterThanOrEqual(bottom(image));
      expect(
        dark.y,
        "상단 본문 아래에 하단 행이 놓인다",
      ).toBeGreaterThanOrEqual(bottom(action));
      expect(
        sameRow(dark, about) && sameRow(about, light),
        "하단 세 영역이 같은 행이다",
      ).toBe(true);
      expect(
        about.x,
        "어두운 사진과 가구 소개가 겹치지 않는다",
      ).toBeGreaterThanOrEqual(right(dark));
      expect(
        light.x,
        "가구 소개와 밝은 사진이 겹치지 않는다",
      ).toBeGreaterThanOrEqual(Math.max(right(about), right(aboutBody)));
    }
  });
}

for (const [index, title] of titles.entries()) {
  test(`${title} 소개는 모바일과 데스크톱에서 해당 크기의 원본 사진을 선택한다`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/room-homepage");
    for (let step = 0; step < index; step += 1) {
      await nextButton(page).click();
    }
    await expect(heading(page)).toHaveText(title);
    for (const [width, variant] of [
      [375, "mobile"],
      [1440, "desktop"],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      await expectLoadedImage(hero(page));
      await expect
        .poll(() =>
          hero(page).evaluate(
            (element) =>
              new URL((element as HTMLImageElement).currentSrc).pathname,
          ),
        )
        .toBe(`/room-homepage/${variant}-image-hero-${index + 1}.jpg`);
      await expect(heading(page)).toHaveText(title);
    }
  });
}

test("모바일과 데스크톱에서 어두운 실내와 밝은 의자 원본 사진이 로드되어 보인다", async ({
  page,
}) => {
  await page.goto("/room-homepage");
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const photo of [darkPhoto(page), lightPhoto(page)]) {
      await expectLoadedImage(photo);
      await photo.scrollIntoViewIfNeeded();
      await expect(photo).toBeInViewport();
      await expect(photo).toHaveAccessibleName(/\S/);
    }
  }
});

test("움직임 줄이기 설정에서도 사진과 메뉴가 비필수 애니메이션 없이 바뀐다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/room-homepage");
  await page.evaluate(() => {
    const state = { moving: false };
    const sample = () => {
      state.moving ||= document.getAnimations().some((animation) => {
        const timing = animation.effect?.getTiming();
        return (
          timing &&
          Number(timing.duration) > 0 &&
          animation.playState === "running"
        );
      });
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    (window as unknown as { roomMotion: typeof state }).roomMotion = state;
  });
  await nextButton(page).click();
  await expect(heading(page)).toHaveText(titles[1]);
  await expectLoadedImage(hero(page));
  await menuButton(page).click();
  await expect(page.getByRole("dialog", { name: "메뉴" })).toBeVisible();
  await page.getByRole("button", { name: "메뉴 닫기", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "메뉴" })).toBeHidden();
  await expect(heading(page)).toHaveText(titles[1]);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { roomMotion: { moving: boolean } }).roomMotion
          .moving,
    ),
    "실제 조작 중 비필수 애니메이션이 실행되지 않는다",
  ).toBe(false);
});

test("투명도 줄이기 설정에서는 열린 메뉴 아래 가림막이 불투명해진다", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const session = await context.newCDPSession(page);
  const alphas: number[] = [];
  for (const value of ["no-preference", "reduce"]) {
    await session.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-transparency", value }],
    });
    await page.goto("/room-homepage");
    expect(
      await page.evaluate(
        (setting) =>
          matchMedia(`(prefers-reduced-transparency: ${setting})`).matches,
        value,
      ),
    ).toBe(true);
    await menuButton(page).click();
    await expect(page.getByRole("dialog", { name: "메뉴" })).toBeVisible();
    const alpha = await page.evaluate(() => {
      // 메뉴 아래 뷰포트를 덮는 실제 면을 관찰하며 클래스·토큰 이름에 의존하지 않는다.
      const surfaces = document.elementsFromPoint(
        innerWidth / 2,
        innerHeight - 8,
      );
      const surface = surfaces.find((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          style.position === "fixed" &&
          rect.left <= 0 &&
          rect.right >= innerWidth &&
          rect.bottom >= innerHeight &&
          style.backgroundColor !== "rgba(0, 0, 0, 0)"
        );
      });
      if (!surface) return null;
      const canvas = document.createElement("canvas");
      const drawing = canvas.getContext("2d")!;
      drawing.fillStyle = getComputedStyle(surface).backgroundColor;
      drawing.fillRect(0, 0, 1, 1);
      return (
        (drawing.getImageData(0, 0, 1, 1).data[3]! / 255) *
        Number(getComputedStyle(surface).opacity)
      );
    });
    expect(alpha, "메뉴 아래를 덮는 가림막이 존재한다").not.toBeNull();
    alphas.push(alpha!);
  }
  expect(alphas[0], "일반 설정에서는 배경이 비친다").toBeGreaterThan(0);
  expect(alphas[0]).toBeLessThan(1);
  expect(alphas[1], "투명도 줄이기에서는 가림막이 불투명하다").toBe(1);
});
