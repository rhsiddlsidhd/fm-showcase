import { describe, expect, it } from "vitest";
import type { Challenge } from "./challenge";
import { getStackOptions } from "./stack-options";

const A: Challenge = {
  slug: "challenge-a",
  title: "가 챌린지",
  description: "가 챌린지 설명",
  difficulty: "Newbie",
  stack: ["HTML", "CSS"],
};

const B: Challenge = {
  slug: "challenge-b",
  title: "나 챌린지",
  description: "나 챌린지 설명",
  difficulty: "Junior",
  stack: ["HTML", "CSS", "JavaScript"],
};

const C: Challenge = {
  slug: "challenge-c",
  title: "다 챌린지",
  description: "다 챌린지 설명",
  difficulty: "Intermediate",
  stack: ["TypeScript", "React", "Tailwind CSS"],
};

const D: Challenge = {
  slug: "challenge-d",
  title: "라 챌린지",
  description: "라 챌린지 설명",
  difficulty: "Newbie",
  stack: ["CSS", "JavaScript"],
};

describe("getStackOptions", () => {
  it("기술이 겹치는 챌린지를 다른 순서로 등록해도 기술 옵션은 정해진 순서로 한 번씩 보인다", () => {
    expect(getStackOptions([D, C, B, A])).toEqual([
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Tailwind CSS",
    ]);
  });

  it("등록된 챌린지에 쓰인 기술만 기술 옵션으로 보인다", () => {
    expect(getStackOptions([D, A])).toEqual(["HTML", "CSS", "JavaScript"]);
  });

  it("등록된 챌린지가 없으면 기술 옵션이 하나도 보이지 않는다", () => {
    expect(getStackOptions([])).toEqual([]);
  });
});
