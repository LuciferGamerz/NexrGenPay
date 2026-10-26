import { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div>{eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}<h1 className="text-2xl font-bold tracking-tight sm:text-[30px]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8d9b94]">{description}</p>}</div>{action}</div>;
}

export function NoticeNote({ children }: { children: ReactNode }) {
  return <div className="flex items-start gap-2 rounded-xl border border-[#51452a] bg-[#241f13] px-4 py-3 text-xs leading-relaxed text-[#d4c9a8]"><span className="mt-px font-bold text-[#e5c869]">NOTICE</span><span>{children}</span></div>;
}
