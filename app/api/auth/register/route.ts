import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiError, requireSameOrigin } from "@/lib/http-security";

const schema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72),
});

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Enter a valid email and a password of at least 12 characters.");

  const appOrigin = process.env.APP_ORIGIN;
  if (!appOrigin) return apiError("Account registration is not configured.", 503);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      options: {
        emailRedirectTo: new URL("/auth/confirm", appOrigin).toString(),
      },
    });

    if (error) {
      console.error("Supabase account registration failed:", error.message);
      return apiError("Account registration could not be completed. Check your details and try again.", 400);
    }

    return NextResponse.json({
      message: "If this address can be registered, a verification email has been sent.",
    }, { status: 202 });
  } catch (error) {
    console.error("Account registration failed:", error);
    return apiError("Account registration is temporarily unavailable.", 503);
  }
}
