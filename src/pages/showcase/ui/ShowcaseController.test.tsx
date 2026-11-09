import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import type { Challenge } from "../model/challenge";
import { ShowcaseController } from "./ShowcaseController";

const renderEmptyWithValidQuery = () => {
  const challenges: readonly Challenge[] = [];

  render(
    <MemoryRouter initialEntries={["/?difficulty=Newbie&stack=React"]}>
      <ShowcaseController challenges={challenges} />
    </MemoryRouter>,
  );
};

describe("ShowcaseController", () => {
  it("등록된 챌린지가 없으면 유효한 필터 쿼리가 있어도 등록 없음 안내가 보인다", () => {
    const challenges: readonly Challenge[] = [];

    render(
      <MemoryRouter initialEntries={["/?difficulty=Newbie&stack=React"]}>
        <ShowcaseController challenges={challenges} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("아직 등록된 챌린지가 없습니다."),
    ).toBeInTheDocument();
  });

  it("등록된 챌린지가 없으면 유효한 필터 쿼리가 있어도 난이도·사용 기술 필터가 보이지 않는다", () => {
    renderEmptyWithValidQuery();

    expect(
      screen.queryByRole("group", { name: "난이도" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "사용 기술" }),
    ).not.toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("등록된 챌린지가 없으면 유효한 필터 쿼리가 있어도 결과 개수가 보이지 않는다", () => {
    renderEmptyWithValidQuery();

    expect(screen.queryByText(/\d+개의 챌린지/)).not.toBeInTheDocument();
  });
});
