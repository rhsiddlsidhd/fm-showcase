import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Challenge } from "../model/challenge";
import { ShowcaseController } from "./ShowcaseController";

// 검증용 가상 데이터 A~D. 앱의 등록 목록에는 추가하지 않는다.
const challengeA: Challenge = {
  slug: "challenge-a",
  title: "가상 챌린지 가",
  description: "가 챌린지의 설명입니다.",
  difficulty: "Newbie",
  stack: ["HTML", "CSS"],
};
const challengeB: Challenge = {
  slug: "challenge-b",
  title: "가상 챌린지 나",
  description: "나 챌린지의 설명입니다.",
  difficulty: "Junior",
  stack: ["HTML", "CSS", "JavaScript"],
};
const challengeC: Challenge = {
  slug: "challenge-c",
  title: "가상 챌린지 다",
  description: "다 챌린지의 설명입니다.",
  difficulty: "Intermediate",
  stack: ["TypeScript", "React", "Tailwind CSS"],
};
const challengeD: Challenge = {
  slug: "challenge-d",
  title: "가상 챌린지 라",
  description: "라 챌린지의 설명입니다.",
  difficulty: "Newbie",
  stack: ["CSS", "JavaScript"],
};
const challenges: readonly Challenge[] = [
  challengeA,
  challengeB,
  challengeC,
  challengeD,
];

// jsdom은 scrollIntoView를 구현하지 않는다. 카드 포커스 노출은 E2E에서 확인한다.
const originalScrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});
afterAll(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

const renderList = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <ShowcaseController challenges={challenges} />
    </MemoryRouter>,
  );

const getCard = (challenge: Challenge) =>
  screen.getByRole("link", { name: challenge.title });

describe("ShowcaseController 카드 목록", () => {
  it("등록된 챌린지마다 제목을 이름으로 가진 카드 링크가 하나씩 보인다", () => {
    renderList();

    for (const challenge of challenges) {
      expect(getCard(challenge)).toBeInTheDocument();
    }
  });

  it("카드마다 제목이 제목 요소로 보인다", () => {
    renderList();

    for (const challenge of challenges) {
      expect(
        within(getCard(challenge)).getByRole("heading", {
          level: 2,
          name: challenge.title,
        }),
      ).toBeInTheDocument();
    }
  });

  it("카드마다 그 챌린지의 난이도가 보인다", () => {
    renderList();

    for (const challenge of challenges) {
      expect(
        within(getCard(challenge)).getByText(challenge.difficulty),
      ).toBeInTheDocument();
    }
  });

  it("카드마다 그 챌린지의 사용 기술이 모두 보인다", () => {
    renderList();

    for (const challenge of challenges) {
      const card = within(getCard(challenge));
      for (const stack of challenge.stack) {
        expect(card.getByText(stack)).toBeInTheDocument();
      }
    }
  });

  it("카드마다 그 챌린지의 설명이 보인다", () => {
    renderList();

    for (const challenge of challenges) {
      expect(
        within(getCard(challenge)).getByText(challenge.description),
      ).toBeInTheDocument();
    }
  });

  it("카드 안에는 다른 링크나 버튼이 없다", () => {
    renderList();

    for (const challenge of challenges) {
      const card = within(getCard(challenge));
      expect(card.queryAllByRole("link")).toHaveLength(0);
      expect(card.queryAllByRole("button")).toHaveLength(0);
    }
  });

  it("카드를 누르면 그 챌린지의 경로로 이동한다", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <ShowcaseController challenges={challenges} />,
        },
        { path: "/:slug", element: <p>도착한 챌린지 화면</p> },
      ],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);

    await user.click(getCard(challengeC));

    expect(router.state.location.pathname).toBe("/challenge-c");
  });
});
