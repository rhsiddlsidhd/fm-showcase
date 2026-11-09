import { expect, test } from "@playwright/test";

test("첫 화면에서 Frontend Mentor 챌린지 제목과 등록 없음 안내를 볼 수 있다", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Frontend Mentor 챌린지" }),
  ).toBeVisible();
  await expect(
    page.getByText("아직 등록된 챌린지가 없습니다.", { exact: true }),
  ).toBeVisible();
});
