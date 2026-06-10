"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";
import TimeAttackRankingTop10 from "@/app/components/TimeAttackRankingTop10";
import { useSupabaseUser } from "../../hooks/useSupabaseUser";

const anton = Anton({ subsets: ["latin"], weight: "400" });

type TimeAttackRankRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  best_time: number;
};

export default function TimeAttackPage() {
  const [showGenreButtons, setShowGenreButtons] = useState(false);
  const [showLevelButtons, setShowLevelButtons] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const [timeattackTop10, setTimeattackTop10] = useState<TimeAttackRankRow[]>([]);
  const [rankLoading, setRankLoading] = useState(true);

  const { user, loading: userLoading } = useSupabaseUser();

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
    "/images/quiz_time.png",
    "/images/quiz_woman.png",
  ];

  // ★ スマホ専用キャラ（2枚だけ）
  const mobileCharacters = [
    "/images/quiz_time.png",
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


  useEffect(() => {
    const fetchTimeAttackRanking = async () => {
      setRankLoading(true);
      try {
        const res = await fetch("/api/rankings/timeattack", { cache: "no-store" });
        const data = (await res.json()) as TimeAttackRankRow[];
        setTimeattackTop10(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("ランキング取得失敗:", e);
        setTimeattackTop10([]);
      } finally {
        setRankLoading(false);
      }
    };

    fetchTimeAttackRanking();
  }, []);

  // アコーディオン用 ref
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  return (
    <div className="container mx-auto md:px-4 px-2 py-8 text-center bg-gradient-to-b from-cyan-100 via-sky-200 to-blue-300">
      <h1
        className="text-5xl md:text-7xl font-extrabold mb-6 text-center"
        style={{
          color: "#38BDF8",
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
            0 0 12px #67E8F9
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        {/* 📱スマホ（改行あり） */}
        <span className="block md:hidden leading-tight">
          タイム<br />アタック
        </span>

        {/* 💻PC（1行） */}
        <span className="hidden md:block">
          タイムアタック
        </span>
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-gray-800 mb-2 md:mb-4">
          ＜1人で遊べるクイズゲーム＞
        </p>
        <p className="text-md md:text-2xl font-semibold text-gray-800 mb-8">
          クイズ5問を何秒でクリアできる？集中力と反射力で最速タイムを目指そう！
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
          <Link href="/time-attack/random" className="flex-1">
            <button className="w-full md:w-70 px-6 py-2 md:px-8 md:py-4 bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 text-white rounded-full hover:from-cyan-500 hover:via-sky-400 hover:to-blue-500 cursor-pointer text-lg md:text-2xl font-extrabold shadow-xl transition-transform hover:scale-105 border-2 border-black">
              {/* 全てのクイズから出題 */}
              ⚡ ゲームスタート
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
            「タイムアタック」は、5問クイズの最速クリアを目指すスピードクイズモードです。
            <br />
            5問すべてを、どれだけ速く正解できるかが勝負！
            <br />
            簡単そうに見えて、焦ると意外と間違える…！？
            <br />
            連続で挑戦して、自分の限界タイムを更新しよう！
            <br />
            君は最速クラスに入れるか？
            <br />
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="mt-3 w-full max-w-[900px] rounded-[28px] border border-[#e5ddd3] bg-[#f8f8f8] px-2 py-5 md:px-8 md:py-7 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-xl md:text-3xl font-extrabold text-gray-800 tracking-tight">
                <span className="mr-2 text-sky-500">⚡</span>
                最速タイムに挑戦！
                <span className="ml-2 text-cyan-500">⏱</span>
              </h2>

              <div className="mt-5 w-full max-w-[800px] rounded-[22px] border-2 border-[#efb8b8] bg-[#fff8f8] px-5 py-5 md:px-8 md:py-6">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="shrink-0 text-3xl md:text-5xl">🔒</div>

                  <div className="text-left">
                    <p className="text-lg md:text-2xl font-extrabold text-red-600 leading-tight">
                      ランキングに載るにはログインが必要です
                    </p>
                    <p className="mt-2 text-sm md:text-lg font-bold text-gray-800 leading-relaxed">
                      あなたの記録をランキングに残して、全国のユーザーと競い合おう！
                    </p>
                  </div>
                </div>
              </div>

              {!userLoading && !user && (
                <div className="mt-5 w-full max-w-[800px] rounded-[22px] border border-[#d9d9d9] bg-[#fdfdfd] px-5 py-5 md:px-8 md:py-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-left">
                      <p className="text-xl md:text-2xl font-extrabold text-red-600 leading-tight">
                        ログインしていません
                      </p>
                      <p className="mt-2 text-sm md:text-base font-bold text-gray-800">
                        ログインするとランキングに参加できます！
                      </p>
                    </div>

                    <Link href="/user/login" className="md:shrink-0">
                      <button className="w-full md:w-auto min-w-[200px] px-6 py-2 md:px-8 md:py-3 bg-orange-400 hover:bg-orange-500 text-white rounded-[18px] font-extrabold text-lg md:text-2xl border-2 border-[#b85c00] shadow-[0_3px_0_#b85c00] transition-transform hover:scale-[1.02] cursor-pointer">
                        ログインする
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {rankLoading ? (
              <p className="py-6 text-center text-base md:text-lg font-bold text-gray-600">
                ランキング読み込み中...
              </p>
            ) : timeattackTop10.length > 0 ? (
              <TimeAttackRankingTop10 rows={timeattackTop10} />
            ) : (
              <p className="py-6 text-center text-base md:text-lg font-bold text-gray-600">
                まだランキングがありません
              </p>
            )}
          </div>

        </div>
      </>
    </div>
  );
}
