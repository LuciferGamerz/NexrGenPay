import Link from "next/link";
import { ArrowLeft, ArrowRight, Headset, Repeat2 } from "lucide-react";
import { NoticeNote, PageHeading } from "@/components/ui";

export default function SwapPage() {
  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="USDT / INR"
        title="Conversion unavailable"
        description="This website does not provide conversion pricing or initiate an exchange."
      />

      <div className="mb-6">
        <NoticeNote>
          No exchange quote can be generated and no USDT or INR can be transferred through this page.
        </NoticeNote>
      </div>

      <section className="panel mx-auto max-w-3xl overflow-hidden border-[#4a4030] bg-[radial-gradient(ellipse_at_90%_0%,#292318_0%,#151619_45%,#101214_100%)] p-6 sm:p-9" aria-labelledby="conversion-unavailable-heading">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#51452a] bg-[#241f13] text-[#e5c869]"><Repeat2 size={21} /></span>
          <div>
            <p className="eyebrow mb-2">Service status</p>
            <h2 id="conversion-unavailable-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">Conversion is not available yet.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#a39b8e]">
              A live rate source, quote validation, and payout process have not been implemented. If your account has an available USDT balance, you can submit a sell request from your wallet for manual review; it will not trigger a payout.
            </p>
          </div>
        </div>
        <div className="mt-7 grid gap-3 border-t border-[#35312a] pt-5 sm:grid-cols-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#81796c]">Live rate</p><p className="mt-1.5 text-sm font-semibold text-[#e7dfcf]">Unavailable</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#81796c]">Quote</p><p className="mt-1.5 text-sm font-semibold text-[#e7dfcf]">Unavailable</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#81796c]">Execution</p><p className="mt-1.5 text-sm font-semibold text-[#e7dfcf]">Unavailable</p></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/wallet" className="primary-btn inline-flex items-center gap-2 text-sm">Open wallet <ArrowRight size={15} /></Link>
          <Link href="/contact" className="primary-btn inline-flex items-center gap-2 text-sm"><Headset size={15} /> Contact us</Link>
          <Link href="/" className="ghost-btn inline-flex items-center gap-2 text-sm"><ArrowLeft size={14} /> Back to home</Link>
        </div>
      </section>
    </div>
  );
}
