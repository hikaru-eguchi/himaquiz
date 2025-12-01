"use client";

import { QuizData } from "@/lib/articles";

interface Props {
  quiz: QuizData;
  userAnswer: number | null;
  setUserAnswer: (val: number) => void;
}

export default function QuizQuestion({ quiz, userAnswer, setUserAnswer }: Props) {
  return (
    <div className="my-3 text-center bg-white border border-black rounded-lg p-6 max-w-md mx-auto">
      <p className="text-xl md:text-2xl font-semibold mb-6 md:mb-8">{quiz.question}</p>
      <div className="flex flex-col gap-2">
        {quiz.choices.map((choice, idx) => (
          <label key={idx} className="flex items-center gap-2 cursor-pointer w-fit mx-auto">
            <input
              type="radio"
              name="choice"
              checked={userAnswer === idx}
              onChange={() => setUserAnswer(idx)}
              className="accent-blue-500"
            />
            <span className="text-lg md:text-2xl">{choice}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
