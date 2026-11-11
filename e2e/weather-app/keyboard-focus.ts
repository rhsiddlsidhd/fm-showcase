import { expect, type JSHandle, type Page } from "@playwright/test";
import { routeOpenMeteo } from "./open-meteo-route.ts";

// 포커스 링이 "보인다"의 판정 기준(ux-design.md 「포커스 표시(모든 인터랙티브 요소) — 테두리 --ring」,
// 「focus: 키보드 포커스 진입 → 포커스 링 표시」):
// 포커스를 받은 요소의 계산된 outline 또는 box-shadow 중 보이는 층(색이 투명하지 않고 두께·번짐이 0이 아닌 것)이
// 있고, 그 보이는 층이 포커스가 없을 때와 다르다. 색 값 자체는 단언하지 않는다.
// 애니메이션 진행 과정은 검증 대상이 아니라서(test-boundaries.md) 전환 효과를 끄고 최종 상태만 본다.

export type Ring = { outline: string | null; shadows: string[] };

// 요소의 계산된 스타일에서 보이는 outline과 box-shadow 층만 뽑는다. 브라우저 안에서 실행된다.
export function readRing(element: Element): Ring {
  const style = getComputedStyle(element);

  const isTransparent = (color: string) => {
    if (color === "transparent") return true;
    const inner = color.slice(color.indexOf("(") + 1, color.lastIndexOf(")"));
    const slash = inner.split("/");
    if (slash.length === 2) return parseFloat(slash[1]) === 0;
    const parts = inner.split(",");
    return parts.length === 4 && parseFloat(parts[3]) === 0;
  };

  const splitTopLevel = (value: string) => {
    const result: string[] = [];
    let depth = 0;
    let current = "";
    for (const char of value) {
      if (char === "(") depth += 1;
      if (char === ")") depth -= 1;
      if (char === "," && depth === 0) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) result.push(current.trim());
    return result;
  };

  const outlineVisible =
    style.outlineStyle !== "none" &&
    parseFloat(style.outlineWidth) > 0 &&
    !isTransparent(style.outlineColor);

  const shadows =
    style.boxShadow === "none"
      ? []
      : splitTopLevel(style.boxShadow).filter((layer) => {
          const colorMatch = layer.match(/[a-z]+\([^()]*(\([^()]*\)[^()]*)*\)/);
          const color = colorMatch ? colorMatch[0] : "";
          if (color && isTransparent(color)) return false;
          const lengths = layer
            .replace(color, "")
            .replace("inset", "")
            .trim()
            .split(/\s+/)
            .map((length) => parseFloat(length))
            .filter((length) => !Number.isNaN(length));
          return lengths.some((length) => length !== 0);
        });

  return {
    outline: outlineVisible
      ? `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor} ${style.outlineOffset}`
      : null,
    shadows,
  };
}

const hasVisibleRing = (ring: Ring) =>
  ring.outline !== null || ring.shadows.length > 0;

const sameRing = (a: Ring, b: Ring) =>
  a.outline === b.outline && a.shadows.join("|") === b.shadows.join("|");

function describe(element: Element) {
  const role = element.getAttribute("role") ?? element.tagName.toLowerCase();
  const name =
    element.getAttribute("aria-label") ??
    element.getAttribute("placeholder") ??
    element.textContent?.trim().slice(0, 40) ??
    "";
  return `${role} "${name}"`;
}

export async function disableTransitions(page: Page) {
  await page.addStyleTag({
    content:
      "*, *::before, *::after { transition: none !important; animation: none !important; }",
  });
}

export async function openWithBerlinWeekly(page: Page) {
  await routeOpenMeteo(page, {
    geocoding: "geocoding-berlin.json",
    forecast: "forecast-berlin-7d.json",
  });
  await page.goto("/weather-app");
  await expect(page.getByText("Berlin, Germany").first()).toBeVisible();
  await disableTransitions(page);
}

export type Visit = { label: string; focused: Ring; unfocused: Ring };

// 문서 처음부터 Tab으로 끝까지 돌며, 요소마다 포커스가 있을 때와 다음 Tab으로 떠난 뒤의 링을 잰다.
export async function tabThroughPage(page: Page): Promise<Visit[]> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
  const visits: Visit[] = [];
  let previous: {
    handle: JSHandle<Element>;
    label: string;
    focused: Ring;
  } | null = null;
  const seen: JSHandle<Element>[] = [];

  for (let step = 0; step < 60; step += 1) {
    await page.keyboard.press("Tab");
    const handle = await page.evaluateHandle(
      () => document.activeElement ?? document.body,
    );

    if (previous) {
      visits.push({
        label: previous.label,
        focused: previous.focused,
        unfocused: await previous.handle.evaluate(readRing),
      });
    }

    const isBody = await handle.evaluate((el) => el === document.body);
    let revisited = false;
    for (const other of seen) {
      if (await page.evaluate(([a, b]) => a === b, [handle, other])) {
        revisited = true;
        break;
      }
    }
    if (isBody || revisited) break;

    seen.push(handle);
    previous = {
      handle,
      label: await handle.evaluate(describe),
      focused: await handle.evaluate(readRing),
    };
  }
  return visits;
}

export function expectRingShownOnFocus(visit: Visit) {
  expect(
    hasVisibleRing(visit.focused),
    `${visit.label}에 포커스가 있을 때 보이는 outline 또는 box-shadow가 있다`,
  ).toBe(true);
  expect(
    sameRing(visit.focused, visit.unfocused),
    `${visit.label}의 포커스 표시가 포커스가 없을 때와 다르다`,
  ).toBe(false);
}

export const unitsButton = (page: Page) =>
  page.getByRole("button", { name: "Units" });

const DAY_NAME = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/;

// 요일 선택기 버튼은 지금 선택된 요일 전체 이름을 이름으로 갖는다.
export const daySelector = (page: Page) =>
  page.getByRole("button", { name: DAY_NAME });

export const menuItems = (page: Page) =>
  page
    .getByRole("menu")
    .locator(
      '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]',
    );
