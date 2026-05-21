"use client";

import { usePathname, useRouter } from "next/navigation";
import React from "react";

interface LevelFilterButtonsProps {
  genre?: string; // 例: "knowledge", "psychology", "trivia"
}

// 日本語 → 英語フォルダ名の対応表
const levelMap: Record<string, string> = {
  かんたん: "easy",
  ふつう: "normal",
  難しい: "hard",
  激ムズ: "expert",
};

// ★ 「全て」ボタン追加
const levels = ["全て", "かんたん", "ふつう", "難しい", "激ムズ"];

export default function LevelFilterButtons({ genre }: LevelFilterButtonsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const baseStyle =
    "px-3 md:px-5 py-1 md:py-2 border-2 border-black rounded-full font-bold shadow-sm transition-all cursor-pointer";
  const activeStyle = "scale-110 ring-4 ring-blue-300";

  const levelStyleMap: Record<string, string> = {
    全て:
      "bg-white border-2 border-gray-400 text-gray-700 shadow-[0_0_0_3px_rgba(156,163,175,0.15)]",

    かんたん:
      "bg-white border-2 border-sky-400 text-sky-600 shadow-[0_0_0_3px_rgba(56,189,248,0.15)]",

    ふつう:
      "bg-white border-2 border-yellow-400 text-yellow-600 shadow-[0_0_0_3px_rgba(250,204,21,0.15)]",

    難しい:
      "bg-white border-2 border-purple-500 text-purple-600 shadow-[0_0_0_3px_rgba(168,85,247,0.15)]",

    激ムズ:
      "bg-white border-2 border-red-500 text-red-600 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]",
  };

  const activeRingMap: Record<string, string> = {
    全て: "ring-4 ring-gray-300",

    かんたん: "ring-4 ring-sky-300",

    ふつう: "ring-4 ring-yellow-300",

    難しい: "ring-4 ring-purple-300",

    激ムズ: "ring-4 ring-red-300",
  };

  const handleClick = (levelJp: string) => {
    // ▼ 全て の場合は level パスなしに遷移
    if (levelJp === "全て") {
      const url = genre ? `/quizzes/genre/${genre}` : `/quizzes`;
      router.push(url);
      return;
    }

    const levelEn = levelMap[levelJp];
    if (!levelEn) return;

    let url = "/quizzes";

    if (genre && levelEn) {
      url = `/quizzes/genre/${genre}/level/${levelEn}`;
    } else if (levelEn) {
      url = `/quizzes/level/${levelEn}`;
    }

    router.push(url);
  };

  return (
    <div className="flex justify-center mb-6 flex-wrap bg-gradient-to-br from-emerald-50 via-green-50 to-lime-100 border-4 border-black p-2 md:p-3 rounded-3xl max-w-[360px] md:max-w-[460px] mx-auto">
      {/* タイトル */}
      <p className="text-lg md:text-2xl font-bold mb-2 md:mb-2">🔥 どのレベルで遊ぶ？</p>
      {/* <p className="mb-3 inline-flex items-center gap-1 rounded-full border-3 border-black bg-white px-4 py-1.5 text-lg md:text-2xl font-black text-gray-900">
        <span>🔥</span>
        <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
          どのレベルで遊ぶ？
        </span>
      </p> */}
      <div className="flex justify-center gap-2 mb-1 flex-wrap">
        {levels.map((levelJp) => {
          // ▼ URL 判定
          const url =
            levelJp === "全て"
              ? genre
                ? `/quizzes/genre/${genre}`
                : `/quizzes`
              : genre
              ? `/quizzes/genre/${genre}/level/${levelMap[levelJp]}`
              : `/quizzes/level/${levelMap[levelJp]}`;

          const isActive = pathname === url;

          return (
            <button
              key={levelJp}
              onClick={() => handleClick(levelJp)}
              className={`${baseStyle} ${levelStyleMap[levelJp]} hover:scale-105 ${
                isActive ? `scale-110 ${activeRingMap[levelJp]}` : ""
              }`}
            >
              {levelJp}
            </button>
          );
        })}
      </div>
    </div>
  );
}
