import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth-form";
import { getDictionary } from "@/lib/i18n/config";

vi.mock("@/lib/auth/actions", () => ({
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  signUpWithEmail: vi.fn()
}));

describe("AuthForm", () => {
  it("renders email sign-in, email registration, and Google OAuth entry points", () => {
    render(
      <AuthForm
        labels={getDictionary("en").login}
        next="/generate"
        initialError={null}
      />
    );

    expect(screen.getByRole("tab", { name: /sign in/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with email/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /create account/i }));

    expect(screen.getByRole("tab", { name: /create account/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
  });

  it("shows callback errors returned from Supabase OAuth", () => {
    render(
      <AuthForm
        labels={getDictionary("en").login}
        next="/generate"
        initialError="Google provider is not enabled."
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Google provider is not enabled."
    );
  });
});
