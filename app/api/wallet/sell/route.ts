import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, requireSameOrigin } from "@/lib/http-security";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  amountToSell: z.string().regex(/^(?:0|[1-9]\d{0,21})(?:\.\d{1,8})?$/),
}).refine((data) => Number(data.amountToSell) > 0, { message: "Amount must be greater than zero." });

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error("Sell request authentication lookup failed:", error);
    return apiError("Wallet authentication service is unavailable.", 503);
  }
  if (!user) return apiError("Sign in with a verified account to request a sale.", 401);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Enter a valid USDT amount greater than zero.");

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("request_sell", {
      p_amount: parsed.data.amountToSell,
    });
    if (error) {
      if (error.message.includes("insufficient_balance")) return apiError("Insufficient balance.", 409);
      if (error.message.includes("invalid_amount")) return apiError("Enter a valid USDT amount greater than zero.");
      throw error;
    }

    return NextResponse.json({
      message: "Sell request queued for admin review. No fiat payout has been initiated.",
      transaction: data,
    }, { status: 202 });
  } catch (error) {
    console.error("Supabase sell request failed:", error);
    return apiError("Sell request could not be created.", 503);
  }
}
