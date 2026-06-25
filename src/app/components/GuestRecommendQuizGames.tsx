"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function GuestRecommendQuizGames() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      setLoggedIn(!!data.user);
      setLoading(false);
    };

    run();
  }, [supabase]);

  if (loading) return null;
  if (loggedIn) return null;

  return (
    <div className="max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 mt-2 p-4 md:p-5 bg-gradient-to-br from-yellow-100 via-pink-100 to-sky-100 shadow-xl">
      <p className="text-2xl md:text-4xl font-black text-center leading-tight drop-shadow-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-transparent bg-clip-text">
        🎮どれで遊ぶ？おすすめゲーム3選！
      </p>

      <p className="mt-2 mb-4 text-center text-base md:text-xl font-extrabold text-gray-800 leading-tight">
        迷ったらここから！ひまQの人気クイズゲームに挑戦しよう✨
      </p>

      <div className="flex flex-col gap-3">
        <div className="w-full max-w-[500px] mx-auto rounded-2xl border-2 border-red-300 bg-white/85 p-3 shadow-lg">
          <p className="text-sm md:text-base font-black text-red-500 text-center">
            🔥 迷ったらこれ！
          </p>
          <Link href="/streak-challenge" className="flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-red-500 to-orange-400 text-white hover:scale-110 transition-all">
              ✅連続正解チャレンジ
            </button>
          </Link>
          <p className="mt-2 text-center text-sm md:text-base font-bold text-gray-700 leading-tight">
            何問連続で正解できるか挑戦！ひとりでサクッと熱くなれる定番ゲーム！
          </p>
        </div>

        <div className="w-full max-w-[500px] mx-auto rounded-2xl border-2 border-yellow-300 bg-white/85 p-3 shadow-lg">
          <p className="text-sm md:text-base font-black text-yellow-600 text-center">
            💡 友達とサクッとやるならこれ！
          </p>
          <Link href="/quiz-hirameki" className="flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-300 text-white hover:scale-110 transition-all">
              💡ひらめきクイズ
            </button>
          </Link>
          <p className="mt-2 text-center text-sm md:text-base font-bold text-gray-700 leading-tight">
            ヒントを見ながら答えを当てよう！友達や家族とワイワイ盛り上がれる！
          </p>
        </div>

        <div className="w-full max-w-[500px] mx-auto rounded-2xl border-2 border-blue-300 bg-white/85 p-3 shadow-lg">
          <p className="text-sm md:text-base font-black text-blue-600 text-center">
            👑 熱いオンライン対戦ならこれ！
          </p>
          <Link href="/quiz-royal" className="flex justify-center">
            <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-yellow-500 via-amber-300 to-blue-500 text-white hover:scale-110 transition-all">
              👑クイズロワイヤル
            </button>
          </Link>
          <p className="mt-2 text-center text-sm md:text-base font-bold text-gray-700 leading-tight">
            みんなでリアルタイムバトル！正解を積み上げてクイズ王を目指そう！
          </p>
        </div>
      </div>
    </div>
  );
}