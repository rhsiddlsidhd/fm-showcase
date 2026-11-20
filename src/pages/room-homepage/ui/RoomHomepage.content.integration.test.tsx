import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomHomepagePage } from "../index";

const firstDescription =
  "We provide unmatched quality, comfort, and style for property owners across the country. Our experts combine form and function in bringing your vision to life. Create a room in your own style with our collection and make your property a reflection of you and what you love.";

const aboutDescription =
  "Our multifunctional collection blends design and function to suit your individual taste. Make each room unique, or pick a cohesive theme that best express your interests and what inspires you. Find the furniture pieces you need, from traditional to contemporary styles or anything in between. Product specialists are available to help you create your dream space.";

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

describe("Room 홈페이지 첫 화면", () => {
  it("첫 대표 소개의 이미지와 제목, 원본 설명, Shop now 문구가 함께 보인다", () => {
    render(<RoomHomepagePage />);

    const firstImage = screen
      .getAllByRole("img")
      .find(
        (image) =>
          image.getAttribute("src") ===
          "/room-homepage/desktop-image-hero-1.jpg",
      );

    expect(firstImage).toBeVisible();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Discover innovative ways to decorate",
      }),
    ).toBeVisible();
    expect(screen.getByText(firstDescription)).toBeVisible();
    expect(screen.getByText(/^shop now$/i)).toBeVisible();
  });

  it("About our furniture 제목과 원본 가구 소개 본문이 보인다", () => {
    render(<RoomHomepagePage />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /^about our furniture$/i,
      }),
    ).toBeVisible();
    expect(screen.getByText(aboutDescription)).toBeVisible();
  });

  it("넓은 화면에서 네 메뉴가 링크 역할과 탭 정지점 없는 버튼으로 보인다", () => {
    render(<RoomHomepagePage />);

    for (const name of ["home", "shop", "about", "contact"]) {
      const menuButton = screen.getByRole("button", { name });

      expect(menuButton).toBeVisible();
      expect(menuButton).toHaveProperty("tagName", "BUTTON");
      expect(menuButton).toHaveAttribute("tabindex", "-1");
      expect(screen.queryByRole("link", { name })).toBeNull();

      let element: HTMLElement | null = menuButton;
      while (element) {
        expect(element.tabIndex).toBeLessThan(0);
        // 버튼 조상에 별도의 탭 정지점이 생기지 않는지도 확인한다.
        // eslint-disable-next-line testing-library/no-node-access
        element = element.parentElement;
      }
    }
  });
});
