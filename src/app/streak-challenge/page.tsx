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
    "/images/quiz_man.png",
    "/images/quiz.png",
    "/images/quiz_woman.png",
  ];

  // ★ スマホ専用キャラ（2枚だけ）
  const mobileCharacters = [
    "/images/quiz.png",
    "/images/quiz_woman.png",
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
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-yellow-50 via-yellow-100 to-yellow-200">
      <h1
        className="text-5xl md:text-7xl font-extrabold mb-6 text-center"
        style={{
          color: "orange",
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
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        {/* 📱スマホ（改行あり） */}
        <span className="block md:hidden leading-tight">
          連続正解<br />チャレンジ
        </span>

        {/* 💻PC（1行） */}
        <span className="hidden md:block">
          連続正解チャレンジ
        </span>
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-gray-800 mb-8">
          間違えたらゲームオーバー！何問連続で正解できるか挑戦だ！友達や家族とスコアを競おう！
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
          <Link href="/streak-challenge/random" className="flex-1">
            <button className="w-full md:w-70 px-6 py-2 md:px-8 md:py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black">
              全てのクイズから出題
            </button>
          </Link>

          {/* 難易度 */}
          <button
            className="flex-1 w-full px-6 py-2 md:px-8 md:py-4 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
            onClick={() => setShowLevelButtons((prev) => !prev)}
          >
            難易度を選んで出題
          </button>

          {/* ジャンル */}
          <button
            className="flex-1 w-full px-6 py-2 md:px-8 md:py-4 bg-green-500 text-white rounded-full hover:bg-green-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
            onClick={() => setShowGenreButtons((prev) => !prev)}
          >
            ジャンルを選んで出題
          </button>
        </div>

        {showLevelButtons && (
          <div className="flex flex-col justify-center items-center mt-3 md:mt-5">
            <div className="mb-2 md:mb-3 text-lg md:text-2xl">
              <p>難易度を選んでください</p>
            </div>
            <div className="flex justify-center gap-1 md:gap-3">
              <Link href="streak-challenge/level?level=かんたん">
                <button className="px-4 py-2 md:px-6 md:py-3 bg-white border-2 border-black text-lg md:text-xl font-bold text-black rounded-full cursor-pointer shadow-lg hover:scale-105">
                  かんたん
                </button>
              </Link>
              <Link href="/streak-challenge/level?level=ふつう">
                <button className="px-4 py-2 md:px-6 md:py-3 bg-white border-2 border-black text-lg md:text-xl font-bold text-black rounded-full cursor-pointer shadow-lg hover:scale-105">
                  ふつう
                </button>
              </Link>
              <Link href="/streak-challenge/level?level=難しい">
                <button className="px-4 py-2 md:px-6 md:py-3 bg-white border-2 border-black text-lg md:text-xl font-bold text-black rounded-full cursor-pointer shadow-lg hover:scale-105">
                  難しい
                </button>
              </Link>
            </div>
          </div>
        )}

        {showGenreButtons && (
          <div className="flex flex-col justify-center items-center mt-3 md:mt-5">
            <div className="mb-2 md:mb-3 text-lg md:text-2xl">
              <p>ジャンルを選んでください</p>
            </div>
            <div className="flex justify-center gap-3">
              <Link href="streak-challenge/genre?genre=知識系">
                <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-br from-sky-100 via-sky-300 to-teal-100 border-2 border-black text-lg md:text-xl font-bold text-black rounded-full hover:bg-purple-600 cursor-pointer shadow-lg hover:scale-105">
                  知識系
                </button>
              </Link>
              <Link href="/streak-challenge/genre?genre=心理系">
                <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-br from-pink-100 via-pink-300 to-purple-100 border-2 border-black text-lg md:text-xl font-bold text-black rounded-full hover:bg-pink-600 cursor-pointer shadow-lg hover:scale-105">
                  心理系
                </button>
              </Link>
              <Link href="/streak-challenge/genre?genre=雑学系">
                <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-br from-yellow-100 via-green-300 to-green-100 border-2 border-black text-lg md:text-xl font-bold text-black rounded-full hover:bg-yellow-600 cursor-pointer shadow-lg hover:scale-105">
                  雑学系
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* 説明ボタン */}
        <button
          onClick={handleDescriptionClick}
          className="mt-8 px-6 py-1 md:px-8 md:text-xl bg-white text-gray-800 rounded-full border-2 border-black hover:bg-gray-300 shadow-md transition-colors"
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
            「連続正解チャレンジ」は、どれだけクイズに連続正解できるかを競うモードです。
            1問あたりの制限時間は60秒。
            1問でも間違えた時点でチャレンジ終了となります。
            連続正解数が増えるほど、あなたの称号もランクアップ！
            最高ランクの称号を目指して挑戦してみましょう。
          </p>
        </div>
      </>
    </div>
  );
}
