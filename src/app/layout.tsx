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
      <body className={`${inter.variable} font-sans bg-stone-400 text-gray-800`}>
        <div className="flex flex-col min-h-screen">
          <header className="bg-white shadow-sm">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                トレンドラボ
              </Link>
              <div className="space-x-6">
                <Link href="/about" className="text-gray-600 hover:text-brand-dark transition-colors">
                  サイト紹介
                </Link>
                <Link href="/profile" className="text-gray-600 hover:text-brand-dark transition-colors">
                  プロフィール
                </Link>
                <Link href="/privacy" className="text-gray-600 hover:text-brand-dark transition-colors">
                  プライバシーポリシー
                </Link>
                <Link href="/contact" className="text-gray-600 hover:text-brand-dark transition-colors">
                  お問い合わせ
                </Link>
              </div>
            </nav>
          </header>
          <main className="flex-grow container mx-auto px-6 py-10">{children}</main>
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
