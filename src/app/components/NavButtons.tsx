"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavButtons() {
  const pathname = usePathname();
  const [activeUrl, setActiveUrl] = useState("/quizzes");

  // ✅ 開閉状態（ボタンでのみ変更）
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (pathname) setActiveUrl(pathname);
  }, [pathname]);

  // ✅ クリックしたら activeUrl だけ更新（開閉はしない）
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
    "px-3 py-1 rounded-md border-2 border-black text-sm md:text-lg font-extrabold bg-white";

  const rowWrap = "flex flex-wrap justify-center gap-2 md:gap-3 py-2";

  // ✅ クイズゲーム：スマホだけ横スクロール
  const gameScrollOuter =
    "w-full overflow-x-auto overflow-y-hidden md:overflow-visible [-webkit-overflow-scrolling:touch]";
  const gameRow =
    "flex flex-nowrap gap-2 py-2 px-2 whitespace-nowrap min-w-max md:flex-wrap md:justify-center md:gap-3 md:whitespace-normal md:min-w-0";

  // ✅ 開閉アニメ
  const panel =
    `overflow-hidden transition-all duration-300 ease-out ` +
    (isOpen ? "max-h-[3000px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0");

  // ✅ 背景色（ちょい変え版）
  const bgSolo = "bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50"; // 1人用：暖色寄り
  const bgMulti = "bg-gradient-to-br from-sky-50 via-indigo-50 to-fuchsia-50"; // みんな：寒色寄り
  const bgGacha = "bg-gradient-to-br from-emerald-50 via-lime-50 to-yellow-50"; // ガチャ：キラッと系

  return (
    <div className="w-full flex justify-center mt-2 mb-1 md:mt-5 md:mb-5">
      {/* ✅ PC時の最大幅を広げる（1200→1400） */}
      <div className="w-[min(1400px,calc(100vw-24px))] rounded-2xl border-2 border-black bg-white p-2 md:p-3 shadow-md">
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

        {/* ✅ PCは常に表示、スマホはボタンで開閉 */}
        <div
          id="nav-panel"
          className={`md:mt-2 md:max-h-none md:opacity-100 md:overflow-visible ${panel}`}
        >
          <div className="flex flex-col gap-3 md:gap-4">
            {/* ①②：スマホ縦 / PC横 */}

            {/* ✅ ここがポイント：
                スマホは縦 / PCは横並びで「1人」「みんな」「ガチャ」を並べる */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {/* 1人で遊べる */}
              <fieldset className={`${groupBox} ${bgSolo} md:flex-1`}>
                <legend className={groupLegend}>ひとりで遊べるクイズゲーム</legend>
                <p className="text-xs md:text-sm text-black/70">
                  気軽に挑戦！ひとりクイズタイム！
                </p>
                <div className="mx-auto w-full max-w-[300px] md:max-w-none">
                  <div className={gameScrollOuter}>
                    <div className={gameRow}>
                      <Link
                        href="/streak-challenge"
                        onClick={() => handleNavClick("/streak-challenge")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-red-500 to-orange-400 text-white ring-2 ring-orange-400 md:hover:scale-110 ${
                            activeUrl === "/streak-challenge" ? activeStyle : ""
                          }`}
                        >
                          連続正解チャレンジ
                        </button>
                      </Link>

                      <Link
                        href="/time-quiz"
                        onClick={() => handleNavClick("/time-quiz")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-[#ec0101] via-[#FF6B6B] to-[#fb9797] text-white ring-2 ring-red-400 md:hover:scale-110 ${
                            activeUrl === "/time-quiz" ? activeStyle : ""
                          }`}
                        >
                          制限時間クイズ
                        </button>
                      </Link>

                      <Link
                        href="/quiz-master"
                        onClick={() => handleNavClick("/quiz-master")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-purple-500 to-indigo-400 text-white ring-2 ring-purple-400 md:hover:scale-110 ${
                            activeUrl === "/quiz-master" ? activeStyle : ""
                          }`}
                        >
                          クイズダンジョン
                        </button>
                      </Link>

                      <Link
                        href="/quiz-kimagure"
                        onClick={() => handleNavClick("/quiz-kimagure")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-yellow-400 to-yellow-300 text-white ring-2 ring-yellow-400 md:hover:scale-110 ${
                            activeUrl === "/quiz-kimagure" ? activeStyle : ""
                          }`}
                        >
                          きまぐれクイズ
                        </button>
                      </Link>

                      {/* <Link
                        href="/quiz-badge"
                        onClick={() => handleNavClick("/quiz-badge")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-yellow-500 via-amber-600 to-slate-800 text-white ring-2 ring-yellow-900 md:hover:scale-110 ${
                            activeUrl === "/quiz-badge" ? activeStyle : ""
                          }`}
                        >
                          バッジハンター
                        </button>
                      </Link> */}

                      <Link
                        href="/quiz-luck"
                        onClick={() => handleNavClick("/quiz-luck")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-emerald-500 to-teal-400 text-white ring-2 ring-emerald-500 md:hover:scale-110 ${
                            activeUrl === "/quiz-luck" ? activeStyle : ""
                          }`}
                        >
                          運命のクイズ
                        </button>
                      </Link>
                    </div>
                  </div>

                  <p className="mt-1 text-xs text-black/60 text-center md:hidden">
                    ← 横にスワイプできます →
                  </p>
                </div>
              </fieldset>

              {/* みんなで遊べる */}
              <fieldset className={`${groupBox} ${bgMulti} md:flex-1`}>
                <legend className={groupLegend}>みんなで遊べるクイズゲーム</legend>
                <p className="text-xs md:text-sm text-black/70">
                  ネットの誰かと！友達や家族と！みんなでワイワイ遊ぼう🎉
                </p>
                <div className="mx-auto w-full max-w-[300px] md:max-w-none">
                  <div className={gameScrollOuter}>
                    <div className={gameRow}>
                      <Link
                        href="/quiz-battle"
                        onClick={() => handleNavClick("/quiz-battle")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-pink-500 via-yellow-400 to-green-500 text-white ring-2 ring-pink-500 md:hover:scale-110 ${
                            activeUrl === "/quiz-battle" ? activeStyle : ""
                          }`}
                        >
                          クイズバトル
                        </button>
                      </Link>

                      <Link
                        href="/quiz-royal"
                        onClick={() => handleNavClick("/quiz-royal")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-yellow-500 via-amber-300 to-blue-500 text-white ring-2 ring-yellow-500 md:hover:scale-110 ${
                            activeUrl === "/quiz-royal" ? activeStyle : ""
                          }`}
                        >
                          クイズロワイヤル
                        </button>
                      </Link>

                      <Link
                        href="/quiz-adventure"
                        onClick={() => handleNavClick("/quiz-adventure")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-500 text-white ring-2 ring-blue-500 md:hover:scale-110 ${
                            activeUrl === "/quiz-adventure" ? activeStyle : ""
                          }`}
                        >
                          協力ダンジョン
                        </button>
                      </Link>

                      <Link
                        href="/quiz-dobon"
                        onClick={() => handleNavClick("/quiz-dobon")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-emerald-700 via-amber-800 to-stone-800 text-white ring-2 ring-stone-600 md:hover:scale-110 ${
                            activeUrl === "/quiz-dobon" ? activeStyle : ""
                          }`}
                        >
                          サバイバルクイズ
                        </button>
                      </Link>

                      <Link
                        href="/quiz-majority"
                        onClick={() => handleNavClick("/quiz-majority")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-red-500 to-blue-500 text-white ring-2 ring-red-600 md:hover:scale-110 ${
                            activeUrl === "/quiz-majority" ? activeStyle : ""
                          }`}
                        >
                          多数決クイズ
                        </button>
                      </Link>

                      <Link
                        href="/quiz-quick"
                        onClick={() => handleNavClick("/quiz-quick")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-cyan-400 via-sky-300 to-sky-200 text-white ring-2 ring-cyan-500 md:hover:scale-110 ${
                            activeUrl === "/quiz-quick" ? activeStyle : ""
                          }`}
                        >
                          瞬発力クイズ
                        </button>
                      </Link>

                      <Link
                        href="/quiz-dice"
                        onClick={() => handleNavClick("/quiz-dice")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-green-700 via-emerald-500 to-amber-300 text-white ring-2 ring-emerald-600 md:hover:scale-110 ${
                            activeUrl === "/quiz-dice" ? activeStyle : ""
                          }`}
                        >
                          サイコロクイズ
                        </button>
                      </Link>

                      {/* <Link
                        href="/quiz-mind"
                        onClick={() => handleNavClick("/quiz-mind")}
                      >
                        <button
                          className={`${baseStyle} bg-gradient-to-r from-pink-600 via-rose-500 to-amber-200 text-white ring-2 ring-rose-500 md:hover:scale-110 ${
                            activeUrl === "/quiz-mind" ? activeStyle : ""
                          }`}
                        >
                          心理当てバトル
                        </button>
                      </Link> */}
                    </div>
                  </div>

                  <p className="mt-1 text-xs text-black/60 text-center md:hidden">
                    ← 横にスワイプできます →
                  </p>
                </div>
              </fieldset>

              {/* ガチャ */}
              {/* <fieldset className={`${groupBox} ${bgGacha} md:flex-1`}>
                <legend className={groupLegend}>ガチャコーナー</legend>

                <div className={rowWrap}>
                  <Link
                    href="/quiz-gacha"
                    onClick={() => handleNavClick("/quiz-gacha")}
                  >
                    <button
                      className={`${baseStyle} bg-gradient-to-r from-red-400 via-sky-400 to-green-400 text-white ring-2 ring-white md:hover:scale-110 ${
                        activeUrl === "/quiz-gacha" ? activeStyle : ""
                      }`}
                    >
                      ひまQガチャ
                    </button>
                  </Link>
                </div>
              </fieldset> */}
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <fieldset
                className={`${groupBox} bg-gradient-to-br from-white via-slate-50 to-slate-100 md:flex-1`}
              >
                <legend className={groupLegend}>クイズ問題集</legend>
                <p className="text-xs md:text-sm text-black/70">
                  面白いクイズ問題集が勢ぞろい。気になるテーマを解いてみよう！
                </p>
                <div className={rowWrap}>
                  <Link
                    href="/quizbooks"
                    onClick={() => handleNavClick("/quizbooks")}
                  >
                    <button
                      className={`${baseStyle} bg-white text-black ${
                        activeUrl === "/quizbooks" ? activeStyle : ""
                      }`}
                    >
                      漢字穴埋めクイズ
                    </button>
                  </Link>
                </div>
              </fieldset>

              <fieldset
                className={`${groupBox} bg-gradient-to-br from-emerald-50 via-sky-50 to-yellow-50 md:flex-1`}
              >
                <legend className={groupLegend}>4択クイズ</legend>
                <p className="text-xs md:text-sm text-black/70">
                  サクッと遊べる4択クイズ。スキマ時間に脳トレ＆腕試し！
                </p>
                <div className={rowWrap}>
                  <Link
                    href="/quizzes"
                    onClick={() => handleNavClick("/quizzes")}
                  >
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
                      <Link
                        key={genre}
                        href={url}
                        onClick={() => handleNavClick(url)}
                      >
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
          </div>
        </div>
      </div>
    </div>
  );
}
