"use client";

import { useMemo, useState } from "react";

type SegmentKey = "a" | "b" | "c" | "d" | "e" | "f" | "g";
type HeadType = "none" | "start" | "end" | "both";
type OperatorSegmentKey = "h" | "v" | "top" | "bottom";

type SegmentShape = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const SEGMENTS: Record<SegmentKey, SegmentShape> = {
  a: { x: 20, y: 10, width: 60, height: 10 },
  b: { x: 75, y: 18, width: 10, height: 55 },
  c: { x: 75, y: 78, width: 10, height: 55 },
  d: { x: 20, y: 135, width: 60, height: 10 },
  e: { x: 15, y: 78, width: 10, height: 55 },
  f: { x: 15, y: 18, width: 10, height: 55 },
  g: { x: 20, y: 72, width: 60, height: 10 },
};

const DIGIT_SEGMENTS: Record<string, SegmentKey[]> = {
  "0": ["a", "b", "c", "d", "e", "f"],
  "1": ["b", "c"],
  "2": ["a", "b", "g", "e", "d"],
  "3": ["a", "b", "c", "d", "g"],
  "4": ["f", "g", "b", "c"],
  "5": ["a", "f", "g", "c", "d"],
  "6": ["a", "f", "g", "e", "c", "d"],
  "7": ["a", "b", "c"],
  "8": ["a", "b", "c", "d", "e", "f", "g"],
  "9": ["a", "b", "c", "d", "f", "g"],
};

function MatchStick({
  x,
  y,
  width,
  height,
  head = "both",
  highlight = false,
  onClick,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  head?: HeadType;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const isHorizontal = width > height;
  const headSize = isHorizontal ? height : width;

//   const bodyColor = highlight ? "#ef4444" : "#C68642";
//   const headColor = highlight ? "#ef4444" : "#B22222";
  const bodyColor = highlight ? "#ef4444" : "#fbc559";
  const headColor = highlight ? "#ef4444" : "#f43e3e";

  if (isHorizontal) {
    return (
      <g
        onClick={onClick}
        style={{ cursor: "pointer" }}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={height / 2}
          fill={bodyColor}
        />

        {!highlight && (head === "start" || head === "both") && (
          <rect
            x={x}
            y={y}
            width={headSize}
            height={height}
            rx={height / 2}
            fill={headColor}
          />
        )}

        {!highlight && (head === "end" || head === "both") && (
          <rect
            x={x + width - headSize}
            y={y}
            width={headSize}
            height={height}
            rx={height / 2}
            fill={headColor}
          />
        )}

        <rect
          x={x - 6}
          y={y - 6}
          width={width + 12}
          height={height + 12}
          rx={(height + 12) / 2}
          fill="transparent"
        />
      </g>
    );
  }

  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={width / 2}
        fill={bodyColor}
      />

      {!highlight && (head === "start" || head === "both") && (
        <rect
          x={x}
          y={y}
          width={width}
          height={headSize}
          rx={width / 2}
          fill={headColor}
        />
      )}

      {!highlight && (head === "end" || head === "both") && (
        <rect
          x={x}
          y={y + height - headSize}
          width={width}
          height={headSize}
          rx={width / 2}
          fill={headColor}
        />
      )}

      <rect
        x={x - 6}
        y={y - 6}
        width={width + 12}
        height={height + 12}
        rx={(width + 12) / 2}
        fill="transparent"
      />
    </g>
  );
}

function Digit({
  value,
  x,
  y,
  tokenIndex,
  selectedSticks,
  toggleStick,
}: {
  value: string;
  x: number;
  y: number;
  tokenIndex: number;
  selectedSticks: Set<string>;
  toggleStick: (id: string) => void;
}) {
  const activeSegments = DIGIT_SEGMENTS[value] ?? [];

  return (
    <g transform={`translate(${x}, ${y})`}>
      {activeSegments.map((key) => {
        const seg = SEGMENTS[key];
        const stickId = `${tokenIndex}:${key}`;

        return (
          <MatchStick
            key={stickId}
            x={seg.x}
            y={seg.y}
            width={seg.width}
            height={seg.height}
            head="start"
            highlight={selectedSticks.has(stickId)}
            onClick={() => toggleStick(stickId)}
          />
        );
      })}
    </g>
  );
}

