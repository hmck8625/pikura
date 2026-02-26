import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ピクラ - 日本最大のピックルボールプラットフォーム",
    template: "%s | ピクラ",
  },
  description:
    "ピクラ（pikura）は日本最大のピックルボール総合プラットフォームです。最新ニュース、ランキング、イベント情報、ペア募集など、ピックルボールに関するすべてがここに。",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "ピクラ - 日本最大のピックルボールプラットフォーム",
    description:
      "最新ニュース、ランキング、イベント情報、ペア募集など、ピックルボールに関するすべてがここに。",
    siteName: "ピクラ",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
