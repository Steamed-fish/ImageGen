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
});