function PlusSign({
  x,
  y,
  tokenIndex,
  selectedSticks,
  toggleStick,
}: {
  x: number;
  y: number;
  tokenIndex: number;
  selectedSticks: Set<string>;
  toggleStick: (id: string) => void;
}) {
  const hId = `${tokenIndex}:h`;
  const vId = `${tokenIndex}:v`;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <MatchStick
        x={10}
        y={35}
        width={60}
        height={10}
        head="start"
        highlight={selectedSticks.has(hId)}
        onClick={() => toggleStick(hId)}
      />
      <MatchStick
        x={35}
        y={10}
        width={10}
        height={60}
        head="start"
        highlight={selectedSticks.has(vId)}
        onClick={() => toggleStick(vId)}
      />
    </g>
  );
}

function MinusSign({
  x,
  y,
  tokenIndex,
  selectedSticks,
  toggleStick,
}: {
  x: number;
  y: number;
  tokenIndex: number;
  selectedSticks: Set<string>;
  toggleStick: (id: string) => void;
}) {
  const hId = `${tokenIndex}:h`;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <MatchStick
        x={10}
        y={35}
        width={60}
        height={10}
        head="start"
        highlight={selectedSticks.has(hId)}
        onClick={() => toggleStick(hId)}
      />
    </g>
  );
}

function EqualSign({
  x,
  y,
  tokenIndex,
  selectedSticks,
  toggleStick,
}: {
  x: number;
  y: number;
  tokenIndex: number;
  selectedSticks: Set<string>;
  toggleStick: (id: string) => void;
}) {
  const topId = `${tokenIndex}:top`;
  const bottomId = `${tokenIndex}:bottom`;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <MatchStick
        x={10}
        y={20}
        width={60}
        height={10}
        head="start"
        highlight={selectedSticks.has(topId)}
        onClick={() => toggleStick(topId)}
      />
      <MatchStick
        x={10}
        y={50}
        width={60}
        height={10}
        head="start"
        highlight={selectedSticks.has(bottomId)}
        onClick={() => toggleStick(bottomId)}
      />
    </g>
  );
}

function renderToken({
  token,
  x,
  y,
  tokenIndex,
  selectedSticks,
  toggleStick,
}: {
  token: string;
  x: number;
  y: number;
  tokenIndex: number;
  selectedSticks: Set<string>;
  toggleStick: (id: string) => void;
}) {
  if (/^\d$/.test(token)) {
    return (
      <Digit
        key={`${token}-${tokenIndex}-${x}`}
        value={token}
        x={x}
        y={y}
        tokenIndex={tokenIndex}
        selectedSticks={selectedSticks}
        toggleStick={toggleStick}
      />
    );
  }

  if (token === "+") {
    return (
      <PlusSign
        key={`${token}-${tokenIndex}-${x}`}
        x={x}
        y={y + 20}
        tokenIndex={tokenIndex}
        selectedSticks={selectedSticks}
        toggleStick={toggleStick}
      />
    );
  }

  if (token === "-") {
    return (
      <MinusSign
        key={`${token}-${tokenIndex}-${x}`}
        x={x}
        y={y + 20}
        tokenIndex={tokenIndex}
        selectedSticks={selectedSticks}
        toggleStick={toggleStick}
      />
    );
  }

  if (token === "=") {
    return (
      <EqualSign
        key={`${token}-${tokenIndex}-${x}`}
        x={x}
        y={y + 20}
        tokenIndex={tokenIndex}
        selectedSticks={selectedSticks}
        toggleStick={toggleStick}
      />
    );
  }

  return null;
}

export default function MatchstickExpression({
  expression,
}: {
  expression: string;
}) {
  const [selectedStickIds, setSelectedStickIds] = useState<Set<string>>(new Set());

  const tokens = useMemo(() => {
    return expression.replace(/\s+/g, "").split("");
  }, [expression]);

  const toggleStick = (id: string) => {
    setSelectedStickIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const startX = 20;
  const startY = 15;
  const tokenGap = 110;

  const svgWidth = Math.max(160, tokens.length * tokenGap + 20);
  const svgHeight = 180;

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`マッチ棒式 ${expression}`}
      className="w-full h-auto"
    >
      <rect
        x="0"
        y="0"
        width={svgWidth}
        height={svgHeight}
        // rx="20"
        // fill="#FFF8ED"
        fill="#ffffff"
      />

      {tokens.map((token, index) =>
        renderToken({
          token,
          x: startX + index * tokenGap,
          y: startY,
          tokenIndex: index,
          selectedSticks: selectedStickIds,
          toggleStick,
        })
      )}
    </svg>
  );
}