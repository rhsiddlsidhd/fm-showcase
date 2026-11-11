import { expect, test } from "@playwright/test";
import {
  expectRingShownOnFocus,
  menuItems,
  openWithBerlinWeekly,
  readRing,
  unitsButton,
} from "./keyboard-focus.ts";

// 포커스 링 판정 기준은 keyboard-focus.ts 머리 주석에 있다.

test.describe("포커스 링", () => {
  test("키보드로 연 Units 드롭다운에서 방향키로 옮겨 가는 옵션마다 포커스 링이 보인다", async ({
    page,
  }) => {
    await openWithBerlinWeekly(page);
    await unitsButton(page).focus();
    await page.keyboard.press("Enter");
    const items = menuItems(page);
    await expect(items.first()).toBeFocused();

    const count = await items.count();
    expect(count).toBeGreaterThan(1);
    for (let index = 0; index < count; index += 1) {
      const item = items.nth(index);
      await expect(item).toBeFocused();
      const label = `옵션 "${(await item.textContent())?.trim()}"`;
      const focused = await item.evaluate(readRing);
      await page.keyboard.press("ArrowDown");
      // 포커스가 실제로 다음 항목(마지막이면 첫 항목)으로 옮겨 간 뒤에 포커스 없는 상태를 읽는다.
      await expect(item).not.toBeFocused();
      const unfocused = await item.evaluate(readRing);
      expectRingShownOnFocus({ label, focused, unfocused });
    }
  });
});
