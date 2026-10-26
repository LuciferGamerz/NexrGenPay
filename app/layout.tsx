import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "NextGenPay — USDT / INR",
  description: "Learn about NextGenPay and check USDT and INR service availability.",
  icons: {
    icon: "/nextgenpay-mark.png",
    apple: "/nextgenpay-mark.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
