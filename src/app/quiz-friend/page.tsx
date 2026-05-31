"use client";

import { useState, useEffect, useRef } from "react";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";

const anton = Anton({ subsets: ["latin"], weight: "400" });

type FriendMode = "friend" | "lover";
type FriendGenre = "daily" | "image" | "love" | "choice";

const modes: {
  key: FriendMode;
  label: string;
  description: string;
  questionCount: number;
}[] = [
  {
    key: "friend",
    label: "友達モード",
    description: "友達・家族・知り合いと気軽に遊べる",
    questionCount: 4,
  },
  {
    key: "lover",
    label: "恋人モード",
    description: "恋人同士でちょっと深めに診断",
    questionCount: 5,
  },
];

const genres: {
  key: FriendGenre;
  label: string;
  description: string;
  onlyLover?: boolean;
}[] = [
  {
    key: "daily",
    label: "日常編",
    description: "コンビニ・LINE・朝の弱さなど",
  },
  {
    key: "image",
    label: "イメージ編",
    description: "ゾンビ・無人島・メンタルなど",
  },
  {
    key: "love",
    label: "恋愛編",
    description: "嫉妬・甘える派・サプライズなど",
    onlyLover: true,
  },
  {
    key: "choice",
    label: "究極の2択編",
    description: "ラーメンvs寿司、朝型vs夜型など",
  },
];

