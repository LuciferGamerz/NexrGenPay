import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="page-wrap flex min-h-[calc(100vh-72px)] items-center justify-center">
      <section className="panel w-full max-w-[480px] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#a87949] via-[#dfbd78] to-[#f1dda9]" />
        <div className="p-6 sm:p-8">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-[#8d9b94] hover:text-white">
            <ArrowLeft size={14} /> Back to home
          </Link>
          <div className="mb-6">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-[#51452a] bg-[#241f13] text-[#e5c869]"><LockKeyhole size={20} /></div>
            <p className="eyebrow mb-2">Account access</p>
            <h1 className="text-2xl font-bold tracking-tight">Sign in or register</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#a39b8e]">Email verification is required. Supabase securely manages account credentials; never reuse a wallet recovery phrase as a password.</p>
          </div>
          <AuthForm />
        </div>
      </section>
    </div>
  );
}
