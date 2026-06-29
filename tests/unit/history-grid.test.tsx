import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HistoryGrid } from "@/components/history-grid";

vi.mock("next/image", () => ({
  default: (props: {
    fill?: boolean;
    unoptimized?: boolean;
  } & React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { fill, unoptimized, ...imageProps } = props;

    void fill;
    void unoptimized;

    return React.createElement("img", imageProps);
  }
}));

const item = {
  id: "job-1",
  image_type: "poster",
  subject: "a coffee brand launch poster",
  compiled_prompt: "Create a poster about a coffee brand launch poster.",
  storage_path: "7fd61c8b-3256-4824-a72c-c54f26bb84e9/job-1.png",
  created_at: "2026-06-29T08:00:00.000Z",
  completed_at: "2026-06-29T08:00:10.000Z",
  imageUrl: "https://example.com/signed/job-1.png"
};

describe("HistoryGrid", () => {
  it("renders an empty state when there are no items", () => {
    render(<HistoryGrid items={[]} />);

    expect(screen.getByText("No generated images yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your completed generations will appear here after the first successful run."
      )
    ).toBeInTheDocument();
  });

  it("renders history item details and an open link when an image URL exists", () => {
    render(<HistoryGrid items={[item]} />);

    expect(screen.getByAltText(item.subject)).toBeInTheDocument();
    expect(screen.getByText("poster")).toBeInTheDocument();
    expect(screen.getByText(item.subject)).toBeInTheDocument();
    expect(screen.getByText(item.compiled_prompt)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /open image/i });
    expect(link).toHaveAttribute("href", item.imageUrl);
  });
});
