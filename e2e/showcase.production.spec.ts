import { expect, test } from "@playwright/test";

test("첫 화면에서 날씨 앱 카드가 제목·난이도·기술 태그·설명과 함께 보이고 등록 안내는 보이지 않는다", async ({
  page,
}) => {
  await page.goto("/");

  const card = page.getByRole("link", { name: /Weather app/ });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Weather app");
  await expect(card).toContainText("Intermediate");
  await expect(card).toContainText("TypeScript");
  await expect(card).toContainText("React");
  await expect(card).toContainText("Tailwind CSS");
  await expect(card).toContainText(
    "지역을 검색해 현재 날씨와 7일·시간별 예보를 봅니다.",
  );
  await expect(
    page.getByText("챌린지들 등록해주세요.", { exact: true }),
  ).toHaveCount(0);
});
