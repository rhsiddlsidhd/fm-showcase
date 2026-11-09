import { expect, test, type Page } from "@playwright/test";
import { challenges } from "./fixtures/showcase-registry.ts";

// Tailwind 기본 브레이크포인트: md = 48rem(768px), lg = 64rem(1024px).
// 이 저장소의 src/app/styles/index.css는 이 값을 재정의하지 않는다.
const layouts = [
  { width: 767, label: "md 미만", visible: 1 },
  { width: 768, label: "md 이상·lg 미만", visible: 2 },
  { width: 1023, label: "md 이상·lg 미만", visible: 2 },
  { width: 1024, label: "lg 이상", visible: 3 },
] as const;

const titles = challenges.map((challenge) => challenge.title);
const lastTitle = titles[titles.length - 1];

function cardLink(page: Page, title: string) {
  return page.getByRole("link", { name: new RegExp(title) });
}

for (const area of [
  "체크 기호",
  "레이블 글자",
  "글자·체크 기호 밖 레이블 표면",
] as const) {
  test(`Newbie 칩의 ${area} 위치를 클릭하면 Newbie가 선택된다`, async ({
    page,
  }) => {
    await page.goto("/");
    const checkbox = page
      .getByRole("group", { name: "난이도", exact: true })
      .getByRole("checkbox", { name: "Newbie", exact: true });
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
    await page.evaluate(() => document.fonts.ready);
    await checkbox.scrollIntoViewIfNeeded();

    const point = await checkbox.evaluate((element, targetArea) => {
      const control = element.getBoundingClientRect();
      if (targetArea === "체크 기호") {
        return {
          x: control.x + control.width / 2,
          y: control.y + control.height / 2,
        };
      }

      const label = (element as HTMLButtonElement).labels?.[0];
      if (!label) throw new Error("Newbie에 연결된 레이블이 없다");
      const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
      let text = walker.nextNode();
      while (text && !text.textContent?.includes("Newbie"))
        text = walker.nextNode();
      if (!text) throw new Error("레이블에 Newbie 글자가 없다");
      const start = text.textContent!.indexOf("Newbie");
      const range = document.createRange();
      range.setStart(text, start);
      range.setEnd(text, start + "Newbie".length);
      const word = range.getBoundingClientRect();
      if (targetArea === "레이블 글자") {
        // 첫 글자 N의 실제 텍스트 영역 중앙을 누른다.
        range.setEnd(text, start + 1);
        const letter = range.getBoundingClientRect();
        return {
          x: letter.x + letter.width / 2,
          y: letter.y + letter.height / 2,
        };
      }

      // 레이블은 가상 요소로 칩 전체에 클릭 영역을 넓힐 수도 있다.
      // 연결된 레이블과 체크박스를 함께 담은 칩의 실제 치수를 쓴다.
      let chip: Element = label;
      while (!chip.contains(element)) {
        if (!chip.parentElement) throw new Error("Newbie 칩을 찾을 수 없다");
        chip = chip.parentElement;
      }
      const surface = chip.getBoundingClientRect();
      const left = Math.min(word.left, control.left);
      const right = Math.max(word.right, control.right);
      const top = Math.min(word.top, control.top);
      const bottom = Math.max(word.bottom, control.bottom);
      const centerX = surface.x + surface.width / 2;
      const centerY = surface.y + surface.height / 2;
      const spaces = [
        { gap: left - surface.left, x: (surface.left + left) / 2, y: centerY },
        {
          gap: surface.right - right,
          x: (right + surface.right) / 2,
          y: centerY,
        },
        { gap: top - surface.top, x: centerX, y: (surface.top + top) / 2 },
        {
          gap: surface.bottom - bottom,
          x: centerX,
          y: (bottom + surface.bottom) / 2,
        },
      ].sort((a, b) => b.gap - a.gap);
      const space = spaces[0]!;
      if (space.gap <= 2)
        throw new Error("레이블에 글자·체크 기호 밖 클릭 가능한 여백이 없다");
      const hit = document.elementFromPoint(space.x, space.y);
      if (!hit || !label.contains(hit)) {
        throw new Error("칩의 여백 좌표가 연결된 레이블 표면에 닿지 않는다");
      }
      return { x: space.x, y: space.y };
    }, area);

    await page.mouse.click(point.x, point.y);

    await expect(checkbox).toBeChecked();
    await expect
      .poll(() => new URL(page.url()).searchParams.getAll("difficulty"))
      .toEqual(["Newbie"]);
  });
}

