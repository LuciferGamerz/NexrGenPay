import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDepositNetworkConfig } from "@/lib/deposit-config";
import { verifyDeposit } from "@/lib/deposit-verifier";
import { apiError, requireSameOrigin } from "@/lib/http-security";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { DepositNetwork } from "@/lib/wallet-types";

const schema = z.object({
  network: z.enum(["BEP20", "ERC20", "TRC20"]),
  txHash: z.string().trim().min(64).max(66),
  amount: z.string().regex(/^(?:0|[1-9]\d{0,21})(?:\.\d{1,8})?$/).optional(),
}).refine((data) => !data.amount || Number(data.amount) > 0, { message: "Amount must be greater than zero." });

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error("Deposit claim authentication lookup failed:", error);
    return apiError("Wallet authentication service is unavailable.", 503);
  }
  if (!user) return apiError("Sign in with a verified account to submit a deposit claim.", 401);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Enter a valid network and transaction hash.");

  const network: DepositNetwork = parsed.data.network;
  const submittedHash = parsed.data.txHash.toLowerCase().replace(/^0x/, "");
  const txHash = network === "TRC20" ? submittedHash : `0x${submittedHash}`;

  try {
    const config = getDepositNetworkConfig(network);
    if (parsed.data.amount && (parsed.data.amount.split(".")[1]?.length ?? 0) > config.decimals) {
      return apiError(`Amount supports up to ${config.decimals} decimal places on ${network}.`);
    }

    const verification = await verifyDeposit(network, txHash, parsed.data.amount);
    if (verification.status === "INVALID") return apiError(verification.message, 422);
    if (!verification.amount) {
      return NextResponse.json({
        message: "Transaction not found on-chain yet. Check the hash and try again after it is included; no balance has been credited.",
      }, { status: 202 });
    }
    if (!/^(?:0|[1-9]\d{0,21})(?:\.\d{1,8})?$/.test(verification.amount) || Number(verification.amount) <= 0) {
      return apiError("The verified transfer amount exceeds the wallet ledger's supported precision.", 422);
    }

    const userClient = await createClient();
    const { data: existing, error: lookupError } = await userClient
      .from("transactions")
      .select("user_id, status")
      .eq("network", network)
      .eq("tx_hash", txHash)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing && existing.user_id !== user.id) {
      return apiError("This transaction hash has already been claimed.", 409);
    }
    if (existing?.status === "COMPLETED") {
      return NextResponse.json({ message: "This deposit has already been credited." });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("process_deposit_claim", {
      p_user_id: user.id,
      p_network: network,
      p_tx_hash: txHash,
      p_amount: verification.amount,
      p_status: verification.status === "VERIFIED" ? "COMPLETED" : "PENDING",
      p_from_address: verification.fromAddress || null,
      p_to_address: verification.toAddress,
      p_actual_confirmations: verification.confirmations,
      p_required_confirmations: config.confirmations,
      p_admin_note: null,
    });
    if (error) {
      if (error.message.includes("transaction_hash_already_claimed")) {
        return apiError("This transaction hash has already been claimed.", 409);
      }
      if (error.message.includes("transaction_amount_mismatch")) {
        return apiError("This hash is already pending with a different amount.", 409);
      }
      if (error.message.includes("transaction_not_claimable")) {
        return apiError("This transaction cannot be claimed again.", 409);
      }
      throw error;
    }

    if (verification.status === "PENDING") {
      return NextResponse.json({
        message: "Transfer found. Deposit remains pending until its confirmation threshold is reached; no balance has been credited.",
        transaction: data.transaction,
      }, { status: 202 });
    }

    return NextResponse.json({
      message: data.credited
        ? "Verified deposit credited to your internal USDT balance."
        : "This deposit has already been credited.",
      transaction: data.transaction,
    });
  } catch (error) {
    console.error("Supabase deposit claim failed:", error);
    return apiError("Deposit verification is temporarily unavailable. Please try again later.", 503);
  }
}
