"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { ArrowDownToLine, Home, Info, Mail, Repeat2, UserRound, Users, Wallet } from "lucide-react";
import { SupportWidget } from "./support-widget";

const navigation = [
  { label: "Home", href: "/", icon: Home },
  { label: "Deposit USDT", href: "/deposit", icon: ArrowDownToLine },
  { label: "Swap", href: "/swap", icon: Repeat2 },
  { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "Referrals", href: "/referrals", icon: Users },
  { label: "Account", href: "/account", icon: UserRound },
  { label: "About us", href: "/about", icon: Info },
  { label: "Contact us", href: "/contact", icon: Mail }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <Link href="/" className="brand-row flex h-[82px] items-center gap-3 border-b border-line px-6">
          <div className="brand-mark" aria-hidden="true">
            <Image src="/nextgenpay-mark.png" alt="" width={34} height={34} priority className="h-[34px] w-[34px] rounded-[10px] object-cover" />
          </div>
          <span className="brand-copy"><span className="brand-wordmark">NextGen<span className="brand-accent">Pay</span></span><span className="brand-tag">TRADE MADE CLEAR</span></span>
        </Link>
        <div className="side-caption px-6 pb-3 pt-7 text-[10px] font-bold uppercase tracking-[.16em] text-[#607068]">Workspace</div>
        <nav className="nav-list flex flex-col gap-1 px-3">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = href.includes("#") ? pathname === href.split("#")[0] : pathname === href;
            return <Link key={label} href={href} title={label} aria-label={label} aria-current={active ? "page" : undefined} className={`nav-link ${active ? "active" : ""}`}><Icon size={17} aria-hidden="true" /><span className="nav-label">{label}</span></Link>;
          })}
        </nav>
        <div className="side-bottom absolute bottom-5 left-4 right-4 rounded-xl border border-line bg-[#101715] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Info size={15} className="text-mint" /> Service status</div>
          <p className="side-bottom-copy text-[11px] leading-relaxed text-[#849189]">Pre-launch setup. Deposits require operator configuration; sell requests are manually reviewed.</p>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="flex min-w-0 items-center gap-2 text-sm text-[#8d9b94]"><span className="hidden sm:inline">Workspace</span><span className="hidden sm:inline text-[#4a5750]">/</span><span className="font-semibold text-white">{titleFor(pathname)}</span></div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-full border border-[#51452a] bg-[#241f13] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#e5c869] sm:inline-flex">Pre-launch</span>
            <Link href="/account" className="primary-btn !rounded-lg !px-3 !py-2 text-xs">Account</Link>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="site-footer-inner">
            <p className="site-footer-copyright">© {new Date().getFullYear()} NextGenPay. All rights reserved.</p>
          </div>
        </footer>
      </main>
      <SupportWidget />
    </div>
  );
}

function titleFor(path: string) {
  if (path === "/") return "Home";
  if (path === "/wallet") return "Wallet";
  if (path === "/deposit") return "Deposit USDT";
  if (path === "/swap") return "Swap";
  if (path === "/referrals") return "Referrals";
  if (path === "/account") return "Account & verification";
  if (path === "/about") return "About us";
  if (path === "/contact") return "Contact us";
  if (path === "/login") return "Sign in";
  return "Home";
}
