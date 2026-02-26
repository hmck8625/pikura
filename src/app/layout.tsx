import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: true,
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pikura.app";

export const metadata: Metadata = {
  title: {
    default: "ピクラ - 日本最大のピックルボールプラットフォーム",
    template: "%s | ピクラ",
  },
  description:
    "ピクラ（pikura）は日本最大のピックルボール総合プラットフォームです。JPA公式ランキング、最新ニュース、大会・イベント情報、ペア募集など、ピックルボールに関するすべてがここに。",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ピクラ - 日本最大のピックルボールプラットフォーム",
    description:
      "JPA公式ランキング、最新ニュース、大会・イベント情報、ペア募集など、ピックルボールに関するすべてがここに。",
    siteName: "ピクラ",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/api/og?type=default",
        width: 1200,
        height: 630,
        alt: "ピクラ - 日本最大のピックルボールプラットフォーム",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ピクラ - 日本最大のピックルボールプラットフォーム",
    description:
      "JPA公式ランキング、最新ニュース、大会・イベント情報。ピックルボールのすべてがここに。",
    images: ["/api/og?type=default"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-P5XZZN4H');`,
          }}
        />
      </head>
      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P5XZZN4H"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
