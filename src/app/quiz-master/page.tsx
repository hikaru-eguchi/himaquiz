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
    "/images/dragon.png",
    "/images/yuusya_game.png",
    "/images/mimic.png",
  ];

  const secretBosses = [
    { id: "ancient_dragon", name: "エンシェントドラゴン", requiredLevel: 10 },
    { id: "dark_knight", name: "ダークナイト", requiredLevel: 15 },
    { id: "susanoo", name: "スサノオ", requiredLevel: 20 },
    { id: "takemikazuchi", name: "タケミカヅチ", requiredLevel: 25 },
    { id: "ultimate_dragon", name: "アルティメットドラゴン", requiredLevel: 30 },
    { id: "fujin", name: "風神", requiredLevel: 35 },
    { id: "raijin", name: "雷神", requiredLevel: 35 },
    { id: "quiz_demon_king", name: "クイズ大魔王", requiredLevel: 40 },
    { id: "quiz_emperor", name: "クイズ帝王", requiredLevel: 50 },
  ] as const;

  const [userLevel, setUserLevel] = useState<number>(0);
  const [levelLoading, setLevelLoading] = useState(false);

  useEffect(() => {
    const fetchLevel = async () => {
      if (!user) {
        setUserLevel(0);
        return;
      }
      setLevelLoading(true);
      try {
        // ここはあなたのprofiles設計に合わせる：
        // - 例: profiles に level カラムがある想定
        const { data, error } = await supabase
          .from("profiles")
          .select("level")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setUserLevel(Number(data?.level ?? 0));
      } catch (e) {
        console.error("failed to load user level:", e);
        setUserLevel(0);
      } finally {
        setLevelLoading(false);
      }
    };

    fetchLevel();
  }, [user, supabase]);

  const unlocked = secretBosses.filter((b) => userLevel >= b.requiredLevel);
  const locked = secretBosses.filter((b) => userLevel < b.requiredLevel);

  // 「未解放」は最初の1つだけ表示、それ以降は非表示
  const showBosses = [...unlocked, ...(locked[0] ? [locked[0]] : [])];


  // ★ スマホ専用キャラ（2枚だけ）
  const mobileCharacters = [
    "/images/dragon.png",
    "/images/yuusya_game.png",
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
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-purple-100 via-purple-200 to-purple-300">
      <h1
        className="text-5xl md:text-7xl font-extrabold mb-6 text-center"
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
        {/* 📱スマホ（改行あり） */}
        <span className="block md:hidden leading-tight">
          クイズ<br />ダンジョン
        </span>

        {/* 💻PC（1行） */}
        <span className="hidden md:block">
          クイズダンジョン
        </span>
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-gray-800 mb-2 md:mb-4">
          ＜1人で遊べるクイズゲーム＞
        </p>
        <p className="text-md md:text-2xl font-semibold text-gray-800 mb-8">
          クイズで進む冒険ダンジョン！君はどこまで到達できる？最強の称号「クイズマスター」を手に入れろ！
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
          <Link href="/quiz-master/random" className="flex-1">
            <button className="w-full md:w-80 px-6 py-2 md:px-8 md:py-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-full hover:bg-blue-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black">
              ゲームスタート
            </button>
          </Link>
          {/* <Link href="/quiz-master/random" className="flex-1">
            <button className="w-full md:w-110 px-6 py-2 md:px-8 md:py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black">
              全てのクイズから出題
            </button>
          </Link>

          <button
            className="flex-1 w-full px-6 py-2 md:px-8 md:py-4 bg-green-500 text-white rounded-full hover:bg-green-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
            onClick={() => setShowGenreButtons((prev) => !prev)}
          >
            ジャンルを選んで出題
          </button> */}
        </div>
        {showGenreButtons && (
          <div className="flex flex-col justify-center items-center mt-3 md:mt-5">
            <div className="mb-2 md:mb-3 text-lg md:text-2xl">
              <p>ジャンルを選んでください</p>
            </div>
            <div className="flex justify-center gap-3">
              <Link href="/quiz-master/genre?genre=知識系">
                <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-br from-sky-100 via-sky-300 to-teal-100 border-2 border-black text-lg md:text-xl font-bold text-black rounded-full hover:bg-purple-600 cursor-pointer shadow-lg">
                  知識系
                </button>
              </Link>
              <Link href="/quiz-master/genre?genre=心理系">
                <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-br from-pink-100 via-pink-300 to-purple-100 border-2 border-black text-lg md:text-xl font-bold text-black rounded-full hover:bg-pink-600 cursor-pointer shadow-lg">
                  心理系
                </button>
              </Link>
              <Link href="/quiz-master/genre?genre=雑学系">
                <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-br from-yellow-100 via-green-300 to-green-100 border-2 border-black text-lg md:text-xl font-bold text-black rounded-full hover:bg-yellow-600 cursor-pointer shadow-lg">
                  雑学系
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* 説明ボタン */}
        <button
          onClick={handleDescriptionClick}
          className="mt-4 px-6 py-1 md:px-8 md:text-xl bg-white text-gray-800 rounded-full border-2 border-black hover:bg-gray-300 shadow-md transition-colors"
        >
          このゲームの説明を見る
        </button>

        {/* ✅ シークレットダンジョン */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div
  className="relative overflow-hidden border-2 border-black rounded-2xl p-4 shadow
             bg-gradient-to-br from-[#f6f1ff] via-[#efe7ff] to-[#fff4d6]"
>
            <div className="relative">
              <p className="text-2xl md:text-3xl font-extrabold text-gray-900">
                🔒 シークレットダンジョン
              </p>

              {userLoading ? (
                <p className="mt-2 text-gray-600 font-bold">判定中...</p>
              ) : user ? (
                <>
                  <p className="text-md md:text-lg mt-2 text-gray-800 font-bold">
                    挑戦するダンジョンを選んでください
                  </p>
                  <p className="text-xs md:text-sm text-gray-700 font-bold">
                    ※通常/フェアリーで強さ・報酬が変わります
                  </p>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {showBosses.map((b) => {
                      const isUnlocked = userLevel >= b.requiredLevel;

                      return (
                        <div
                          key={b.id}
                          className="relative overflow-hidden rounded-xl p-4 shadow flex flex-col gap-3
                          bg-gradient-to-br from-[#fff7cc] via-[#f7d774] to-[#d4a017]"
                        >
                          {/* 条件表示 */}
                          {isUnlocked ? (
                            <p className="text-sm md:text-md font-extrabold text-gray-700">
                              条件：ユーザーレベル {b.requiredLevel} 以上
                            </p>
                          ) : (
                            <p className="text-sm md:text-md font-extrabold text-gray-700">
                              🔒 ユーザーレベル {b.requiredLevel} で解放
                            </p>
                          )}

                          {/* ボス名（未解放は伏せてもOK） */}
                          <p className="text-xl md:text-2xl font-extrabold text-gray-900">
                            {isUnlocked ? `${b.name} に挑戦🔥` : "？？？（未解放）"}
                          </p>

                          {/* 解放されている時だけボタン表示 */}
                          {isUnlocked ? (
                            <div className="flex gap-2">
                              <Link
                                href={`/quiz-master/random?course=secret&boss=${encodeURIComponent(
                                  b.id
                                )}&variant=normal`}
                                className="flex-1"
                              >
                                <button className="w-full px-4 py-2 bg-white text-gray-900 rounded-lg border-2 border-black font-extrabold hover:bg-gray-100 cursor-pointer">
                                  通常
                                </button>
                              </Link>

                              <Link
                                href={`/quiz-master/random?course=secret&boss=${encodeURIComponent(
                                  b.id
                                )}&variant=fairy`}
                                className="flex-1"
                              >
                                <button className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white rounded-lg border-2 border-black font-extrabold hover:opacity-90 cursor-pointer">
                                  フェアリー
                                </button>
                              </Link>
                            </div>
                          ) : (
                            <button
                              disabled
                              className="w-full px-4 py-2 rounded-lg border-2 border-black font-extrabold
                                        bg-black/30 text-white/60 cursor-not-allowed"
                            >
                              まだ挑戦できません
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-3 text-gray-800 font-bold">
                    このコースはログインすると遊べます！
                  </p>
                  <button
                    onClick={() => router.push("/user/login")}
                    className="mt-3 px-6 py-3 bg-blue-500 text-white rounded-xl font-extrabold hover:bg-blue-600 cursor-pointer"
                  >
                    ログインして遊ぶ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

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
            「クイズダンジョン」は、クイズを解きながらダンジョンを進んでいく冒険クイズゲームです。<br />
            クイズに正解すれば敵に攻撃できますが、間違えるとあなたのHP（ライフ）が減ってしまいます。<br />
            HPが0になるとゲームオーバー。<br />
            敵を倒すごとにステージが進み、あなたのランク（称号）もどんどん昇格していきます。<br />
            運が良ければ、めったに入手できないレアアイテムを発見できることも…！？<br />
            最終称号 「クイズマスター」を手に入れて、ダンジョン制覇を目指しましょう！
          </p>
        </div>
      </>
    </div>
  );
}