// 카드들을 담은 가로 스크롤 영역(Rail)의 보이는 범위 안에 카드가 전부 들어오는지 본다.
// 가로 스크롤 영역이 없으면 null을 돌려준다.
async function measureRail(page: Page) {
  const handles = await Promise.all(
    titles.map((title) => cardLink(page, title).elementHandle()),
  );
  return page.evaluate((cards) => {
    const findScroller = (element: Element) => {
      let node = element.parentElement;
      while (node) {
        const overflowX = getComputedStyle(node).overflowX;
        if (overflowX === "auto" || overflowX === "scroll") return node;
        node = node.parentElement;
      }
      return null;
    };
    const scroller = findScroller(cards[0]!);
    if (!scroller) return null;
    const box = scroller.getBoundingClientRect();
    const viewLeft = box.left + scroller.clientLeft;
    const viewRight = viewLeft + scroller.clientWidth;
    const rects = cards.map((card) => card!.getBoundingClientRect());
    return {
      fullyVisible: rects
        .map((rect, index) => ({ rect, index }))
        .filter(
          ({ rect }) =>
            rect.left >= viewLeft - 0.5 && rect.right <= viewRight + 0.5,
        )
        .map(({ index }) => index),
      tops: rects.map((rect) => Math.round(rect.top)),
      scrollable: scroller.scrollWidth > scroller.clientWidth,
      // 목록 중 뷰포트 안에 보이는 부분의 중앙. 카드가 뷰포트보다 높아도
      // 휠 입력이 실제로 목록 위에서 일어나게 한다.
      pointer: {
        x: (Math.max(box.left, 0) + Math.min(box.right, innerWidth)) / 2,
        y: (Math.max(box.top, 0) + Math.min(box.bottom, innerHeight)) / 2,
      },
    };
  }, handles);
}

// 포커스된 카드 링크와 그 포커스 표시(outline) 영역이 목록의 보이는 영역과
// 뷰포트 안에 모두 들어오는지 본다. 포커스가 카드에 없으면 null을 돌려준다.
async function measureFocusedCard(page: Page, title: string) {
  const handle = await cardLink(page, title).elementHandle();
  return page.evaluate((card) => {
    if (!card || document.activeElement !== card) return null;
    let scroller = card.parentElement;
    while (scroller) {
      const overflowX = getComputedStyle(scroller).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") break;
      scroller = scroller.parentElement;
    }
    if (!scroller) return null;
    const box = scroller.getBoundingClientRect();
    const view = {
      left: Math.max(box.left + scroller.clientLeft, 0),
      top: Math.max(box.top + scroller.clientTop, 0),
      right: Math.min(
        box.left + scroller.clientLeft + scroller.clientWidth,
        innerWidth,
      ),
      bottom: Math.min(
        box.top + scroller.clientTop + scroller.clientHeight,
        innerHeight,
      ),
    };
    const style = getComputedStyle(card);
    const outlineWidth = parseFloat(style.outlineWidth) || 0;
    const outlineShown = style.outlineStyle !== "none" && outlineWidth > 0;
    const spread = outlineShown
      ? Math.max(outlineWidth + (parseFloat(style.outlineOffset) || 0), 0)
      : 0;
    const rect = card.getBoundingClientRect();
    const inside = (r: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }) =>
      r.left >= view.left - 0.5 &&
      r.right <= view.right + 0.5 &&
      r.top >= view.top - 0.5 &&
      r.bottom <= view.bottom + 0.5;
    return {
      outlineShown,
      linkVisible: inside(rect),
      outlineVisible: inside({
        left: rect.left - spread,
        top: rect.top - spread,
        right: rect.right + spread,
        bottom: rect.bottom + spread,
      }),
    };
  }, handle);
}

