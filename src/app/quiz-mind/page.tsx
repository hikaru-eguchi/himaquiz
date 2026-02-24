"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizMasterPage() {
  const router = useRouter();

  const [showDescription, setShowDescription] = useState(false);

  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  // ★ 入力された制限時間（クエリで渡す）
  const [limitTime, setLimitTime] = useState<number | null>(5);

  // ★ PC用キャラ（全6枚）
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
    router.push(`/quiz-mind/random?time=${limitTime}`);
  };

  // ▼ あいことば対戦
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [battleCode, setBattleCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState<number | null>(2);

  return (
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-pink-400 via-rose-400 to-amber-400">
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
          心理当て<br />バトル
        </span>
        <span className="hidden md:block">心理当てバトル</span>
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-white mb-2 md:mb-4">
          ＜みんなで遊べるクイズゲーム＞
        </p>
        <p className="text-md md:text-2xl font-semibold text-white mb-8">
          相手の心理を見抜け！いちばん心を読めるのは誰だ！？
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

        <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
          {/* <div>
            <button
              onClick={handleRandomQuizStart}
              className="w-full md:w-80 px-6 py-2 md:px-8 md:py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
            >
              オンラインでだれかと遊ぶ
            </button>
            <p className="text-sm text-gray-100 mt-1">※一定時間マッチしないとCPUと対戦になります</p>
          </div> */}
          <div>
            <button
              onClick={() => setShowCodeInput(true)}
              className="w-full md:w-80 px-6 py-2 md:px-8 md:py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
            >
              知り合いと遊ぶ
            </button>
            <p className="text-sm text-white mt-1">※2人〜8人でプレイできます。</p>
          </div>
        </div>

        {showCodeInput && (
          <div className="mt-6 bg-white p-4 rounded-xl max-w-md mx-auto border-2 border-black">
            {/* 参加人数 */}
            <p className="text-xl font-bold mb-2">
              参加人数を入力してください（2〜8人）
            </p>
            <input
              type="number"
              min={2}
              max={8}
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
                if (playerCount > 8) setPlayerCount(8);
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
                if (!playerCount || playerCount < 2 || playerCount > 8) {
                  setCodeError("参加人数は2〜8人で入力してください");
                  return;
                }
                if (!battleCode.trim()) {
                  setCodeError("あいことばを入力してください");
                  return;
                }
                router.push(
                  `/quiz-mind/code?time=${limitTime}&code=${battleCode}&count=${playerCount}`
                );
              }}
              className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded font-bold"
            >
              マッチ開始
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
              「心理当てバトル」は、みんなの心を読み合うドキドキ心理戦ゲーム！🧠✨<br />
              各ターンでは代表プレイヤーが「いちばん自分の気持ちに近い選択」をこっそり選びます。<br />
              他のプレイヤーは、その“本音の選択”をズバリ当てられればポイントGET！🎯<br />
              読み切るか？それとも読まれるか！？ドキドキバトルを楽しもう！🔥<br />
              ※知り合いとのみの対戦となります。
          </p>
        </div>
      </>
    </div>
  );
}
