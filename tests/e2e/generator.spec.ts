import { expect, test, type BrowserContext } from "@playwright/test";

const e2eAuthCookie = "prompt_studio_e2e_auth";

async function signInWithE2eMock(context: BrowserContext) {
  await context.addCookies([
    {
      name: e2eAuthCookie,
      value: "1",
      domain: "127.0.0.1",
      path: "/"
    }
  ]);
}

test("home page opens and switches between Chinese and English", async ({
  page
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "不会写 prompt，也能生成专业图片。" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "开始生成" })).toHaveCount(2);

  await page.getByRole("button", { name: "English" }).click();

  await expect(
    page.getByRole("heading", {
      name: "Professional images without prompt craft."
    })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Start generating" })
  ).toHaveCount(2);
});

test("anonymous users visiting generate are redirected to login", async ({
  page
}) => {
  await page.goto("/generate");

  await expect(page).toHaveURL(/\/login\?next=%2Fgenerate$/);
  await expect(
    page.getByRole("heading", { name: "登录后开始生成图片。" })
  ).toBeVisible();
});

test("login page displays email and Google sign-in options", async ({ page }) => {
  await page.goto("/login?next=%2Fgenerate");

  await expect(
    page.getByRole("heading", { name: "登录后开始生成图片。" })
  ).toBeVisible();
  await expect(page.getByLabel("邮箱")).toBeVisible();
  await expect(page.getByLabel("密码")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "使用邮箱登录" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "使用 Google 继续" })
  ).toBeVisible();
});

test("mock signed-in user can update generator controls and prompt preview", async ({
  context,
  page
}) => {
  const generateRequests: string[] = [];

  await signInWithE2eMock(context);
  await page.route("**/api/generate", async (route) => {
    generateRequests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "e2e-route-mock",
        imageUrl: "",
        compiledPrompt: "E2E route mock"
      })
    });
  });

  await page.goto("/generate");

  await expect(page.getByText("AI 创作工作台")).toBeVisible();
  await expect(page.getByText("创作控制台")).toBeVisible();

  await page.getByLabel("图片类型").selectOption("social");
  await page.getByLabel("画面比例").selectOption("16:9");
  await page.getByLabel("风格").selectOption("cinematic");
  await page.getByLabel("场景").selectOption("nature");
  await page.getByLabel("留白").selectOption("left_text_space");
  await page.getByLabel("主题").fill("lake view");
  await page
    .getByLabel("补充要求")
    .fill("Premium, calm, clean background");

  await expect(
    page.getByText("Create a social media image about lake view", {
      exact: false
    })
  ).toBeVisible();
  await expect(
    page.getByText("cinematic lighting and framing", { exact: false })
  ).toBeVisible();
  await expect(
    page.getByText("natural environment", { exact: false })
  ).toBeVisible();
  await expect(
    page.getByText("wide 16:9 composition", { exact: false })
  ).toBeVisible();
  await expect(
    page.getByText("negative space on the left", { exact: false })
  ).toBeVisible();
  await expect(
    page.getByText("Additional requirements: Premium, calm, clean background.", {
      exact: false
    })
  ).toBeVisible();
  expect(generateRequests).toHaveLength(0);
});

test("mobile home page has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByText("自动组装的英文 prompt")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 1;
  });
  expect(hasHorizontalOverflow).toBe(false);
});
