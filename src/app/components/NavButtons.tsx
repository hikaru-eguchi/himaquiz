"use client";

import Link from "next/link";
import { useState } from "react";

export default function NavButtons() {
  const [activeUrl, setActiveUrl] = useState("/quizzes");

  const genreMap: Record<string, string> = {
    "知識系": "/quizzes/genre/knowledge",
    "心理系": "/quizzes/genre/psychology",
    "雑学系": "/quizzes/genre/trivia",
  };

  const genres = Object.keys(genreMap);

  const genreBgMap: Record<string, string> = {
    "心理系": "bg-gradient-to-br from-pink-100 via-pink-300 to-purple-100",
    "知識系": "bg-gradient-to-br from-sky-100 via-sky-300 to-teal-100",
    "雑学系": "bg-gradient-to-br from-yellow-100 via-green-300 to-green-100",
  };

  const activeStyle = "scale-110 ring-4 ring-blue-300";
  const baseStyle =
    "px-3 md:px-5 py-1 md:py-2 border-2 border-black rounded-full font-bold shadow-sm transition-all cursor-pointer flex-none";

  return (
    <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 md:gap-4 md:mt-6 md:mb-3">
      {/* 全て */}
      <Link href="/quizzes" onClick={() => setActiveUrl("/quizzes")}>
        <button
          className={`${baseStyle} bg-white text-black hover:scale-105 ${
            activeUrl === "/quizzes" ? activeStyle : ""
          }`}
        >
          全て
        </button>
      </Link>

      {/* ジャンルボタン */}
      {genres.map((genre) => {
        const url = genreMap[genre];
        const isActive = activeUrl === url;

        return (
          <Link key={genre} href={url} onClick={() => setActiveUrl(url)}>
            <button
              className={`${baseStyle} ${genreBgMap[genre]} text-black hover:scale-105 ${
                isActive ? activeStyle : ""
              }`}
            >
              {genre}
            </button>
          </Link>
        );
      })}

      {/* 最後の3つのボタン */}
      <div className="flex gap-2 md:gap-4 py-2 md:py-0 px-2 md:px-0
                      overflow-x-auto md:overflow-visible
                      whitespace-nowrap w-full md:w-auto">
        <Link href="/streak-challenge" onClick={() => setActiveUrl("/streak-challenge")}>
          <button
            className={`${baseStyle} bg-gradient-to-r from-red-500 to-orange-400 text-white shadow-xl ring-2 ring-orange-400 hover:scale-110 ${
              activeUrl === "/streak-challenge" ? activeStyle : ""
            }`}
          >
            連続正解チャレンジ
          </button>
        </Link>

        <Link href="/time-quiz" onClick={() => setActiveUrl("/time-quiz")}>
          <button
            className={`${baseStyle} bg-gradient-to-r from-[#ec0101] via-[#FF6B6B] to-[#fb9797] text-white shadow-xl ring-2 ring-red-400 hover:scale-110 ${
              activeUrl === "/time-quiz" ? activeStyle : ""
            }`}
          >
            制限時間クイズ
          </button>
        </Link>

        <Link href="/quiz-master" onClick={() => setActiveUrl("/quiz-master")}>
          <button
            className={`${baseStyle} bg-gradient-to-r from-purple-500 to-indigo-400 text-white shadow-xl ring-2 ring-purple-400 hover:scale-110 ${
              activeUrl === "/quiz-master" ? activeStyle : ""
            }`}
          >
            クイズダンジョン
          </button>
        </Link>

        <Link href="/quiz-gacha" onClick={() => setActiveUrl("/quiz-gacha")}>
          <button
            className={`${baseStyle} bg-gradient-to-r from-red-400 via-sky-400 to-green-400 text-white shadow-xl ring-2 ring-white hover:scale-110 ${
              activeUrl === "/quiz-gacha" ? activeStyle : ""
            }`}
          >
            クイズガチャ
          </button>
        </Link>

        <Link href="/quiz-battle" onClick={() => setActiveUrl("/quiz-battle")}>
          <button
            className={`${baseStyle} bg-gradient-to-r from-pink-500 via-yellow-400 to-green-500 text-white shadow-xl ring-2 ring-pink-500 hover:scale-110 ${
              activeUrl === "/quiz-battle" ? activeStyle : ""
            }`}
          >
            クイズバトル
          </button>
        </Link>

        <Link href="/quiz-adventure" onClick={() => setActiveUrl("/quiz-adventure")}>
          <button
            className={`${baseStyle} bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-500 text-white shadow-xl ring-2 ring-blue-500 hover:scale-110 ${
              activeUrl === "/quiz-adventure" ? activeStyle : ""
            }`}
          >
            協力ダンジョン
          </button>
        </Link>
      </div>
    </div>
  );
}