export default function QuizFriendPage() {
  const router = useRouter();

  const [showDescription, setShowDescription] = useState(false);
  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  const [selectedMode, setSelectedMode] = useState<FriendMode>("friend");
  const [selectedGenre, setSelectedGenre] = useState<FriendGenre>("daily");

  const allCharacters = [
    "/images/quiz_man.png",
    "/images/quiz.png",
    "/images/quiz_woman.png",
  ];

  const mobileCharacters = ["/images/quiz.png", "/images/quiz_woman.png"];

  const [characters, setCharacters] = useState<string[]>([]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setCharacters(isMobile ? mobileCharacters : allCharacters);
  }, []);

  const [visibleCount, setVisibleCount] = useState(0);

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
  const [friendCode, setFriendCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const selectedModeData = modes.find((mode) => mode.key === selectedMode);
  const questionCount = selectedModeData?.questionCount ?? 4;

  const selectableGenres = genres.filter((genre) => {
    if (genre.onlyLover && selectedMode !== "lover") return false;
    return true;
  });

  useEffect(() => {
    if (selectedMode === "friend" && selectedGenre === "love") {
      setSelectedGenre("daily");
    }
  }, [selectedMode, selectedGenre]);

  const handleStart = () => {
    if (!friendCode.trim()) {
      setCodeError("あいことばを入力してください");
      return;
    }

    router.push(
      `/quiz-friend/code?code=${encodeURIComponent(
        friendCode.trim()
      )}&mode=${selectedMode}&genre=${selectedGenre}&count=2&questions=${questionCount}`
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 text-center min-h-screen bg-gradient-to-b from-sky-400 via-cyan-300 to-yellow-200">
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
          なかよし
          <br />
          診断
        </span>
        <span className="hidden md:block">なかよし診断</span>
      </h1>

      <p className="text-md md:text-2xl font-semibold text-white mb-2 md:mb-4 drop-shadow">
        ＜2人で遊べる診断ゲーム＞
      </p>
      <p className="text-md md:text-2xl font-semibold text-white mb-8 drop-shadow">
        意外と知らない！？2人の理解度をチェックしよう！
      </p>

      {/* <div className="flex justify-center gap-2 md:gap-4 mb-8">
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
      </div> */}

      <div className="max-w-4xl mx-auto bg-white/75 border-2 border-black rounded-3xl shadow-xl px-4 py-5 md:px-8 md:py-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-4">
          モードを選ぼう
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {modes.map((mode) => {
            const active = selectedMode === mode.key;

            return (
              <button
                key={mode.key}
                onClick={() => {
                  setSelectedMode(mode.key);
                  setCodeError(null);
                }}
                className={`
                  rounded-2xl border-4 px-4 py-3 text-left transition-all shadow-md px-4 py-3 text-left transition-all shadow-md
                  ${
                    active
                      ? mode.key === "friend"
                        ? "bg-gradient-to-br from-sky-200 via-cyan-100 to-yellow-100 border-sky-500 ring-4 ring-sky-300 scale-[1.03]"
                        : "bg-gradient-to-br from-pink-200 via-rose-100 to-orange-100 border-pink-500 ring-4 ring-pink-300 scale-[1.03]"
                      : "bg-white border-black opacity-50 hover:opacity-100 hover:scale-[1.02]"
                  }
                `}
              >
                <p className="text-xl md:text-2xl font-extrabold text-gray-900">
                  {mode.key === "friend" ? "🤝" : "💞"} {mode.label}
                </p>
                <p className="text-sm md:text-base font-bold text-gray-700 mt-1">
                  {mode.questionCount}問で診断
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-4">
          ジャンルを選ぼう
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {selectableGenres.map((genre) => {
            const active = selectedGenre === genre.key;

            return (
              <button
                key={genre.key}
                onClick={() => {
                  setSelectedGenre(genre.key);
                  setCodeError(null);
                }}
                className={`
                  rounded-2xl border-2 border-black px-4 py-3 text-left transition-all shadow-md
                  ${
                    active
                      ? "bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 border-amber-500 ring-4 ring-amber-300 scale-[1.03]"
                      : "bg-white border-black hover:scale-[1.02]"
                  }
                `}
              >
                <p className="text-lg md:text-xl font-extrabold text-gray-900">
                  {genre.key === "daily" && "🏪 "}
                  {genre.key === "image" && "🧟 "}
                  {genre.key === "love" && "💘 "}
                  {genre.key === "choice" && "⚖️ "}
                  {genre.label}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {genre.description}
                </p>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowCodeInput((prev) => !prev)}
          className="w-full md:w-80 px-6 py-3 md:px-8 md:py-4 bg-sky-400 text-white rounded-full hover:scale-105 cursor-pointer text-lg md:text-2xl font-extrabold shadow-lg transition-transform border-2 border-black"
        >
          あいことばでマッチ
        </button>

        <p className="text-sm text-gray-700 mt-2">
          ※2人のみでプレイできます。モード・ジャンルは同じものを選択してください。
        </p>

        {showCodeInput && (
          <div className="mt-6 bg-white p-4 rounded-xl max-w-md mx-auto border-2 border-black shadow-md">
            <p className="text-xl font-bold mb-2">
              あいことばを入力してください
            </p>

            <input
              type="text"
              value={friendCode}
              onChange={(e) => {
                setFriendCode(e.target.value);
                setCodeError(null);
              }}
              className="border-2 border-gray-300 rounded-lg px-3 py-2 text-lg w-full"
            />

            {codeError && (
              <p className="mt-2 text-red-600 font-bold">{codeError}</p>
            )}

            <button
              onClick={handleStart}
              className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-sky-500 via-cyan-400 to-yellow-300 text-white rounded-xl font-extrabold border-2 border-black shadow-md hover:scale-105 transition-transform"
            >
              マッチ開始
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleDescriptionClick}
        className="mt-4 px-6 py-1 md:px-8 md:text-xl bg-white text-gray-800 rounded-full border-2 border-black hover:bg-gray-100 shadow-md transition-colors"
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
          className="text-gray-700 text-md md:text-lg text-center px-4 py-3 leading-relaxed"
        >
          「なかよし診断」は、友達や恋人と2人で遊べる理解度テストです。
          <br />
          まずはモードとジャンルを選び、お互いに質問に対する回答を答えます。
          <br />
          1問につき「本当の回答」と「違う回答」を用意して、相手は2択で予想します。🎯
          <br />
          最後に正答率から理解度を発表！🎉
          <br />
          当たっても外れても盛り上がる、なかよし診断ゲームです。✨
        </p>
      </div>
    </div>
  );
}