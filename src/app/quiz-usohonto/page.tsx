"use client";

import { useState, useEffect, useRef } from "react";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizUsoHontoPage() {
  const router = useRouter();

  const [showDescription, setShowDescription] = useState(false);
  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  const allCharacters = [
    "/images/quiz_man.png",
    "/images/quiz_usohonto.png",
    "/images/quiz_woman.png",
  ];

  const mobileCharacters = ["/images/quiz_usohonto.png", "/images/quiz_woman.png"];

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
    <div className="container mx-auto px-4 py-8 text-center bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_45%,#e11d48_55%,#fb7185_100%)]">
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
            0 0 14px #fef08a
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        <span className="block md:hidden leading-tight">
          ウソ？
          <br />
          ホント？
          <br />
          ゲーム
        </span>
        <span className="hidden md:block">ウソ？ホント？ゲーム</span>
      </h1>

      <p className="text-md md:text-2xl font-semibold text-white mb-2 md:mb-4">
        ＜友達と遊べる心理ゲーム＞
      </p>

      <p className="text-md md:text-2xl font-semibold text-white mb-8">
        その話、信じていいの？話を聞いてウソかホントか見抜こう！
      </p>

      <div className="mx-auto mb-6 grid max-w-2xl grid-cols-2 overflow-hidden rounded-3xl border-4 border-black shadow-2xl">
        <div className="bg-blue-500/90 px-4 py-3 text-white">
          <p className="text-2xl md:text-3xl font-black">ホント</p>
          <p className="text-sm md:text-base font-bold">本当の話で勝負</p>
        </div>
        <div className="bg-rose-500/90 px-4 py-3 text-white">
          <p className="text-2xl md:text-3xl font-black">ウソ</p>
          <p className="text-sm md:text-base font-bold">だまして得点ゲット</p>
        </div>
      </div>

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
            className="w-full md:w-80 px-6 py-2 md:px-8 md:py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-rose-500 text-white rounded-full cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
          >
            あいことばでマッチ
          </button>
          <p className="text-sm text-white mt-1">
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
                `/quiz-usohonto/code?code=${encodeURIComponent(
                  battleCode.trim()
                )}&count=${playerCount}`
              );
            }}
            className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-rose-500 text-white rounded font-bold border-2 border-black"
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
          「ウソ？ホント？」は、出されたお題について話して、
          その話が本当かウソかを見抜くトーク心理ゲームです！🎭
          <br />
          話す人には、こっそり「本当の話をしてください」または
          「ウソの話をしてください」がランダムで表示されます。
          <br />
          話を聞いた人は、その話がホントかウソかを投票！
          見抜けた人は得点、だませた話し手にも得点が入ります。
          <br />
          本当なのに疑われる？ウソなのに信じられる？
          会話と推理で盛り上がろう！✨
          <br />
          ※あいことばでのみマッチできます。
        </p>
      </div>
    </div>
  );
}