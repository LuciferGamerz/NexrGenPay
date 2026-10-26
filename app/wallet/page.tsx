import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NoticeNote, PageHeading } from "@/components/ui";
import { WalletDashboard } from "@/components/wallet-dashboard";

export default function WalletPage() {
  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="Wallet"
        title="USDT account"
        description="Verify a completed USDT transfer with its transaction hash, or link a sending wallet for automatic detection of future transfers."
      />
      <div className="mb-6">
        <NoticeNote>
          Send only to the configured address on the selected network. Wallet linking is optional for automatic detection; you can also submit a transaction hash after transferring. Deposits are credited only after on-chain verification and required confirmations. Sell requests wait for manual review; this site does not automatically pay INR.
        </NoticeNote>
      </div>
      <WalletDashboard />
      <div className="mt-6 flex justify-center">
        <Link href="/" className="ghost-btn inline-flex items-center gap-2 text-xs"><ArrowLeft size={14} /> Back to home</Link>
      </div>
    </div>
  );
}
