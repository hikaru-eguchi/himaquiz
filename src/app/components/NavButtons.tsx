"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavButtons() {
  const pathname = usePathname();

  const genres = ["知識系", "心理系", "雑学系"];
  const levels = ["かんたん", "ふつう", "難しい"];

  // 白文字にせず、リング＋拡大のみ
  const activeStyle = "scale-110 ring-4 ring-blue-300";

  const baseStyle =
    "px-2 md:px-5 py-1 md:py-2 border-2 border-black rounded-full font-bold shadow-sm transition-all cursor-pointer";

  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-4 md:mt-6 md:mb-3">

      {/* 全て */}
      <Link href="/quizzes">
        <button
          className={`${baseStyle} bg-white text-black hover:scale-105
            ${pathname === "/quizzes" ? activeStyle : ""}`}
        >
          全て
        </button>
      </Link>

      {/* ジャンル */}
      {genres.map((genre) => {
        const url = `/quizzes/genre/${encodeURIComponent(genre)}`;
        const isActive = pathname.startsWith(url);
        return (
          <Link key={genre} href={url}>
            <button
              className={`${baseStyle} bg-blue-500 text-white hover:scale-105
                ${isActive ? activeStyle : ""}`}
            >
              {genre} ▼
            </button>
          </Link>
        );
      })}

      {/* 難易度 */}
      {levels.map((level) => {
        const url = `/quizzes/level/${encodeURIComponent(level)}`;
        const isActive = pathname.startsWith(url);
        return (
          <Link key={level} href={url}>
            <button
              className={`${baseStyle} bg-white text-black hover:scale-105
                ${isActive ? activeStyle : ""}`}
            >
              {level} ▼
            </button>
          </Link>
        );
      })}

      {/* クイズマスター */}
      <Link href="/quiz-master">
        <button
          className={`${baseStyle} bg-yellow-400 text-black hover:scale-105
            ${pathname.startsWith("/quiz-master") ? activeStyle : ""}`}
        >
          クイズマスターへの道
        </button>
      </Link>
    </div>
  );
}
