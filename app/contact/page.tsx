import Link from "next/link";
import { ArrowUpRight, MessageCircle, Send, ShieldAlert } from "lucide-react";
import { NoticeNote, PageHeading } from "@/components/ui";

const whatsappUrl = "https://wa.me/918487984489";
const telegramUrl = "https://t.me/capjack666";

const channels = [
  {
    name: "WhatsApp",
    detail: "+91 84879 84489",
    hint: "Opens WhatsApp in a new tab",
    href: whatsappUrl,
    icon: MessageCircle,
    iconStyle: "border-[#31513b] bg-[#142319] text-[#b2c899]",
    hoverStyle: "hover:border-[#65784d]"
  },
  {
    name: "Telegram",
    detail: "@capjack666",
    hint: "Opens Telegram in a new tab",
    href: telegramUrl,
    icon: Send,
    iconStyle: "border-[#3c4a50] bg-[#172126] text-[#a8c2c8]",
    hoverStyle: "hover:border-[#64787d]"
  }
];

export default function ContactPage() {
  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="Get in touch"
        title="We’re here to help."
        description="Choose a messaging channel below to contact the team."
      />

      <div className="mb-6">
        <NoticeNote>
          The website chat is not connected to a support agent. Use the messaging channels below for assistance; this pre-launch site does not provide live rates or initiate fiat payouts.
        </NoticeNote>
      </div>

      <section aria-labelledby="channels-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">Contact channels</p>
            <h2 id="channels-heading" className="text-lg font-semibold">Choose how you’d like to connect.</h2>
          </div>
          <span className="text-xs text-[#81796c]">External links open in a new tab</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {channels.map(({ name, detail, hint, href, icon: Icon, iconStyle, hoverStyle }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`panel group flex min-h-40 items-start gap-4 p-5 transition-colors sm:p-6 ${hoverStyle}`}
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${iconStyle}`}>
                <Icon size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{name}</span>
                  <ArrowUpRight size={16} className="shrink-0 text-[#81796c] transition-colors group-hover:text-[#e5c869]" />
                </span>
                <span className="mt-3 block break-words text-sm font-medium text-[#ded5c4]">{detail}</span>
                <span className="mt-1.5 block text-xs text-[#81796c]">{hint}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="panel mt-5 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#51452a] bg-[#241f13] text-[#e5c869]"><MessageCircle size={18} /></span>
          <div>
            <p className="eyebrow mb-1">Website assistance</p>
            <h2 className="font-semibold">Need help with the website?</h2>
            <p className="mt-1 text-sm text-[#928b80]">Use the Help button to find our direct contact channels.</p>
          </div>
        </div>
        <Link href="/about" className="ghost-btn inline-flex w-fit shrink-0 items-center gap-2 text-sm">
          About NextGenPay <ArrowUpRight size={14} />
        </Link>
      </section>

      <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#39342a] bg-[#15140f] p-4 text-xs leading-relaxed text-[#aaa294]">
        <ShieldAlert size={15} className="mt-0.5 shrink-0 text-[#c8aa68]" />
        <p>Never share passwords, one-time codes, recovery phrases, or private keys over messaging. This site does not provide live account or transaction support.</p>
      </div>
    </div>
  );
}
