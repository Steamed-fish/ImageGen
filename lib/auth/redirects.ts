export function getSafeRedirectPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/generate";
  }

  return next;
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

export function buildAuthCallbackUrl(next: string) {
  const url = new URL("/auth/callback", getSiteUrl());
  url.searchParams.set("next", getSafeRedirectPath(next));
  return url.toString();
}

export function buildLoginPath(next: string, error?: string | null) {
  const url = new URL("/login", getSiteUrl());
  url.searchParams.set("next", getSafeRedirectPath(next));

  if (error) {
    url.searchParams.set("error", cleanAuthMessage(error));
  }

  return `${url.pathname}${url.search}`;
}

export function buildLoginUrl(origin: string, next: string, error?: string | null) {
  const url = new URL("/login", origin);
  url.searchParams.set("next", getSafeRedirectPath(next));

  if (error) {
    url.searchParams.set("error", cleanAuthMessage(error));
  }

  return url;
}

export function cleanAuthMessage(message: string) {
  return message.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 240);
}
