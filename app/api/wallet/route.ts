import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to view your wallet." }, { status: 401 });

    const supabase = await createClient();
    const { data: rows, error } = await supabase
      .from("transactions")
      .select("id, type, network, amount, tx_hash, status, actual_confirmations, required_confirmations, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) throw error;

    const { data: depositWallets, error: walletsError } = await supabase
      .from("deposit_wallets")
      .select("address")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (walletsError) throw walletsError;

    const transactions = (rows ?? []).map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      network: transaction.network,
      amount: transaction.amount,
      txHash: transaction.tx_hash,
      status: transaction.status,
      actualConfirmations: transaction.actual_confirmations,
      requiredConfirmations: transaction.required_confirmations,
      createdAt: transaction.created_at,
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        usdtBalance: user.usdtBalance,
      },
      depositWallets: depositWallets ?? [],
      transactions,
    });
  } catch (error) {
    console.error("Supabase wallet lookup failed:", error);
    return NextResponse.json({ error: "Wallet service is unavailable." }, { status: 503 });
  }
}
