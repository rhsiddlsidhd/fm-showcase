import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
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

const renderList = (list: readonly Challenge[] = challenges) =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <ShowcaseController challenges={list} />
    </MemoryRouter>,
  );

const getGroup = (name: string) => screen.getByRole("group", { name });

const expectOptionsInOrder = (group: HTMLElement, names: string[]) => {
  const options = within(group).getAllByRole("checkbox");
  expect(options).toHaveLength(names.length);
  names.forEach((name, index) => {
    expect(options[index]).toHaveAccessibleName(name);
  });
};

describe("ShowcaseController 필터 옵션", () => {
  it("난이도 그룹에서 다섯 난이도를 모두 선택 옵션으로 볼 수 있다", () => {
    renderList();

    expectOptionsInOrder(getGroup("난이도"), [
      "Newbie",
      "Junior",
      "Intermediate",
      "Advanced",
      "Guru",
    ]);
  });

  it("필터 그룹 이름이 한국어로 난이도와 사용 기술로 보인다", () => {
    renderList();

    expect(getGroup("난이도")).toBeInTheDocument();
    expect(getGroup("사용 기술")).toBeInTheDocument();
  });

  it("사용 기술 그룹에는 등록 데이터에 나온 기술만 정해진 순서로 한 번씩 보인다", () => {
    renderList([challengeC, challengeD]);

    expectOptionsInOrder(getGroup("사용 기술"), [
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Tailwind CSS",
    ]);
  });
});
