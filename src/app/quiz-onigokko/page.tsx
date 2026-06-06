"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

const anton = Anton({ subsets: ["latin"], weight: "400" });

export default function QuizOnigokkoPage() {
  const router = useRouter();
  const { user } = useSupabaseUser();

  const [showDescription, setShowDescription] = useState(false);
  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  const [limitTime] = useState<number | null>(5);

  const allCharacters = [
    "/images/onigokko1.png",
    "/images/skin_chara1_ボード.png",
    "/images/onigokko2.png",
  ];

  const mobileCharacters = [
    "/images/onigokko1.png",
    "/images/skin_chara1_ボード.png",
  ];

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

  const handleRandomQuizStart = () => {
    router.push(`/quiz-onigokko/random?time=${limitTime}`);
  };

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [battleCode, setBattleCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState<number | null>(2);

  return (
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-red-400 via-yellow-100 to-yellow-300">
      <p className="mx-auto mb-3 inline-flex rounded-full border-2 border-red-700 bg-red-100 px-4 py-1 text-sm font-black text-red-700 backdrop-blur">
        👹鬼から逃げろ！
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
          クイズ<br />おにごっこ
        </span>
        <span className="hidden md:block">クイズおにごっこ</span>
      </h1>

      <p className="text-md md:text-2xl font-semibold text-red-900 mb-2 md:mb-4">
        ＜みんなで遊べるクイズゲーム＞
      </p>

      <p className="text-md md:text-2xl font-semibold text-red-900 mb-8">
        アイテムでパワーアップ！捕まると鬼が交代するドタバタクイズバトル！
      </p>

      <p className="mx-auto mb-8 max-w-3xl text-sm font-bold leading-relaxed text-red-900/80 md:text-lg">
        クイズに正解してスピードアップ・透明化・バリアを発動！鬼だった時間を短くして、優勝を目指そう！
      </p>

      <div className="flex justify-center gap-2 md:gap-4 mb-8">
        {characters.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`クイズおにごっこキャラ${index}`}
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
            className="w-full md:w-80 rounded-full border-2 border-red-900 bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 px-6 py-2 md:px-8 md:py-4 text-lg font-black text-white transition hover:scale-105 md:text-2xl shadow-md"
          >
            オンラインで対戦
          </button>
          <p className="text-sm text-red-900 mt-1">※2人〜4人でプレイできます。</p>
        </div>

        <div>
          <button
            onClick={() => setShowCodeInput(true)}
            className="w-full md:w-80 rounded-full border-2 border-red-800 bg-gradient-to-r from-yellow-100 via-yellow-300 to-orange-300 px-6 py-2 md:px-8 md:py-4 text-lg font-black text-orange-900 transition hover:scale-105 md:text-2xl shadow-md"
          >
            あいことばで対戦
          </button>
          <p className="text-sm text-red-900 mt-1">※2人〜4人でプレイできます。</p>
        </div>
      </div>

      {showCodeInput && (
        <div className="mt-6 bg-white p-4 rounded-xl max-w-md mx-auto border-2 border-red-700 shadow-lg">
          <p className="text-xl font-bold mb-2 text-red-900">
            参加人数を入力してください（2〜4人）
          </p>

          <input
            type="number"
            min={2}
            max={4}
            value={playerCount ?? ""}
            onChange={(e) => {
              const valStr = e.target.value;
              setPlayerCount(valStr === "" ? null : Number(valStr));
              setCodeError(null);
            }}
            onBlur={() => {
              if (playerCount === null) return;
              if (playerCount < 2) setPlayerCount(2);
              if (playerCount > 4) setPlayerCount(4);
            }}
            className="border-2 border-red-200 px-2 py-1 text-lg w-full mb-4 rounded"
          />

          <p className="text-xl font-bold mb-2 text-red-900">
            あいことばを入力してください
          </p>

          <input
            type="text"
            value={battleCode}
            onChange={(e) => {
              setBattleCode(e.target.value);
              setCodeError(null);
            }}
            className="border-2 border-red-200 px-2 py-1 text-lg w-full rounded"
          />

          {codeError && (
            <p className="mt-2 text-red-600 font-bold">{codeError}</p>
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
                `/quiz-onigokko/code?time=${limitTime}&code=${battleCode}&count=${playerCount}`
              );
            }}
            className="mt-5 w-full rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-red-700 px-5 py-3 text-lg font-black text-white transition hover:scale-105"
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
              group ml-0 mt-3 inline-flex items-center gap-2 rounded-full
              border-3 border-red-900 bg-gradient-to-r from-white via-red-50 to-rose-100
              px-7 py-3 text-base md:text-xl font-black text-red-800
              shadow-[0_5px_0_rgba(127,29,29,1)] transition
              hover:-translate-y-0.5 hover:scale-105
              active:translate-y-1 active:shadow-[0_2px_0_rgba(127,29,29,1)]
              md:ml-3 md:mt-4
            "
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-red-400 to-rose-600 text-white shadow">
              👕
            </span>
            <span>使用スタイルを変更</span>
          </button>
        </div>
      )}

      <button
        onClick={handleDescriptionClick}
        className="mt-4 px-6 py-1 md:px-8 md:text-xl bg-white text-red-800 rounded-full border-2 border-red-700 hover:bg-red-50 shadow-md transition-colors font-bold"
      >
        このゲームの説明を見る
      </button>

      <div
        className="overflow-hidden transition-all duration-500 ease-in-out mt-2 rounded-xl bg-white border border-red-100"
        style={{
          maxHeight: showDescription
            ? descriptionRef.current?.scrollHeight
            : 0,
        }}
      >
        <p
          ref={descriptionRef}
          className="text-red-900 text-md md:text-lg text-center px-4 py-3 font-bold leading-relaxed"
        >
          「クイズおにごっこ」は、ステージを走り回って鬼から逃げる対戦型クイズゲーム！👹<br />
          マップのいろんな場所に落ちている「？」アイテムを拾うと、クイズが出題されます。<br />
          クイズに正解すると、スピードアップ・透明化・バリアなどの効果が発動！<br />
          鬼に捕まると、捕まった人が次の鬼に交代します。<br />
          制限時間が終わったとき、鬼だった時間が一番短い人が優勝！<br />
          クイズとアイテムをうまく使って、鬼の時間をできるだけ短くしよう！⌛<br />
          知識と動きの両方がカギになる、ハラハラ鬼ごっこバトルです！🏃‍♂️💨
        </p>
      </div>

      <div className="mx-auto mt-5 max-w-3xl rounded-3xl border-3 border-red-900 bg-gradient-to-br from-red-500 via-white to-rose-300 p-4 md:p-5 shadow-[0_6px_0_rgba(127,29,29,1)]">
        <div className="text-center">
          <p className="text-xl md:text-3xl font-black text-red-900 drop-shadow">
            操作するキャラの見た目を変えよう！✨
          </p>

          <p className="mt-2 text-sm md:text-base font-bold leading-relaxed text-red-900/90">
            ひまスタイルガチャで、新しい見た目をゲット！
            <br />
            クイズおにごっこでもお気に入りのスタイルで走り回ろう！
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
          className="mt-4 inline-flex rounded-full border-3 border-red-900 bg-white px-7 py-3 text-base md:text-xl font-black text-red-800 shadow-[0_5px_0_rgba(127,29,29,1)] hover:scale-105 transition"
        >
          🎨 ひまスタイルガチャ
        </Link>
      </div>
    </div>
  );
}