async function expectKeyboardCardExposure(page: Page) {
  // 마지막 카드는 처음에 목록의 보이는 영역 밖에 있다.
  await expect
    .poll(async () =>
      (await measureRail(page))?.fullyVisible.includes(
        titles.indexOf(lastTitle!),
      ),
    )
    .toBe(false);

  const target = cardLink(page, lastTitle!);
  const before = await target.boundingBox();
  expect(before).not.toBeNull();
  // 승인된 세로 황금비를 실제 링크 치수로 확인한다. 서브픽셀 반올림만 허용한다.
  expect(
    Math.abs(before!.height - before!.width * 1.61803398875),
  ).toBeLessThanOrEqual(1);
  for (let i = 0; i < 50; i += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((el) => el === document.activeElement)) break;
  }
  await expect(target).toBeFocused();
  const after = await target.boundingBox();
  expect(after).not.toBeNull();
  expect(
    Math.abs(after!.height - after!.width * 1.61803398875),
  ).toBeLessThanOrEqual(1);
  expect(Math.abs(after!.width - before!.width)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(after!.height - before!.height)).toBeLessThanOrEqual(0.5);

  await expect
    .poll(() => measureFocusedCard(page, lastTitle!))
    .toEqual({
      outlineShown: true,
      linkVisible: true,
      outlineVisible: true,
    });
}

for (const { width, label, visible } of layouts) {
  test.describe(`화면 폭 ${width}px (${label})`, () => {
    test.use({ viewport: { width, height: 900 } });

    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await expect(cardLink(page, titles[0]!)).toBeVisible();
    });

    test(`챌린지 카드 ${visible}개가 목록의 보이는 영역 안에 전부 들어온다`, async ({
      page,
    }) => {
      await expect
        .poll(
          async () => (await measureRail(page))?.fullyVisible.length ?? null,
        )
        .toBe(visible);
    });

    test("등록된 챌린지 카드는 모두 한 줄에 놓인다", async ({ page }) => {
      await expect
        .poll(async () => {
          const rail = await measureRail(page);
          return rail ? new Set(rail.tops).size : null;
        })
        .toBe(1);
    });

    test("보이는 영역을 넘친 카드는 목록을 가로로 넘겨 볼 수 있다", async ({
      page,
    }) => {
      await expect
        .poll(async () => (await measureRail(page))?.scrollable ?? null)
        .toBe(true);

      // 사용자가 목록을 화면 안으로 끌어온 뒤 그 위에서 가로로 넘긴다.
      await cardLink(page, titles[0]!).scrollIntoViewIfNeeded();
      const rail = await measureRail(page);
      await page.mouse.move(rail!.pointer.x, rail!.pointer.y);
      await page.mouse.wheel(2000, 0);

      await expect
        .poll(async () => {
          const after = await measureRail(page);
          return after?.fullyVisible.includes(titles.indexOf(lastTitle!));
        })
        .toBe(true);
    });

    test("키보드로 화면 밖 카드에 포커스를 옮기면 카드 전체와 포커스 표시가 보인다", async ({
      page,
    }) => {
      await expectKeyboardCardExposure(page);
    });
  });
}

for (const { width, visible } of layouts.filter(
  ({ width }) => width !== 1023,
)) {
  test.describe(`화면 ${width}×600px`, () => {
    test.use({ viewport: { width, height: 600 } });

    test(`낮은 화면에서도 카드 ${visible}개 노출과 황금비를 유지하며 키보드와 가로 스크롤로 탐색한다`, async ({
      page,
    }) => {
      await page.goto("/");
      await expect(cardLink(page, titles[0]!)).toBeVisible();
      await expect
        .poll(
          async () => (await measureRail(page))?.fullyVisible.length ?? null,
        )
        .toBe(visible);
      await expect
        .poll(async () => {
          const rail = await measureRail(page);
          return rail ? new Set(rail.tops).size : null;
        })
        .toBe(1);
      await expectKeyboardCardExposure(page);
      const rail = await measureRail(page);
      expect(rail?.scrollable).toBe(true);
      await page.mouse.move(rail!.pointer.x, rail!.pointer.y);
      await page.mouse.wheel(-2000, 0);
      await expect
        .poll(async () => (await measureRail(page))?.fullyVisible.includes(0))
        .toBe(true);
      await expect
        .poll(
          async () => (await measureRail(page))?.fullyVisible.length ?? null,
        )
        .toBe(visible);
    });
  });
}
