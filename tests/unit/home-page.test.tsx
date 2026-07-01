import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the polished Chinese home page with generator preview", async () => {
    render(await HomePage());

    expect(
      screen.getByRole("heading", {
        name: "不会写 prompt，也能生成专业图片。"
      })
    ).toBeInTheDocument();

    expect(screen.getAllByText("Prompt Studio").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/选择创意参数和主题/)
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole("link", { name: /开始生成/ })[0]
    ).toHaveAttribute("href", "/generate");
    expect(screen.getByRole("link", { name: /查看作品库/ })).toHaveAttribute(
      "href",
      "/history"
    );

    expect(screen.getByText("社媒活动图")).toBeInTheDocument();
    expect(screen.getByText("自动组装的英文 prompt")).toBeInTheDocument();
    expect(
      screen.getByText(/Create a social media image/i)
    ).toBeInTheDocument();

    expect(screen.getByText("选择用途")).toBeInTheDocument();
    expect(screen.getByText("留白可控")).toBeInTheDocument();
    expect(screen.getByText("活动海报")).toBeInTheDocument();
  });

  it("keeps the mobile hero compact enough to reveal the preview", async () => {
    render(await HomePage());

    const heading = screen.getByRole("heading", {
      name: "不会写 prompt，也能生成专业图片。"
    });
    const hero = heading.closest("section");
    const intro = screen.getByText(
      /选择创意参数和主题/
    );
    const ctaGroup = screen
      .getAllByRole("link", { name: /开始生成/ })[0]
      .parentElement;

    expect(hero).toHaveClass("min-h-[calc(100dvh-76px)]", "gap-8", "px-4", "py-8");
    expect(heading).toHaveClass("mt-5", "text-4xl", "sm:text-5xl");
    expect(intro).toHaveClass("mt-5", "max-w-xl", "leading-7");
    expect(ctaGroup).toHaveClass("mt-7", "flex-wrap", "gap-3");
    expect(screen.getByText("自动组装的英文 prompt")).toBeInTheDocument();
  });
});
