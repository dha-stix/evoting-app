import type { Metadata } from "next";
import { PT_Sans} from "next/font/google";
import { Providers } from './providers'
import "./globals.css";

const sora = PT_Sans({ subsets: ["latin"], weight: ["400","700"]});

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
      <body className={sora.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
