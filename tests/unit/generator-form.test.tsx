import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeneratorForm } from "@/components/generator-form";
import { getDictionary, type Locale } from "@/lib/i18n/config";

vi.mock("@/lib/auth/actions", () => ({
  signInWithGoogle: vi.fn()
}));

function renderGeneratorForm({
  isLoggedIn = false,
  locale = "en"
}: {
  isLoggedIn?: boolean;
  locale?: Locale;
} = {}) {
  return render(
    <GeneratorForm
      isLoggedIn={isLoggedIn}
      locale={locale}
      dictionary={getDictionary(locale)}
    />
  );
}

describe("GeneratorForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates the prompt preview when a subject is entered", () => {
    renderGeneratorForm();

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

  it("renders Chinese UI while keeping the compiled prompt template in English", () => {
    renderGeneratorForm({ locale: "zh" });

    expect(screen.getByRole("heading", { name: "创建图片" })).toBeInTheDocument();
    expect(screen.getByLabelText("主题")).toBeInTheDocument();
    expect(
      screen.getByText("输入主题后预览专业英文 prompt。")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("主题"), {
      target: { value: "咖啡品牌发布海报" }
    });

    expect(
      screen.getByText(/Create a poster about 咖啡品牌发布海报/)
    ).toBeInTheDocument();
  });

  it("opens sign-in-required UX when anonymous users click Generate", () => {
    renderGeneratorForm();

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "a coffee brand launch poster" }
    });
    fireEvent.click(screen.getByRole("button", { name: /generate 1 image/i }));

    expect(
      screen.getByRole("dialog", { name: /sign in to generate/i })
    ).toBeInTheDocument();
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

    renderGeneratorForm({ isLoggedIn: true });

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "a coffee brand launch poster" }
    });
    fireEvent.click(screen.getByRole("button", { name: /generate 1 image/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /upgrade coming soon/i })
      ).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("resets loading and shows a friendly error when generation returns non-JSON", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response("<!doctype html><h1>Not found</h1>", {
        status: 404,
        headers: { "Content-Type": "text/html" }
      })
    );

    renderGeneratorForm({ isLoggedIn: true });

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "a coffee brand launch poster" }
    });
    fireEvent.click(screen.getByRole("button", { name: /generate 1 image/i }));

    expect(
      screen.getByRole("button", { name: /generate 1 image/i })
    ).toBeDisabled();

    await waitFor(() => {
      expect(
        screen.getByText("We couldn't generate your image. Please try again.")
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /generate 1 image/i })
    ).toBeEnabled();
  });

  it("clears an old generated image when a later generation fails", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ imageUrl: "https://example.com/result.png" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Generation failed." }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        })
      );

    renderGeneratorForm({ isLoggedIn: true });

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "a coffee brand launch poster" }
    });
    fireEvent.click(screen.getByRole("button", { name: /generate 1 image/i }));

    await waitFor(() => {
      expect(screen.getByAltText("Generated result")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /generate 1 image/i }));

    await waitFor(() => {
      expect(screen.getByText("Generation failed.")).toBeInTheDocument();
    });
    expect(screen.queryByAltText("Generated result")).not.toBeInTheDocument();
  });

  it("prevents duplicate waitlist requests while joining is in flight", async () => {
    const fetchMock = vi.mocked(fetch);
    let resolveWaitlist: (response: Response) => void;
    const waitlistPromise = new Promise<Response>((resolve) => {
      resolveWaitlist = resolve;
    });

    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "You have used your free credits.",
            code: "INSUFFICIENT_CREDITS"
          }),
          { status: 402, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockReturnValue(waitlistPromise);

    renderGeneratorForm({ isLoggedIn: true });

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "a coffee brand launch poster" }
    });
    fireEvent.click(screen.getByRole("button", { name: /generate 1 image/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /upgrade coming soon/i })
      ).toBeInTheDocument();
    });

    const joinButton = screen.getByRole("button", { name: /join waitlist/i });
    fireEvent.click(joinButton);
    fireEvent.click(joinButton);

    const waitlistCalls = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/upgrade-waitlist"
    );
    expect(waitlistCalls).toHaveLength(1);
    expect(joinButton).toBeDisabled();

    await act(async () => {
      resolveWaitlist!(new Response(null, { status: 204 }));
      await waitlistPromise;
    });
  });
});
