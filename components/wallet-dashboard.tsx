"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Copy, LoaderCircle, LogOut, RefreshCw, Wallet } from "lucide-react";
import type { FormEvent } from "react";

type Network = "BEP20" | "ERC20" | "TRC20";
type DepositOption = { network: Network; label: string; address: string; qrImage: string };
type WalletTransaction = {
  id: string;
  type: "DEPOSIT" | "SELL";
  network: Network | null;
  amount: string;
  txHash: string | null;
  status: "PENDING" | "COMPLETED" | "FAILED";
  actualConfirmations: number | null;
  requiredConfirmations: number | null;
  createdAt: string;
};
type WalletData = {
  user: { email: string; role: "USER" | "ADMIN"; usdtBalance: string };
  depositWallets: { address: string }[];
  transactions: WalletTransaction[];
};

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function explorerUrl(transaction: WalletTransaction) {
  if (!transaction.txHash) return null;
  if (transaction.network === "BEP20") return `https://bscscan.com/tx/${transaction.txHash}`;
  if (transaction.network === "ERC20") return `https://etherscan.io/tx/${transaction.txHash}`;
  if (transaction.network === "TRC20") return `https://tronscan.org/#/transaction/${transaction.txHash}`;
  return null;
}

export function WalletDashboard() {
  const [networks, setNetworks] = useState<DepositOption[]>([]);
  const [data, setData] = useState<WalletData | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | "">("");
  const [depositTxHash, setDepositTxHash] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadWallet = useCallback(async () => {
    setError(null);
    try {
      const [configResponse, walletResponse] = await Promise.all([
        fetch("/api/wallet/config", { cache: "no-store" }),
        fetch("/api/wallet", { cache: "no-store" })
      ]);
      const config = await configResponse.json();
      if (!configResponse.ok) throw new Error(config.error ?? "Could not load deposit networks.");
      setNetworks(config.networks);
      setSelectedNetwork((current) => current || config.networks[0]?.network || "");

      const wallet = await walletResponse.json();
      if (walletResponse.status === 401) {
        setData(null);
        return;
      }
      if (!walletResponse.ok) throw new Error(wallet.error ?? "Could not load your wallet.");
      setData(wallet);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your wallet.");
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    if (!data) return;
    const refreshTimer = window.setInterval(() => void loadWallet(), 30_000);
    return () => window.clearInterval(refreshTimer);
  }, [data, loadWallet]);

  async function linkDepositWallet() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const provider = window.ethereum;
      if (!provider) {
        throw new Error(
          "No Ethereum wallet was detected. Linking is optional: use Verify deposit with transaction hash below. To enable automatic detection for future transfers, install or enable a wallet extension, then reload this page."
        );
      }

      const [chainId, accounts] = await Promise.all([
        provider.request({ method: "eth_chainId" }),
        provider.request({ method: "eth_requestAccounts" }),
      ]);
      if (chainId !== "0x1") throw new Error("Switch your wallet to Ethereum Mainnet before linking it.");
      if (!Array.isArray(accounts) || typeof accounts[0] !== "string") {
        throw new Error("Your wallet did not return an account.");
      }
      const address = accounts[0];
      const challengeResponse = await fetch("/api/wallet/deposit-wallet/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address })
      });
      const challenge = await challengeResponse.json();
      if (!challengeResponse.ok) throw new Error(challenge.error ?? "Could not begin wallet linking.");

      const signature = await provider.request({
        method: "personal_sign",
        params: [challenge.message, address],
      });
      if (typeof signature !== "string") throw new Error("Your wallet did not return a signature.");

      const response = await fetch("/api/wallet/deposit-wallet/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          address,
          signature,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not verify wallet ownership.");
      setMessage(result.message);
      await loadWallet();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not link deposit wallet.");
    } finally {
      setBusy(false);
    }
  }

  async function submitSell(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/wallet/sell", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountToSell: sellAmount })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Sell request failed.");
      setMessage(result.message);
      setSellAmount("");
      await loadWallet();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sell request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      if (!selectedNetwork) throw new Error("Select a configured deposit network.");
      const response = await fetch("/api/wallet/deposit-claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          network: selectedNetwork,
          txHash: depositTxHash,
        }),
      });
      const result = await response.json();
      if (!response.ok && response.status !== 202) {
        throw new Error(result.error ?? "Could not verify this deposit.");
      }
      setMessage(result.message);
      if (response.status !== 202) {
        setDepositTxHash("");
      }
      await loadWallet();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not verify this deposit.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please retry.");
      setData(null);
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the address. Select and copy it manually.");
    }
  }

  const selected = networks.find((network) => network.network === selectedNetwork);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {!data ? (
        <section className="panel p-6 sm:p-8">
          <p className="eyebrow mb-2">Secure account required</p>
          <h2 className="text-xl font-semibold">Sign in to access your wallet</h2>
          <p className="mt-2 text-sm leading-6 text-[#a39b8e]">Only verified, authenticated accounts can submit deposits or sell requests.</p>
          <Link href="/login" className="primary-btn mt-5 inline-flex text-sm">Sign in or create account</Link>
        </section>
      ) : (
        <>
          <section className="panel flex flex-wrap items-center justify-between gap-4 p-5 sm:p-7">
            <div>
              <p className="eyebrow mb-2">Available balance</p>
              <p className="text-3xl font-bold tracking-tight">{data.user.usdtBalance} <span className="text-sm font-semibold text-[#a39b8e]">USDT</span></p>
              <p className="mt-2 text-xs text-[#a39b8e]">{data.user.email}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="ghost-btn inline-flex items-center gap-2 text-xs" onClick={() => void loadWallet()}><RefreshCw size={14} /> Refresh</button>
              <button type="button" className="ghost-btn inline-flex items-center gap-2 text-xs" onClick={signOut} disabled={busy}><LogOut size={14} /> Sign out</button>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="panel p-5 sm:p-7" aria-labelledby="deposit-heading">
              <p className="eyebrow mb-2">On-chain deposit</p>
              <h2 id="deposit-heading" className="text-lg font-semibold">Deposit USDT</h2>
              {networks.length === 0 ? (
                <p className="mt-4 rounded-lg border border-[#51452a] bg-[#241f13] p-4 text-sm leading-6 text-[#d4c9a8]">
                  Deposits are disabled until the business configures a verified receiving address, QR image, token contract and RPC for a network.
                </p>
              ) : (
                <>
                  <label className="mt-5 block text-xs font-semibold text-[#c7c1b5]" htmlFor="deposit-network">Network</label>
                  <select id="deposit-network" value={selectedNetwork} onChange={(event) => setSelectedNetwork(event.target.value as Network)} className="mt-2 w-full rounded-lg border border-line bg-[#111214] px-3 py-3 text-sm">
                    {networks.map((network) => <option key={network.network} value={network.network}>{network.label}</option>)}
                  </select>
                  {selected && (
                    <div className="mt-4 rounded-xl border border-line bg-[#111214] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#81796c]">Send only USDT on {selected.network}</p>
                      <div className="mt-3 flex items-start gap-3">
                        <code className="min-w-0 flex-1 break-all text-xs leading-6 text-[#e7dfcf]">{selected.address}</code>
                        <button type="button" aria-label="Copy deposit address" onClick={() => void copyAddress(selected.address)} className="ghost-btn shrink-0 p-2">
                          {copied ? <Check size={15} /> : <Copy size={15} />}
                        </button>
                      </div>
                      {selected.qrImage && <img src={selected.qrImage} alt={`${selected.network} USDT deposit address QR code`} className="mx-auto mt-4 h-40 w-40 rounded-lg bg-white p-2" />}
                    </div>
                  )}
                  {selected && (
                    <>
                      <p className="mt-3 text-xs leading-5 text-[#a39b8e]">
                        Linking a sending wallet is optional. It enables automatic detection for future transfers from that wallet; the signature only proves ownership and never sends a transaction or grants spending access. To verify a completed transfer without connecting a wallet, use the transaction-hash form below.
                      </p>
                      {data.depositWallets.length > 0 && (
                        <div className="mt-4 rounded-lg border border-[#355a46] bg-[#15251c] p-3 text-xs leading-5 text-[#9cdbb4]">
                          <p className="font-semibold">Linked sending wallets</p>
                          {data.depositWallets.map(({ address }) => <code key={address} className="mt-2 block break-all">{address}</code>)}
                        </div>
                      )}
                      <button type="button" onClick={() => void linkDepositWallet()} disabled={busy || !selected} className="primary-btn mt-5 flex w-full items-center justify-center gap-2 text-sm disabled:opacity-50">
                        {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Wallet size={15} />}
                        {busy ? "Verifying wallet…" : data.depositWallets.length > 0 ? "Link another sending wallet" : "Connect and verify sending wallet"}
                      </button>
                      <p className="mt-3 text-xs leading-5 text-[#a39b8e]">
                        Automatic detection applies only to new Ethereum USDT transfers from a linked wallet. Transfers from exchanges, other wallets, or sent before linking are not auto-matched; submit their transaction hash below instead. The server-side watcher must be running, and deposits are credited only after enough confirmations.
                      </p>
                      <form onSubmit={submitDeposit} className="mt-6 space-y-3 border-t border-line pt-5">
                        <div>
                          <p className="eyebrow mb-2">Already transferred?</p>
                          <h3 className="text-sm font-semibold">Verify with transaction hash</h3>
                          <p className="mt-2 text-xs leading-5 text-[#a39b8e]">
                            Paste your transaction hash. We look up and verify the token, receiving address, transfer amount, and confirmations on-chain before crediting your balance. Unconfirmed transfers remain pending.
                          </p>
                        </div>
                        <label className="block text-xs font-semibold text-[#c7c1b5]" htmlFor="deposit-tx-hash">Transaction hash</label>
                        <input
                          id="deposit-tx-hash"
                          value={depositTxHash}
                          onChange={(event) => setDepositTxHash(event.target.value)}
                          required
                          maxLength={66}
                          autoComplete="off"
                          spellCheck={false}
                          placeholder="0x…"
                          className="w-full rounded-lg border border-line bg-[#111214] px-3 py-3 font-mono text-xs"
                        />
                        <button type="submit" disabled={busy} className="primary-btn w-full text-sm disabled:opacity-50">
                          {busy ? "Verifying on-chain…" : "Verify deposit"}
                        </button>
                      </form>
                    </>
                  )}
                </>
              )}
            </section>

            <section className="panel p-5 sm:p-7" aria-labelledby="sell-heading">
              <p className="eyebrow mb-2">Manual settlement</p>
              <h2 id="sell-heading" className="text-lg font-semibold">Request a USDT sale</h2>
              <p className="mt-2 text-sm leading-6 text-[#a39b8e]">The amount is reserved from your available balance and sent to a manual admin review queue. This service does not calculate an INR quote or initiate a payout.</p>
              <form onSubmit={submitSell} className="mt-5 space-y-3">
                <label className="block text-xs font-semibold text-[#c7c1b5]" htmlFor="sell-amount">Amount to sell (USDT)</label>
                <input id="sell-amount" inputMode="decimal" value={sellAmount} onChange={(event) => setSellAmount(event.target.value)} required placeholder="0.00" className="w-full rounded-lg border border-line bg-[#111214] px-3 py-3 text-sm" />
                <button type="submit" disabled={busy} className="primary-btn w-full text-sm disabled:opacity-50">{busy ? "Submitting…" : "Submit sale request"}</button>
              </form>
              <p className="mt-3 text-xs leading-5 text-[#a39b8e]">If an admin rejects the request, the reserved USDT returns to your available balance. Marking a request complete records a manually completed payout.</p>
            </section>
          </div>

          <section className="panel overflow-hidden p-5 sm:p-7" aria-labelledby="history-heading">
            <h2 id="history-heading" className="text-lg font-semibold">Recent activity</h2>
            {data.transactions.length === 0 ? (
              <p className="mt-4 text-sm text-[#a39b8e]">No transactions yet.</p>
            ) : (
              <div className="mt-4 divide-y divide-line">
                {data.transactions.map((transaction) => {
                  const url = explorerUrl(transaction);
                  return (
                    <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-semibold">{transaction.type === "DEPOSIT" ? `Deposit${transaction.network ? ` · ${transaction.network}` : ""}` : "Sell request"}</p>
                        <p className="mt-1 text-xs text-[#8d877c]">{new Date(transaction.createdAt).toLocaleString()}</p>
                        {transaction.status === "PENDING" && transaction.type === "DEPOSIT" && transaction.actualConfirmations !== null && (
                          <p className="mt-1 text-xs text-[#c7b783]">Confirmations: {transaction.actualConfirmations}/{transaction.requiredConfirmations}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{transaction.amount} USDT</p>
                        <p className={`mt-1 text-xs ${transaction.status === "COMPLETED" ? "text-[#9cdbb4]" : transaction.status === "FAILED" ? "text-[#f0a5a0]" : "text-[#e5c869]"}`}>{transaction.status}</p>
                        {url && <a className="mt-1 inline-block text-xs text-[#e5c869] underline" href={url} target="_blank" rel="noreferrer">View transaction</a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {data.user.role === "ADMIN" && <Link href="/admin" className="ghost-btn inline-flex text-xs">Open admin sell queue</Link>}
        </>
      )}

      {(message || error) && (
        <p role={error ? "alert" : "status"} className={`flex items-start gap-2 rounded-lg border p-3 text-sm leading-6 ${error ? "border-[#68413d] bg-[#281817] text-[#f0a5a0]" : "border-[#355a46] bg-[#15251c] text-[#9cdbb4]"}`}>
          {error && <AlertTriangle size={16} className="mt-1 shrink-0" />}
          {error ?? message}
        </p>
      )}
    </div>
  );
}
