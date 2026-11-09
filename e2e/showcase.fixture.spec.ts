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
      // 마지막 카드는 처음에 목록의 보이는 영역 밖에 있다.
      await expect
        .poll(async () =>
          (await measureRail(page))?.fullyVisible.includes(
            titles.indexOf(lastTitle!),
          ),
        )
        .toBe(false);

      const target = cardLink(page, lastTitle!);
      for (let i = 0; i < 50; i += 1) {
        await page.keyboard.press("Tab");
        if (await target.evaluate((el) => el === document.activeElement)) break;
      }
      await expect(target).toBeFocused();

      await expect
        .poll(() => measureFocusedCard(page, lastTitle!))
        .toEqual({
          outlineShown: true,
          linkVisible: true,
          outlineVisible: true,
        });
    });
  });
}
