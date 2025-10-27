import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "トレンドラボ",
  description: "話題になっていることや役立つ情報を発信するサイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} font-sans bg-stone-100 text-gray-800`}>
        <div className="flex flex-col min-h-screen">
          {/* ヘッダー */}
          <header className="bg-white shadow-sm py-12 text-center">
            {/* タイトル（リンク化） */}
            <Link href="/" className="no-underline">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 hover:text-gray-700 transition-colors">
                トレンドラボ
              </h1>
            </Link>

            {/* ナビゲーションリンク */}
            <nav className="flex justify-center flex-wrap gap-8 text-lg font-medium">
              <Link
                href="/about"
                className="text-gray-700 hover:text-gray-900 no-underline transition-colors"
              >
                サイト紹介
              </Link>
              <Link
                href="/profile"
                className="text-gray-700 hover:text-gray-900 no-underline transition-colors"
              >
                プロフィール
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
