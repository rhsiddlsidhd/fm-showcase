import { expect, test } from "@playwright/test";

test("첫 화면에서 Frontend Mentor 챌린지 제목을 볼 수 있다", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Frontend Mentor 챌린지" }),
  ).toBeVisible();
});
