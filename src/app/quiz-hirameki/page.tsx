"use client";

import { useState, useEffect, useRef } from "react";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizHiramekiPage() {
  const router = useRouter();

  const [showDescription, setShowDescription] = useState(false);
  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  const allCharacters = [
    "/images/quiz_man.png",
    "/images/quiz.png",
    "/images/quiz_woman.png",
  ];

  const mobileCharacters = ["/images/quiz.png", "/images/quiz_woman.png"];

  const [characters, setCharacters] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setCharacters(isMobile ? mobileCharacters : allCharacters);
  }, []);

  useEffect(() => {
    setVisibleCount(0);

    characters.forEach((_, index) => {
      setTimeout(() => {
        setVisibleCount((v) => v + 1);
      }, index * 300);
    });
  }, [characters]);

  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [battleCode, setBattleCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState<number | null>(2);

  return (
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-yellow-300 via-amber-200 to-orange-300">
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
            0 0 16px #fef08a
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        <span className="block md:hidden leading-tight">
          ひらめき
          <br />
          クイズ
        </span>
        <span className="hidden md:block">ひらめきクイズ</span>
      </h1>

      <p className="text-md md:text-2xl font-semibold text-orange-800 mb-2 md:mb-4">
        ＜友達と遊べるクイズゲーム＞
      </p>

      <p className="text-md md:text-2xl font-semibold text-orange-800 mb-8">
        だんだん出てくるヒントから答えをひらめけ！一番早く正解した人が勝ち！
      </p>

      {/* <div className="mx-auto mb-8 max-w-2xl rounded-3xl border-4 border-black bg-white/90 p-4 shadow-2xl">
        <p className="text-sm md:text-base font-black text-orange-600">
          文字数
        </p>

        <div className="mt-2 flex justify-center gap-2">
          {["□", "□", "□", "□", "□"].map((box, index) => (
            <div
              key={index}
              className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl border-4 border-black bg-yellow-100 text-3xl md:text-5xl font-black text-gray-900 shadow"
            >
              {box}
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border-2 border-black bg-yellow-300 px-3 py-3">
            <p className="text-2xl font-black">💡ヒント</p>
            <p className="text-sm md:text-base font-bold">
              10秒ごとに追加
            </p>
          </div>

          <div className="rounded-2xl border-2 border-black bg-amber-300 px-3 py-3">
            <p className="text-2xl font-black">⌛最大1分</p>
            <p className="text-sm md:text-base font-bold">
              早いほど有利
            </p>
          </div>

          <div className="rounded-2xl border-2 border-black bg-orange-300 px-3 py-3">
            <p className="text-2xl font-black">🏆早押し</p>
            <p className="text-sm md:text-base font-bold">
              ひらがなで回答
            </p>
          </div>
        </div>
      </div> */}

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
            onClick={() => setShowCodeInput(true)}
            className="w-full md:w-80 px-6 py-2 md:px-8 md:py-4 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white rounded-full cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
          >
            あいことばでマッチ
          </button>
          <p className="text-sm text-orange-800 mt-1">
            ※2人〜8人でプレイできます。
          </p>
        </div>
      </div>

      {showCodeInput && (
        <div className="mt-6 bg-white p-4 rounded-xl max-w-md mx-auto border-2 border-black shadow-xl">
          <p className="text-xl font-bold mb-2">
            参加人数を入力してください（2〜8人）
          </p>

          <input
            type="number"
            min={2}
            max={8}
            value={playerCount ?? ""}
            onChange={(e) => {
              const valStr = e.target.value;
              setPlayerCount(valStr === "" ? null : Number(valStr));
              setCodeError(null);
            }}
            onBlur={() => {
              if (playerCount === null) return;
              if (playerCount < 2) setPlayerCount(2);
              if (playerCount > 8) setPlayerCount(8);
            }}
            className="border px-2 py-1 text-lg w-full mb-4"
          />

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
            <p className="mt-2 text-red-600 font-bold">{codeError}</p>
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
                `/quiz-hirameki/code?code=${encodeURIComponent(
                  battleCode.trim()
                )}&count=${playerCount}`
              );
            }}
            className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white rounded font-bold border-2 border-black"
          >
            ゲーム開始
          </button>
        </div>
      )}

      <button
        onClick={handleDescriptionClick}
        className="mt-4 px-6 py-1 md:px-8 md:text-xl bg-white text-gray-800 rounded-full border-2 border-black hover:bg-gray-300 shadow-md transition-colors"
      >
        このゲームの説明を見る
      </button>

      <div
        className="overflow-hidden transition-all duration-500 ease-in-out mt-2 rounded-xl bg-white max-w-3xl mx-auto"
        style={{
          maxHeight: showDescription
            ? descriptionRef.current?.scrollHeight
            : 0,
        }}
      >
        <p
          ref={descriptionRef}
          className="text-gray-700 text-md md:text-lg text-center px-4 py-3"
        >
          「ひらめきクイズ」は、少しずつ出てくるヒントを見ながら、
          答えを早く当てるヒント早押しゲームです！💡
          <br />
          最初はかんたんなヒントからスタートし、
          10秒ごとに新しいヒントが追加されます。
          <br />
          文字数は「□□□□」のように表示されるので、
          ひらめいたら答えをひらがなで入力して送信！
          <br />
          最大1分のあいだに、誰が一番早く正解できるかを競います。
          <br />
          知識だけじゃなく、連想力・発想力・ひらめき力が勝負のカギ！✨
          <br />
          ※あいことばでのみマッチできます。
        </p>
      </div>
    </div>
  );
}
