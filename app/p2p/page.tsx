import Link from "next/link";

export default function P2PPage() {
  return (
    <div className="page-wrap">
      <div className="panel mx-auto max-w-2xl p-8 text-center sm:p-10">
        <p className="eyebrow mb-3">Removed</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Peer-to-peer trading is unavailable.</h1>
        <p className="mt-4 text-sm leading-7 text-[#9aa69f]">No peer-to-peer trades can be created or completed on this website.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/deposit" className="primary-btn inline-flex items-center gap-2">Return to deposit tiers</Link>
          <Link href="/" className="ghost-btn">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
