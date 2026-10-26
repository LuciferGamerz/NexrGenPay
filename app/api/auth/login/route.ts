import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiError, requireSameOrigin } from "@/lib/http-security";

const schema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72),
});

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Invalid email or password.", 400);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
    });
    if (error) {
      if (error.code === "email_not_confirmed") {
        return apiError("Verify your email address before signing in.", 403);
      }
      return apiError("Invalid email or password.", 401);
    }

    return NextResponse.json({ message: "Signed in." });
  } catch (error) {
    console.error("Supabase sign-in failed:", error);
    return apiError("Sign-in is temporarily unavailable.", 503);
  }
}
