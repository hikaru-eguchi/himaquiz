"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizMasterPage() {
  const [showGenreButtons, setShowGenreButtons] = useState(false);
  const [showLevelButtons, setShowLevelButtons] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const handleGenreClick = () => {
    setShowGenreButtons(true);
  };
  const handleLevelClick = () => {
    setShowLevelButtons(true);
  };
  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  // ★ PC用キャラ（全6枚）
  const allCharacters = [
    "/images/quiz_man_fortune.png",
    "/images/quiz_fortune.png",
    "/images/quiz_woman_fortune.png",
  ];

  // ★ スマホ専用キャラ（2枚だけ）
  const mobileCharacters = [
    "/images/quiz_fortune.png",
    "/images/quiz_woman_fortune.png",
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
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-purple-950 via-fuchsia-900 to-pink-800">
      <h1
        className="text-5xl md:text-7xl font-extrabold mb-4 text-center"
        style={{
          color: "#FFD54A",
          textShadow: `
            2px 2px 0 #000,
            -2px 2px 0 #000,
            2px -2px 0 #000,
            -2px -2px 0 #000,
            0 0 14px rgba(255, 213, 74, 0.85)
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        {/* 📱スマホ（改行あり） */}
        <span className="block md:hidden leading-tight">
          ひまＱ<br />占い
        </span>

        {/* 💻PC（1行） */}
        <span className="hidden md:block">
          ひまＱ占い
        </span>
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-white/90 mb-2 md:mb-4">
          ＜直感でわかる！今日のひまQ運勢＞
        </p>
        <p className="text-md md:text-2xl font-semibold text-white/90 mb-8">
          直感で選ぶだけ！今日のひまQ運勢を占おう🔮
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
          <Link href="/quiz-fortune/random" className="flex-1">
            <button className="w-full md:w-70 px-6 py-2 md:px-8 md:py-4 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 text-white rounded-full hover:bg-blue-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black">
              {/* 全てのクイズから出題 */}
              占いスタート🔮
            </button>
          </Link>
        </div>

        <p className="mt-3 text-xs md:text-sm text-white/80">
          ※ 何回やってもOK！結果は“遊び”として楽しんでね！
        </p>

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
            「ひまQ占い」は、1問の選択で“今日のひまQ運勢”がわかるミニコーナーです。<br />
            直感で答えを選ぶだけで、星（★★★★★）と一言アドバイスが表示されます。<br />
            今日の運試しに、サクッとどうぞ！🔮✨
          </p>
        </div>
      </>
    </div>
  );
}
