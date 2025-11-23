import type { Metadata } from "next";
import { Inter, Yomogi } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const yomogi = Yomogi({ weight: "400", subsets: ["latin"], variable: "--font-yomogi" });

export const metadata: Metadata = {
  title: {
    default: "暇つぶしクイズの「ひまQ」 - 暇つぶしに最適な脳トレクイズ",
    template: "%s | 暇つぶしクイズの「ひまQ」 - 暇つぶしに最適な脳トレクイズ",
  },
  description: "暇つぶしに最適！簡単な脳トレクイズや面白クイズで、ちょっとした空き時間を楽しく過ごそう。",
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
      </head>

      <body className={`${inter.variable} ${yomogi.variable} font-sans bg-[#abe4fb]`}>
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
                  <p className="text-black/90 mt-4 md:text-xl tracking-wide font-bold">
                    暇つぶしに最適！クイズで頭を鍛えよう
                  </p>
                </Link>
              </div>
            </div>

            {/* ===== ジャンル＆難易度ボタン（ページ遷移型） ===== */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 md:mt-6 md:mb-3">
              {/* 全て */}
              <Link href="/quizzes">
                <button className="px-2 md:px-5 py-1 md:py-2 border-2 border-black rounded-full bg-white text-black font-bold shadow-sm hover:scale-105 transition-all cursor-pointer">
                  全て
                </button>
              </Link>

              {/* ジャンル */}
              {genres.map((genre) => (
                <Link key={genre} href={`/quizzes/genre/${encodeURIComponent(genre)}`}>
                  <button className="px-2 md:px-5 py-1 md:py-2 border-2 border-black rounded-full bg-blue-500 text-white font-bold shadow-sm hover:scale-105 transition-all cursor-pointer">
                    {genre} ▼
                  </button>
                </Link>
              ))}

              {/* 難易度 */}
              {levels.map((level) => (
                <Link key={level} href={`/quizzes/level/${encodeURIComponent(level)}`}>
                  <button className="px-2 md:px-5 py-1 md:py-2 border-2 border-black rounded-full bg-white text-black font-bold shadow-sm hover:scale-105 transition-all cursor-pointer">
                    {level} ▼
                  </button>
                </Link>
              ))}
            </div>
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
              <p className="text-xs text-gray-600">&copy; 2025 ひまQ. All Rights Reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
