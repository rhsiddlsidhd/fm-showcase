import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
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

const renderAt = (url = "/") => {
  const router = createMemoryRouter(
    [{ path: "/", element: <ShowcaseController challenges={challenges} /> }],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

const getNewbie = () =>
  within(screen.getByRole("group", { name: "난이도" })).getByRole("checkbox", {
    name: "Newbie",
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

describe("ShowcaseController 결과 수와 낭독기 알림", () => {
  it("A~D 화면에 처음 들어오면 필터 아래·챌린지 목록 위에 4개의 챌린지가 보인다", () => {
    renderAt();

    const count = getVisibleCount();
    expect(count).toHaveTextContent(/^4개의 챌린지$/);
    expect(
      isBefore(screen.getByRole("group", { name: "사용 기술" }), count),
    ).toBe(true);
    expect(
      isBefore(count, screen.getByRole("link", { name: challengeA.title })),
    ).toBe(true);
  });

  it("A~D 화면에 처음 들어오면 낭독기 알림 영역은 있지만 알림 문자열은 비어 있다", () => {
    renderAt();

    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
  });

  it("A~D 화면에서 Newbie를 고르면 보이는 결과 수가 2개의 챌린지로 바뀐다", async () => {
    const user = userEvent.setup();
    renderAt();

    await user.click(getNewbie());

    await waitFor(() =>
      expect(getVisibleCount()).toHaveTextContent(/^2개의 챌린지$/),
    );
  });

  it("A~D 화면에서 Newbie를 고르면 같은 낭독기 알림 영역이 2개의 챌린지를 알린다", async () => {
    const user = userEvent.setup();
    renderAt();
    const statusBefore = screen.getByRole("status");

    await user.click(getNewbie());

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/^2개의 챌린지$/),
    );
    expect(screen.getByRole("status")).toBe(statusBefore);
  });

  it("Newbie를 고른 뒤 뒤로 이동하면 같은 낭독기 알림 영역이 복원된 4개의 챌린지를 알린다", async () => {
    const user = userEvent.setup();
    const router = renderAt();
    const statusBefore = screen.getByRole("status");

    await user.click(getNewbie());
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/^2개의 챌린지$/),
    );

    await act(async () => {
      await router.navigate(-1);
    });

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/^4개의 챌린지$/),
    );
    expect(getVisibleCount()).toHaveTextContent(/^4개의 챌린지$/);
    expect(screen.getByRole("status")).toBe(statusBefore);
  });
});
