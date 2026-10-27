import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthGate } from "./components/auth-gate";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Boarding House Ledger",
  description: "Search tenant accounts and track outstanding balances.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <nav className="flex items-center justify-between border-b border-zinc-800 px-6 py-6 md:px-[max(24px,calc((100vw-1000px)/2))]">
          <Link href="/" className="font-bold">
            Boarding House
            <span className="font-normal text-zinc-400"> / Ledger</span>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/" className="hover:text-zinc-400">Home</Link>
            <Link href="/ledger" className="hover:text-zinc-400">Ledger</Link>
            <Link href="/account" className="hover:text-zinc-400">Account</Link>
            <span className="text-xs text-zinc-400">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-white" />
              API connected
            </span>
          </div>
        </nav>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
