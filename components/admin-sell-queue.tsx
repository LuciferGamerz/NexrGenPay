"use client";

import { useCallback, useEffect, useState } from "react";

type SellRequest = {
  id: string;
  amount: string;
  createdAt: string;
  user: { email: string };
};

export function AdminSellQueue() {
  const [transactions, setTransactions] = useState<SellRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/transactions", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not load the admin queue.");
      setTransactions(result.transactions);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the admin queue.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function review(id: string, decision: "COMPLETE" | "FAIL") {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/transactions/${id}/review`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, note: decision === "COMPLETE" ? "Manual payout confirmed by admin." : "Rejected by admin." })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Review failed.");
      await refresh();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Review failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="panel mx-auto max-w-4xl p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow mb-2">Authorized admin</p><h2 className="text-lg font-semibold">Pending sell requests</h2></div>
        <button type="button" onClick={() => void refresh()} className="ghost-btn text-xs">Refresh</button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg border border-[#68413d] bg-[#281817] p-3 text-sm text-[#f0a5a0]">{error}</p>}
      {transactions.length === 0 ? (
        <p className="mt-5 text-sm text-[#a39b8e]">No pending sell requests.</p>
      ) : (
        <div className="mt-4 divide-y divide-line">
          {transactions.map((transaction) => (
            <article key={transaction.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-semibold">{transaction.amount} USDT</p>
                <p className="mt-1 text-xs text-[#a39b8e]">{transaction.user.email} · {new Date(transaction.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={busyId === transaction.id} onClick={() => void review(transaction.id, "FAIL")} className="ghost-btn text-xs disabled:opacity-50">Reject & refund</button>
                <button type="button" disabled={busyId === transaction.id} onClick={() => void review(transaction.id, "COMPLETE")} className="primary-btn text-xs disabled:opacity-50">Confirm manual payout</button>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-[#a39b8e]">Only confirm after you have independently completed and reconciled the fiat payout. This action does not send money.</p>
    </section>
  );
}
