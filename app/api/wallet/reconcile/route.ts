import { NextResponse } from "next/server";
import { getDepositNetworkConfig } from "@/lib/deposit-config";
import { safeDepositErrorMessage, scanEthereumDeposits } from "@/lib/deposit-scanner";
import { verifyDeposit } from "@/lib/deposit-verifier";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const secret = process.env.DEPOSIT_RECONCILE_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data: pending, error: lookupError } = await supabase.rpc("list_pending_deposits");
    if (lookupError) throw lookupError;

    let credited = 0;
    for (const deposit of pending) {
      if (!deposit.network || !deposit.tx_hash) continue;

      const config = getDepositNetworkConfig(deposit.network);
      const verification = await verifyDeposit(deposit.network, deposit.tx_hash, deposit.amount);
      const status = verification.status === "VERIFIED"
        ? "COMPLETED"
        : verification.status === "INVALID" ? "FAILED" : "PENDING";
      const { data, error } = await supabase.rpc("process_deposit_claim", {
        p_user_id: deposit.user_id,
        p_network: deposit.network,
        p_tx_hash: deposit.tx_hash,
        p_amount: deposit.amount,
        p_status: status,
        p_from_address: verification.status === "INVALID" ? deposit.from_address : verification.fromAddress || null,
        p_to_address: verification.status === "INVALID" ? deposit.to_address ?? config.address : verification.toAddress,
        p_actual_confirmations: verification.status === "INVALID" ? deposit.actual_confirmations ?? 0 : verification.confirmations,
        p_required_confirmations: config.confirmations,
        p_admin_note: verification.status === "INVALID" ? verification.message : null,
      });
      if (error) throw error;
      if (data.credited) credited += 1;
    }

    const automatic = await scanEthereumDeposits();
    return NextResponse.json({
      processed: pending.length,
      credited: credited + automatic.credited,
      automatic,
    });
  } catch (error) {
    console.error("Supabase deposit reconciliation failed:", safeDepositErrorMessage(error));
    return NextResponse.json({ error: "Deposit reconciliation failed." }, { status: 503 });
  }
}
