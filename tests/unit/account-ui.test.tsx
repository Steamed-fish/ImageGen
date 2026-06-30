import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountMenu } from "@/components/account-menu";
import { AppHeader } from "@/components/app-header";
import { CreditBadge } from "@/components/credit-badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/auth/actions", () => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "zh")
}));

const createSupabaseServerClientMock = vi.mocked(createSupabaseServerClient);

describe("account UI", () => {
  it("renders a sign-in action for anonymous visitors", () => {
    render(<AccountMenu email={null} labels={getDictionary("en").account} />);

    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("renders the user email and sign-out action for signed-in users", () => {
    render(
      <AccountMenu email="alex@example.com" labels={getDictionary("en").account} />
    );

    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
  });

  it("renders credits only when a balance is available", () => {
    const { rerender } = render(
      <CreditBadge credits={5} label={getDictionary("zh").account.credits} />
    );

    expect(screen.getByText("5 积分")).toBeInTheDocument();

    rerender(
      <CreditBadge credits={null} label={getDictionary("zh").account.credits} />
    );

    expect(screen.queryByText("5 积分")).not.toBeInTheDocument();
  });

  it("renders the current language as selected", () => {
    render(
      <LanguageSwitcher locale="zh" labels={getDictionary("zh").language} />
    );

    expect(screen.getByRole("group", { name: "语言" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "中文" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
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
    const linkRow = screen.getByRole("link", { name: "生成" })
      .parentElement;

    expect(nav).toHaveClass("flex-wrap", "gap-y-3");
    expect(linkRow).toHaveClass("order-last", "w-full", "sm:w-auto");
    expect(screen.getByRole("button", { name: "登录" })).toHaveClass(
      "shrink-0"
    );
    expect(screen.getByRole("button", { name: "中文" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
