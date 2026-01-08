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
  const [limitTime, setLimitTime] = useState<number | null>(2);

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
    router.push(`/quiz-battle/random?time=${limitTime}`);
  };

  // ▼ あいことば対戦
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [battleCode, setBattleCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-pink-500 via-yellow-400 to-green-500">
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
          クイズ<br />バトル
        </span>
        <span className="hidden md:block">クイズバトル</span>
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-white mb-1 md:mb-2">
          ＜2人対戦クイズゲーム＞
        </p>
        <p className="text-md md:text-2xl font-semibold text-white mb-8">
          どれだけ高得点を狙えるか誰かと対戦！相手よりもハイスコアを目指そう！
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
          <div>
            <button
              onClick={handleRandomQuizStart}
              className="w-full md:w-80 px-6 py-2 md:px-8 md:py-4 bg-sky-500 text-white rounded-full hover:bg-sky-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
            >
              オンラインでだれかと対戦
            </button>
            <p className="text-sm text-gray-800 mt-1">※一定時間マッチしないとCPUとの対戦になります</p>
          </div>
          <div>
            <button
              onClick={() => setShowCodeInput(true)}
              className="w-full md:w-80 px-6 py-2 md:px-8 md:py-4 bg-pink-500 text-white rounded-full hover:bg-pink-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
            >
              知り合いと対戦
            </button>
          </div>
        </div>

        {showCodeInput && (
          <div className="mt-6 bg-white p-4 rounded-xl max-w-md mx-auto border-2 border-black">
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
                if (!battleCode.trim()) {
                  setCodeError("対戦コードを入力してください");
                  return;
                }
                router.push(
                  `/quiz-battle/code?time=${limitTime}&code=${battleCode}`
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
            「クイズバトル」は、だれかと正解数や得点を競う対戦型クイズゲームです。<br />
            制限時間は 2分間。その間にどれだけ正解できるかで勝負します。<br />
            問題の難易度に応じて獲得ポイントが変わります：かんたん…50P、ふつう…100P、むずかしい…150P。<br />
            ただし油断は禁物！3問連続で間違えると、得点が100ポイント減ってしまいます。<br />
            近くの友達とあいことばを合わせてマッチすることも、ネット上の誰かと対戦することも可能です。<br />
            相手よりも高得点を目指して、全力で挑戦しよう！<br />
            ※オンラインで対戦相手が見つからない場合は、CPU（コンピュータ）との対戦になります。
          </p>
        </div>
      </>
    </div>
  );
}
