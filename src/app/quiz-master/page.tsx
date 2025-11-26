"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizMasterPage() {
  const [showGenreButtons, setShowGenreButtons] = useState(false);

  const handleGenreClick = () => {
    setShowGenreButtons(true);
  };

  // ★ PC用キャラ（全6枚）
  const allCharacters = [
    "/images/dragon.png",
    "/images/yuusya.png",
    "/images/mahoutsukai_wind.png",
  ];

  // ★ スマホ専用キャラ（2枚だけ）
  const mobileCharacters = [
    "/images/dragon.png",
    "/images/yuusya.png",
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

  return (
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-purple-100 via-purple-200 to-purple-300">
      <h1
        className="text-2xl md:text-7xl font-extrabold mb-6 text-center"
        style={{
          color: "#a78bfa",
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
            0 0 10px #aa00ff
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        クイズマスターへの道
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-gray-800 mb-8">
          クイズで進む冒険ダンジョン！君はどこまで到達できる？最強の称号「クイズマスター」を手に入れろ！
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
                w-30 h-30 md:w-50 md:h-52 object-cover rounded-lg
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            />
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
          <Link href="/quiz-master/random" className="flex-1">
            <button className="w-full px-6 py-2 md:px-8 md:py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black">
              全ジャンルで挑む
              <span className="text-sm md:text-lg text-gray-100 block">
                （全知の覇者オールラウンドマスター）
              </span>
            </button>
          </Link>

          <Link href="#" className="flex-1">
            <button
              className="flex-1 w-full px-6 py-2 md:px-8 md:py-4 bg-green-500 text-white rounded-full hover:bg-green-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
              onClick={handleGenreClick}
            >
              ジャンルを選んで挑む
              <span className="text-sm md:text-lg text-gray-100 block">
                （専門領域の覇者スペシャリストマスター）
              </span>
            </button>
          </Link>
        </div>

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
    </div>
  );
}
