"use client";

import { useState, useEffect } from "react";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedSoloGames from "@/app/components/RecommendedSoloGames";
import { diagnosisGames, type DiagnosisGame } from "@/lib/diagnosis_psychologicaltest";
import { getTopDiagnosisResult } from "@/lib/diagnosis_psychologicaltest/results";

const QuizResult = ({
  diagnosisTitle,
  resultTitle,
  resultDescription,
  resultFeatures,
  onShareX,
  onRetry,
}: {
  diagnosisTitle: string;
  resultTitle: string;
  resultDescription: string;
  resultFeatures: string[];
  onShareX: () => void;
  onRetry: () => void;
}) => {
  const [showScore, setShowScore] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowScore(true), 500));
    timers.push(setTimeout(() => setShowText(true), 1000));
    timers.push(setTimeout(() => setShowRank(true), 1800));
    timers.push(setTimeout(() => setShowButton(true), 1800));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative max-w-5xl mx-auto">
      {showScore && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 shadow-md text-rose-600 font-bold text-sm md:text-base border border-pink-100">
            <span>💗</span>
            <span>{diagnosisTitle} の結果</span>
          </div>
        </div>
      )}

      {showText && (
        <p className="text-lg md:text-2xl text-white font-bold mb-4 text-center drop-shadow">
          あなたのタイプは…
        </p>
      )}

      {showRank && (
        <div className="bg-white/95 rounded-[2rem] shadow-2xl px-5 py-8 md:px-10 md:py-12 border-2 border-black">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
            <div className="hidden md:block shrink-0">
              <img
                src="/images/quiz_personality.png"
                alt="心理テストキャラ"
                className="w-32 drop-shadow-xl"
              />
            </div>

            <div className="flex-1 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-rose-600 font-bold text-sm md:text-base mb-4">
                <span>✨</span>
                <span>心理テスト結果</span>
              </div>

              <p className="text-4xl md:text-6xl font-extrabold text-rose-600 drop-shadow-lg leading-tight">
                {resultTitle}
              </p>

              <p className="mt-5 text-base md:text-2xl text-rose-950 leading-relaxed max-w-2xl mx-auto font-semibold">
                {resultDescription}
              </p>

              {resultFeatures.length > 0 && (
                <div className="mt-8 text-left max-w-xl mx-auto">
                  <p className="text-lg md:text-2xl font-extrabold text-pink-600 text-center mb-4">
                    このタイプの特徴
                  </p>

                  <div className="grid gap-3 text-center">
                    {resultFeatures.map((feature) => (
                      <div
                        key={feature}
                        className="rounded-2xl bg-pink-50 border border-pink-100 px-4 py-3 text-rose-900 text-base md:text-lg font-bold shadow-sm"
                      >
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-center gap-4">
              <img
                src="/images/quiz_personality.png"
                alt="心理テストキャラ"
                className="w-20 md:hidden drop-shadow-lg"
              />
              <img
                src="/images/quiz_woman_personality.png"
                alt="心理テストキャラ"
                className="w-20 md:w-32 drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      )}

      {showButton && (
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-6">
          <button
            className="px-6 py-3 bg-black text-white border border-black rounded-xl font-bold text-xl hover:opacity-80 cursor-pointer shadow-md"
            onClick={onShareX}
          >
            Xで結果をシェア
          </button>

          <button
            className="px-6 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white rounded-xl font-bold text-xl hover:scale-105 transition cursor-pointer shadow-md border-2 border-black"
            onClick={onRetry}
          >
            べつの心理テストをする
          </button>
        </div>
      )}

      {showButton && (
        <div className="mt-6">
          <RecommendedSoloGames
            title="次はどれで遊ぶ？🎮"
            count={4}
            excludeHref="/quiz-psychologicaltest"
          />
        </div>
      )}
    </div>
  );
};

export default function QuizModePage() {
  const [selectedDiagnosis, setSelectedDiagnosis] =
    useState<DiagnosisGame | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(
    null
  );
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [resultTitle, setResultTitle] = useState("");
  const [resultDescription, setResultDescription] = useState("");
  const [resultFeatures, setResultFeatures] = useState<string[]>([]);

  const questions = selectedDiagnosis?.questions ?? [];
  const currentQuestion = questions[currentIndex];

  const startDiagnosis = (diagnosis: DiagnosisGame) => {
    setSelectedDiagnosis(diagnosis);
    setCurrentIndex(0);
    setSelectedChoiceIndex(null);
    setSelectedAnswers([]);
    setFinished(false);
    setResultTitle("");
    setResultDescription("");
    setResultFeatures([]);
  };

  const resetGame = () => {
    setSelectedDiagnosis(null);
    setCurrentIndex(0);
    setSelectedChoiceIndex(null);
    setSelectedAnswers([]);
    setFinished(false);
    setResultTitle("");
    setResultDescription("");
    setResultFeatures([]);
  };

  const handleNext = () => {
    if (selectedChoiceIndex === null || !selectedDiagnosis) return;

    const nextAnswers = [...selectedAnswers, selectedChoiceIndex];
    setSelectedAnswers(nextAnswers);

    if (currentIndex + 1 >= questions.length) {
      const { result } = getTopDiagnosisResult(
        selectedDiagnosis,
        nextAnswers
      );

      setResultTitle(result.title);
      setResultDescription(result.description);
      setResultFeatures(result.features ?? []);
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedChoiceIndex(null);
    }
  };

  const handleShareX = () => {
    const diagnosisName = selectedDiagnosis?.title ?? "心理テスト";
    const text = [
      `【ひまQ｜${diagnosisName}】`,
      `私のタイプ：${resultTitle}`,
      resultDescription,
      "",
      "👇ひまQで心理テストしてみる",
      "#ひまQ #心理テスト #性格診断",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() });
  };

  if (!selectedDiagnosis) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-b from-pink-300 via-rose-200 to-fuchsia-200">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/30 rounded-full blur-xl" />
        <div className="absolute top-20 right-10 w-56 h-56 bg-pink-400/20 rounded-full blur-2xl" />
        <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-white/25 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-fuchsia-300/25 rounded-full blur-xl" />

        <div className="relative container mx-auto px-4 py-10 md:py-14 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg leading-tight">
            今日はどの心理テストをする？💗
          </h1>

          <p className="mt-4 text-base md:text-xl text-white max-w-2xl mx-auto leading-relaxed font-semibold drop-shadow">
            気になるテーマを選ぶだけ！
            <br className="hidden md:block" />
            直感で答えて、あなたの性格・恋愛傾向・隠れた一面をチェックしよう✨
          </p>

          <div className="flex justify-center items-end gap-3 md:gap-8 mt-8 mb-10">
            <div className="px-4 py-2 rounded-2xl bg-white/90 shadow-lg text-sm md:text-base font-bold text-rose-600 border border-pink-100">
              深く考えず、直感で選んでね！
            </div>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
            {diagnosisGames.map((game, index) => {
              const emojiList = [
                "💗",
                "🧠",
                "💘",
                "✨",
                "🌙",
                "💎",
                "🌸",
                "🫶",
                "😳",
                "⭐",
                "🎀",
                "🔮",
                "💭",
                "🧸",
                "💬",
                "🌷",
                "🍓",
                "🪽",
              ];

              const emoji = emojiList[index % emojiList.length];
              const isPopular = index === 0;

              return (
                <button
                  key={game.slug}
                  onClick={() => startDiagnosis(game)}
                  className="group relative overflow-hidden rounded-3xl bg-white/95 shadow-xl p-6 md:p-7 text-left transition duration-300 hover:-translate-y-1 hover:shadow-2xl border-2 border-black cursor-pointer"
                >
                  {isPopular && (
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-rose-500 text-white text-xs md:text-sm font-bold shadow">
                      人気
                    </div>
                  )}

                  <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-pink-100 group-hover:bg-pink-200 transition" />

                  <div className="relative flex items-start gap-4">
                    <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-300 via-rose-300 to-fuchsia-300 flex items-center justify-center text-3xl shadow-md border border-white">
                      {emoji}
                    </div>

                    <div className="flex-1">
                      <p className="text-2xl md:text-3xl font-extrabold text-rose-600 group-hover:text-pink-600 transition">
                        {game.title}
                      </p>

                      <p className="mt-2 text-rose-950 text-sm md:text-base leading-relaxed font-medium">
                        {game.description}
                      </p>

                      <div className="mt-5 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0 md:justify-between">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 text-rose-600 text-sm font-bold border border-pink-100">
                          直感で答えるだけ
                        </span>

                        <span className="text-lg md:text-xl font-bold text-pink-500 group-hover:translate-x-1 transition">
                          テストする →
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-8 text-white text-sm md:text-base font-semibold drop-shadow">
            ※ 結果はお楽しみ診断です。友達と見せ合って楽しんでね！
          </p>
        </div>
      </div>
    );
  }

  if (!currentQuestion && !finished) {
    return (
      <p className="p-8 text-center text-rose-700 font-bold">
        心理テストを読み込み中です...
      </p>
    );
  }

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-pink-300 via-rose-200 to-fuchsia-200">
      {!finished ? (
        <>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 text-rose-600 font-bold text-lg md:text-2xl shadow-md mb-6 border border-pink-100">
            {/* 質問 {currentIndex + 1} / {questions.length} */}
            心理テストの質問
          </div>

          <div className="max-w-3xl mx-auto bg-white/95 rounded-3xl shadow-2xl p-6 md:p-10 border-2 border-black">
            <p className="text-2xl md:text-4xl font-extrabold text-rose-950 mb-8 leading-relaxed">
              {questions[currentIndex].question}
            </p>

            <div className="flex flex-col gap-4">
              {questions[currentIndex].choices.map((choice, index) => {
                const isSelected = selectedChoiceIndex === index;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedChoiceIndex(index)}
                    className={`w-full px-5 py-4 rounded-2xl text-lg md:text-2xl font-bold border-2 transition cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white border-black shadow-md scale-[1.02]"
                        : "bg-white text-rose-900 border-pink-200 hover:bg-pink-50"
                    }`}
                  >
                    {choice.text}
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <button
                className="px-6 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white text-lg md:text-xl font-bold rounded-full hover:scale-105 transition cursor-pointer disabled:opacity-50 border-2 border-black shadow-lg"
                onClick={handleNext}
                disabled={selectedChoiceIndex === null}
              >
                {currentIndex + 1 === questions.length
                  ? "診断結果を見る💗"
                  : "次へ"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <QuizResult
          diagnosisTitle={selectedDiagnosis.title}
          resultTitle={resultTitle}
          resultDescription={resultDescription}
          resultFeatures={resultFeatures}
          onShareX={handleShareX}
          onRetry={resetGame}
        />
      )}
    </div>
  );
}