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
};

// ★ 「全て」ボタン追加
const levels = ["全て", "かんたん", "ふつう", "難しい"];

export default function LevelFilterButtons({ genre }: LevelFilterButtonsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const baseStyle =
    "px-2 md:px-5 py-1 md:py-2 border-2 border-black rounded-full font-bold shadow-sm transition-all cursor-pointer";
  const activeStyle = "scale-110 ring-4 ring-blue-300";

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
    <div className="flex justify-center gap-1 md:gap-2 md:gap-4 mb-6 flex-wrap">
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
            className={`${baseStyle} bg-white text-black hover:scale-105 ${
              isActive ? activeStyle : ""
            }`}
          >
            {levelJp}
          </button>
        );
      })}
    </div>
  );
}
