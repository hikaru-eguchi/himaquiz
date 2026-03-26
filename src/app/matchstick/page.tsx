"use client";

import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import MatchstickExpression from "../components/MatchstickExpression";

function sanitizeExpression(value: string) {
  return value.replace(/\s+/g, "");
}
function extractNumbers(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export default function MatchstickPage() {
  const [expression, setExpression] = useState("6+4=4");
  const [answerExpression, setAnswerExpression] = useState("8-4=4");

  const questionRef = useRef<HTMLDivElement | null>(null);
  const answerRef = useRef<HTMLDivElement | null>(null);

  const downloadFromRef = async ({
    targetRef,
    mode,
  }: {
    targetRef: React.RefObject<HTMLDivElement | null>;
    mode: "問題" | "答え";
  }) => {
    if (!targetRef.current) return;

    try {
      // const question = sanitizeExpression(expression || "6+4=4");
      // const answer = sanitizeExpression(answerExpression || "8-4=4");
      const question = extractNumbers(expression || "6+4=4");
      const answer = extractNumbers(answerExpression || "8-4=4");

      const dataUrl = await htmlToImage.toPng(targetRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `マッチ棒クイズ_問題${question}_答え${answer}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("画像保存に失敗しました", error);
      alert("画像保存に失敗しました");
    }
  };

  const handleDownloadQuestion = async () => {
    await downloadFromRef({
      targetRef: questionRef,
      mode: "問題",
    });
  };

  const handleDownloadAnswer = async () => {
    await downloadFromRef({
      targetRef: answerRef,
      mode: "答え",
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 p-6">
      <div className="mx-auto max-w-4xl rounded-3xl border-2 border-amber-200 bg-white p-6 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800 md:text-3xl">
          マッチ棒画像メーカー
        </h1>

        <div className="mb-6 flex flex-col items-center gap-4">
          <div className="w-full max-w-md">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              問題の式
            </label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="例: 6+4=4"
              className="w-full rounded-xl border-2 border-amber-300 px-4 py-3 text-lg outline-none"
            />
          </div>

          <div className="w-full max-w-md">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              答えの式
            </label>
            <input
              type="text"
              value={answerExpression}
              onChange={(e) => setAnswerExpression(e.target.value)}
              placeholder="例: 8-4=4"
              className="w-full rounded-xl border-2 border-red-300 px-4 py-3 text-lg outline-none"
            />
          </div>

          <p className="text-sm text-gray-500">使える文字: 0〜9、+、-、=</p>
          <p className="text-sm text-red-500">
            棒をクリックすると赤く切り替わります
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={handleDownloadQuestion}
              className="rounded-xl border-2 border-black bg-yellow-300 px-5 py-2 font-bold text-black shadow transition hover:scale-105"
            >
              問題画像を保存
            </button>

            <button
              onClick={handleDownloadAnswer}
              className="rounded-xl border-2 border-black bg-orange-300 px-5 py-2 font-bold text-black shadow transition hover:scale-105"
            >
              答え画像を保存
            </button>
          </div>
        </div>

        <div className="mb-8">
          <p className="mb-3 text-center text-sm font-bold text-gray-700">
            問題プレビュー
          </p>
          <div className="flex justify-center">
            <div
              ref={questionRef}
              className="w-full max-w-[900px] rounded-2xl bg-white p-4"
            >
              <MatchstickExpression expression={expression} />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 text-center text-sm font-bold text-gray-700">
            答えプレビュー
          </p>
          <div className="flex justify-center">
            <div
              ref={answerRef}
              className="w-full max-w-[900px] rounded-2xl bg-white p-4"
            >
              <MatchstickExpression expression={answerExpression} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}