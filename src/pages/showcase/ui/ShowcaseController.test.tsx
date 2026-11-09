import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import type { Challenge } from "../model/challenge";
import { ShowcaseController } from "./ShowcaseController";

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
});
