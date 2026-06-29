import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeneratorForm } from "@/components/generator-form";

vi.mock("@/lib/auth/actions", () => ({
  signInWithGoogle: vi.fn()
}));

describe("GeneratorForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates the prompt preview when a subject is entered", () => {
    render(<GeneratorForm isLoggedIn={false} />);

    expect(
      screen.getByText("Enter a subject to preview the professional prompt.")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "a coffee brand launch poster" }
    });

    expect(
      screen.getByText(/Create a poster about a coffee brand launch poster/i)
    ).toBeInTheDocument();
  });

  it("opens sign-in-required UX when anonymous users click Generate", () => {
    render(<GeneratorForm isLoggedIn={false} />);

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "a coffee brand launch poster" }
    });
    fireEvent.click(screen.getByRole("button", { name: /generate 1 image/i }));

    expect(screen.getByText("Sign in to generate")).toBeInTheDocument();
    expect(
      screen.getByText("Please sign in with Google to generate an image.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i })
    ).toBeInTheDocument();
  });

  it("opens the upgrade modal when the API returns insufficient credits", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: "You have used your free credits.",
          code: "INSUFFICIENT_CREDITS"
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<GeneratorForm isLoggedIn={true} />);

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "a coffee brand launch poster" }
    });
    fireEvent.click(screen.getByRole("button", { name: /generate 1 image/i }));

    await waitFor(() => {
      expect(screen.getByText("Upgrade coming soon")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate",
      expect.objectContaining({ method: "POST" })
    );
  });
});
