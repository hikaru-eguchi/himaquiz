"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../hooks/useSupabaseUser"; // パスはプロジェクトに合わせて調整

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizMasterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [showDescription, setShowDescription] = useState(false);
  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  // ★ PC用キャラ
  const allCharacters = [
    "/images/quiz_man.png",
    "/images/quiz.png",
    "/images/quiz_woman.png",
  ];

  // ★ スマホ専用キャラ
  const mobileCharacters = ["/images/quiz.png", "/images/quiz_woman.png"];

  // ★ 画面サイズで表示画像を切り替え
  const [characters, setCharacters] = useState<string[]>([]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md未満
    setCharacters(isMobile ? mobileCharacters : allCharacters);
  }, []);

  // ★ アニメーション用
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    // characters が空の間は何もしない
    if (characters.length === 0) return;

    setVisibleCount(0);
    const timers = characters.map((_, index) =>
      window.setTimeout(() => {
        setVisibleCount((v) => v + 1);
      }, index * 300)
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [characters]);

  // アコーディオン用 ref
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  // ✅ 未ログインなら「ログイン誘導画面」
  if (!userLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-300 via-green-600 to-emerald-700">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="bg-white/90 backdrop-blur p-6 md:p-10 rounded-2xl border-2 border-black shadow-xl text-center max-w-xl w-full">
            <p className="text-2xl md:text-3xl font-extrabold text-gray-800">
              このゲームはログイン（無料）すると遊べるよ！
            </p>

            <p className="mt-3 text-sm md:text-lg text-gray-700 leading-relaxed">
              ログインすると、ポイントなどの記録が保存されて<br />
              いろんな機能が使えるようになります。
            </p>

            <div className="mt-6 flex flex-col md:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/user/login")}
                className="px-6 py-3 rounded-lg font-bold text-white bg-blue-500 hover:bg-blue-600 shadow"
              >
                ログインして遊ぶ
              </button>
              <button
                onClick={() => router.push("/user/signup")}
                className="px-6 py-3 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 shadow"
              >
                新規ユーザー登録（無料）
              </button>
            </div>

            <p className="mt-4 text-xs md:text-sm text-gray-600">
              ※ログイン後に戻ってくると、ゲームを開始できます
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ ログイン状態読み込み中
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-emerald-400 via-green-200 to-emerald-400">
      <h1
        className="text-5xl md:text-7xl font-extrabold mb-6 text-center"
        style={{
          color: "yellow",
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
        <span className="block md:hidden leading-tight">
          運命の<br />クイズ
        </span>
        <span className="hidden md:block">運命のクイズ</span>
      </h1>

      <p className="text-md md:text-2xl font-semibold text-black mb-2 md:mb-4">
        ＜1人で遊べるクイズゲーム＞
      </p>
      <p className="text-md md:text-2xl font-semibold text-black mb-8">
        正解を重ねるほど報酬アップ！ただし、1問でも間違えたらチャレンジ終了！君はどこまで進める？
      </p>

      {/* ★ スマホは2枚、PCは3枚を順番に登場 */}
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
        <Link href="/quiz-luck/random" className="flex-1">
          <button className="w-full md:w-70 px-6 py-2 md:px-8 md:py-4 bg-purple-500 text-white rounded-full hover:bg-purple-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black">
            ゲームスタート
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
          maxHeight: showDescription ? descriptionRef.current?.scrollHeight : 0,
        }}
      >
        <p
          ref={descriptionRef}
          className="text-gray-700 text-md md:text-lg text-center px-4 py-2"
        >
          「運命のクイズ」は、正解を重ねることで報酬がアップしていくチャレンジ型のクイズゲームです。<br />
          最初のチャレンジでは、2問連続で正解すると報酬が決定し、100〜300ポイントの中からランダムで獲得できます。<br />
          その後もチャレンジを続けることができ、次のチャレンジに成功すると、報酬はさらにアップしていきます。<br />
          チャレンジは最大3回まで。すべてのチャレンジに成功すると、その時点の報酬を獲得できます。<br />
          途中で間違えた場合はチャレンジ終了となり、今回の未確定報酬は一部減少しますが、所持ポイントが減ることはありません。<br />
          続けて挑戦するか、ここで報酬を確定するか――判断するのはあなた次第。自分の実力に挑戦してみましょう！<br />
          ※本ゲームはゲーム内の報酬システムによるもので、換金・金銭的価値・金銭を賭ける要素はありません。<br />
        </p>
      </div>
    </div>
  );
}
