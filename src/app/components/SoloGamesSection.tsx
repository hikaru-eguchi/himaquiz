"use client";

import { useState } from "react";
import Link from "next/link";

export default function SoloGamesSection() {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 p-5 bg-gradient-to-b from-emerald-0 via-emerald-100 to-emerald-200">
      <p className="text-2xl md:text-4xl font-extrabold mb-2 text-center leading-tight drop-shadow-xl text-emerald-500">
        🎮ひとりで遊べるクイズゲーム🎮
      </p>

      <p className="text-lg md:text-xl mb-2 text-center leading-tight mb-4">
        気軽に挑戦！ひとりクイズタイム！
      </p>

      <div className="flex justify-center gap-3 md:gap-5 flex-wrap">
        {/* 連続正解チャレンジ */}
        <div className="relative text-center max-w-[280px] md:mb-0">
          <span className="absolute -top-3 -left-4 z-10 px-3 py-1 text-xs md:text-sm font-bold rounded-full border-2 border-white bg-red-500 text-white shadow-md rotate-[-8deg]">
            🔥人気No.1
          </span>

          <Link href="/streak-challenge" className="w-full md:w-auto flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-red-500 to-orange-400 text-white hover:scale-110 transition-all">
              ✅連続正解チャレンジ
            </button>
          </Link>

          <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              何問連続で正解できるか挑戦！
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              集中力と実力を試せるゲームです。
            </p>
          </div>
        </div>

        {/* クイズダンジョン */}
        <div className="text-center max-w-[280px]">
          <Link href="/quiz-master" className="w-full md:w-auto flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-purple-500 to-indigo-400 text-white hover:scale-110 transition-all">
              ⚔クイズダンジョン
            </button>
          </Link>

          <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              モンスターを倒してキャラを集めよう！
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              ステージ攻略が楽しいやりこみモード！
            </p>
          </div>
        </div>

        {/* タイムアタック */}
        <div className="text-center max-w-[280px]">
          <Link href="/time-attack" className="w-full md:w-auto flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400 text-white hover:scale-110 transition-all">
              ⚡3問タイムアタック
            </button>
          </Link>

          <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              最速王を目指せ！
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              3問だけの超高速タイムアタック！
            </p>
          </div>
        </div>

        {showMore && (
          <>
            {/* きまぐれクイズ */}
            <div className="text-center max-w-[280px]">
              <Link href="/quiz-kimagure" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-yellow-400 to-yellow-300 text-white hover:scale-110 transition-all">
                  ☁きまぐれクイズ
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  きまぐれにひまもんが出現！
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  何種類みつけられる？
                </p>
              </div>
            </div>

            {/* クイズ迷路 */}
            <div className="text-center max-w-[280px]">
              <Link href="/quiz-maze" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-amber-700 to-orange-500 text-white hover:scale-110 transition-all">
                  🧱クイズ迷路
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  クイズを解いて迷路を突破せよ！
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  君はゴールまでたどり着ける？
                </p>
              </div>
            </div>

            {/* ひまQ占い */}
            {/* <div className="text-center max-w-[280px]">
              <Link href="/quiz-fortune" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white hover:scale-110 transition-all">
                  🔮ひまQ占い
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  直感で答えるひまQ占い！
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  今日の運勢は★いくつ？
                </p>
              </div>
            </div> */}

            {/* ひまQ診断 */}
            {/* <div className="text-center max-w-[280px]">
              <Link href="/quiz-personality" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:scale-110 transition-all">
                  🔍ひまQ診断
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  直感で答えるタイプ診断！
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  あなたはどのタイプ？
                </p>
              </div>
            </div> */}

            {/* 心理テスト */}
            {/* <div className="text-center max-w-[280px]">
              <Link href="/quiz-psychologicaltest" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white hover:scale-110 transition-all">
                  ❤心理テスト
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  直感でわかる性格診断！
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  あなたの本当のタイプは？
                </p>
              </div>
            </div> */}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="mt-5 mx-auto block rounded-full border-2 border-black bg-white px-6 py-2 text-lg md:text-xl font-black text-gray-800 shadow hover:scale-105 transition-all"
      >
        {showMore ? "▲ 閉じる" : "▼ もっと見る"}
      </button>
    </div>
  );
}