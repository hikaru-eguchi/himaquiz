"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type FriendMode = "friend" | "lover";
type FriendGenre = "daily" | "image" | "love" | "choice";

const modes: {
  key: FriendMode;
  label: string;
  questionCount: number;
  emoji: string;
}[] = [
  {
    key: "friend",
    label: "友達モード",
    questionCount: 4,
    emoji: "🤝",
  },
  {
    key: "lover",
    label: "恋人モード",
    questionCount: 5,
    emoji: "💞",
  },
];

const genres: {
  key: FriendGenre;
  label: string;
  onlyLover?: boolean;
}[] = [
  {
    key: "daily",
    label: "日常編",
  },
  {
    key: "image",
    label: "イメージ編",
  },
  {
    key: "love",
    label: "恋愛編",
    onlyLover: true,
  },
  {
    key: "choice",
    label: "究極の2択編",
  },
];

export default function QuizFriendRematchSelectPage() {
  return (
    <Suspense fallback={<div className="bg-white" />}>
      <QuizFriendRematchSelectContent />
    </Suspense>
  );
}

function QuizFriendRematchSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get("code") || "";

  const [selectedMode, setSelectedMode] = useState<FriendMode>("friend");
  const [selectedGenre, setSelectedGenre] = useState<FriendGenre>("daily");

  const selectableGenres = genres.filter((genre) => {
    if (genre.onlyLover && selectedMode !== "lover") return false;
    return true;
  });

  const selectedModeData = modes.find((m) => m.key === selectedMode);
  const questionCount = selectedModeData?.questionCount ?? 4;

  const handleStart = () => {
    router.push(
      `/quiz-friend/code?code=${encodeURIComponent(
        code
      )}&mode=${selectedMode}&genre=${selectedGenre}&count=2&questions=${questionCount}`
    );
  };

  return (
    <div
      className={`
        px-4 py-8 text-center
        ${
          selectedMode === "lover"
            ? "bg-gradient-to-b from-pink-400 via-rose-200 to-yellow-100"
            : "bg-gradient-to-b from-sky-400 via-cyan-300 to-yellow-200"
        }
      `}
    >
      <div className="mx-auto max-w-3xl rounded-3xl border-4 border-black bg-white/80 p-5 shadow-xl">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900">
          次のモードを選ぼう！
        </h1>

        <p className="mt-3 text-lg md:text-xl font-bold text-gray-700">
          同じあいことばでそのまま遊べます
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {modes.map((mode) => {
            const active = selectedMode === mode.key;

            return (
              <button
                key={mode.key}
                onClick={() => {
                  setSelectedMode(mode.key);

                  if (mode.key === "friend" && selectedGenre === "love") {
                    setSelectedGenre("daily");
                  }
                }}
                className={`
                  rounded-2xl border-4 px-4 py-4 text-left transition-all shadow-md
                  ${
                    active
                      ? mode.key === "friend"
                        ? "bg-gradient-to-br from-sky-200 via-cyan-100 to-yellow-100 border-sky-500 ring-4 ring-sky-300 scale-[1.03]"
                        : "bg-gradient-to-br from-pink-200 via-rose-100 to-orange-100 border-pink-500 ring-4 ring-pink-300 scale-[1.03]"
                      : "bg-white border-black opacity-70 hover:opacity-100 hover:scale-[1.02]"
                  }
                `}
              >
                <p className="text-2xl font-extrabold text-gray-900">
                  {mode.emoji} {mode.label}
                </p>

                <p className="mt-2 text-sm font-bold text-gray-700">
                  {mode.questionCount}問
                </p>
              </button>
            );
          })}
        </div>

        <h2 className="mt-8 text-2xl md:text-3xl font-extrabold text-gray-800">
          ジャンルを選ぼう
        </h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {selectableGenres.map((genre) => {
            const active = selectedGenre === genre.key;

            return (
              <button
                key={genre.key}
                onClick={() => setSelectedGenre(genre.key)}
                className={`
                  rounded-2xl border-2 border-black px-4 py-3 text-left transition-all shadow-md
                  ${
                    active
                      ? selectedMode === "lover"
                        ? "bg-gradient-to-br from-pink-100 via-rose-50 to-orange-50 border-pink-400 ring-4 ring-pink-200 scale-[1.03]"
                        : "bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 border-amber-500 ring-4 ring-amber-300 scale-[1.03]"
                      : "bg-white hover:scale-[1.02]"
                  }
                `}
              >
                <p className="text-xl font-extrabold text-gray-900">
                  {genre.key === "daily" && "🏪 "}
                  {genre.key === "image" && "🧟 "}
                  {genre.key === "love" && "💘 "}
                  {genre.key === "choice" && "⚖️ "}
                  {genre.label}
                </p>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleStart}
          className={`
            mt-8 w-full rounded-full border-4 border-black px-6 py-4 text-2xl font-extrabold text-gray-800 shadow-lg transition-all hover:scale-105
            ${
              selectedMode === "lover"
                ? "bg-gradient-to-r from-pink-300 via-rose-100 to-yellow-100"
                : "bg-gradient-to-r from-sky-200 via-cyan-100 to-yellow-100"
            }
          `}
        >
          このモードで遊ぶ！
        </button>
      </div>
    </div>
  );
}