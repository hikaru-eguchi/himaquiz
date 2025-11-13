import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: {
    default: 'ひまQ',
    template: '%s | ひまQ'
  },
  description: '暇つぶしにできる面白いクイズサイト。',
  metadataBase: new URL('https://www.hima-quiz.com'),
  openGraph: {
    title: 'ひまQ',
    description: '暇つぶしにできる面白いクイズサイト。',
    url: 'https://www.hima-quiz.com',
    siteName: 'ひまQ',
    images: [
      {
        url: '/images/ogp-default.jpg',
        width: 1200,
        height: 630,
        alt: 'ひまQ'
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
      </head>
      <body className={`${inter.variable} font-sans bg-stone-100 text-gray-800`}>
        <div className="flex flex-col min-h-screen">
          {/* ヘッダー */}
          <header className="bg-white shadow-sm py-6 md:py-12 text-center">
            {/* タイトル（リンク化） */}
            <Link href="/" className="no-underline">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 md:mb-8 hover:text-gray-700 transition-colors">
                ひまQ
              </h1>
            </Link>

            {/* ナビゲーションリンク */}
            <nav className="flex justify-center md:pl-27 flex-wrap gap-6 md:gap-20 text-lg md:text-2xl font-medium">
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 no-underline transition-colors"
              >
                最新クイズ
              </Link>
              <Link
                href="/articles"
                className="text-gray-700 hover:text-gray-900 no-underline transition-colors"
              >
                クイズ一覧
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
              <p>&copy; 2025 ひまQ. All Rights Reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
