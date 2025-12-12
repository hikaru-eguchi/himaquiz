"use client";

import { useState, useEffect, useRef } from "react";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizMasterPage() {
  const router = useRouter();

  const [showDescription, setShowDescription] = useState(false);

  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  // ★ 入力された制限時間（クエリで渡す）
  const [limitTime, setLimitTime] = useState<number | null>(1);

  // ★ PC用キャラ（全3枚）
  const allCharacters = [
    "/images/yuusya_game.png",
    "/images/gacha.png",
    "/images/dragon.png",
  ];

  // ★ スマホ専用キャラ（2枚だけ）
  const mobileCharacters = [
    "/images/yuusya_game.png",
    "/images/gacha.png",
  ];

  // ★ 画面サイズで画像を切り替え
  const [characters, setCharacters] = useState<string[]>([]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768; 
    setCharacters(isMobile ? mobileCharacters : allCharacters);
  }, []);

  // ★ アニメーション用
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    characters.forEach((_, index) => {
      setTimeout(() => {
        setVisibleCount((v) => v + 1);
      }, index * 300);
    });
  }, [characters]);

  // アコーディオン用 ref
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  // ▼ 全てのクイズから出題（time をクエリに付ける）
  const handleRandomQuizStart = () => {
    router.push(`/quiz-gacha/random?time=${limitTime}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-red-400 via-sky-400 to-green-400">
      <h1
        className="text-5xl md:text-7xl font-extrabold mb-6 text-center"
        style={{
          color: "#ffffff",
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
            0 0 10px #000000
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        <span className="block md:hidden leading-tight">
          クイズ<br />ガチャ
        </span>
        <span className="hidden md:block">クイズガチャ</span>
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-white mb-8">
          クイズに正解してガチャにチャレンジ！超レアキャラを引き当てよう！
        </p>

        {/* ★ スマホは2枚、PCは3枚 */}
        <div className="flex justify-center gap-2 md:gap-4 mb-8">
          {characters.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`キャラ${index}`}
              className={`
                ${visibleCount > index ? "character-animate" : "opacity-0"}
                w-30 h-32 md:w-50 md:h-52 object-cover rounded-lg
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            />
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-4 max-w-4xl mx-auto">

          {/* ▼ 全てのクイズから出題（クエリ付き） */}
          <button
            onClick={handleRandomQuizStart}
            className="w-full md:w-80 px-6 py-2 md:px-8 md:py-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-full hover:bg-gradient-to-r hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
          >
            ガチャをはじめる
          </button>
        </div>

        {/* ▼ 説明ボタン */}
        <button
          onClick={handleDescriptionClick}
          className="mt-4 px-6 py-1 md:px-8 md:text-xl bg-white text-gray-800 rounded-full border-2 border-black hover:bg-gray-300 shadow-md transition-colors"
        >
          このゲームの説明を見る
        </button>

        {/* ▼ アコーディオン説明文 */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out mt-2 rounded-xl bg-white`}
          style={{
            maxHeight: showDescription
              ? descriptionRef.current?.scrollHeight
              : 0,
          }}
        >
          <p
            ref={descriptionRef}
            className="text-gray-700 text-md md:text-lg text-center px-4 py-2"
          >
            「クイズガチャ」は、クイズに答えてポイントを集め、そのポイントでガチャを回して楽しめるゲームです。
            正解すれば難易度に応じてポイントを獲得でき、ガチャは 1回100P で回せます。
            獲得ポイントは難易度ごとに変化します：かんたん…100P、ふつう…150P、むずかしい…200P。
            ガチャから登場するキャラは全17種類！ポイントを集めて、全キャラコンプリートを目指そう！
          </p>
        </div>
      </>
    </div>
  );
}
