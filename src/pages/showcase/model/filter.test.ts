import { describe, expect, it } from "vitest";
import type { Challenge } from "./challenge";
import { filterChallenges } from "./filter";

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

const CHALLENGES = [A, B, C, D];

describe("filterChallenges", () => {
  it("다른 순서로 등록한 목록을 필터링해도 등록한 순서대로 보인다", () => {
    const registered = [D, C, B, A];

    expect(
      filterChallenges(registered, {
        difficulty: ["Newbie", "Junior"],
        stack: [],
      }),
    ).toEqual([D, B, A]);
  });

  it("난이도를 여러 개 고르면 그중 하나에 맞는 챌린지가 보인다", () => {
    expect(
      filterChallenges(CHALLENGES, {
        difficulty: ["Newbie", "Junior"],
        stack: [],
      }),
    ).toEqual([A, B, D]);
  });

  it("기술을 여러 개 고르면 그중 하나를 사용하는 챌린지가 보인다", () => {
    expect(
      filterChallenges(CHALLENGES, {
        difficulty: [],
        stack: ["React", "JavaScript"],
      }),
    ).toEqual([B, C, D]);
  });

  it("난이도와 기술을 함께 고르면 두 조건을 모두 만족하는 챌린지만 보인다", () => {
    expect(
      filterChallenges(CHALLENGES, {
        difficulty: ["Newbie", "Junior"],
        stack: ["React", "JavaScript"],
      }),
    ).toEqual([B, D]);
  });

  it("아무 필터도 고르지 않으면 전체 챌린지가 보인다", () => {
    expect(filterChallenges(CHALLENGES, { difficulty: [], stack: [] })).toEqual(
      [A, B, C, D],
    );
  });
});
