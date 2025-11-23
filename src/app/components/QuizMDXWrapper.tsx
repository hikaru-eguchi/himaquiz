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
  children?: ReactNode; // MDX本文も表示したい場合
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

      {quiz.choices.map((choice, i) => (
        <button
          key={i}
          onClick={() => handleSelect(i)}
          className={`block my-2 p-2 border rounded w-full text-left
            ${selected !== null
              ? i === quiz.answer
                ? "border-green-500 bg-green-100"
                : i === selected
                ? "border-red-500 bg-red-100"
                : ""
              : "border-gray-300 hover:bg-gray-100"}
          `}
        >
          {choice}
        </button>
      ))}

      <button
        className="mt-4 text-blue-500 underline"
        onClick={() => setShowHint(!showHint)}
      >
        {showHint ? "ヒントを隠す" : "ヒントを見る"}
      </button>

      {showHint && <p className="my-2 text-gray-700">{quiz.hint}</p>}

      {showAnswer && (
        <p className="mt-4 font-bold">
          {selected === quiz.answer
            ? "正解！🎉"
            : `不正解…正解は ${quiz.choices[quiz.answer]} です`}
        </p>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
