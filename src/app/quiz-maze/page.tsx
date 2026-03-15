"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizMasterPage() {
  const [showDescription, setShowDescription] = useState(false);

  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  // ★ PC用キャラ（全6枚）
  const allCharacters = [
    "/images/maze2.png",
    "/images/maze1.png",
    "/images/maze3.png",
  ];

  // ★ スマホ専用キャラ（2枚だけ）
  const mobileCharacters = [
    "/images/maze1.png",
    "/images/maze2.png",
  ];

  // ★ 画面サイズで表示画像を切り替え
  const [characters, setCharacters] = useState<string[]>([]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md未満
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
  }, [characters]); // ← charactersが決まってから実行

  // アコーディオン用 ref
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  return (
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-amber-900 via-orange-700 to-yellow-600">
      <h1
        className="text-5xl md:text-7xl font-extrabold mb-4 text-center"
        style={{
          color: "#f7f8fa", // sky-300
          textShadow: `
            2px 2px 0 #000,
            -2px 2px 0 #000,
            2px -2px 0 #000,
            -2px -2px 0 #000,
            0 0 14px rgba(255, 200, 80, 0.9)
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        {/* 📱スマホ（改行あり） */}
        <span className="block md:hidden leading-tight">
          クイズ<br />迷路
        </span>

        {/* 💻PC（1行） */}
        <span className="hidden md:block">
          クイズ迷路
        </span>
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-white/90 mb-2 md:mb-4">
          ＜クイズを解いて脱出せよ！＞
        </p>
        <p className="text-md md:text-2xl font-semibold text-white/90 mb-8">
          クイズに正解して道を進め！あなたはゴールまでたどり着ける？
        </p>

        {/* ★ スマホは2枚、PCは6枚を順番に登場 */}
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
          <Link href="/quiz-maze/random" className="flex-1">
            <button className="w-full md:w-70 px-6 py-2 md:px-8 md:py-4 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 text-black rounded-full cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black">
              {/* 全てのクイズから出題 */}
              ゲームスタート🗺
            </button>
          </Link>
        </div>

        {/* 説明ボタン */}
        <button
          onClick={handleDescriptionClick}
          className="mt-4 px-6 py-1 md:px-8 md:text-xl bg-white text-gray-800 rounded-full border-2 border-black hover:bg-gray-300 shadow-md transition-colors"
        >
          このゲームの説明を見る
        </button>

        {/* アコーディオン説明文 */}
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
            「クイズ迷路」は、迷路を進みながらクイズに挑戦するゲームです。<br />
            迷路の中にある“ゴールのカギ”を見つけて、出口を目指しましょう！<br />
            道をふさぐクイズに正解すると、先へ進むことができます。<br />
            でも間違えると…スタート地点に戻されてしまいます！<br />
            ステージごとに分かれ道やギミックが登場することも…？<br />
            ひらめきと知識で、迷路を突破しよう！🧩✨
          </p>
        </div>
      </>
    </div>
  );
}
