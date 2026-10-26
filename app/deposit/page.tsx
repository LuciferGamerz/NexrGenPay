import Link from "next/link";
import { ArrowRight, CircleAlert, Headset } from "lucide-react";
import { NoticeNote, PageHeading } from "@/components/ui";

export default function DepositPage() {
  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="USDT deposits"
        title="Automatic deposit detection"
        description="Link the Ethereum wallet you send USDT from. The server detects and verifies new transfers automatically."
      />

      <div className="mb-6">
        <NoticeNote>
          Do not send cryptocurrency or money until the wallet page shows a configured address for the exact network you intend to use. Never send assets to an address shown for another network.
        </NoticeNote>
      </div>

      <section className="panel mx-auto max-w-3xl overflow-hidden border-[#4a4030] bg-[radial-gradient(ellipse_at_90%_0%,#292318_0%,#151619_45%,#101214_100%)] p-6 sm:p-9" aria-labelledby="deposit-unavailable-heading">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#51452a] bg-[#241f13] text-[#e5c869]"><CircleAlert size={21} /></span>
          <div>
            <p className="eyebrow mb-2">Ethereum Mainnet · ERC-20</p>
            <h2 id="deposit-unavailable-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">Link your sending wallet before you deposit.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#a39b8e]">
              The wallet page displays the configured receiving address and QR. Sign a short ownership message with the wallet you will send from; no transaction hash is needed. Automatic credits require the database migration and the server-side deposit watcher to be running.
            </p>
          </div>
        </div>
        <div className="mt-7 grid gap-3 border-t border-[#35312a] pt-5 sm:grid-cols-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#81796c]">Supported network</p><p className="mt-1.5 text-sm font-semibold text-[#e7dfcf]">Ethereum Mainnet only</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#81796c]">Confirmation</p><p className="mt-1.5 text-sm font-semibold text-[#e7dfcf]">Automatic on-chain verification</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#81796c]">Sell requests</p><p className="mt-1.5 text-sm font-semibold text-[#e7dfcf]">Manual review only</p></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/wallet" className="primary-btn inline-flex items-center gap-2 text-sm">Open wallet <ArrowRight size={15} /></Link>
          <Link href="/contact" className="primary-btn inline-flex items-center gap-2 text-sm"><Headset size={15} /> Contact us</Link>
        </div>
      </section>
    </div>
  );
}
