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
    "/images/quiz_man_personality.png",
    "/images/quiz_personality.png",
    "/images/quiz_woman_personality.png",
  ];

  // ★ スマホ専用キャラ（2枚だけ）
  const mobileCharacters = [
    "/images/quiz_personality.png",
    "/images/quiz_woman_personality.png",
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
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-pink-300 via-rose-200 to-fuchsia-200">
      <h1
        className="text-5xl md:text-7xl font-extrabold mb-4 text-center"
        style={{
          color: "#fff7fb",
          textShadow: `
            2px 2px 0 #000,
            -2px 2px 0 #000,
            2px -2px 0 #000,
            -2px -2px 0 #000,
            0 0 16px rgba(236, 72, 153, 0.9)
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        {/* 📱スマホ（改行あり） */}
        <span className="block md:hidden leading-tight">
          心理<br />テスト
        </span>

        {/* 💻PC（1行） */}
        <span className="hidden md:block">
          心理テスト
        </span>
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-white/90 mb-2 md:mb-4">
          ＜直感でわかる！あなたの本当のタイプ＞
        </p>
        <p className="text-md md:text-2xl font-semibold text-white/90 mb-8">
          深く考えずに選ぶだけ。あなたの性格・恋愛傾向・隠れた一面をチェック！
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
          <Link href="/quiz-psychologicaltest/random" className="flex-1">
            <button className="w-full md:w-70 px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white rounded-full hover:from-pink-600 hover:via-rose-600 hover:to-fuchsia-600 cursor-pointer text-lg md:text-2xl font-bold shadow-lg transition-transform hover:scale-105 border-2 border-black">
              心理テストを始める💗
            </button>
          </Link>
        </div>

        <p className="mt-3 text-xs md:text-sm text-black/80">
          ※ 結果はあくまでお楽しみ診断です。友達と見せ合って楽しんでね！
        </p>

        {/* 説明ボタン */}
        <button
          onClick={handleDescriptionClick}
          className="mt-4 px-6 py-1 md:px-8 md:text-xl bg-white text-gray-800 rounded-full border-2 border-black hover:bg-gray-300 shadow-md transition-colors"
        >
          このテストの説明を見る
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
            「心理テスト」は、いくつかの質問に直感で答えるだけで、
            あなたの性格や恋愛傾向、意外な一面がわかるミニ診断です。
            <br />
            どの答えを選ぶかで、あなたらしさがちょっと見えてくるかも。
            <br />
            ひとりでも、友達や恋人と一緒でも楽しめます🧠💗
          </p>
        </div>
      </>
    </div>
  );
}
