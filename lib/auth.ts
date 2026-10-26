import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/wallet-types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") throw error;

  const authUser = data.user;
  if (!authUser || !authUser.email_confirmed_at) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, usdt_balance")
    .eq("id", authUser.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return null;

  const role: UserRole = profile.role === "ADMIN" ? "ADMIN" : "USER";
  return {
    id: profile.id,
    email: profile.email,
    role,
    usdtBalance: profile.usdt_balance,
  };
}
