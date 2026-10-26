"use client";

import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

export function SupportWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-[82px] right-5 z-40 sm:bottom-6 sm:right-6">
      {open && (
        <section className="mb-3 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-line bg-[#101715] shadow-2xl" aria-label="Help and support">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1d3020] text-mint"><MessageCircle size={16} /></span>
              <div>
                <p className="text-sm font-bold">Help & support</p>
                <p className="text-[10px] text-[#c8aa68]">Chat support unavailable</p>
              </div>
            </div>
            <button aria-label="Close support" onClick={() => setOpen(false)} className="text-[#849189]"><X size={17} /></button>
          </div>
          <div className="space-y-3 p-4">
            <p className="rounded-xl bg-[#1b2520] p-3 text-xs leading-relaxed text-[#d9e1dc]">
              Website chat is not connected to a support agent. Contact the team using one of the channels below.
            </p>
            <div className="grid grid-cols-2 gap-2 border-t border-line pt-3">
              <a href="https://wa.me/918487984489" target="_blank" rel="noopener noreferrer" className="ghost-btn flex items-center justify-center gap-2 !px-2 !py-2.5 text-xs">
                <MessageCircle size={14} className="text-[#69D181]" /> WhatsApp
              </a>
              <a href="https://t.me/capjack666" target="_blank" rel="noopener noreferrer" className="ghost-btn flex items-center justify-center gap-2 !px-2 !py-2.5 text-xs">
                <Send size={14} className="text-[#75BDF2]" /> Telegram
              </a>
            </div>
          </div>
        </section>
      )}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close help and support" : "Open help and support"}
        aria-expanded={open}
        className="ml-auto flex h-12 items-center gap-2 rounded-full bg-mint px-4 font-bold text-ink shadow-lg hover:bg-[#bbff8b]"
      >
        <MessageCircle size={18} /><span className="text-sm">Help</span>
      </button>
    </div>
  );
}
