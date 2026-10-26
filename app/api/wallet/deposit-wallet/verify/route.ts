import { NextResponse } from "next/server";
import { recoverMessageAddress } from "viem";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createEthereumClient } from "@/lib/ethereum-client";
import { getDepositNetworkConfig } from "@/lib/deposit-config";
import { apiError, requireSameOrigin } from "@/lib/http-security";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  challengeId: z.string().uuid(),
  address: z.string().trim().length(42),
  signature: z.string().regex(/^0x[0-9a-fA-F]{130}$/),
});

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
  if (!parsed.success) return apiError("Wallet signature details are invalid.");

  try {
    const address = parsed.data.address.toLowerCase();
    const supabase = createAdminClient();
    const { data: message, error: challengeError } = await supabase.rpc("get_deposit_wallet_challenge", {
      p_user_id: user.id,
      p_challenge_id: parsed.data.challengeId,
      p_address: address,
    });
    if (challengeError) throw challengeError;
    if (!message) return apiError("Wallet link request expired. Please try again.", 410);

    const signer = await recoverMessageAddress({ message, signature: parsed.data.signature as `0x${string}` });
    if (signer.toLowerCase() !== address) return apiError("The signature does not match this wallet.", 422);

    const config = getDepositNetworkConfig("ERC20");
    const client = createEthereumClient();
    const chainId = await client.getChainId();
    if (chainId !== 1) throw new Error(`Wallet linking RPC returned chain ID ${chainId}; expected 1.`);
    const startBlock = await client.getBlockNumber();
    const safeStartBlock = Number(startBlock);
    if (!Number.isSafeInteger(safeStartBlock)) throw new Error("Ethereum block number exceeds the safe integer range.");

    const { error: linkError } = await supabase.rpc("complete_deposit_wallet_link", {
      p_user_id: user.id,
      p_challenge_id: parsed.data.challengeId,
      p_address: address,
      p_start_block: safeStartBlock,
    });
    if (linkError) {
      if (linkError.message.includes("wallet_already_linked")) {
        return apiError("This sending wallet is already linked to another account.", 409);
      }
      if (linkError.message.includes("wallet_challenge_expired_or_invalid")) {
        return apiError("Wallet link request expired. Please try again.", 410);
      }
      throw linkError;
    }

    return NextResponse.json({
      message: `Wallet linked on ${config.label}. New confirmed USDT transfers from this wallet will be detected automatically.`,
      address,
    });
  } catch (error) {
    console.error("Could not verify deposit wallet signature:", error);
    return apiError("Wallet linking is temporarily unavailable.", 503);
  }
}
