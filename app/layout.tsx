import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KOSPI Chat",
  description: "실시간 국내 증시 분석 및 채팅",
  icons: [
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
