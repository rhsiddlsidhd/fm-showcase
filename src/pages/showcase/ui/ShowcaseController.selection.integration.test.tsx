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

// jsdom은 scrollIntoView를 구현하지 않는다. 카드 포커스 노출은 E2E에서 확인한다.
const originalScrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});
afterAll(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

const renderAt = (url = "/", list: readonly Challenge[] = challenges) => {
  const router = createMemoryRouter(
    [{ path: "/", element: <ShowcaseController challenges={list} /> }],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

type Router = ReturnType<typeof renderAt>;

const getGroup = (name: string) => screen.getByRole("group", { name });

const getDifficulty = (name: Difficulty) =>
  within(getGroup("난이도")).getByRole("checkbox", { name });

const getStack = (name: Stack) =>
  within(getGroup("사용 기술")).getByRole("checkbox", { name });

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

const expectCheckedDifficulties = (checked: Difficulty[]) => {
  for (const name of [
    "Newbie",
    "Junior",
    "Intermediate",
    "Advanced",
    "Guru",
  ] as const) {
    if (checked.includes(name)) {
      expect(getDifficulty(name)).toBeChecked();
    } else {
      expect(getDifficulty(name)).not.toBeChecked();
    }
  }
};

const expectVisibleCards = (
  visible: readonly Challenge[],
  all: readonly Challenge[] = challenges,
) =>
  waitFor(() => {
    for (const challenge of all) {
      const card = screen.queryByRole("link", { name: challenge.title });
      if (visible.includes(challenge)) {
        expect(card).toBeInTheDocument();
      } else {
        expect(card).not.toBeInTheDocument();
      }
    }
  });

describe("ShowcaseController 필터 선택과 URL", () => {
  it("난이도 Newbie·Junior와 기술 JavaScript를 고르면 URL이 반복 키로 바뀌고 체크 상태와 B·D 카드가 맞는다", async () => {
    const user = userEvent.setup();
    const router = renderAt();

    await user.click(getDifficulty("Newbie"));
    await user.click(getDifficulty("Junior"));
    await user.click(getStack("JavaScript"));

    expectQuery(router, {
      difficulty: ["Newbie", "Junior"],
      stack: ["JavaScript"],
    });
    expectCheckedDifficulties(["Newbie", "Junior"]);
    expect(getStack("JavaScript")).toBeChecked();
    await expectVisibleCards([challengeB, challengeD]);
  });

  it("Newbie의 연결된 레이블을 누르면 Newbie가 선택되고 URL에 하나 반영되며 A·D 카드가 보인다", async () => {
    const user = userEvent.setup();
    const router = renderAt();
    const checkbox = getDifficulty("Newbie") as HTMLButtonElement;
    const label = checkbox.labels?.[0];
    expect(label).toBeDefined();

    await user.click(label as HTMLLabelElement);

    expect(getDifficulty("Newbie")).toBeChecked();
    expectQuery(router, { difficulty: ["Newbie"], stack: [] });
    await expectVisibleCards([challengeA, challengeD]);
  });

  it("Newbie 체크박스를 누르면 Newbie가 선택되고 URL에 하나 반영되며 A·D 카드가 보인다", async () => {
    const user = userEvent.setup();
    const router = renderAt();

    await user.click(getDifficulty("Newbie"));

    expect(getDifficulty("Newbie")).toBeChecked();
    expectQuery(router, { difficulty: ["Newbie"], stack: [] });
    await expectVisibleCards([challengeA, challengeD]);
  });

  it("Newbie 체크박스에 포커스하고 Space를 누르면 Newbie가 선택되고 URL에 하나 반영되며 A·D 카드가 보인다", async () => {
    const user = userEvent.setup();
    const router = renderAt();

    act(() => getDifficulty("Newbie").focus());
    await user.keyboard(" ");

    expect(getDifficulty("Newbie")).toBeChecked();
    expectQuery(router, { difficulty: ["Newbie"], stack: [] });
    await expectVisibleCards([challengeA, challengeD]);
  });

  it("Newbie·Junior URL로 들어와 Newbie만 해제하면 URL에서 Newbie만 빠지고 Junior는 유지되며 B 카드만 보인다", async () => {
    const user = userEvent.setup();
    const router = renderAt("/?difficulty=Newbie&difficulty=Junior");

    await user.click(getDifficulty("Newbie"));

    expectCheckedDifficulties(["Junior"]);
    expectQuery(router, { difficulty: ["Junior"], stack: [] });
    await expectVisibleCards([challengeB]);
  });

  it("반복 키 쿼리 URL로 들어오면 체크 상태와 카드 목록이 쿼리와 맞는다", async () => {
    renderAt("/?difficulty=Newbie&difficulty=Junior&stack=JavaScript");

    expectCheckedDifficulties(["Newbie", "Junior"]);
    expect(getStack("JavaScript")).toBeChecked();
    expect(getStack("HTML")).not.toBeChecked();
    expect(getStack("CSS")).not.toBeChecked();
    await expectVisibleCards([challengeB, challengeD]);
  });

  it("선택을 세 번 바꾼 뒤 뒤로 세 번과 앞으로 세 번 이동하면 단계마다 체크 상태와 목록이 복원된다", async () => {
    const user = userEvent.setup();
    const router = renderAt();
    const go = (delta: number) =>
      act(async () => {
        await router.navigate(delta);
      });

    await user.click(getDifficulty("Newbie"));
    await user.click(getDifficulty("Junior"));
    await user.click(getDifficulty("Newbie"));
    expectCheckedDifficulties(["Junior"]);
    await expectVisibleCards([challengeB]);

    await go(-1);
    expectCheckedDifficulties(["Newbie", "Junior"]);
    await expectVisibleCards([challengeA, challengeB, challengeD]);

    await go(-1);
    expectCheckedDifficulties(["Newbie"]);
    await expectVisibleCards([challengeA, challengeD]);

    await go(-1);
    expectCheckedDifficulties([]);
    expectQuery(router, { difficulty: [], stack: [] });
    await expectVisibleCards(challenges);

    await go(1);
    expectCheckedDifficulties(["Newbie"]);
    await expectVisibleCards([challengeA, challengeD]);

    await go(1);
    expectCheckedDifficulties(["Newbie", "Junior"]);
    await expectVisibleCards([challengeA, challengeB, challengeD]);

    await go(1);
    expectCheckedDifficulties(["Junior"]);
    expectQuery(router, { difficulty: ["Junior"], stack: [] });
    await expectVisibleCards([challengeB]);
  });

  it("등록 데이터에 없는 허용 기술 React가 쿼리에 있으면 Newbie를 골라도 URL에 React가 남고 React 옵션은 생기지 않으며 카드가 없다", async () => {
    const user = userEvent.setup();
    const registered = [challengeA, challengeB];
    const router = renderAt("/?stack=React", registered);

    await user.click(getDifficulty("Newbie"));

    expectQuery(router, { difficulty: ["Newbie"], stack: ["React"] });
    const stackOptions = within(getGroup("사용 기술")).getAllByRole("checkbox");
    expect(stackOptions).toHaveLength(3);
    ["HTML", "CSS", "JavaScript"].forEach((name, index) => {
      expect(stackOptions[index]).toHaveAccessibleName(name);
    });
    await expectVisibleCards([], registered);
  });
});
