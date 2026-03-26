"use client";

import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import KanjiFillBlankImage from "../components/KanjiFillBlankImage";

type Direction = "up" | "down" | "left" | "right";

const directionOptions: { value: Direction; label: string }[] = [
  { value: "up", label: "↑ 上" },
  { value: "down", label: "↓ 下" },
  { value: "left", label: "← 左" },
  { value: "right", label: "→ 右" },
];

export default function KanjiFillBlankPage() {
  const [topChar, setTopChar] = useState("学");
  const [rightChar, setRightChar] = useState("校");
  const [bottomChar, setBottomChar] = useState("生");
  const [leftChar, setLeftChar] = useState("先");

  const [topArrow, setTopArrow] = useState<Direction>("down");
  const [rightArrow, setRightArrow] = useState<Direction>("right");
  const [bottomArrow, setBottomArrow] = useState<Direction>("down");
  const [leftArrow, setLeftArrow] = useState<Direction>("right");

  const [answerChar, setAnswerChar] = useState("入");
  const [showAnswer, setShowAnswer] = useState(false);

  const captureRef = useRef<HTMLDivElement | null>(null);

  const handleDownload = async () => {
    if (!captureRef.current) return;

    try {
      const safeTop = (topChar || "学").slice(0, 1);
      const safeRight = (rightChar || "校").slice(0, 1);
      const safeBottom = (bottomChar || "生").slice(0, 1);
      const safeLeft = (leftChar || "先").slice(0, 1);
      const safeAnswer = (answerChar || "答").slice(0, 1);

      const dataUrl = await htmlToImage.toPng(captureRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      const suffix = showAnswer ? "_答え" : "";

      link.download = `漢字穴埋め_${safeTop}${safeRight}${safeBottom}${safeLeft}（${safeAnswer}）${suffix}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("画像保存に失敗しました", error);
      alert("画像保存に失敗しました");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 p-6">
      <div className="mx-auto max-w-5xl rounded-[28px] border-2 border-amber-300 bg-white p-6 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-extrabold text-gray-800 md:text-3xl">
          漢字穴埋め画像メーカー
        </h1>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              上の漢字
            </label>
            <input
              type="text"
              value={topChar}
              onChange={(e) => setTopChar(e.target.value.slice(0, 1))}
              maxLength={1}
              className="w-full rounded-xl border-2 border-amber-300 px-4 py-3 text-lg outline-none"
              placeholder="例: 学"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              上の矢印方向
            </label>
            <select
              value={topArrow}
              onChange={(e) => setTopArrow(e.target.value as Direction)}
              className="w-full rounded-xl border-2 border-amber-300 bg-white px-4 py-3 text-lg outline-none"
            >
              {directionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              右の漢字
            </label>
            <input
              type="text"
              value={rightChar}
              onChange={(e) => setRightChar(e.target.value.slice(0, 1))}
              maxLength={1}
              className="w-full rounded-xl border-2 border-amber-300 px-4 py-3 text-lg outline-none"
              placeholder="例: 校"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              右の矢印方向
            </label>
            <select
              value={rightArrow}
              onChange={(e) => setRightArrow(e.target.value as Direction)}
              className="w-full rounded-xl border-2 border-amber-300 bg-white px-4 py-3 text-lg outline-none"
            >
              {directionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              下の漢字
            </label>
            <input
              type="text"
              value={bottomChar}
              onChange={(e) => setBottomChar(e.target.value.slice(0, 1))}
              maxLength={1}
              className="w-full rounded-xl border-2 border-amber-300 px-4 py-3 text-lg outline-none"
              placeholder="例: 生"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              下の矢印方向
            </label>
            <select
              value={bottomArrow}
              onChange={(e) => setBottomArrow(e.target.value as Direction)}
              className="w-full rounded-xl border-2 border-amber-300 bg-white px-4 py-3 text-lg outline-none"
            >
              {directionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              左の漢字
            </label>
            <input
              type="text"
              value={leftChar}
              onChange={(e) => setLeftChar(e.target.value.slice(0, 1))}
              maxLength={1}
              className="w-full rounded-xl border-2 border-amber-300 px-4 py-3 text-lg outline-none"
              placeholder="例: 先"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              左の矢印方向
            </label>
            <select
              value={leftArrow}
              onChange={(e) => setLeftArrow(e.target.value as Direction)}
              className="w-full rounded-xl border-2 border-amber-300 bg-white px-4 py-3 text-lg outline-none"
            >
              {directionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              答えの漢字
            </label>
            <input
              type="text"
              value={answerChar}
              onChange={(e) => setAnswerChar(e.target.value.slice(0, 1))}
              maxLength={1}
              className="w-full rounded-xl border-2 border-red-300 px-4 py-3 text-lg outline-none"
              placeholder="例: 入"
            />
          </div>
        </div>

        <div className="mb-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setShowAnswer((prev) => !prev)}
            className="rounded-full border-2 border-black bg-red-200 px-5 py-2 font-bold text-black shadow transition hover:scale-105"
          >
            {showAnswer ? "？に戻す" : "答えを表示"}
          </button>

          <button
            onClick={handleDownload}
            className="rounded-full border-2 border-black bg-orange-300 px-5 py-2 font-bold text-black shadow transition hover:scale-105"
          >
            画像として保存
          </button>
        </div>

        <div className="mb-4 text-center text-sm text-gray-600">
          中央の枠は固定です。答えを表示ボタンを押すと、？が赤い答えの漢字に切り替わります。
        </div>

        <div className="flex justify-center">
          <div ref={captureRef} className="rounded-[28px] bg-white p-4">
            <KanjiFillBlankImage
              topChar={topChar}
              rightChar={rightChar}
              bottomChar={bottomChar}
              leftChar={leftChar}
              topArrow={topArrow}
              rightArrow={rightArrow}
              bottomArrow={bottomArrow}
              leftArrow={leftArrow}
              answerChar={answerChar}
              showAnswer={showAnswer}
            />
          </div>
        </div>
      </div>
    </main>
  );
}