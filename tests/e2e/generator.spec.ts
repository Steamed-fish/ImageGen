import { expect, test } from "@playwright/test";

test("anonymous user can fill generator and sees login-required message", async ({
  page
}) => {
  await page.goto("/generate");

  await page
    .getByRole("textbox", { name: "Subject" })
    .fill("a launch poster for a ceramic tea brand");

  await expect(
    page.getByText("Create a poster about a launch poster")
  ).toBeVisible();

  await page.getByRole("button", { name: "Generate 1 image" }).click();

  await expect(
    page.getByText("Please sign in with Google to generate an image.")
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Sign in to generate" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" })
  ).toBeVisible();
});

test("home page links to generator", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Start generating" }).click();

  await expect(page).toHaveURL(/\/generate$/);
  await expect(
    page.getByRole("heading", { name: "Create an image" })
  ).toBeVisible();
});

test("home page mobile smoke has no horizontal overflow and shows generator preview", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByText("Generator preview")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 1;
  });
  expect(hasHorizontalOverflow).toBe(false);

  const previewTop = await page.getByText("Generator preview").evaluate((element) => {
    return element.getBoundingClientRect().top;
  });
  expect(previewTop).toBeLessThan(844);
});
