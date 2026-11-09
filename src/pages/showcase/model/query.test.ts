import { describe, expect, it } from "vitest";
import type { FilterSelection } from "./challenge";
import { parseSelection, toSearchParams } from "./query";

describe("parseSelection", () => {
  it("반복된 난이도·기술 키의 값을 모두 선택값으로 읽는다", () => {
    const params = new URLSearchParams(
      "?difficulty=Newbie&difficulty=Junior&stack=React",
    );

    expect(parseSelection(params)).toEqual({
      difficulty: ["Newbie", "Junior"],
      stack: ["React"],
    });
  });

  it("쿼리가 없으면 난이도와 기술 모두 선택되지 않는다", () => {
    expect(parseSelection(new URLSearchParams(""))).toEqual({
      difficulty: [],
      stack: [],
    });
  });

  it("허용 목록 밖의 값은 빠지고 함께 온 허용 값만 선택된다", () => {
    const params = new URLSearchParams(
      "?difficulty=Newbie&difficulty=Expert&stack=Python&stack=CSS",
    );

    expect(parseSelection(params)).toEqual({
      difficulty: ["Newbie"],
      stack: ["CSS"],
    });
  });

  it("허용 기술이면 등록된 챌린지에 없더라도 선택값으로 남는다", () => {
    const params = new URLSearchParams("?stack=React");

    expect(parseSelection(params).stack).toEqual(["React"]);
  });

  it("같은 값이 반복된 쿼리는 난이도·기술마다 하나의 선택으로 읽는다", () => {
    const params = new URLSearchParams(
      "?difficulty=Newbie&difficulty=Newbie&stack=CSS&stack=CSS",
    );

    expect(parseSelection(params)).toEqual({
      difficulty: ["Newbie"],
      stack: ["CSS"],
    });
  });

  it("쿼리를 읽어도 원래 쿼리는 바뀌지 않는다", () => {
    const query = "difficulty=Newbie&difficulty=Expert&stack=CSS&stack=CSS";
    const params = new URLSearchParams(query);

    parseSelection(params);

    expect(params.toString()).toBe(query);
  });
});

describe("toSearchParams", () => {
  it("선택한 난이도·기술마다 키를 반복한 쿼리를 만든다", () => {
    const params = toSearchParams({
      difficulty: ["Newbie", "Junior"],
      stack: ["React"],
    });

    expect(params.getAll("difficulty")).toEqual(["Newbie", "Junior"]);
    expect(params.getAll("stack")).toEqual(["React"]);
  });

  it("중복 쿼리를 읽어 다시 만든 쿼리에는 난이도·기술마다 같은 값이 한 번만 있다", () => {
    const parsed = parseSelection(
      new URLSearchParams(
        "?difficulty=Newbie&difficulty=Newbie&stack=CSS&stack=CSS",
      ),
    );

    const params = toSearchParams(parsed);

    expect(params.getAll("difficulty")).toEqual(["Newbie"]);
    expect(params.getAll("stack")).toEqual(["CSS"]);
  });
});

describe("쿼리 왕복", () => {
  it("선택값으로 만든 쿼리 문자열을 다시 읽으면 같은 선택값이 나온다", () => {
    const selection: FilterSelection = {
      difficulty: ["Newbie", "Advanced", "Guru"],
      stack: ["HTML", "TypeScript", "React"],
    };

    const query = toSearchParams(selection).toString();
    const restored = parseSelection(new URLSearchParams(query));

    expect(new Set(restored.difficulty)).toEqual(new Set(selection.difficulty));
    expect(restored.difficulty).toHaveLength(selection.difficulty.length);
    expect(new Set(restored.stack)).toEqual(new Set(selection.stack));
    expect(restored.stack).toHaveLength(selection.stack.length);
  });

  it("공백이 있는 기술 Tailwind CSS도 쿼리 문자열을 거쳐 그대로 선택된다", () => {
    const selection: FilterSelection = {
      difficulty: [],
      stack: ["Tailwind CSS", "CSS"],
    };

    const query = toSearchParams(selection).toString();
    const restored = parseSelection(new URLSearchParams(query));

    expect(new Set(restored.stack)).toEqual(new Set(["Tailwind CSS", "CSS"]));
    expect(restored.stack).toHaveLength(2);
  });

  it("아무것도 선택하지 않은 선택값은 빈 쿼리가 되고 다시 읽어도 선택이 없다", () => {
    const query = toSearchParams({ difficulty: [], stack: [] }).toString();

    expect(query).toBe("");
    expect(parseSelection(new URLSearchParams(query))).toEqual({
      difficulty: [],
      stack: [],
    });
  });
});
