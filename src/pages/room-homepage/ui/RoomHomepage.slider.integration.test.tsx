import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomHomepagePage } from "../index";

const slides = [
  {
    title: "Discover innovative ways to decorate",
    description:
      "We provide unmatched quality, comfort, and style for property owners across the country. Our experts combine form and function in bringing your vision to life. Create a room in your own style with our collection and make your property a reflection of you and what you love.",
    desktopImage: "/room-homepage/desktop-image-hero-1.jpg",
    mobileImage: "/room-homepage/mobile-image-hero-1.jpg",
  },
  {
    title: "We are available all across the globe",
    description:
      "With stores all over the world, it's easy for you to find furniture for your home or place of business. Locally, we’re in most major cities throughout the country. Find the branch nearest you using our store locator. Any questions? Don't hesitate to contact us today.",
    desktopImage: "/room-homepage/desktop-image-hero-2.jpg",
    mobileImage: "/room-homepage/mobile-image-hero-2.jpg",
  },
  {
    title: "Manufactured with the best materials",
    description:
      "Our modern furniture store provide a high level of quality. Our company has invested in advanced technology to ensure that every product is made as perfect and as consistent as possible. With three decades of experience in this industry, we understand what customers want for their home and office.",
    desktopImage: "/room-homepage/desktop-image-hero-3.jpg",
    mobileImage: "/room-homepage/mobile-image-hero-3.jpg",
  },
];

beforeEach(() => {
  vi.stubGlobal("innerWidth", 1440);
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string): MediaQueryList => {
      const widthQuery = query.match(
        /\((min|max)-width:\s*(\d+(?:\.\d+)?)(px|rem)\)/,
      );
      const width = widthQuery
        ? Number(widthQuery[2]) * (widthQuery[3] === "rem" ? 16 : 1)
        : 0;

      return {
        matches: widthQuery
          ? widthQuery[1] === "min"
            ? 1440 >= width
            : 1440 <= width
          : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      };
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const expectSlide = (index: number) => {
  const slide = slides[index];

  expect(
    screen.getByRole("heading", { level: 1, name: slide.title }),
  ).toBeVisible();
  expect(screen.getByText(slide.description)).toBeVisible();

  const image = screen
    .getAllByRole("img")
    .find((element) =>
      [slide.desktopImage, slide.mobileImage].includes(
        element.getAttribute("src") ?? "",
      ),
    );
  expect(image).toBeVisible();

  // picture의 source는 접근성 트리에 없으므로 같은 이미지의 반응형 출처를 확인한다.
  // eslint-disable-next-line testing-library/no-node-access
  const picture = image!.closest("picture");
  // eslint-disable-next-line testing-library/no-node-access
  const sources = picture ? Array.from(picture.querySelectorAll("source")) : [];
  const imagePaths = [image!, ...sources].flatMap((element) =>
    [element.getAttribute("src"), element.getAttribute("srcset")].flatMap(
      (value) =>
        value?.match(
          /\/room-homepage\/(?:desktop|mobile)-image-hero-\d\.jpg/g,
        ) ?? [],
    ),
  );

  expect([...new Set(imagePaths)].sort()).toEqual(
    [slide.desktopImage, slide.mobileImage].sort(),
  );
};

describe("Room 홈페이지 슬라이드 탐색", () => {
  it("다음을 누를 때 둘째와 셋째 소개의 제목, 원본 설명, 이미지 쌍이 차례로 함께 보인다", async () => {
    const user = userEvent.setup();
    render(<RoomHomepagePage />);
    expectSlide(0);

    await user.click(screen.getByRole("button", { name: "다음 슬라이드" }));
    expectSlide(1);

    await user.click(screen.getByRole("button", { name: "다음 슬라이드" }));
    expectSlide(2);
  });

  it("셋째 소개에서 이전을 누를 때 둘째와 첫째 소개의 제목, 원본 설명, 이미지 쌍이 차례로 함께 보인다", async () => {
    const user = userEvent.setup();
    render(<RoomHomepagePage />);
    await user.click(screen.getByRole("button", { name: "다음 슬라이드" }));
    await user.click(screen.getByRole("button", { name: "다음 슬라이드" }));
    expectSlide(2);

    await user.click(screen.getByRole("button", { name: "이전 슬라이드" }));
    expectSlide(1);

    await user.click(screen.getByRole("button", { name: "이전 슬라이드" }));
    expectSlide(0);
  });

  it("첫째 소개에서 이전을 누르면 셋째 소개의 제목, 원본 설명, 이미지 쌍으로 순환한다", async () => {
    const user = userEvent.setup();
    render(<RoomHomepagePage />);
    expectSlide(0);

    await user.click(screen.getByRole("button", { name: "이전 슬라이드" }));

    expectSlide(2);
  });

  it("셋째 소개에서 다음을 누르면 첫째 소개의 제목, 원본 설명, 이미지 쌍으로 순환한다", async () => {
    const user = userEvent.setup();
    render(<RoomHomepagePage />);
    await user.click(screen.getByRole("button", { name: "다음 슬라이드" }));
    await user.click(screen.getByRole("button", { name: "다음 슬라이드" }));
    expectSlide(2);

    await user.click(screen.getByRole("button", { name: "다음 슬라이드" }));

    expectSlide(0);
  });

  it("처음 비어 있는 하나의 상태 알림 영역이 유지되며 바뀐 소개의 제목과 순서를 알린다", async () => {
    const user = userEvent.setup();
    render(<RoomHomepagePage />);
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();

    for (const index of [1, 2, 0]) {
      await user.click(screen.getByRole("button", { name: "다음 슬라이드" }));

      expect(screen.getByRole("status")).toBe(status);
      expect(status).toHaveTextContent(slides[index].title);
      expect(status).toHaveTextContent(new RegExp(`\\b${index + 1}\\b`));
      expect(status).toHaveTextContent(/\b3\b/);
    }

    await user.click(screen.getByRole("button", { name: "이전 슬라이드" }));

    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent(slides[2].title);
    expect(status).toHaveTextContent(/\b3\b/);
  });
});
