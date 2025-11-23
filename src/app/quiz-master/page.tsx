"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizMasterPage() {
  const [showGenreButtons, setShowGenreButtons] = useState(false); // ジャンルボタン表示用

  const handleGenreClick = () => {
    setShowGenreButtons(true); // ジャンルボタンを表示
  };

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1
        className="text-2xl md:text-7xl font-extrabold mb-6 text-center"
        style={{
            color: "orange",              // 文字の中
            textShadow: `
            2px 2px 0 #000,
            -2px 2px 0 #000,
            2px -2px 0 #000,
            -2px -2px 0 #000,
            0px 2px 0 #000,
            2px 0px 0 #000,
            -2px 0px 0 #000,
            0px -2px 0 #000,
            1px 1px 0 #000,
            -1px 1px 0 #000,
            1px -1px 0 #000,
            -1px -1px 0 #000,
            0 0 10px #FFA500
            `,                             // 影で光ってる感じ
            fontFamily: anton.style.fontFamily, // ポップで目立つフォント
        }}
      >
        クイズマスターへの道
      </h1>
      {<>
          <p className="text-lg md:text-3xl font-semibold text-gray-800 mb-8">間違えたら即終了！連続正解で称号をゲットしよう！（何度でもプレイ可能）</p>
          
          {/* 画像を横並びで表示 */}
          <div className="flex justify-center gap-4 mb-8">
            <img src="/images/dragon.png" alt="ドラゴン" className="w-15 h-15 md:w-40 md:h-40 object-cover rounded-lg" />
            <img src="/images/yuusya.png" alt="クイズの勇者" className="w-15 h-15 md:w-40 md:h-40 object-cover rounded-lg" />
            <img src="/images/ryuukishi.png" alt="クイズの竜騎士" className="w-0 h-0 md:w-40 md:h-40 object-cover rounded-lg" />
            <img src="/images/tabibito.png" alt="クイズの旅人" className="w-15 h-15 md:w-40 md:h-40 object-cover rounded-lg" />
            <img src="/images/yuusya2.png" alt="クイズの勇者2" className="w-15 h-15 md:w-40 md:h-40 object-cover rounded-lg" />
            <img src="/images/dragon2.png" alt="ドラゴン2" className="w-15 h-15 md:w-40 md:h-40 object-cover rounded-lg" />
          </div>
          
          <div className="flex justify-center gap-1 md:gap-4">
            <Link href="/quiz-master/random">
                <button
                    className="px-2 py-1 md:px-8 md:py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105"
                >
                    ランダムで挑む
                    <span className="text-sm md:text-lg text-gray-200 block">
                        （全知の覇者オールラウンドマスター）
                    </span>
                </button>
            </Link>
            <button
                className="px-1 py-1 md:px-8 md:py-4 bg-green-500 text-white rounded-full hover:bg-green-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105"
                onClick={handleGenreClick}
            >
                ジャンルを選ぶ
                <span className="text-sm md:text-lg text-gray-200 block">
                    （専門領域の覇者スペシャリストマスター）
                </span>
            </button>
          </div>
          {/* ジャンルボタン表示 */}
          {showGenreButtons && (
            <div className="flex justify-center gap-4 mt-6">
                <Link href="/quiz-master/genre?genre=知識系">
                    <button className="px-4 py-2 md:px-6 md:py-3 bg-purple-500 text-lg md:text-xl font-bold text-white rounded-full hover:bg-purple-600 cursor-pointer shadow-lg">
                    知識系
                    </button>
                </Link>
                <Link href="/quiz-master/genre?genre=心理系">
                    <button className="px-4 py-2 md:px-6 md:py-3 bg-pink-500 text-lg md:text-xl font-bold text-white rounded-full hover:bg-pink-600 cursor-pointer shadow-lg">
                    心理系
                    </button>
                </Link>
                <Link href="/quiz-master/genre?genre=雑学系">
                    <button className="px-4 py-2 md:px-6 md:py-3 bg-yellow-500 text-lg md:text-xl font-bold text-white rounded-full hover:bg-yellow-600 cursor-pointer shadow-lg">
                    雑学系
                    </button>
                </Link>
            </div>
          )}
        </>
      }
    </div>
  );
}
