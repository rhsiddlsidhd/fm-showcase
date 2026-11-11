import { expect, test } from "@playwright/test";

test("첫 화면에 등록된 챌린지가 없으면 등록 안내 카드를 볼 수 있다", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByText("챌린지들 등록해주세요.", { exact: true }),
  ).toBeVisible();
});
