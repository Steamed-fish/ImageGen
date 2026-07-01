import { redirect } from "next/navigation";
import type React from "react";
import { Clock, ImageIcon, Sparkles, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AccountJob = {
  id: string;
  subject: string;
  status: "processing" | "completed" | "failed";
  image_type: string;
  created_at: string;
};

function formatDate(value: string, locale: "zh" | "en") {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusLabel(status: AccountJob["status"], locale: "zh" | "en") {
  const labels = {
    zh: {
      processing: "生成中",
      completed: "已完成",
      failed: "失败"
    },
    en: {
      processing: "Processing",
      completed: "Completed",
      failed: "Failed"
    }
  };

  return labels[locale][status];
}

export default async function AccountPage() {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Faccount");
  }

  const admin = createSupabaseAdminClient();
  const [{ data: profile }, { data: jobs }] = await Promise.all([
    admin
      .from("profiles")
      .select("email, display_name, credits_balance, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("generation_jobs")
      .select("id, subject, status, image_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
  ]);

  const accountJobs = (jobs ?? []) as AccountJob[];
  const completedCount = accountJobs.filter((job) => job.status === "completed").length;
  const failedCount = accountJobs.filter((job) => job.status === "failed").length;

  const copy = {
    zh: {
      title: "账户仪表盘",
      subtitle: "查看积分、生成记录和账户状态。",
      credits: "可用积分",
      completed: "近期成功",
      failed: "近期失败",
      memberSince: "加入时间",
      recent: "最近生成",
      upgrade: "升级入口预留",
      upgradeText: "真实支付暂未接入，后续可以在这里展示套餐和充值入口。",
      empty: "还没有生成记录。"
    },
    en: {
      title: "Account dashboard",
      subtitle: "Review credits, generation activity, and account status.",
      credits: "Available credits",
      completed: "Recent completed",
      failed: "Recent failed",
      memberSince: "Member since",
      recent: "Recent generations",
      upgrade: "Upgrade placeholder",
      upgradeText:
        "Payments are not connected yet. Plans and top-ups can live here later.",
      empty: "No generation activity yet."
    }
  }[locale];

  return (
    <main className="min-h-screen px-4 py-8 text-ink sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="bg-night p-6 text-white sm:p-8">
            <Badge variant="accent">{dictionary.nav.account}</Badge>
            <h1 className="mt-5 text-3xl font-semibold sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              {copy.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/80">
              <span>{profile?.email ?? user.email}</span>
              <span>{profile?.display_name ?? user.email}</span>
            </div>
          </Card>
          <Card className="p-6">
            <WalletCards aria-hidden="true" className="h-7 w-7 text-moss" />
            <p className="mt-5 text-sm font-semibold text-muted">
              {copy.credits}
            </p>
            <p className="mt-2 text-5xl font-semibold">
              {profile?.credits_balance ?? 0}
            </p>
            <Button className="mt-6 w-full" variant="outline">
              {copy.upgrade}
            </Button>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-3">
          <Metric
            icon={<Sparkles aria-hidden="true" className="h-5 w-5" />}
            label={copy.completed}
            value={completedCount}
          />
          <Metric
            icon={<ImageIcon aria-hidden="true" className="h-5 w-5" />}
            label={copy.failed}
            value={failedCount}
          />
          <Metric
            icon={<Clock aria-hidden="true" className="h-5 w-5" />}
            label={copy.memberSince}
            value={
              profile?.created_at
                ? formatDate(profile.created_at, locale)
                : formatDate(user.created_at, locale)
            }
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="overflow-hidden">
            <div className="border-b border-line p-5 sm:p-6">
              <h2 className="text-xl font-semibold">
                {copy.recent}
              </h2>
            </div>
            <div className="divide-y divide-line">
              {accountJobs.length > 0 ? (
                accountJobs.map((job) => (
                  <div
                    key={job.id}
                    className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:p-6"
                  >
                    <div>
                      <p className="font-semibold text-ink">{job.subject}</p>
                      <p className="mt-1 text-sm text-muted">
                        {job.image_type} / {formatDate(job.created_at, locale)}
                      </p>
                    </div>
                    <Badge
                      variant={job.status === "completed" ? "accent" : "outline"}
                    >
                      {statusLabel(job.status, locale)}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="p-6 text-sm text-muted">{copy.empty}</p>
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="text-xl font-semibold">
              {copy.upgrade}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              {copy.upgradeText}
            </p>
          </Card>
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 text-moss">
        {icon}
        <p className="text-sm font-semibold text-muted">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-semibold text-ink">
        {value}
      </p>
    </Card>
  );
}
