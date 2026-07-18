import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin | Steinheim Egypt",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={inter.variable}>
      <body className="min-h-screen bg-[#0a0a0b] text-white antialiased">{children}</body>
    </html>
  );
}
