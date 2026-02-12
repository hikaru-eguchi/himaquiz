"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../hooks/useSupabaseUser"; 

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizMasterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [showGenreButtons, setShowGenreButtons] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const handleGenreClick = () => {
    setShowGenreButtons(true);
  };
  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  // ★ PC用キャラ（全6枚）
  const allCharacters = [
    "/images/きまぐれモンスター3.png",
    "/images/きまぐれモンスター1.png",
    "/images/きまぐれモンスター4.png",
  ];

  // ★ スマホ専用キャラ（2枚だけ）
  const mobileCharacters = [
    "/images/きまぐれモンスター3.png",
    "/images/きまぐれモンスター4.png",
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
    <div className="container mx-auto px-4 py-8 text-center bg-yellow-50">
      <h1
        className="text-5xl md:text-7xl font-extrabold mb-6 text-center"
        style={{
          color: "#faec82",
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
            0 0 10px #fef795
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        {/* 📱スマホ（改行あり） */}
        <span className="block md:hidden leading-tight">
          きまぐれ<br />クイズ
        </span>

        {/* 💻PC（1行） */}
        <span className="hidden md:block">
          きまぐれクイズ
        </span>
      </h1>

      <p className="text-md md:text-2xl font-semibold text-gray-800 mb-2 md:mb-4">
        ＜1人で遊べるクイズゲーム＞
      </p>
      <p className="text-md md:text-2xl font-semibold text-gray-800 mb-8">
        きまぐれにいろんなモンスターが出現！どのモンスターに出会えるかな？
      </p>

      {/* ★ スマホは2枚、PCは6枚を順番に登場 */}
      <div className="flex justify-center md:gap-4 mb-8">
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
        <Link href="/quiz-kimagure/random" className="flex-1">
          <button className="w-full md:w-80 px-6 py-2 md:px-8 md:py-4 bg-yellow-200 text-yellow-600 rounded-full hover:bg-yellow-300 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black">
            げーむすたーと
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
          「きまぐれクイズ」は、クイズを解きながらいろんなモンスターに出会うほのぼのクイズゲームです。<br />
          出会えるモンスターは全部で80種類！どんなモンスターに出会えるかはお楽しみ！<br />
          クイズに正解するとモンスターアイコンをもらうことができます（※ログインが必要です）。<br />
        </p>
      </div>
    </div>
  );
}
