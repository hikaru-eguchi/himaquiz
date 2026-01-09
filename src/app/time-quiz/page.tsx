"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizMasterPage() {
  const router = useRouter();

  const [showGenreButtons, setShowGenreButtons] = useState(false);
  const [showLevelButtons, setShowLevelButtons] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  // ★ 入力された制限時間（クエリで渡す）
  const [limitTime, setLimitTime] = useState<number | null>(1);

  // ★ PC用キャラ（全3枚）
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
    router.push(`/time-quiz/random?time=${limitTime}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-red-100 via-red-200 to-red-300">
      <h1
        className="text-5xl md:text-7xl font-extrabold mb-6 text-center"
        style={{
          color: "#f85d5d", // 薄めで鮮やかすぎない赤（使いやすい）
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
            0 0 10px #ff0d0d
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        <span className="block md:hidden leading-tight">
          制限時間<br />クイズ
        </span>
        <span className="hidden md:block">制限時間クイズ</span>
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-gray-800 mb-2 md:mb-4">
          ＜1人で遊べるクイズゲーム＞
        </p>
        <p className="text-md md:text-2xl font-semibold text-gray-900 mb-8">
          制限時間内に何問正解できるか挑戦だ！友達や家族とスコアを競おう！
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

        {/* ▼ 制限時間入力エリア ▼ */}
        <div className="flex flex-col items-center mb-6">
          <label className="text-gray-900 text-lg md:text-2xl font-semibold mb-2">
            制限時間を入力（1〜100分）
          </label>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={limitTime === null ? "" : limitTime}
              onChange={(e) => {
                const raw = e.target.value;

                // 入力欄が空の場合は一時的に null をセット（空を許容）
                if (raw === "") {
                  setLimitTime(null);
                  return;
                }

                const value = Number(raw);

                // 下限・上限を強制
                if (value > 100) setLimitTime(100);
                else if (value < 1) setLimitTime(1);
                else setLimitTime(value);
              }}
              onBlur={() => {
                // フォーカスが外れた時に値が null（空）なら最低値の 1 を入れる
                if (limitTime === null) setLimitTime(1);
              }}
              className="
                w-32 md:w-48 px-4 py-2 text-lg md:text-2xl 
                border-2 border-black rounded-full 
                text-center shadow-md bg-white
              "
            />
            <span className="text-gray-900 text-lg md:text-2xl font-semibold">分</span>
          </div>

          <p className="text-gray-900 text-sm md:text-md mt-1 opacity-80">
            ※ 最大100分まで設定できます
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-4 max-w-4xl mx-auto">

          {/* ▼ 全てのクイズから出題（クエリ付き） */}
          <button
            onClick={handleRandomQuizStart}
            className="w-full md:w-70 px-6 py-2 md:px-8 md:py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
          >
            全てのクイズから出題
          </button>

          {/* ▼ 難易度 */}
          <button
            className="flex-1 w-full px-6 py-2 md:px-8 md:py-4 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
            onClick={() => setShowLevelButtons((prev) => !prev)}
          >
            難易度を選んで出題
          </button>

          {/* ▼ ジャンル */}
          <button
            className="flex-1 w-full px-6 py-2 md:px-8 md:py-4 bg-green-500 text-white rounded-full hover:bg-green-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
            onClick={() => setShowGenreButtons((prev) => !prev)}
          >
            ジャンルを選んで出題
          </button>
        </div>

        {/* ▼ 難易度選択（time付きリンク） */}
        {showLevelButtons && (
          <div className="flex flex-col justify-center items-center mt-3 md:mt-5">
            <div className="mb-2 md:mb-3 text-lg md:text-2xl">
              <p>難易度を選んでください</p>
            </div>
            <div className="flex justify-center gap-1 md:gap-3">
              <Link href={`/time-quiz/level?level=かんたん&time=${limitTime}`}>
                <button className="px-4 py-2 md:px-6 md:py-3 bg-white border-2 border-black text-lg md:text-xl font-bold text-black rounded-full cursor-pointer shadow-lg hover:scale-105">
                  かんたん
                </button>
              </Link>
              <Link href={`/time-quiz/level?level=ふつう&time=${limitTime}`}>
                <button className="px-4 py-2 md:px-6 md:py-3 bg-white border-2 border-black text-lg md:text-xl font-bold text-black rounded-full cursor-pointer shadow-lg hover:scale-105">
                  ふつう
                </button>
              </Link>
              <Link href={`/time-quiz/level?level=難しい&time=${limitTime}`}>
                <button className="px-4 py-2 md:px-6 md:py-3 bg-white border-2 border-black text-lg md:text-xl font-bold text-black rounded-full cursor-pointer shadow-lg hover:scale-105">
                  難しい
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ▼ ジャンル選択（time付きリンク） */}
        {showGenreButtons && (
          <div className="flex flex-col justify-center items-center mt-3 md:mt-5">
            <div className="mb-2 md:mb-3 text-lg md:text-2xl">
              <p>ジャンルを選んでください</p>
            </div>
            <div className="flex justify-center gap-3">
              <Link href={`/time-quiz/genre?genre=知識系&time=${limitTime}`}>
                <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-br from-sky-100 via-sky-300 to-teal-100 border-2 border-black text-lg md:text-xl font-bold text-black rounded-full hover:scale-105">
                  知識系
                </button>
              </Link>
              <Link href={`/time-quiz/genre?genre=心理系&time=${limitTime}`}>
                <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-br from-pink-100 via-pink-300 to-purple-100 border-2 border-black text-lg md:text-xl font-bold text-black rounded-full hover:scale-105">
                  心理系
                </button>
              </Link>
              <Link href={`/time-quiz/genre?genre=雑学系&time=${limitTime}`}>
                <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-br from-yellow-100 via-green-300 to-green-100 border-2 border-black text-lg md:text-xl font-bold text-black rounded-full hover:scale-105">
                  雑学系
                </button>
              </Link>
            </div>
          </div>
        )}

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
            「制限時間クイズ」は、時間内にどれだけ正解して高得点を狙えるかを競うチャレンジゲームです。<br />
            制限時間は 1〜100分の間で自由に設定できます。<br />
            問題に正解すると、難易度に応じてポイントを獲得できます：かんたん…50P、ふつう…100P、むずかしい…150P。<br />
            ただし油断は禁物！3問連続で間違えると、得点が100ポイント減ってしまいます。<br />
            得点が増えるほど、あなたの称号もランクアップ！<br />
            最高ランクの称号を目指して、ぜひ挑戦してみてください。
          </p>
        </div>
      </>
    </div>
  );
}
