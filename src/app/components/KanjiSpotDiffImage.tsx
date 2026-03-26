"use client";

type Props = {
  baseChar: string;
  diffChar: string;
  rows?: number;
  cols?: number;
  seed?: number;
  showAnswer?: boolean;
};

function getDiffIndex({
  rows,
  cols,
  seed,
}: {
  rows: number;
  cols: number;
  seed: number;
}) {
  const total = rows * cols;
  const safeSeed = Number.isFinite(seed) ? seed : 0;
  return Math.abs(safeSeed) % total;
}

function createGrid({
  baseChar,
  diffChar,
  rows,
  cols,
  seed,
}: {
  baseChar: string;
  diffChar: string;
  rows: number;
  cols: number;
  seed: number;
}) {
  const total = rows * cols;
  const diffIndex = getDiffIndex({ rows, cols, seed });

  return Array.from({ length: total }, (_, index) => ({
    char: index === diffIndex ? diffChar : baseChar,
    isDiff: index === diffIndex,
  }));
}

export default function KanjiSpotDiffImage({
  baseChar,
  diffChar,
  rows = 8,
  cols = 8,
  seed = 0,
  showAnswer = false,
}: Props) {
  const safeBase = (baseChar || "漢").slice(0, 1);
  const safeDiff = (diffChar || "間").slice(0, 1);

  const cells = createGrid({
    baseChar: safeBase,
    diffChar: safeDiff,
    rows,
    cols,
    seed,
  });

  return (
    <div
      className="inline-block bg-white p-6"
      style={{ width: "fit-content" }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {cells.map((cell, index) => (
          <div
            key={index}
            className="flex items-center justify-center"
            style={{
              width: 50,
              height: 50,
              fontSize: 36,
              fontWeight: 800,
              lineHeight: 1,
              color: showAnswer && cell.isDiff ? "#dc2626" : "#000000",
            }}
          >
            {cell.char}
          </div>
        ))}
      </div>
    </div>
  );
}