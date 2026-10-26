"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { FormEvent } from "react";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Account request failed.");
      if (mode === "register") {
        setMessage(result.message);
        setPassword("");
      } else {
        window.location.assign("/wallet");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Account request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="space-y-4" onSubmit={submit}>
        <label className="block text-xs font-semibold text-[#c7c1b5]" htmlFor="account-email">Email</label>
        <input id="account-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-line bg-[#111214] px-3 py-3 text-sm" />
        <label className="block text-xs font-semibold text-[#c7c1b5]" htmlFor="account-password">Password</label>
        <input id="account-password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? 1 : 12} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-line bg-[#111214] px-3 py-3 text-sm" />
        {mode === "register" && <p className="text-xs leading-5 text-[#a39b8e]">Use at least 12 characters. You must verify your email before signing in.</p>}
        <button type="submit" disabled={busy} className="primary-btn flex w-full items-center justify-center gap-2 text-sm disabled:opacity-50">
          {busy && <LoaderCircle size={15} className="animate-spin" />}
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <button type="button" className="mt-4 text-xs font-semibold text-[#e5c869] underline" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setMessage(null); }}>
        {mode === "login" ? "Need an account? Create one" : "Already registered? Sign in"}
      </button>
      {message && <p role="status" className="mt-4 rounded-lg border border-[#355a46] bg-[#15251c] p-3 text-sm leading-6 text-[#9cdbb4]">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-[#68413d] bg-[#281817] p-3 text-sm leading-6 text-[#f0a5a0]">{error}</p>}
    </>
  );
}
