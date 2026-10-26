import Link from "next/link";
import { ArrowRight, Headset, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { NoticeNote, PageHeading } from "@/components/ui";

const securityItems = [
  {
    icon: Smartphone,
    title: "Email verification",
    description: "Supabase email confirmation must be enabled and configured before accounts can sign in."
  },
  {
    icon: ShieldCheck,
    title: "Identity verification",
    description: "KYC/AML identity checks are not implemented in this prototype."
  },
  {
    icon: KeyRound,
    title: "Two-factor authentication",
    description: "Two-factor authentication and password recovery are not implemented."
  }
];

export default function AccountPage() {
  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="Profile & security"
        title="Account access"
        description="Email-verified sign-in is implemented; identity checks, two-factor authentication, and account recovery are not."
      />

      <div className="mb-6">
        <NoticeNote>
          Email delivery must be configured before registration can be verified. Do not use this prototype for production accounts or send identity documents.
        </NoticeNote>
      </div>

      <section className="panel mb-5 overflow-hidden border-[#4a4030] bg-[radial-gradient(ellipse_at_100%_0%,#292318_0%,#151619_42%,#101214_100%)] p-5 sm:p-7" aria-label="Account service status">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-xl">
            <p className="eyebrow mb-2">Account access</p>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Pre-launch account setup.</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#a39b8e]">Sign-in requires a verified email. Additional production safeguards and identity workflows still need to be implemented.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[#39342a] bg-[#111214]/75 px-4 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#58492e] bg-[#221d13] text-[#e5c879]"><ShieldCheck size={19} /></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#928b80]">Service status</p>
              <p className="mt-1 text-sm font-semibold text-[#e8d5a1]">Pre-launch</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel p-5 sm:p-7" aria-labelledby="security-heading">
        <div className="mb-6">
          <p className="eyebrow mb-1">Account safeguards</p>
          <h2 id="security-heading" className="text-lg font-semibold">Verification & security</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#8d877c]">The account backend is not a complete production identity or recovery system.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {securityItems.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-xl border border-line bg-[#111214] p-4">
              <Icon size={18} className="mb-4 text-[#c8aa68]" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{title}</h3>
                <span className="rounded-full bg-[#20201c] px-2.5 py-1 text-[10px] font-semibold text-[#aaa294]">{title === "Email verification" ? "Implemented; setup required" : "Not implemented"}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#8d877c]">{description}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
          <Link href="/login" className="primary-btn inline-flex items-center gap-2 text-sm">Sign in or register <ArrowRight size={15} /></Link>
          <Link href="/contact" className="primary-btn inline-flex items-center gap-2 text-sm"><Headset size={15} /> Contact us</Link>
        </div>
      </section>
    </div>
  );
}
