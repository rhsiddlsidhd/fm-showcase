import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Challenge } from "../model/challenge";
import { ChallengeRail } from "./ChallengeRail";

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
      <ChallengeRail challenges={challenges} />
    </MemoryRouter>,
  );

const getCard = (challenge: Challenge) =>
  screen.getByRole("link", { name: challenge.title });

describe("ChallengeRail 카드 목록", () => {
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

  it("카드는 등록된 순서대로 보인다", () => {
    renderList();

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      challenges.map((challenge) => expect.stringContaining(challenge.title)),
    );
  });

  it("카드마다 그 챌린지의 경로로 가는 링크 하나다", () => {
    renderList();

    for (const challenge of challenges) {
      expect(getCard(challenge)).toHaveAttribute("href", `/${challenge.slug}`);
    }
    expect(screen.getAllByRole("link")).toHaveLength(challenges.length);
  });

  it("카드 목록 외에 페이지 제목, 필터, 결과 개수가 없다", () => {
    renderList();

    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*개/)).not.toBeInTheDocument();
  });

  it("카드를 누르면 그 챌린지의 경로로 이동한다", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <ChallengeRail challenges={challenges} />,
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

describe("ChallengeRail 빈 상태", () => {
  const renderEmpty = () =>
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ChallengeRail challenges={[]} />
      </MemoryRouter>,
    );

  it("등록된 챌린지가 없으면 등록 안내 카드가 보인다", () => {
    renderEmpty();

    expect(screen.getByText("챌린지들 등록해주세요.")).toBeInTheDocument();
  });

  it("등록 안내는 화면 낭독기에 알려지는 상태 영역으로 보인다", () => {
    renderEmpty();

    expect(screen.getByRole("status")).toHaveTextContent(
      "챌린지들 등록해주세요.",
    );
  });

  it("등록된 챌린지가 없으면 카드 링크가 하나도 없다", () => {
    renderEmpty();

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
