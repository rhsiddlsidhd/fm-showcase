import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectRingShownOnFocus,
  readRing,
} from "../weather-app/keyboard-focus.ts";

const menuLabels = ["home", "shop", "about", "contact"];

const openButton = (page: Page) =>
  page.getByRole("button", {
    name: "메뉴 열기",
    exact: true,
    includeHidden: true,
  });

const menuDialog = (page: Page) =>
  page.getByRole("dialog", { name: "메뉴", exact: true });

const visibleMenuText = (page: Page, label: string) =>
  page.getByText(label, { exact: true }).and(page.locator(":visible"));

const closeButton = (page: Page) =>
  menuDialog(page).getByRole("button", { name: "메뉴 닫기", exact: true });

async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 20; step += 1) {
    await page.keyboard.press("Tab");
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      return;
    }
  }
  await expect(target, "Tab으로 메뉴 열기 버튼에 도달한다").toBeFocused();
}

async function expectFocusedInViewport(target: Locator) {
  await expect(target).toBeFocused();
  await expect(target).toBeVisible();
  await expect(target).toBeInViewport({ ratio: 1 });
}

async function expectFocusedRing(target: Locator, label: string) {
  await expectFocusedInViewport(target);
  const focused = await target.evaluate(readRing);
  await target.evaluate((element) => (element as HTMLElement).blur());
  const unfocused = await target.evaluate(readRing);
  await target.focus();
  expectRingShownOnFocus({ label, focused, unfocused });
}

async function expectClosed(page: Page) {
  await expect(menuDialog(page)).toBeHidden();
  await expect(openButton(page)).toHaveAttribute("aria-expanded", "false");
  await expectFocusedInViewport(openButton(page));
  for (const label of menuLabels) {
    await expect(visibleMenuText(page, label)).toHaveCount(0);
  }
}

test.use({ viewport: { width: 375, height: 812 } });

test.beforeEach(async ({ page }) => {
  await page.goto("/room-homepage");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Discover innovative ways to decorate",
      exact: true,
    }),
  ).toBeVisible();
  await expect(openButton(page)).toBeVisible();
});

test("모바일 메뉴를 열면 탭 정지점 없는 네 메뉴 버튼이 표시되고 클릭해도 상태가 유지된다", async ({
  page,
}) => {
  const opener = openButton(page);
  await expect(opener).toBeVisible();
  await expect(opener).toHaveAttribute("aria-expanded", "false");
  for (const label of menuLabels) {
    await expect(visibleMenuText(page, label)).toHaveCount(0);
  }

  await opener.click();
  const dialog = menuDialog(page);
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(opener).toHaveAttribute("aria-expanded", "true");
  const controlledId = await opener.getAttribute("aria-controls");
  expect(controlledId).toBeTruthy();
  await expect(dialog).toHaveAttribute("id", controlledId ?? "");

  for (const label of menuLabels) {
    const button = dialog.getByRole("button", { name: label, exact: true });
    await expect(button).toBeVisible();
    await expect(button).toHaveJSProperty("tagName", "BUTTON");
    await expect(button).toHaveAttribute("tabindex", "-1");
    await expect(
      dialog.getByRole("link", { name: label, exact: true }),
    ).toHaveCount(0);
    await button.click();
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/room-homepage$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Discover innovative ways to decorate",
        includeHidden: true,
      }),
    ).toBeVisible();
  }
});

for (const key of ["Enter", "Space"]) {
  test(`Tab으로 찾은 메뉴 버튼을 ${key}로 열면 닫기 버튼으로 보이는 초점이 옮겨 간다`, async ({
    page,
  }) => {
    const opener = openButton(page);
    await expect(opener).toBeVisible();
    const unfocused = await opener.evaluate(readRing);
    await tabTo(page, opener);
    await expectFocusedInViewport(opener);
    expectRingShownOnFocus({
      label: "메뉴 열기",
      focused: await opener.evaluate(readRing),
      unfocused,
    });

    await page.keyboard.press(key);
    await expect(menuDialog(page)).toBeVisible();
    await expectFocusedRing(closeButton(page), "메뉴 닫기");
  });
}

for (const action of ["닫기 버튼", "Escape"]) {
  test(`${action}으로 열린 메뉴를 닫으면 문구가 숨겨지고 열기 버튼으로 초점이 돌아온다`, async ({
    page,
  }) => {
    await openButton(page).click();
    await expect(menuDialog(page)).toBeVisible();
    await expect(closeButton(page)).toBeFocused();

    if (action === "닫기 버튼") {
      await closeButton(page).click();
    } else {
      await page.keyboard.press("Escape");
    }
    await expectClosed(page);
  });
}

test("열린 메뉴에서 Tab과 Shift+Tab을 눌러도 닫기 버튼만 초점을 받는다", async ({
  page,
}) => {
  await tabTo(page, openButton(page));
  await page.keyboard.press("Enter");
  const closer = closeButton(page);
  await expectFocusedInViewport(closer);

  for (const key of ["Tab", "Tab", "Shift+Tab", "Shift+Tab"]) {
    await page.keyboard.press(key);
    await expectFocusedInViewport(closer);
  }
});

test("메뉴가 열려 있는 동안 배경은 inert여서 슬라이더와 열기 버튼에 초점을 줄 수 없다", async ({
  page,
}) => {
  const backgroundButtons = [
    openButton(page),
    page.getByRole("button", {
      name: "이전 슬라이드",
      exact: true,
      includeHidden: true,
    }),
    page.getByRole("button", {
      name: "다음 슬라이드",
      exact: true,
      includeHidden: true,
    }),
  ];
  await openButton(page).click();
  const closer = closeButton(page);
  await expectFocusedInViewport(closer);
  expect(
    await closer.evaluate((element) => Boolean(element.closest("[inert]"))),
  ).toBe(false);

  for (const button of backgroundButtons) {
    await expect(button).toHaveCount(1);
    expect(
      await button.evaluate((element) => Boolean(element.closest("[inert]"))),
      "배경 조작 항목은 inert 영역 안에 있다",
    ).toBe(true);
    await button.evaluate((element) => (element as HTMLElement).focus());
    await expect(closer).toBeFocused();
  }

  await page.keyboard.press("Escape");
  await expectClosed(page);
  for (const button of backgroundButtons) {
    expect(
      await button.evaluate((element) => Boolean(element.closest("[inert]"))),
    ).toBe(false);
  }
});

test("열린 메뉴는 767px에서 유지되고 768px에서 닫히며 이전 슬라이드 버튼의 초점이 화면에 보인다", async ({
  page,
}) => {
  await tabTo(page, openButton(page));
  await page.keyboard.press("Enter");
  await expect(menuDialog(page)).toBeVisible();

  await page.setViewportSize({ width: 767, height: 240 });
  await expect(menuDialog(page)).toBeVisible();
  await expect(closeButton(page)).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.setViewportSize({ width: 768, height: 240 });

  await expect(menuDialog(page)).toBeHidden();
  await expect(openButton(page)).toBeHidden();
  const previous = page.getByRole("button", {
    name: "이전 슬라이드",
    exact: true,
  });
  await expectFocusedRing(previous, "이전 슬라이드");
  expect(
    await previous.evaluate((element) => Boolean(element.closest("[inert]"))),
  ).toBe(false);
  for (const label of menuLabels) {
    await expect(visibleMenuText(page, label)).toHaveCount(1);
  }

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(menuDialog(page)).toBeHidden();
  await expect(openButton(page)).toHaveAttribute("aria-expanded", "false");
});
