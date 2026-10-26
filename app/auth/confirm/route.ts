import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isConfirmationType(value: string | null): value is "email" | "signup" {
  return value === "email" || value === "signup";
}

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/login?verified=1";
  }
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appOrigin = process.env.APP_ORIGIN;
  if (!appOrigin) {
    return NextResponse.json({ error: "Auth callback is not configured." }, { status: 503 });
  }
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = getSafeNextPath(url.searchParams.get("next"));

  if (!tokenHash || !isConfirmationType(type)) {
    return NextResponse.redirect(new URL("/login?error=invalid-verification-link", appOrigin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      console.error("Supabase email verification failed:", error.message);
      return NextResponse.redirect(new URL("/login?error=verification-failed", appOrigin));
    }

    return NextResponse.redirect(new URL(next, appOrigin));
  } catch (error) {
    console.error("Email confirmation callback failed:", error);
    return NextResponse.redirect(new URL("/login?error=verification-failed", appOrigin));
  }
}
