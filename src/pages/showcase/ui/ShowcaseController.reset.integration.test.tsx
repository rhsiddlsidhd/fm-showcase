import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Challenge, Difficulty, Stack } from "../model/challenge";
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

const NO_RESULTS_TEXT = "조건에 맞는 챌린지가 없습니다.";
const RESET_NAME = "필터 초기화";
// Newbie(A·D)와 React(C)를 함께 고르면 그룹 사이 AND로 결과가 0건이다.
const NO_RESULTS_URL = "/?difficulty=Newbie&stack=React";

// jsdom은 scrollIntoView를 구현하지 않는다. 카드 포커스 노출은 E2E에서 확인한다.
const originalScrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});
afterAll(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

const renderAt = (url = "/") => {
  const router = createMemoryRouter(
    [{ path: "/", element: <ShowcaseController challenges={challenges} /> }],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

type Router = ReturnType<typeof renderAt>;

const go = (router: Router, delta: number) =>
  act(async () => {
    await router.navigate(delta);
  });

const getGroup = (name: string) => screen.getByRole("group", { name });

const getDifficulty = (name: Difficulty) =>
  within(getGroup("난이도")).getByRole("checkbox", { name });

const getStack = (name: Stack) =>
  within(getGroup("사용 기술")).getByRole("checkbox", { name });

const queryResetButtons = () =>
  screen.queryAllByRole("button", { name: RESET_NAME });

const expectQuery = (
  router: Router,
  expected: { difficulty: Difficulty[]; stack: Stack[] },
) => {
  const params = new URLSearchParams(router.state.location.search);
  expect([...params.getAll("difficulty")].sort()).toEqual(
    [...expected.difficulty].sort(),
  );
  expect([...params.getAll("stack")].sort()).toEqual(
    [...expected.stack].sort(),
  );
};

const expectVisibleCards = (visible: readonly Challenge[]) =>
  waitFor(() => {
    for (const challenge of challenges) {
      const card = screen.queryByRole("link", { name: challenge.title });
      if (visible.includes(challenge)) {
        expect(card).toBeInTheDocument();
      } else {
        expect(card).not.toBeInTheDocument();
      }
    }
  });

// 낭독기 알림(status) 밖에 있는, 화면에 보이는 결과 수 문구.
const getVisibleCount = () => {
  const countText = /^\d+개의 챌린지$/;
  const status = screen.queryByRole("status");
  const announced = status ? within(status).queryAllByText(countText) : [];
  const visible = screen
    .getAllByText(countText)
    .filter((element) => element !== status && !announced.includes(element));
  expect(visible).toHaveLength(1);
  return visible[0];
};

const isBefore = (first: Node, second: Node) =>
  (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !==
  0;

describe("ShowcaseController 결과 없음과 필터 초기화", () => {
  it("Newbie·React처럼 맞는 챌린지가 없는 조건으로 들어오면 조건에 맞는 챌린지가 없습니다 안내가 보이고 카드는 없다", async () => {
    renderAt(NO_RESULTS_URL);

    expect(screen.getByText(NO_RESULTS_TEXT)).toBeInTheDocument();
    await expectVisibleCards([]);
  });

  it("맞는 챌린지가 없는 조건으로 들어오면 필터 초기화 버튼은 결과 없음 안내 뒤에 하나만 보인다", () => {
    renderAt(NO_RESULTS_URL);

    const buttons = queryResetButtons();
    expect(buttons).toHaveLength(1);
    expect(isBefore(screen.getByText(NO_RESULTS_TEXT), buttons[0])).toBe(true);
    expect(isBefore(getVisibleCount(), buttons[0])).toBe(true);
  });

  it("맞는 챌린지가 없는 조건으로 들어와도 두 필터 그룹과 선택 상태, 0개의 챌린지 결과 수와 낭독기 알림 영역이 남아 있다", () => {
    renderAt(NO_RESULTS_URL);

    expect(getDifficulty("Newbie")).toBeChecked();
    expect(getStack("React")).toBeChecked();
    expect(getVisibleCount()).toHaveTextContent(/^0개의 챌린지$/);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("결과가 있는 화면에서 React를 더 골라 0건이 되면 같은 낭독기 알림 영역이 0개의 챌린지를 알린다", async () => {
    const user = userEvent.setup();
    renderAt("/?difficulty=Newbie");
    const statusBefore = screen.getByRole("status");

    await user.click(getStack("React"));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/^0개의 챌린지$/),
    );
    expect(screen.getByRole("status")).toBe(statusBefore);
    expect(getVisibleCount()).toHaveTextContent(/^0개의 챌린지$/);
    expect(screen.getByText(NO_RESULTS_TEXT)).toBeInTheDocument();
  });

  it("결과 없음 안내의 필터 초기화를 누르면 쿼리가 비고 안내가 사라지며 전체 4개 챌린지가 보인다", async () => {
    const user = userEvent.setup();
    const router = renderAt(NO_RESULTS_URL);

    await user.click(screen.getByRole("button", { name: RESET_NAME }));

    expect(router.state.location.search).toBe("");
    expectQuery(router, { difficulty: [], stack: [] });
    expect(getDifficulty("Newbie")).not.toBeChecked();
    expect(getStack("React")).not.toBeChecked();
    expect(screen.queryByText(NO_RESULTS_TEXT)).not.toBeInTheDocument();
    await expectVisibleCards(challenges);
    expect(getVisibleCount()).toHaveTextContent(/^4개의 챌린지$/);
  });

  it("결과 없음에서 초기화한 뒤 뒤로 이동하면 Newbie·React 선택과 결과 없음 안내, 0개의 챌린지가 복원된다", async () => {
    const user = userEvent.setup();
    const router = renderAt(NO_RESULTS_URL);

    await user.click(screen.getByRole("button", { name: RESET_NAME }));
    await expectVisibleCards(challenges);

    await go(router, -1);

    expectQuery(router, { difficulty: ["Newbie"], stack: ["React"] });
    expect(getDifficulty("Newbie")).toBeChecked();
    expect(getStack("React")).toBeChecked();
    expect(screen.getByText(NO_RESULTS_TEXT)).toBeInTheDocument();
    expect(getVisibleCount()).toHaveTextContent(/^0개의 챌린지$/);
    await expectVisibleCards([]);
  });

  it("결과 없음에서 초기화하고 뒤로 간 뒤 앞으로 이동하면 선택 없는 전체 4개가 복원되고 새 이력이 생기지 않는다", async () => {
    const user = userEvent.setup();
    const router = renderAt(NO_RESULTS_URL);

    await user.click(screen.getByRole("button", { name: RESET_NAME }));
    await expectVisibleCards(challenges);
    await go(router, -1);
    await expectVisibleCards([]);

    await go(router, 1);

    expect(router.state.historyAction).toBe("POP");
    expectQuery(router, { difficulty: [], stack: [] });
    expect(getDifficulty("Newbie")).not.toBeChecked();
    expect(getStack("React")).not.toBeChecked();
    expect(screen.queryByText(NO_RESULTS_TEXT)).not.toBeInTheDocument();
    await expectVisibleCards(challenges);
    expect(getVisibleCount()).toHaveTextContent(/^4개의 챌린지$/);

    // 앞으로 이동이 새 이력을 만들지 않았다면 다시 뒤로 가면 초기화 전 URL이다.
    await go(router, -1);
    expectQuery(router, { difficulty: ["Newbie"], stack: ["React"] });
    expect(router.state.historyAction).toBe("POP");
  });

  it("Newbie를 골라 결과가 있으면 필터 초기화 버튼이 필터 그룹 뒤·결과 수 앞에 하나만 보이고 결과 없음 안내는 없다", async () => {
    renderAt("/?difficulty=Newbie");
    await expectVisibleCards([challengeA, challengeD]);

    const buttons = queryResetButtons();
    expect(buttons).toHaveLength(1);
    expect(isBefore(getGroup("사용 기술"), buttons[0])).toBe(true);
    expect(isBefore(buttons[0], getVisibleCount())).toBe(true);
    expect(screen.queryByText(NO_RESULTS_TEXT)).not.toBeInTheDocument();
  });

  it("결과가 있는 화면에서 필터 영역의 필터 초기화를 누르면 쿼리가 비고 전체 4개 챌린지가 보이며 초기화 버튼이 사라진다", async () => {
    const user = userEvent.setup();
    const router = renderAt("/?difficulty=Newbie");

    await user.click(screen.getByRole("button", { name: RESET_NAME }));

    expect(router.state.location.search).toBe("");
    expect(getDifficulty("Newbie")).not.toBeChecked();
    await expectVisibleCards(challenges);
    expect(queryResetButtons()).toHaveLength(0);
  });

  it("선택 없이 전체 목록에 들어오면 필터 초기화 버튼이 보이지 않는다", async () => {
    renderAt();
    await expectVisibleCards(challenges);

    expect(queryResetButtons()).toHaveLength(0);
  });
});
