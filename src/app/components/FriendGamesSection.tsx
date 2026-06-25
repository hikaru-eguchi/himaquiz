"use client";

import { useState } from "react";
import Link from "next/link";

export default function FriendGamesSection() {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 p-5 bg-gradient-to-b from-pink-0 via-pink-100 to-pink-200">
      <p className="text-2xl md:text-4xl font-extrabold mb-2 text-center leading-tight drop-shadow-xl text-pink-500">
        👥友達と遊べるクイズゲーム👥
      </p>

      <p className="text-lg md:text-xl mb-2 text-center leading-tight mb-4">
        合言葉を作って、友達や恋人、家族だけで楽しもう！🤝
      </p>

      <div className="flex justify-center gap-3 md:gap-5 flex-wrap">

        {/* 心理当てバトル */}
        <div className="relative text-center max-w-[280px]">
          <span className="absolute -top-3 -left-4 z-10 px-3 py-1 text-xs md:text-sm font-bold rounded-full border-2 border-white bg-red-500 text-white shadow-md rotate-[-8deg]">
            🔥人気No.1
          </span>

          <Link href="/quiz-mind" className="w-full md:w-auto flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-200 text-white hover:scale-110 transition-all">
              🧠心理当てバトル
            </button>
          </Link>

          <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              相手の心理を見抜け！
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              いちばん心を読めるのは誰だ！？
            </p>
          </div>
        </div>

        {/* なかよし診断 */}
        <div className="text-center max-w-[280px]">
            <Link href="/quiz-friend" className="w-full md:w-auto flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-yellow-200 text-white hover:scale-110 transition-all">
                💞なかよし診断
            </button>
            </Link>

            <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
            <p className="text-sm md:text-base text-gray-700 leading-tight">
                相手のこと、どれくらい知ってる？
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
                友達・恋人と盛り上がる理解度テスト！
            </p>
            </div>
        </div>

        {/* ウソ？ホント？ゲーム */}
        <div className="text-center max-w-[280px]">
            <Link href="/quiz-usohonto" className="w-full md:w-auto flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_45%,#e11d48_55%,#fb7185_100%)] text-white hover:scale-110 transition-all">
                🎭ウソ？ホント？ゲーム
            </button>
            </Link>

            <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
            <p className="text-sm md:text-base text-gray-700 leading-tight">
                その話、信じていい？
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
                話がウソかホントかを見抜け！
            </p>
            </div>
        </div>

        {/* ひらめきクイズ */}
        {/* <div className="text-center max-w-[280px]">
          <Link href="/quiz-hirameki" className="w-full md:w-auto flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-300 text-white hover:scale-110 transition-all">
              💡ひらめきクイズ
            </button>
          </Link>

          <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              でてくるヒントで答えを当てろ！
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              みんなでできる早押しクイズゲーム！
            </p>
          </div>
        </div> */}

        {/* これどっち？ */}
        {/* <div className="text-center max-w-[280px]">
          <Link href="/quiz-koredochi" className="w-full md:w-auto flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-cyan-400 via-violet-300 to-pink-400 text-white hover:scale-110 transition-all">
              🤔これどっち？
            </button>
          </Link>

          <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              みんなと意見は合う？
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              友達とできるシンクロゲーム！
            </p>
          </div>
        </div> */}

        {showMore && (
          <>
            {/* なかよし診断 */}
            {/* <div className="text-center max-w-[280px]">
              <Link href="/quiz-friend" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-yellow-200 text-white hover:scale-110 transition-all">
                  💞なかよし診断
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  相手のこと、どれくらい知ってる？
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  友達・恋人と盛り上がる理解度テスト！
                </p>
              </div>
            </div> */}

            {/* シンクロランキング */}
            {/* <div className="text-center max-w-[280px]">
              <Link href="/quiz-synchro" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 text-white hover:scale-110 transition-all">
                  👑シンクロランキング
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  みんなのベスト3は同じ？
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  順位を選んでシンクロさせよう！
                </p>
              </div>
            </div> */}

            {/* ウソ？ホント？ゲーム */}
            {/* <div className="text-center max-w-[280px]">
              <Link href="/quiz-usohonto" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_45%,#e11d48_55%,#fb7185_100%)] text-white hover:scale-110 transition-all">
                  🎭ウソ？ホント？ゲーム
                </button>
              </Link>

              <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  その話、信じていい？
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                  話がウソかホントかを見抜け！
                </p>
              </div>
            </div> */}
            
            {/* ひらめきクイズ */}
            <div className="text-center max-w-[280px]">
            <Link href="/quiz-hirameki" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-300 text-white hover:scale-110 transition-all">
                💡ひらめきクイズ
                </button>
            </Link>

            <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                でてくるヒントで答えを当てろ！
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                みんなでできる早押しクイズゲーム！
                </p>
            </div>
            </div>

            {/* これどっち？ */}
            <div className="text-center max-w-[280px]">
            <Link href="/quiz-koredochi" className="w-full md:w-auto flex justify-center">
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-cyan-400 via-violet-300 to-pink-400 text-white hover:scale-110 transition-all">
                🤔これどっち？
                </button>
            </Link>

            <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                みんなと意見は合う？
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-tight">
                友達とできるシンクロゲーム！
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