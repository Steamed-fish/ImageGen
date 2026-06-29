import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the polished home page with generator preview", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Structured image generation for polished creative work."
      })
    ).toBeInTheDocument();

    expect(screen.getByText("Prompt Studio")).toBeInTheDocument();
    expect(
      screen.getByText(/choose image type, ratio, style, scene, and whitespace/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /start generating/i })
    ).toHaveAttribute("href", "/generate");
    expect(screen.getByRole("link", { name: /view history/i })).toHaveAttribute(
      "href",
      "/history"
    );

    expect(screen.getByText("Generator preview")).toBeInTheDocument();
    expect(screen.getByText("Poster")).toBeInTheDocument();
    expect(screen.getByText("4:5")).toBeInTheDocument();
    expect(screen.getByText("Editorial")).toBeInTheDocument();
    expect(screen.getByText("Top text space")).toBeInTheDocument();
    expect(
      screen.getByText(/Create a 4:5 editorial poster/i)
    ).toBeInTheDocument();

    expect(screen.getByText("Structured choices")).toBeInTheDocument();
    expect(screen.getByText("Prompt assembly")).toBeInTheDocument();
    expect(screen.getByText("Saved history")).toBeInTheDocument();
  });

  it("keeps the mobile hero compact enough to reveal the preview", () => {
    render(<HomePage />);

    const heading = screen.getByRole("heading", {
      name: "Structured image generation for polished creative work."
    });
    const hero = heading.closest("section");
    const intro = screen.getByText(
      /choose image type, ratio, style, scene, and whitespace/i
    );
    const ctaGroup = screen
      .getByRole("link", { name: /start generating/i })
      .parentElement;
    const preview = screen.getByText("Generator preview").closest("section");

    expect(hero).toHaveClass("gap-5", "px-4", "py-5");
    expect(heading).toHaveClass("mt-4", "text-3xl", "sm:text-4xl");
    expect(intro).toHaveClass("mt-4", "text-base", "sm:text-lg");
    expect(ctaGroup).toHaveClass("mt-5", "flex-wrap", "gap-2");
    expect(preview).toHaveClass("p-4", "sm:p-5");
  });
});
