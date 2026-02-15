"use client";

import { QuizData } from "@/lib/articles4";

interface Props {
  quiz: QuizData;
  userAnswer: number | null;
  setUserAnswer: (val: number) => void;
  onPick: (idx: number) => void;
}

const AB = ["A", "B"] as const;

export default function QuizQuestion4({ quiz, userAnswer, setUserAnswer, onPick }: Props) {
  const choices = (quiz.choices ?? []).slice(0, 2); // 念のため2つに制限

  return (
    <div className="my-3 text-center bg-white border border-black rounded-lg p-6 max-w-md mx-auto">
      <p className="text-xl md:text-2xl font-semibold mb-6 md:mb-8">
        {quiz.question}
      </p>

      <div className="grid grid-cols-1 gap-3">
        {choices.map((choice, idx) => {
          const isSelected = userAnswer === idx;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setUserAnswer(idx);   // 見た目の選択状態
                onPick(idx);          // その瞬間に送信
              }}
              className={`
                w-full
                flex items-center gap-3
                px-4 py-4
                rounded-xl border-2
                text-left
                transition
                ${isSelected ? "border-blue-600 bg-blue-50" : "border-gray-300 bg-white hover:bg-gray-50"}
              `}
            >
              {/* A / B バッジ */}
              <span
                className={`
                  inline-flex items-center justify-center
                  w-10 h-10
                  rounded-full
                  font-extrabold text-lg
                  ${isSelected ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}
                `}
              >
                {AB[idx]}
              </span>

              {/* 選択肢本文 */}
              <span className="text-lg md:text-2xl font-bold">
                {choice}
              </span>

              {/* 右端にチェック風 */}
              <span className="ml-auto text-xl">
                {isSelected ? "✅" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
