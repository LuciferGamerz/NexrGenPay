import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: rows, error } = await supabase
      .from("transactions")
      .select("id, user_id, amount, created_at")
      .eq("status", "PENDING")
      .eq("type", "SELL")
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw error;

    const userIds = [...new Set((rows ?? []).map((transaction) => transaction.user_id))];
    const { data: profiles, error: profileError } = userIds.length
      ? await supabase.from("profiles").select("id, email").in("id", userIds)
      : { data: [], error: null };
    if (profileError) throw profileError;

    const emailsById = new Map((profiles ?? []).map((profile) => [profile.id, profile.email]));
    const transactions = (rows ?? []).map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      createdAt: transaction.created_at,
      user: { email: emailsById.get(transaction.user_id) ?? "Unknown user" },
    }));
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Supabase admin sell queue lookup failed:", error);
    return NextResponse.json({ error: "Admin transaction queue is unavailable." }, { status: 503 });
  }
}
