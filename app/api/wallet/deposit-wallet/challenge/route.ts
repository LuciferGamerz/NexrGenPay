import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDepositNetworkConfig } from "@/lib/deposit-config";
import { apiError, requireSameOrigin } from "@/lib/http-security";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ address: z.string().trim().length(42) });

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error("Deposit wallet authentication lookup failed:", error);
    return apiError("Wallet authentication service is unavailable.", 503);
  }
  if (!user) return apiError("Sign in with a verified account to link a wallet.", 401);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isAddress(parsed.data.address, { strict: false })) {
    return apiError("Enter a valid Ethereum wallet address.");
  }

  try {
    getDepositNetworkConfig("ERC20");
    const address = getAddress(parsed.data.address).toLowerCase();
    const challengeId = randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const message = [
      "NextGenPay deposit wallet link",
      `Origin: ${new URL(request.url).origin}`,
      `Account: ${user.id}`,
      `Wallet: ${address}`,
      `Nonce: ${challengeId}`,
      `Issued at: ${new Date().toISOString()}`,
      `Expires at: ${expiresAt.toISOString()}`,
      "Sign this message to prove wallet ownership. This does not authorize a transaction.",
    ].join("\n");

    const supabase = createAdminClient();
    const { error } = await supabase.rpc("create_deposit_wallet_challenge", {
      p_user_id: user.id,
      p_challenge_id: challengeId,
      p_address: address,
      p_message: message,
      p_expires_at: expiresAt.toISOString(),
    });
    if (error) throw error;

    return NextResponse.json({ challengeId, address, message, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error("Could not create deposit wallet challenge:", error);
    return apiError("Wallet linking is temporarily unavailable.", 503);
  }
}
