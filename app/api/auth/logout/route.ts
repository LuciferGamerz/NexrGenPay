import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSameOrigin } from "@/lib/http-security";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return NextResponse.json({ message: "Signed out." });
  } catch (error) {
    console.error("Supabase sign-out failed:", error);
    return NextResponse.json({ error: "Sign-out is temporarily unavailable." }, { status: 503 });
  }
}
