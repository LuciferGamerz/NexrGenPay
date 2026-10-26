import Link from "next/link";
import { ArrowLeft, Headset, Users } from "lucide-react";
import { NoticeNote, PageHeading } from "@/components/ui";

export default function ReferralsPage() {
  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="Referral program"
        title="Referrals are unavailable"
        description="Referral links, invite tracking and rewards are not connected to an account service."
      />

      <div className="mb-6">
        <NoticeNote>
          No referral codes or rewards are issued by this website. Do not rely on referral balances or expected payouts here.
        </NoticeNote>
      </div>

      <section className="panel mx-auto max-w-3xl overflow-hidden border-[#4a4030] bg-[radial-gradient(ellipse_at_90%_0%,#292318_0%,#151619_45%,#101214_100%)] p-6 sm:p-9" aria-labelledby="referral-unavailable-heading">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#51452a] bg-[#241f13] text-[#e5c869]"><Users size={21} /></span>
          <div>
            <p className="eyebrow mb-2">Program status</p>
            <h2 id="referral-unavailable-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">The referral program is not available yet.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#a39b8e]">
              Referral links, invite tracking and reward payments require account and rewards services that are not connected to this website.
            </p>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-3 border-t border-[#35312a] pt-5">
          <Link href="/contact" className="primary-btn inline-flex items-center gap-2 text-sm"><Headset size={15} /> Contact us</Link>
          <Link href="/" className="ghost-btn inline-flex items-center gap-2 text-sm"><ArrowLeft size={14} /> Back to home</Link>
        </div>
      </section>
    </div>
  );
}
