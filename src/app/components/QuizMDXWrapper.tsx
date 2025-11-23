"use client";
import { useState } from "react";
import type { ReactNode } from "react";

interface QuizProps {
  quiz: {
    title: string;
    question: string;
    choices: string[];
    answer: number;
    hint: string;
  };
  children?: ReactNode;
}

export default function QuizMDXWrapper({ quiz, children }: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleSelect = (i: number) => {
    setSelected(i);
    setShowAnswer(true);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
      <p className="mb-4">{quiz.question}</p>

      {quiz.choices.map((choice, i) => {
        // 選択済みの場合のマーク
        let mark = "";
        if (selected !== null) {
          if (i === quiz.answer) mark = "〇";
          else if (i === selected && i !== quiz.answer) mark = "×";
        }

        return (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`flex justify-between items-center my-2 p-2 border rounded w-full text-left cursor-pointer hover:text-blue-700
              ${selected !== null
                ? i === quiz.answer
                  ? "border-green-500 bg-green-100"
                  : i === selected
                  ? "border-red-500 bg-red-100"
                  : ""
                : "border-gray-300 hover:bg-gray-100"}
            `}
          >
            <span>{choice}</span>
            {mark && <span className="ml-2 font-bold">{mark}</span>}
          </button>
        );
      })}

      <button
        className="mt-4 text-blue-500 underline cursor-pointer hover:text-blue-700"
        onClick={() => setShowHint(!showHint)}
      >
        {showHint ? "ヒントを隠す" : "ヒントを見る"}
      </button>

      {showHint && <p className="my-2 text-gray-700">{quiz.hint}</p>}

      {showAnswer && selected !== null && (
        <p
          className={`mt-4 text-3xl font-extrabold text-center ${
            selected === quiz.answer ? "text-green-600 animate-pulse" : "text-red-600"
          }`}
        >
          {selected === quiz.answer
            ? "正解！🎉"
            : `不正解…正解は ${quiz.choices[quiz.answer]} です`}
        </p>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
