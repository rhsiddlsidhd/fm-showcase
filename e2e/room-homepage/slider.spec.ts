import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectRingShownOnFocus,
  readRing,
  tabThroughPage,
} from "../weather-app/keyboard-focus.ts";

const firstSlide = {
  title: "Discover innovative ways to decorate",
  description:
    "We provide unmatched quality, comfort, and style for property owners across the country. Our experts combine form and function in bringing your vision to life. Create a room in your own style with our collection and make your property a reflection of you and what you love.",
  image: "/room-homepage/desktop-image-hero-1.jpg",
};

const secondSlide = {
  title: "We are available all across the globe",
  description:
    "With stores all over the world, it's easy for you to find furniture for your home or place of business. Locally, we’re in most major cities throughout the country. Find the branch nearest you using our store locator. Any questions? Don't hesitate to contact us today.",
  image: "/room-homepage/desktop-image-hero-2.jpg",
};

const previousButton = (page: Page) =>
  page.getByRole("button", { name: "이전 슬라이드", exact: true });

const nextButton = (page: Page) =>
  page.getByRole("button", { name: "다음 슬라이드", exact: true });

async function expectSlide(page: Page, slide: typeof firstSlide) {
  await expect(
    page.getByRole("heading", { level: 1, name: slide.title, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(slide.description, { exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      page
        .getByRole("img")
        .evaluateAll((images) =>
          images
            .filter(
              (image): image is HTMLImageElement =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0,
            )
            .map((image) => new URL(image.currentSrc).pathname),
        ),
    )
    .toContain(slide.image);
}

async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 20; step += 1) {
    await page.keyboard.press("Tab");
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      return;
    }
  }
  await expect(target, "Tab 순회로 슬라이더 버튼에 도달한다").toBeFocused();
}

test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  await page.goto("/room-homepage");
});

test("홈페이지 주소로 직접 들어가면 첫 대표 이미지와 소개, Shop now 문구가 보인다", async ({
  page,
}) => {
  await expectSlide(page, firstSlide);
  await expect(page.getByText(/^shop now$/i)).toBeVisible();
  await expect(page).toHaveURL(/\/room-homepage$/);
});

test("마우스로 다음과 이전을 클릭하면 이미지와 소개가 둘째에서 첫째로 함께 바뀐다", async ({
  page,
}) => {
  await expectSlide(page, firstSlide);

  await nextButton(page).click();
  await expectSlide(page, secondSlide);

  await previousButton(page).click();
  await expectSlide(page, firstSlide);
  await expect(page).toHaveURL(/\/room-homepage$/);
});

for (const key of ["Enter", "Space"]) {
  test(`Tab으로 이동한 슬라이더 버튼의 초점이 보이고 ${key}로 둘째 소개와 첫째 소개를 오간다`, async ({
    page,
  }) => {
    await expectSlide(page, firstSlide);
    const previous = previousButton(page);
    const next = nextButton(page);
    const previousUnfocused = await previous.evaluate(readRing);
    const nextUnfocused = await next.evaluate(readRing);

    await tabTo(page, previous);
    expectRingShownOnFocus({
      label: "이전 슬라이드",
      focused: await previous.evaluate(readRing),
      unfocused: previousUnfocused,
    });
    await page.keyboard.press("Tab");
    await expect(next).toBeFocused();
    expectRingShownOnFocus({
      label: "다음 슬라이드",
      focused: await next.evaluate(readRing),
      unfocused: nextUnfocused,
    });

    await page.keyboard.press(key);
    await expectSlide(page, secondSlide);
    await expect(next).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(previous).toBeFocused();
    await page.keyboard.press(key);
    await expectSlide(page, firstSlide);
    await expect(previous).toBeFocused();
  });
}

for (const label of ["home", "shop", "about", "contact", "Shop now"]) {
  test(`${label} 문구는 클릭하거나 Tab으로 순회해도 경로와 슬라이드, 메뉴 상태를 바꾸지 않는다`, async ({
    page,
  }) => {
    await expectSlide(page, firstSlide);
    await nextButton(page).click();
    await expectSlide(page, secondSlide);

    const text = page.getByText(new RegExp(`^${label}$`, "i"));
    await expect(text).toBeVisible();
    await expect(
      page.getByRole("link", { name: label, exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: label, exact: true }),
    ).toHaveCount(0);
    expect(
      await text.evaluate((element) => {
        for (
          let node: Element | null = element;
          node;
          node = node.parentElement
        ) {
          if (
            node.matches('a[href], button, [role="link"], [role="button"]') ||
            (node instanceof HTMLElement && node.tabIndex >= 0)
          ) {
            return false;
          }
        }
        return true;
      }),
      "문구와 그 조상은 링크·버튼·탭 정지점이 아니다",
    ).toBe(true);

    await text.click();
    await expect(page).toHaveURL(/\/room-homepage$/);
    await expectSlide(page, secondSlide);
    await expect(page.getByRole("dialog", { name: "메뉴" })).toHaveCount(0);

    const visits = await tabThroughPage(page);
    expect(
      visits.some((visit) =>
        visit.label.toLowerCase().includes(`"${label.toLowerCase()}"`),
      ),
      "실제 Tab 순회에서도 정적 문구에 초점이 머물지 않는다",
    ).toBe(false);
    for (const menu of ["home", "shop", "about", "contact"]) {
      await expect(page.getByText(menu, { exact: true })).toBeVisible();
    }
    await expect(page).toHaveURL(/\/room-homepage$/);
    await expectSlide(page, secondSlide);
    await expect(page.getByRole("dialog", { name: "메뉴" })).toHaveCount(0);
  });
}
