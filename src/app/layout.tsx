import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: {
    default: 'トレンドラボ',
    template: '%s | トレンドラボ'
  },
  description: '話題のニュースやトレンド情報をお届けするメディアサイト。',
  metadataBase: new URL('https://www.trendlab.jp'),
  openGraph: {
    title: 'トレンドラボ',
    description: '話題のニュースやトレンド情報をお届けするメディアサイト。',
    url: 'https://www.trendlab.jp',
    siteName: 'トレンドラボ',
    images: [
      {
        url: '/images/ogp-default.jpg',
        width: 1200,
        height: 630,
        alt: 'トレンドラボ'
      }
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
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
        {/* 所有権確認用（AdSense用metaタグ） */}
        <meta name="google-adsense-account" content="ca-pub-9009696291438240" />
        
        {/* Googleタグ（gtag.js）を読み込み */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-CXCJWQ1EQX"
        />

        {/* 設定スクリプトを挿入 */}
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CXCJWQ1EQX');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} font-sans bg-stone-100 text-gray-800`}>
        <div className="flex flex-col min-h-screen">
          {/* ヘッダー */}
          <header className="bg-white shadow-sm py-6 md:py-12 text-center">
            {/* タイトル（リンク化） */}
            <Link href="/" className="no-underline">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 md:mb-8 hover:text-gray-700 transition-colors">
                トレンドラボ
              </h1>
            </Link>

            {/* ナビゲーションリンク */}
            <nav className="flex justify-center flex-wrap gap-6 md:gap-8 text-lg font-medium">
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 no-underline transition-colors"
              >
                話題の記事
              </Link>
              <Link
                href="/articles"
                className="text-gray-700 hover:text-gray-900 no-underline transition-colors"
              >
                記事一覧
              </Link>
              <Link
                href="/profile"
                className="text-gray-700 hover:text-gray-900 no-underline transition-colors"
              >
                サイト紹介
              </Link>
              <Link
                href="/privacy"
                className="text-gray-700 hover:text-gray-900 no-underline transition-colors"
              >
                プライバシーポリシー
              </Link>
              <Link
                href="/contact"
                className="text-gray-700 hover:text-gray-900 no-underline transition-colors"
              >
                お問い合わせ
              </Link>
            </nav>
          </header>

          {/* メイン */}
          <main className="flex-grow container mx-auto px-6 py-4">{children}</main>

          {/* フッター */}
          <footer className="bg-gray-100 mt-auto">
            <div className="container mx-auto px-6 py-5 text-center text-gray-500">
              <p>&copy; 2025 トレンドラボ. All Rights Reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
