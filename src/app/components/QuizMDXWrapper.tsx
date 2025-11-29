"use client";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

interface QuizProps {
  quiz: {
    title: string;
    question: string;
    choices: string[];
    answer: number;
    hint: string;
    answerExplanation?: string;
    trivia?: string;
  };
  children?: ReactNode;
}

export default function QuizMDXWrapper({ quiz, children }: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setSelected(null);
    setShowHint(false);
    setShowAnswer(false);
  }, [quiz]);

  const handleSelect = (i: number) => {
    setSelected(i);
    setShowAnswer(true);
  };

  return (
    <div className="p-4 max-w-xl mx-auto bg-white rounded-xl">
      <p className="mb-4 text-xl md:text-2xl">{quiz.question}</p>

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
            <span className="text-lg md:text-xl">{choice}</span>
            {mark && <span className="ml-2 font-bold">{mark}</span>}
          </button>
        );
      })}

      <button
        className="mt-4 text-xl md:text-2xl text-blue-500 underline cursor-pointer hover:text-blue-700"
        onClick={() => setShowHint(!showHint)}
      >
        {showHint ? "ヒントを隠す" : "ヒントを見る"}
      </button>

      {showHint && <p className="my-2 text-xl md:text-2xl text-gray-700">{quiz.hint}</p>}

      {showAnswer && selected !== null && (
        <div className="mt-4">
          <p
            className={`mt-4 text-3xl md:text-4xl font-extrabold text-center whitespace-pre-line ${
              selected === quiz.answer ? "text-green-600 animate-pulse" : "text-red-600"
            }`}
          >
            {selected === quiz.answer
              ? "◎正解！🎉"
              : `ざんねん！\n正解は" ${quiz.choices[quiz.answer]} "でした！`}
          </p>

          {quiz.answerExplanation && (
            <div className="mt-10 text-center">
              <p className="text-xl md:text-2xl font-bold text-blue-600">解説📖</p>
              <p className="mt-2 text-lg md:text-xl text-gray-700">{quiz.answerExplanation}</p>
            </div>
          )}

          {quiz.trivia && (
            <div className="mt-10 text-center">
              <p className="text-xl md:text-2xl font-bold text-yellow-600">知って得する豆知識💡</p>
              <p className="mt-2 text-lg md:text-xl text-gray-700">{quiz.trivia}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
