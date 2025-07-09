import type { Metadata } from "next";
//import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

// const NotoSans = Noto_Sans_SC({
//   variable: "--font-noto-sans",
//   //subsets: ["latin"],
//   //display: "swap"
// });

// const NotoSerif = Noto_Serif_SC({
//   variable: "--font-noto-serif",
//   //subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "点名器",
  description: "一种点名器",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={/*`${NotoSans.variable} ${NotoSerif.variable} antialiased`*/`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
