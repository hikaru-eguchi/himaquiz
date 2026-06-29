"use client";

import { useState } from "react";
import Link from "next/link";

export default function MultiGamesSection() {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 p-5 bg-gradient-to-b from-sky-0 via-sky-100 to-sky-200">
      <p className="text-2xl md:text-4xl font-extrabold mb-2 text-center leading-tight drop-shadow-xl text-sky-500">
        🌐みんなで遊べるクイズゲーム🌐
      </p>

      <p className="text-lg md:text-xl mb-2 text-center leading-tight mb-4">
        ネットの誰かと！友達や家族と！みんなでワイワイ遊ぼう🎉
      </p>

      <div className="flex justify-center gap-3 md:gap-5 flex-wrap">
        {/* クイズロワイヤル */}
        <div className="relative text-center max-w-[280px]">
          <span className="absolute -top-3 -left-4 z-10 px-3 py-1 text-xs md:text-sm font-bold rounded-full border-2 border-white bg-red-500 text-white shadow-md rotate-[-8deg]">
            🔥人気No.1
          </span>

          <Link href="/quiz-royal" className="w-full md:w-auto flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-yellow-500 via-amber-300 to-blue-500 text-white hover:scale-110 transition-all">
              👑クイズロワイヤル
            </button>
          </Link>

          <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              みんなで1分間のクイズバトル！
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              正解を積み上げて王冠をつかみ取れ！
            </p>
          </div>
        </div>

        {/* サバイバルクイズ */}
        <div className="text-center max-w-[280px]">
          {/* <span className="absolute -top-3 -left-4 z-10 px-3 py-1 text-xs md:text-sm font-bold rounded-full border-2 border-white bg-red-500 text-white shadow-md rotate-[-8deg]">
            🔥人気No.1
          </span> */}

          <Link href="/quiz-dobon" className="w-full md:w-auto flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-emerald-700 via-amber-800 to-stone-800 text-white hover:scale-110 transition-all">
              💀サバイバルクイズ
            </button>
          </Link>

          <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              ３問間違えたら即脱落！
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              君は最後まで生き残れるか！？
            </p>
          </div>
        </div>

        {/* クイズアリーナ */}
        <div className="text-center max-w-[280px]">
          <Link href="/quiz-arena" className="w-full md:w-auto flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-[radial-gradient(circle_at_top,#fde68a_0%,#fb7185_28%,#7c3aed_62%,#111827_100%)] text-white hover:scale-110 transition-all">
              ⚔クイズアリーナ
            </button>
          </Link>

          <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              相手より先に倒せ！
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              ひまQのキャラで戦う白熱クイズバトル！
            </p>
          </div>
        </div>

        {showMore && (
          <>
            {/* クイズバトル */}
            <div className="text-center max-w-[280px]">
              <Link href="/quiz-battle" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-pink-500 via-yellow-400 to-green-500 text-white hover:scale-110 transition-all">
                  🔥クイズバトル
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  1分間でどれだけ正解できるか勝負だ！
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  相手よりハイスコアを狙おう！
                </p>
              </div>
            </div>

            {/* 協力ダンジョン */}
            <div className="text-center max-w-[280px]">
              <Link href="/quiz-adventure" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-500 text-white hover:scale-110 transition-all">
                  ⚔協力ダンジョン
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  仲間と力を合わせてクイズに挑め！
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  クイズに正解して、強敵を打ち倒そう！
                </p>
              </div>
            </div>

            {/* サイコロクイズ */}
            {/* <div className="text-center max-w-[280px]">
              <Link href="/quiz-dice" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-green-700 via-emerald-500 to-amber-300 text-white hover:scale-110 transition-all">
                  🎲サイコロクイズ
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  サイコロ次第でポイント爆増！？
                  サイコロひとつで運命が変わる！
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  運も実力も試されるドキドキクイズ！
                  一発逆転も狙えるスリル満点クイズ！
                </p>
              </div>
            </div> */}

            {/* クイズおにごっこ */}
            <div className="text-center max-w-[280px]">
              <Link href="/quiz-onigokko" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-red-600 via-red-500 to-orange-300 text-white hover:scale-110 transition-all">
                  👹クイズおにごっこ
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  捕まれば鬼に交代！
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  ハラハラ追いかけっこクイズアクション！
                </p>
              </div>
            </div>

            {/* スペースクイズ */}
            <div className="text-center max-w-[280px]">
              <Link href="/quiz-space" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-cyan-500 via-purple-600 to-fuchsia-500 text-white hover:scale-110 transition-all">
                  🛸スペースクイズ
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  正解エリアへ急げ！
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  最後まで生き残る宇宙クイズバトル！
                </p>
              </div>
            </div>

            {/* ワードチェイス */}
            <div className="text-center max-w-[280px]">
              <Link href="/quiz-word" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-[#6b1d1d] via-[#a16207] to-[#f59e0b] text-white hover:scale-110 transition-all">
                  🔍ワードチェイス
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  迷路の中で文字を集めろ！
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  誰よりも早く単語を当てる探索クイズ！
                </p>
              </div>
            </div>
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