import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountMenu } from "@/components/account-menu";
import { AppHeader } from "@/components/app-header";
import { CreditBadge } from "@/components/credit-badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/auth/actions", () => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

const createSupabaseServerClientMock = vi.mocked(createSupabaseServerClient);

describe("account UI", () => {
  it("renders a sign-in action for anonymous visitors", () => {
    render(<AccountMenu email={null} />);

    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("renders the user email and sign-out action for signed-in users", () => {
    render(<AccountMenu email="alex@example.com" />);

    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
  });

  it("renders credits only when a balance is available", () => {
    const { rerender } = render(<CreditBadge credits={5} />);

    expect(screen.getByText("5 credits")).toBeInTheDocument();

    rerender(<CreditBadge credits={null} />);

    expect(screen.queryByText("5 credits")).not.toBeInTheDocument();
  });

  it("wraps mobile header controls while keeping generate and sign-in reachable", async () => {
    createSupabaseServerClientMock.mockResolvedValueOnce({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null } }))
      },
      from: vi.fn()
    } as never);

    render(await AppHeader());

    const nav = screen.getByRole("navigation");
    const linkRow = screen.getByRole("link", { name: /generate/i })
      .parentElement;

    expect(nav).toHaveClass("flex-wrap", "gap-y-3");
    expect(linkRow).toHaveClass("order-last", "w-full", "sm:w-auto");
    expect(screen.getByRole("button", { name: /sign in/i })).toHaveClass(
      "shrink-0"
    );
  });
});
