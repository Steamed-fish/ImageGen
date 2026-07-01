import { NextResponse, type NextRequest } from "next/server";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import {
  buildLoginUrl,
  cleanAuthMessage,
  getSafeRedirectPath
} from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));
  const oauthError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      buildLoginUrl(requestUrl.origin, next, cleanAuthMessage(oauthError))
    );
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        buildLoginUrl(requestUrl.origin, next, error.message)
      );
    }

    const { data } = await supabase.auth.getUser();

    if (data.user) {
      try {
        await ensureProfile(data.user);
      } catch {
        return NextResponse.redirect(
          buildLoginUrl(
            requestUrl.origin,
            next,
            "We could not finish setting up your account."
          )
        );
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
