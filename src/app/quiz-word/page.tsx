"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizMasterPage() {
  const router = useRouter();
  const { user } = useSupabaseUser();

  const [showDescription, setShowDescription] = useState(false);

  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  // ★ 入力された制限時間（クエリで渡す）
  const [limitTime, setLimitTime] = useState<number | null>(5);

  // ★ PC用キャラ（全6枚）
  const allCharacters = [
    "/images/word_book1.png",
    "/images/skin_chara1_ボード.png",
    "/images/word_book2.png",
  ];

  // ★ スマホ専用キャラ（2枚だけ）
  const mobileCharacters = [
    "/images/word_book1.png",
    "/images/skin_chara1_ボード.png",
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
    router.push(`/quiz-word/random?time=${limitTime}`);
  };

  // ▼ あいことば対戦
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [battleCode, setBattleCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState<number | null>(2);

  return (
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-[#6b1d1d] via-[#a16207] to-[#f59e0b]">
      <p className="mx-auto mb-3 inline-flex rounded-full border border-amber-700 bg-[#fff8e7] px-4 py-1 text-sm font-black text-amber-900 backdrop-blur">
        文字を集めろ！
      </p>
      
      <h1
        className="text-5xl md:text-7xl font-extrabold mb-6 text-center"
        style={{
          color: "#ffffff",
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
            0 0 10px #ffffff
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        <span className="block md:hidden leading-tight">
          ワード<br />チェイス
        </span>
        <span className="hidden md:block">ワードチェイス</span>
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-white mb-2 md:mb-4">
          ＜みんなで遊べるクイズゲーム＞
        </p>
        <p className="text-md md:text-2xl font-semibold text-white mb-8">
          本の世界を駆け回り、隠された単語を見つけ出そう！
        </p>

        <p className="mx-auto mb-8 max-w-3xl text-sm font-bold leading-relaxed text-white/75 md:text-lg">
          巨大な本の世界を探索しよう。本を見つけて文字やヒントを集め、誰よりも早く答えを見つけよう。
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
                w-30 h-30 md:w-70 md:h-70 object-cover rounded-lg
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            />
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
          <div>
            <button
              onClick={handleRandomQuizStart}
              className="w-full md:w-80 px-6 py-2 md:px-8 md:py-4 rounded-full border-2 border-amber-600 bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-4 text-lg font-black text-white transition hover:scale-105 md:text-2xl"
            >
              オンラインで対戦
            </button>
            <p className="text-sm text-gray-100 mt-1">※4人でプレイできます。</p>
            {/* <p className="text-sm text-gray-100 mt-1">※一定時間マッチしないとCPUとの対戦になります</p> */}
          </div>
          <div>
            <button
              onClick={() => setShowCodeInput(true)}
              className="w-full md:w-80 px-6 py-2 md:px-8 md:py-4 rounded-full border-2 border-orange-900 bg-gradient-to-r from-yellow-700 to-amber-800 px-6 py-4 text-lg font-black text-white transition hover:scale-105 md:text-2xl"
            >
              あいことばで対戦
            </button>
            <p className="text-sm text-gray-100 mt-1">※2人〜4人でプレイできます。</p>
          </div>
        </div>

        {showCodeInput && (
          <div className="mt-6 bg-white p-4 rounded-xl max-w-md mx-auto border-2 border-black">
            {/* 参加人数 */}
            <p className="text-xl font-bold mb-2">
              参加人数を入力してください（2〜4人）
            </p>
            <input
              type="number"
              min={2}
              max={4}
              value={playerCount ?? ""} // nullish coalescing で空文字を許可
              onChange={(e) => {
                const valStr = e.target.value;
                setPlayerCount(valStr === "" ? null : Number(valStr)); // 空文字も許可
                setCodeError(null);
              }}
              onBlur={() => {
                // フォーカスアウト時に範囲チェック
                if (playerCount === null) return;
                if (playerCount < 2) setPlayerCount(2);
                if (playerCount > 4) setPlayerCount(4);
              }}
              className="border px-2 py-1 text-lg w-full mb-4"
            />

            {/* あいことば */}
            <p className="text-xl font-bold mb-2">
              あいことばを入力してください
            </p>
            <input
              type="text"
              value={battleCode}
              onChange={(e) => {
                setBattleCode(e.target.value);
                setCodeError(null);
              }}
              className="border px-2 py-1 text-lg w-full"
            />

            {codeError && (
              <p className="mt-2 text-red-600 font-bold">
                {codeError}
              </p>
            )}

            <button
              onClick={() => {
                if (!playerCount || playerCount < 2 || playerCount > 4) {
                  setCodeError("参加人数は2〜4人で入力してください");
                  return;
                }
                if (!battleCode.trim()) {
                  setCodeError("あいことばを入力してください");
                  return;
                }
                router.push(
                  `/quiz-word/code?time=${limitTime}&code=${battleCode}&count=${playerCount}`
                );
              }}
              className="mt-5 w-full rounded-full bg-gradient-to-r from-amber-700 via-orange-500 to-yellow-400 px-5 py-3 text-lg font-black text-white transition hover:scale-105"
            >
              マッチ開始
            </button>
          </div>
        )}

        {user && (
          <div>
            <button
              type="button"
              onClick={() => router.push("/user/mystyle")}
              className="
                group
                ml-0 mt-3
                inline-flex items-center gap-2
                rounded-full
                border-3 border-black
                bg-gradient-to-r from-white via-cyan-50 to-violet-100
                px-7 py-3
                text-base md:text-xl
                font-black
                text-violet-800
                shadow-[0_5px_0_rgba(0,0,0,1)]
                transition
                hover:-translate-y-0.5
                hover:scale-105
                active:translate-y-1
                active:shadow-[0_2px_0_rgba(0,0,0,1)]
                md:ml-3 md:mt-4
              "
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-400 text-white shadow">
                👕
              </span>
              <span>使用スタイルを変更</span>
            </button>
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
            「ワードチェイス」は、巨大な本とノートの世界を探索して、<br />
            隠された単語を見つけ出す対戦型単語探しゲーム！📚<br />
            マップのどこかにある本を見つけて、クイズに正解すると文字を獲得できます！<br />
            時々ヒント本や偽物の本も登場します。<br />
            集めた文字やヒントを手掛かりに、中央の巨大な辞書で答えを入力しよう！<br />
            間違えると一定時間回答できなくなるので注意！<br />
            制限時間は3分。誰よりも早く正解しよう！🏆
          </p>
        </div>

        <div className="mx-auto mt-5 max-w-3xl rounded-3xl border-3 border-black bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 p-4 md:p-5 shadow-[0_6px_0_rgba(0,0,0,1)]">
          <div className="text-center">
            <p className="text-xl md:text-3xl font-black text-white drop-shadow">
              操作するキャラの見た目を変えよう！✨
            </p>

            <p className="mt-2 text-sm md:text-base font-bold leading-relaxed text-white/95">
              ひまスタイルガチャで、新しい見た目をゲット！
              <br />
              本の世界でもお気に入りのスタイルで冒険しよう！
            </p>
          </div>

          <div className="hidden md:flex justify-center gap-3 mt-4">
            <img
              src="/images/skin_chara1_ボード.png"
              alt=""
              className="h-24 object-contain drop-shadow-xl"
            />
            <img
              src="/images/skin_chara2_ジェット（レッド）.png"
              alt=""
              className="h-24 object-contain drop-shadow-xl"
            />
            <img
              src="/images/skin_chara3_ジェット（ブルー）.png"
              alt=""
              className="h-24 object-contain drop-shadow-xl"
            />
          </div>

          <div className="flex md:hidden justify-center gap-3 mt-4">
            <img
              src="/images/skin_chara4_ジェット（グリーン）.png"
              alt=""
              className="h-20 object-contain drop-shadow-xl"
            />
            <img
              src="/images/skin_chara2_ジェット（レッド）.png"
              alt=""
              className="h-20 object-contain drop-shadow-xl"
            />
          </div>

          <Link
            href="/style-gacha"
            className="mt-4 inline-flex rounded-full border-3 border-black bg-yellow-300 px-7 py-3 text-base md:text-xl font-black text-black shadow-[0_5px_0_rgba(0,0,0,1)] hover:scale-105 transition"
          >
            🎨 ひまスタイルガチャ
          </Link>
        </div>
      </>
    </div>
  );
}
