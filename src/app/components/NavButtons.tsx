"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavButtons() {
  const pathname = usePathname();
  const [activeUrl, setActiveUrl] = useState("/quizzes");

  // ✅ 開閉状態（スマホはデフォで閉じる / PCは開きっぱなし）
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (pathname) setActiveUrl(pathname);
  }, [pathname]);

  // ✅ PC幅になったら自動で開く（スマホへ戻ったら閉じる）
  useEffect(() => {
    const onResize = () => {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches; // md
      setIsOpen(isDesktop);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ✅ クリックしたら（スマホだけ）閉じる
  const handleNavClick = (url: string) => {
    setActiveUrl(url);
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop) setIsOpen(false);
  };

  const genreMap: Record<string, string> = {
    知識系: "/quizzes/genre/knowledge",
    心理系: "/quizzes/genre/psychology",
    雑学系: "/quizzes/genre/trivia",
  };

  const genres = Object.keys(genreMap);

  const genreBgMap: Record<string, string> = {
    心理系: "bg-gradient-to-br from-pink-100 via-pink-300 to-purple-100",
    知識系: "bg-gradient-to-br from-sky-100 via-sky-300 to-teal-100",
    雑学系: "bg-gradient-to-br from-yellow-100 via-green-300 to-green-100",
  };

  const activeStyle = "md:scale-110 ring-4 ring-blue-300";
  const baseStyle =
    "px-3 md:px-5 py-1 md:py-2 border-2 border-black rounded-full font-bold shadow-sm transition-all cursor-pointer flex-none md:hover:scale-105";

  const groupBox =
    "w-full rounded-2xl border-2 border-black p-3 md:p-4 shadow-sm";

  const groupLegend =
    "px-3 py-1 rounded-full border-2 border-black text-md md:text-xl font-extrabold bg-white";

  const rowWrap = "flex flex-wrap justify-center gap-2 md:gap-3 py-2";

  // ✅ ③クイズゲーム：スマホだけ横スクロール
  const gameScrollOuter =
    "w-full overflow-x-auto overflow-y-hidden md:overflow-visible [-webkit-overflow-scrolling:touch]";
  const gameRow =
    "flex flex-nowrap gap-2 py-2 px-2 whitespace-nowrap min-w-max md:flex-wrap md:justify-center md:gap-3 md:whitespace-normal md:min-w-0";

  // ✅ 開閉アニメ用
  const panel =
    `overflow-hidden transition-all duration-300 ease-out ` +
    (isOpen ? "max-h-[2000px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0");

  return (
    <div className="w-full flex justify-center mt-2">
      {/* 全体 */}
      <div className="w-[min(1200px,calc(100vw-24px))] rounded-2xl border-2 border-black bg-white p-2 md:p-3 shadow-md">
        {/* ✅ 開閉ボタン（スマホだけ表示） */}
        <div className="flex md:hidden justify-center">
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="px-4 py-2 rounded-full border-2 border-black font-extrabold bg-yellow-200 shadow-sm active:scale-95 transition"
            aria-expanded={isOpen}
            aria-controls="nav-panel"
          >
            {isOpen ? "メニューを閉じる ▲" : "メニューを開く ▼"}
          </button>
        </div>

        {/* ✅ 中身（PCは常に表示 / スマホは開いた時だけ） */}
        <div id="nav-panel" className={panel}>
          <div className="flex flex-col gap-3 md:gap-4">
            {/* ①②：スマホ縦 / PC横 */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {/* ① クイズ問題集 */}
              <fieldset className={`${groupBox} bg-gradient-to-br from-white via-slate-50 to-slate-100 md:flex-1`}>
                <legend className={groupLegend}>クイズ問題集</legend>

                <div className={rowWrap}>
                  <Link href="/quizbooks" onClick={() => handleNavClick("/quizbooks")}>
                    <button
                      className={`${baseStyle} bg-white text-black ${
                        activeUrl === "/quizbooks" ? activeStyle : ""
                      }`}
                    >
                      おもしろクイズ一覧
                    </button>
                  </Link>
                </div>
              </fieldset>

              {/* ② 4択クイズ */}
              <fieldset className={`${groupBox} bg-gradient-to-br from-emerald-50 via-sky-50 to-yellow-50 md:flex-1`}>
                <legend className={groupLegend}>4択クイズ</legend>

                <div className={rowWrap}>
                  <Link href="/quizzes" onClick={() => handleNavClick("/quizzes")}>
                    <button
                      className={`${baseStyle} bg-white text-black ${
                        activeUrl === "/quizzes" ? activeStyle : ""
                      }`}
                    >
                      全て
                    </button>
                  </Link>

                  {genres.map((genre) => {
                    const url = genreMap[genre];
                    const isActive = activeUrl === url;

                    return (
                      <Link key={genre} href={url} onClick={() => handleNavClick(url)}>
                        <button
                          className={`${baseStyle} ${genreBgMap[genre]} text-black ${
                            isActive ? activeStyle : ""
                          }`}
                        >
                          {genre}
                        </button>
                      </Link>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            {/* ③ クイズゲーム */}
            <fieldset className={`${groupBox} bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50`}>
              <legend className={groupLegend}>クイズゲーム</legend>

              {/* スマホは枠を短めに見せる（必要なら数値調整OK） */}
              <div className="mx-auto w-full max-w-[320px] md:max-w-none">
                <div className={gameScrollOuter}>
                  <div className={gameRow}>
                    <Link href="/streak-challenge" onClick={() => handleNavClick("/streak-challenge")}>
                      <button
                        className={`${baseStyle} bg-gradient-to-r from-red-500 to-orange-400 text-white ring-2 ring-orange-400 md:hover:scale-110 ${
                          activeUrl === "/streak-challenge" ? activeStyle : ""
                        }`}
                      >
                        連続正解チャレンジ
                      </button>
                    </Link>

                    <Link href="/time-quiz" onClick={() => handleNavClick("/time-quiz")}>
                      <button
                        className={`${baseStyle} bg-gradient-to-r from-[#ec0101] via-[#FF6B6B] to-[#fb9797] text-white ring-2 ring-red-400 md:hover:scale-110 ${
                          activeUrl === "/time-quiz" ? activeStyle : ""
                        }`}
                      >
                        制限時間クイズ
                      </button>
                    </Link>

                    <Link href="/quiz-master" onClick={() => handleNavClick("/quiz-master")}>
                      <button
                        className={`${baseStyle} bg-gradient-to-r from-purple-500 to-indigo-400 text-white ring-2 ring-purple-400 md:hover:scale-110 ${
                          activeUrl === "/quiz-master" ? activeStyle : ""
                        }`}
                      >
                        クイズダンジョン
                      </button>
                    </Link>

                    <Link href="/quiz-battle" onClick={() => handleNavClick("/quiz-battle")}>
                      <button
                        className={`${baseStyle} bg-gradient-to-r from-pink-500 via-yellow-400 to-green-500 text-white ring-2 ring-pink-500 md:hover:scale-110 ${
                          activeUrl === "/quiz-battle" ? activeStyle : ""
                        }`}
                      >
                        クイズバトル
                      </button>
                    </Link>

                    <Link href="/quiz-adventure" onClick={() => handleNavClick("/quiz-adventure")}>
                      <button
                        className={`${baseStyle} bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-500 text-white ring-2 ring-blue-500 md:hover:scale-110 ${
                          activeUrl === "/quiz-adventure" ? activeStyle : ""
                        }`}
                      >
                        協力ダンジョン
                      </button>
                    </Link>

                    <Link href="/quiz-dobon" onClick={() => handleNavClick("/quiz-dobon")}>
                      <button
                        className={`${baseStyle} bg-gradient-to-r from-emerald-700 via-amber-800 to-stone-800 text-white ring-2 ring-stone-600 md:hover:scale-110 ${
                          activeUrl === "/quiz-dobon" ? activeStyle : ""
                        }`}
                      >
                        サバイバルクイズ
                      </button>
                    </Link>

                    <Link href="/quiz-gacha" onClick={() => handleNavClick("/quiz-gacha")}>
                      <button
                        className={`${baseStyle} bg-gradient-to-r from-red-400 via-sky-400 to-green-400 text-white ring-2 ring-white md:hover:scale-110 ${
                          activeUrl === "/quiz-gacha" ? activeStyle : ""
                        }`}
                      >
                        ひまQガチャ
                      </button>
                    </Link>
                  </div>
                </div>

                <p className="mt-1 text-xs text-black/60 text-center md:hidden">
                  ← 横にスワイプできます
                </p>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}
