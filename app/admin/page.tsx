import { AdminSellQueue } from "@/components/admin-sell-queue";
import { PageHeading } from "@/components/ui";

export default function AdminPage() {
  return (
    <div className="page-wrap">
      <PageHeading eyebrow="Administration" title="Manual payout review" description="Review pending sell requests and record confirmed manual payouts." />
      <AdminSellQueue />
    </div>
  );
}
