"use client";

import { useState } from "react";

interface HintAnswerProps {
  hint?: string;
  answer?: string;
}

export default function HintAnswer({ hint, answer }: HintAnswerProps) {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="my-4">
      {hint && (
        <div className="mb-2">
          <button
            onClick={() => setShowHint(!showHint)}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition"
          >
            ヒント
          </button>
          {showHint && <p className="mt-2 text-gray-700">{hint}</p>}
        </div>
      )}

      {answer && (
        <div>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition"
          >
            答え
          </button>
          {showAnswer && <p className="mt-2 text-gray-700">{answer}</p>}
        </div>
      )}
    </div>
  );
}
