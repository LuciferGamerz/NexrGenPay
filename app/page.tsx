import Link from "next/link";
import { ArrowRight, ExternalLink, Headset, Landmark, ShieldCheck } from "lucide-react";
import { NoticeNote } from "@/components/ui";
import { TradingViewCryptoScreener } from "@/components/tradingview-crypto-screener";

const features = [
  { icon: ShieldCheck, title: "On-chain verification", text: "Deposit claims are checked against the configured network, token, destination, and confirmations." },
  { icon: Landmark, title: "Internal balance controls", text: "Verified deposits and pending sell reservations are recorded in the account ledger." },
  { icon: Headset, title: "Manual sell review", text: "Sell requests require an operator to review and confirm any payout made outside the website." }
];

export default function HomePage() {
  return (
    <div className="page-wrap">
      <section className="hero-panel relative rounded-[28px] px-6 py-9 sm:px-10 sm:py-12 lg:px-12">
        <div className="absolute inset-y-0 left-0 w-px bg-mint/60" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.08fr_.92fr]">
          <div className="max-w-[680px]">
            <p className="eyebrow mb-4">Pre-launch USDT account prototype</p>
            <h1 className="max-w-[650px] text-4xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-5xl lg:text-[58px]">
              USDT account
              <span className="mt-2 block text-[#f1d7a0]">setup in progress.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#a1aea6] sm:text-base">
              This prototype includes verified-account scaffolding, on-chain deposit checks, and manually reviewed sell requests. It is not ready to accept customer funds or initiate INR payouts.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="primary-btn inline-flex items-center gap-2" href="/wallet">Open wallet <ArrowRight size={16} /></Link>
              <Link className="ghost-btn" href="/contact">Contact our team</Link>
            </div>
            <div className="mt-7 grid max-w-lg gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-[#101315]/80 p-3">
                <p className="text-[10px] uppercase tracking-[.14em] text-[#7a857e]">Currency pair</p>
                <p className="mt-2 text-lg font-semibold">USDT / INR</p>
              </div>
              <div className="rounded-2xl border border-line bg-[#101315]/80 p-3">
                <p className="text-[10px] uppercase tracking-[.14em] text-[#7a857e]">Account access</p>
                <p className="mt-2 text-lg font-semibold">Email verification required</p>
              </div>
              <div className="rounded-2xl border border-line bg-[#101315]/80 p-3">
                <p className="text-[10px] uppercase tracking-[.14em] text-[#7a857e]">Transactions</p>
                <p className="mt-2 text-lg font-semibold">Setup required</p>
              </div>
            </div>
          </div>
          <div className="panel relative overflow-hidden p-6 sm:p-8">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border border-[#dfbd7818]" aria-hidden="true" />
            <div className="relative">
              <p className="eyebrow mb-2">Service availability</p>
              <h2 className="text-xl font-semibold tracking-tight">Operator setup still required.</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#a1aea6]">
                Do not send funds. Receiving addresses, RPC providers, database, and email must be configured and tested before deposits can be enabled.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  ["Verified email accounts", "Setup required"],
                  ["Network-specific deposits", "Not configured"],
                  ["Sell requests", "Manual review"],
                  ["INR payout", "Not provided"]
                ].map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between gap-3 border-b border-line/80 pb-3 last:border-0 last:pb-0">
                    <span className="text-sm text-[#d7d2c8]">{service}</span>
                    <span className="rounded-full border border-[#51452a] bg-[#241f13] px-2.5 py-1 text-[10px] font-semibold text-[#e5c869]">{status}</span>
                  </div>
                ))}
              </div>
              <Link href="/about" className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-mint hover:underline">
                About NextGenPay <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5">
        <NoticeNote>Do not send cryptocurrency or money. No receiving address is configured, and sell requests do not trigger INR payouts.</NoticeNote>
      </div>

      <section className="mt-10" aria-labelledby="home-features-heading">
        <div className="mb-5 max-w-2xl">
          <p className="eyebrow mb-2">Our commitment</p>
          <h2 id="home-features-heading" className="text-2xl font-semibold tracking-tight">Designed around confidence.</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#8d9b94]">The prototype makes deposit verification and the manual sell-review workflow explicit; production readiness still requires substantial security and operations work.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="home-feature-card p-5">
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl border border-[#79643a]/50 bg-[#211c12] text-mint"><Icon size={18} /></span>
              <h3 className="mb-2 text-sm font-bold">{title}</h3>
              <p className="text-xs leading-relaxed text-[#8d9b94]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="crypto-markets-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Market data by TradingView</p>
            <h2 id="crypto-markets-heading" className="text-2xl font-semibold tracking-tight">Cryptocurrency markets</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8d9b94]">
              Browse crypto market listings and prices in the embedded TradingView screener. Data coverage and update timing are determined by TradingView and its market sources.
            </p>
          </div>
          <a
            href="https://in.tradingview.com/markets/cryptocurrencies/"
            target="_blank"
            rel="noopener noreferrer"
            className="ghost-btn inline-flex items-center gap-2 text-sm"
          >
            Open TradingView <ExternalLink size={14} />
          </a>
        </div>
        <div className="panel overflow-hidden p-2 sm:p-4">
          <TradingViewCryptoScreener />
        </div>
      </section>
    </div>
  );
}
