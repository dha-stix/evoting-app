import type { Metadata } from "next";
import { Inclusive_Sans } from "next/font/google";
import { Providers } from './providers'
import "./globals.css";

const inter = Inclusive_Sans({ subsets: ["latin"], weight: ["400"] });

export const metadata: Metadata = {
  title: "E-voting System - Final Year Project",
  description: "A Nigerian evoting system for that allow citizens to vote for their respective candidates during election.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
