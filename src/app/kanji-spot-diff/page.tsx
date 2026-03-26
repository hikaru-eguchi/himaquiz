"use client";

import { useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import KanjiSpotDiffImage from "../components/KanjiSpotDiffImage";

export default function KanjiSpotDiffPage() {
  const [baseChar, setBaseChar] = useState("間");
  const [diffChar, setDiffChar] = useState("問");
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(8);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000000));
  const [showAnswer, setShowAnswer] = useState(false);

  const captureRef = useRef<HTMLDivElement | null>(null);

  const sanitizedBase = useMemo(() => (baseChar || "間").slice(0, 1), [baseChar]);
  const sanitizedDiff = useMemo(() => (diffChar || "問").slice(0, 1), [diffChar]);

  const regenerate = () => {
    setSeed(Math.floor(Math.random() * 1000000));
    setShowAnswer(false);
  };

  const handleDownload = async () => {
    if (!captureRef.current) return;

    try {
      const dataUrl = await htmlToImage.toPng(captureRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const suffix = showAnswer ? "_答え" : "";

      const link = document.createElement("a");
      link.download = `漢字間違い探し_${sanitizedBase}-${sanitizedDiff}${suffix}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("画像保存に失敗しました", error);
      alert("画像保存に失敗しました");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-100 p-6">
      <div className="mx-auto max-w-5xl rounded-[28px] border-2 border-amber-300 bg-white p-6 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-extrabold text-gray-800 md:text-3xl">
          漢字間違い探し画像メーカー
        </h1>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              たくさん並べる漢字
            </label>
            <input
              type="text"
              value={baseChar}
              onChange={(e) => setBaseChar(e.target.value.slice(0, 1))}
              placeholder="例: 間"
              className="w-full rounded-xl border-2 border-amber-300 px-4 py-3 text-lg outline-none"
              maxLength={1}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              1つだけ混ぜる漢字
            </label>
            <input
              type="text"
              value={diffChar}
              onChange={(e) => setDiffChar(e.target.value.slice(0, 1))}
              placeholder="例: 問"
              className="w-full rounded-xl border-2 border-amber-300 px-4 py-3 text-lg outline-none"
              maxLength={1}
            />
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              行数
            </label>
            <input
              type="number"
              min={3}
              max={12}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value) || 8)}
              className="w-full rounded-xl border-2 border-amber-300 px-4 py-3 text-lg outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              列数
            </label>
            <input
              type="number"
              min={3}
              max={12}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value) || 8)}
              className="w-full rounded-xl border-2 border-amber-300 px-4 py-3 text-lg outline-none"
            />
          </div>
        </div>

        <div className="mb-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={regenerate}
            className="rounded-full border-2 border-black bg-yellow-300 px-5 py-2 font-bold text-black shadow transition hover:scale-105"
          >
            ランダム配置を変える
          </button>

          <button
            onClick={() => setShowAnswer((prev) => !prev)}
            className="rounded-full border-2 border-black bg-red-200 px-5 py-2 font-bold text-black shadow transition hover:scale-105"
          >
            {showAnswer ? "答えを隠す" : "答えを表示"}
          </button>

          <button
            onClick={handleDownload}
            className="rounded-full border-2 border-black bg-orange-300 px-5 py-2 font-bold text-black shadow transition hover:scale-105"
          >
            画像として保存
          </button>
        </div>

        <div className="mb-4 text-center text-sm text-gray-600">
          1つ目の漢字を大量に並べ、2つ目の漢字をランダムな1マスだけに入れます。
          答えを表示すると、その1文字だけ赤くなります。
        </div>

        <div className="flex justify-center">
          <div ref={captureRef} className="rounded-[28px] bg-white p-4">
            <KanjiSpotDiffImage
              baseChar={sanitizedBase}
              diffChar={sanitizedDiff}
              rows={rows}
              cols={cols}
              seed={seed}
              showAnswer={showAnswer}
            />
          </div>
        </div>
      </div>
    </main>
  );
}