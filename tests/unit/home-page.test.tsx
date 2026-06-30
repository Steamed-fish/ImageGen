import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the polished Chinese home page with generator preview", async () => {
    render(await HomePage());

    expect(
      screen.getByRole("heading", {
        name: "结构化 AI 图片生成，产出更精致的创意作品。"
      })
    ).toBeInTheDocument();

    expect(screen.getByText("Prompt Studio")).toBeInTheDocument();
    expect(
      screen.getByText(/选择图片类型、比例、风格、场景和留白/)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /开始生成/ })
    ).toHaveAttribute("href", "/generate");
    expect(screen.getByRole("link", { name: /查看历史/ })).toHaveAttribute(
      "href",
      "/history"
    );

    expect(screen.getByText("生成器预览")).toBeInTheDocument();
    expect(screen.getByText("海报")).toBeInTheDocument();
    expect(screen.getByText("4:5")).toBeInTheDocument();
    expect(screen.getByText("编辑风")).toBeInTheDocument();
    expect(screen.getByText("顶部文字空间")).toBeInTheDocument();
    expect(
      screen.getByText(/Create a 4:5 editorial poster/i)
    ).toBeInTheDocument();

    expect(screen.getByText("结构化选择")).toBeInTheDocument();
    expect(screen.getByText("Prompt 组装")).toBeInTheDocument();
    expect(screen.getByText("历史保存")).toBeInTheDocument();
  });

  it("keeps the mobile hero compact enough to reveal the preview", async () => {
    render(await HomePage());

    const heading = screen.getByRole("heading", {
      name: "结构化 AI 图片生成，产出更精致的创意作品。"
    });
    const hero = heading.closest("section");
    const intro = screen.getByText(
      /选择图片类型、比例、风格、场景和留白/
    );
    const ctaGroup = screen
      .getByRole("link", { name: /开始生成/ })
      .parentElement;
    const preview = screen.getByText("生成器预览").closest("section");

    expect(hero).toHaveClass("gap-5", "px-4", "py-5");
    expect(heading).toHaveClass("mt-4", "text-3xl", "sm:text-4xl");
    expect(intro).toHaveClass("mt-4", "text-base", "sm:text-lg");
    expect(ctaGroup).toHaveClass("mt-5", "flex-wrap", "gap-2");
    expect(preview).toHaveClass("p-4", "sm:p-5");
  });
});
