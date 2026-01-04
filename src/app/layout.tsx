import type { Metadata } from "next";
import { Inter, Yomogi } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import NavButtons from "./components/NavButtons";
import Script from "next/script";
import HeaderMenu from "./components/HeaderMenu";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const yomogi = Yomogi({ weight: "400", subsets: ["latin"], variable: "--font-yomogi" });

export const metadata: Metadata = {
  title: {
    default: "みんなで遊べる暇つぶしクイズ「ひまQ」 - 空き時間で頭を鍛える脳トレクイズ",
    template: "%s | みんなで遊べる暇つぶしクイズ「ひまQ」 - 空き時間で頭を鍛える脳トレクイズ",
  },
  description: "みんなで遊べる暇つぶしクイズ！脳トレクイズや面白クイズで、ちょっとした空き時間に脳を鍛えよう。無料で遊べる『ひまQ』で脳力アップ！記憶力・思考力を鍛えよう。",
  metadataBase: new URL("https://www.hima-quiz.com"),
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const genres = ["知識系", "心理系", "雑学系"];
  const levels = ["かんたん", "ふつう", "難しい"];

  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico?v=3" />
        <meta name="google-adsense-account" content="ca-pub-9009696291438240" />

        {/* Googleタグ（gtag.js）を読み込み */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-RJ2YBMWVYN"
        />

        {/* 設定スクリプトを挿入 */}
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RJ2YBMWVYN');
          `}
        </Script>
      </head>

      <body className={`${inter.variable} ${yomogi.variable} font-sans bg-[#abe4fb]`}>
        <HeaderMenu />
        <div className="flex flex-col min-h-screen">
          {/* ===== HEADER ===== */}
          <header className="py-3 text-center shadow-md bg-yellow-300">
            <div className="flex items-center justify-center gap-4 md:mr-20">
              <img src="/images/quiz.png" alt="脳トレクイズで暇つぶし" className="w-0 md:w-20 h-auto" />
              <div>
                <Link href="/" className="no-underline group inline-block">
                  <h1
                    className="text-xl md:text-2xl font-extrabold text-white transition-transform group-hover:scale-110"
                    style={{
                      fontFamily: "Bangers, sans-serif",
                      textShadow: `
                        -2px -2px 0 #000,
                        0   -2px 0 #000,
                        2px -2px 0 #000,
                        -2px  0   0 #000,
                        2px  0   0 #000,
                        -2px  2px 0 #000,
                        0    2px 0 #000,
                        2px  2px 0 #000,
                        -1px -3px 0 #000,
                        1px -3px 0 #000,
                        -3px -1px 0 #000,
                        3px -1px 0 #000,
                        -3px  1px 0 #000,
                        3px  1px 0 #000,
                        -1px  3px 0 #000,
                        1px  3px 0 #000
                      `,
                    }}
                  >
                    暇つぶしクイズで遊ぶなら
                    <span className="block text-5xl md:text-7xl mt-2">ひまQ</span>
                  </h1>
                  <p className="text-black/90 mt-3 md:mt-4 mb-1 md:mb-0 md:text-xl tracking-wide font-bold">
                    みんなで遊べる暇つぶしクイズ！
                  </p>
                </Link>
              </div>
            </div>

            {/* ===== ジャンル＆難易度ボタン（ページ遷移型） ===== */}
            <NavButtons />
          </header>

          {/* ===== MAIN ===== */}
          <main className="flex-grow container mx-auto px-6 py-3 mt-6 bg-white rounded-3xl shadow-xl overflow-auto">
            {children}
          </main>

          {/* ===== FOOTER ===== */}
          <footer className="mt-12 py-10 bg-pink-300 shadow-inner">
            <div className="container mx-auto px-6 text-center text-gray-700">
              <div className="flex justify-center flex-wrap gap-8 mb-8 text-base font-medium">
                <Link href="/profile" className="hover:scale-110 transition-transform">サイト紹介</Link>
                <Link href="/privacy" className="hover:scale-110 transition-transform">プライバシー</Link>
                <Link href="/contact" className="hover:scale-110 transition-transform">お問い合わせ</Link>
              </div>
              <p className="text-xs text-gray-600 mb-5">当サイトのイラストは「いらすとや」様、「illustAC」様の素材を使用しています。</p>
              <p className="text-xs text-gray-600">&copy; 2025 ひまQ. All Rights Reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
