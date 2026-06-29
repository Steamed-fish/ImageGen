import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountMenu } from "@/components/account-menu";
import { CreditBadge } from "@/components/credit-badge";

vi.mock("@/lib/auth/actions", () => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn()
}));

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
});
