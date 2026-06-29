import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

function parseSource(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const source = (body as { source?: unknown }).source;

  if (typeof source !== "string") {
    return null;
  }

  const trimmedSource = source.trim();

  if (trimmedSource.length < 1 || trimmedSource.length > 80) {
    return null;
  }

  return trimmedSource;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError(
      401,
      "UNAUTHENTICATED",
      "Please sign in to join the upgrade waitlist."
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "Invalid JSON request body.");
  }

  const source = parseSource(body);

  if (!source) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid waitlist request.");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("upgrade_waitlist").upsert(
    {
      user_id: user.id,
      email: user.email ?? "",
      source
    },
    {
      onConflict: "user_id,source",
      ignoreDuplicates: true
    }
  );

  if (error) {
    return jsonError(
      500,
      "WAITLIST_FAILED",
      "We could not add you to the upgrade waitlist."
    );
  }

  return NextResponse.json({ ok: true });
}
