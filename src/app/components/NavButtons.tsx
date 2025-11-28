"use client";

import Link from "next/link";
import { useState } from "react";

export default function NavButtons() {
  // 選択中のURLを保持（初期：全て）
  const [activeUrl, setActiveUrl] = useState("/quizzes");

  // 日本語 → 英語パスのマッピング
  const genreMap: Record<string, string> = {
    "知識系": "/quizzes/genre/knowledge",
    "心理系": "/quizzes/genre/psychology",
    "雑学系": "/quizzes/genre/trivia",
  };

  const genres = Object.keys(genreMap);

  // ジャンルごとの背景色マッピング
  const genreBgMap: Record<string, string> = {
    "心理系": "bg-gradient-to-br from-pink-100 via-pink-300 to-purple-100",
    "知識系": "bg-gradient-to-br from-sky-100 via-sky-300 to-teal-100",
    "雑学系": "bg-gradient-to-br from-yellow-100 via-green-300 to-green-100",
  };

  // 選択中ボタンの装飾
  const activeStyle = "scale-110 ring-4 ring-blue-300";

  const baseStyle =
    "px-3 md:px-5 py-1 md:py-2 border-2 border-black rounded-full font-bold shadow-sm transition-all cursor-pointer";

  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-4 md:mt-6 md:mb-3">

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
          <Link
            key={genre}
            href={url}
            onClick={() => setActiveUrl(url)}
          >
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

      <div className="w-full flex justify-center gap-2 sm:gap-2 md:gap-4 sm:w-auto sm:flex-row">
        {/* 連続正解チャレンジ */}
        <Link
          href="/streak-challenge"
          onClick={() => setActiveUrl("/streak-challenge")}
        >
          <button
            className={`${baseStyle} bg-gradient-to-r from-red-500 to-orange-400 text-white shadow-xl ring-2 ring-orange-300 hover:scale-110 ${
              activeUrl === "/streak-challenge" ? activeStyle : ""
            }`}
          >
            連続正解チャレンジ
          </button>
        </Link>

        {/* クイズダンジョン */}
        <Link
          href="/quiz-master"
          onClick={() => setActiveUrl("/quiz-master")}
        >
          <button
            className={`${baseStyle} bg-gradient-to-r from-purple-500 to-indigo-400 text-white shadow-xl ring-2 ring-purple-400 hover:scale-110 ${
              activeUrl === "/quiz-master" ? activeStyle : ""
            }`}
          >
            クイズダンジョン
          </button>
        </Link>
      </div>
    </div>
  );
}
