import Link from "next/link";
import { ArrowDownToLine, ArrowRight, Compass, ShieldCheck, WalletCards } from "lucide-react";
import { NoticeNote, PageHeading } from "@/components/ui";

const principles = [
  {
    icon: Compass,
    number: "01",
    title: "Clarity first",
    description: "Prices, terms, and next steps should be easy to understand—without hiding the details that matter."
  },
  {
    icon: ShieldCheck,
    number: "02",
    title: "Trust is earned",
    description: "Real financial products need carefully designed security, privacy, and operational controls."
  },
  {
    icon: WalletCards,
    number: "03",
    title: "Made to be explored",
    description: "    This prototype explores the account and transaction workflow for a USDT/INR service."
  }
];

export default function AboutPage() {
  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="About NextGenPay"
        title="A USDT account prototype in pre-launch setup."
        description="The prototype supports verified accounts, on-chain deposit checks, internal balances, and manual sell review; it is not ready for customer funds."
      />

      <div className="mb-6">
        <NoticeNote>
          Do not transfer cryptocurrency or money. No network receiving address is currently configured, and this site does not initiate INR payouts.
        </NoticeNote>
      </div>

      <section className="panel relative overflow-hidden border-[#4a4030] bg-[radial-gradient(ellipse_at_88%_10%,#302718_0%,#171719_38%,#111214_100%)] p-6 sm:p-9" aria-labelledby="about-statement">
        <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-full border border-[#685638]/50 sm:block" aria-hidden="true" />
        <div className="absolute right-[4.1rem] top-[4.1rem] hidden h-12 w-12 rounded-full border border-[#685638]/40 sm:block" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <p className="eyebrow mb-3">Our approach</p>
          <h2 id="about-statement" className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            Trust starts with making every next step clear.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#a39b8e]">
            The backend supports email-verified accounts, on-chain deposit verification, an internal USDT ledger, and sell requests that require manual review.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/deposit" className="primary-btn inline-flex items-center gap-2 text-sm">
              <ArrowDownToLine size={15} /> Deposit availability
            </Link>
            <Link href="/wallet" className="ghost-btn inline-flex items-center gap-2 text-sm">
              Wallet status <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <div className="relative mt-8 grid gap-3 border-t border-[#35312a] pt-5 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#81796c]">Product focus</p>
            <p className="mt-1.5 text-sm font-medium text-[#e7dfcf]">USDT / INR</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#81796c]">Account access</p>
            <p className="mt-1.5 text-sm font-medium text-[#e7dfcf]">Pre-launch</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#81796c]">Transactions</p>
            <p className="mt-1.5 text-sm font-medium text-[#e7dfcf]">Setup required</p>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="principles-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">Our principles</p>
            <h2 id="principles-heading" className="text-lg font-semibold">Designed around confidence, not noise.</h2>
          </div>
          <span className="text-xs text-[#81796c]">The details matter.</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {principles.map(({ icon: Icon, number, title, description }) => (
            <article key={title} className="panel group p-5 transition-colors hover:border-[#51452a] sm:p-6">
              <div className="mb-6 flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#51452a] bg-[#241f13] text-[#e5c869]">
                  <Icon size={18} />
                </span>
                <span className="text-xs font-semibold tracking-[.12em] text-[#776c56]">{number}</span>
              </div>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#928b80]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-7 max-w-4xl text-xs leading-relaxed text-[#81796c]">
        Financial services require appropriate licensing and compliance review, secure infrastructure, identity and privacy controls, customer support operations, and independently reviewed custody and payment systems before they can be offered.
      </p>
    </div>
  );
}
