import { expect, test } from "@playwright/test";

test("anonymous user can fill generator and sees login-required message", async ({
  page
}) => {
  await page.goto("/generate");

  await page
    .getByRole("textbox", { name: "主题" })
    .fill("a launch poster for a ceramic tea brand");

  await expect(
    page.getByText("Create a poster about a launch poster")
  ).toBeVisible();

  await page.getByRole("button", { name: "生成 1 张图片" }).click();

  await expect(
    page.getByText("请先使用 Google 登录后再生成图片。")
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "登录后生成" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "使用 Google 继续" })
  ).toBeVisible();
});

test("home page links to generator", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "开始生成" }).click();

  await expect(page).toHaveURL(/\/generate$/);
  await expect(page.getByRole("heading", { name: "创建图片" })).toBeVisible();
});

test("user can switch the interface to English", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "English" }).click();

  await expect(
    page.getByRole("link", { name: "Start generating" })
  ).toBeVisible();

  await page.getByRole("link", { name: "Start generating" }).click();
  await expect(
    page.getByRole("heading", { name: "Create an image" })
  ).toBeVisible();
});

test("home page mobile smoke has no horizontal overflow and shows generator preview", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByText("生成器预览")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 1;
  });
  expect(hasHorizontalOverflow).toBe(false);

  const previewTop = await page.getByText("生成器预览").evaluate((element) => {
    return element.getBoundingClientRect().top;
  });
  expect(previewTop).toBeLessThan(844);
});
