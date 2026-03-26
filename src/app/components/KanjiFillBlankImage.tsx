"use client";

type Direction = "up" | "down" | "left" | "right";

type Props = {
  topChar: string;
  rightChar: string;
  bottomChar: string;
  leftChar: string;
  topArrow: Direction;
  rightArrow: Direction;
  bottomArrow: Direction;
  leftArrow: Direction;
  answerChar: string;
  showAnswer: boolean;
};

function ArrowIcon({ direction }: { direction: Direction }) {
  const map: Record<Direction, string> = {
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
  };

  return (
    <span
      style={{
        fontSize: 48,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      {map[direction]}
    </span>
  );
}

function CharBox({
  char,
  size = 76,
  fontSize = 56,
}: {
  char: string;
  size?: number;
  fontSize?: number;
}) {
  return (
    <div
      className="flex items-center justify-center bg-white"
      style={{
        width: size,
        height: size,
        fontSize,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      {char}
    </div>
  );
}

function CenterBox({
  answerChar,
  showAnswer,
}: {
  answerChar: string;
  showAnswer: boolean;
}) {
  return (
    <div
      className="relative flex items-center justify-center border-[3px] border-black bg-white"
      style={{
        width: 96,
        height: 96,
      }}
    >
      <span
        className="absolute"
        style={{
          fontSize: 48,
          fontWeight: 900,
          lineHeight: 1,
          color: showAnswer ? "#dc2626" : "#000000",
        }}
      >
        {showAnswer ? answerChar : "？"}
      </span>
    </div>
  );
}

function TopArea({
  char,
  direction,
}: {
  char: string;
  direction: Direction;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <CharBox char={char} />
      <ArrowIcon direction={direction} />
    </div>
  );
}

function BottomArea({
  char,
  direction,
}: {
  char: string;
  direction: Direction;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ArrowIcon direction={direction} />
      <CharBox char={char} />
    </div>
  );
}

function LeftArea({
  char,
  direction,
}: {
  char: string;
  direction: Direction;
}) {
  return (
    <div className="flex items-center gap-2">
      <CharBox char={char} />
      <ArrowIcon direction={direction} />
    </div>
  );
}

function RightArea({
  char,
  direction,
}: {
  char: string;
  direction: Direction;
}) {
  return (
    <div className="flex items-center gap-2">
      <ArrowIcon direction={direction} />
      <CharBox char={char} />
    </div>
  );
}

export default function KanjiFillBlankImage({
  topChar,
  rightChar,
  bottomChar,
  leftChar,
  topArrow,
  rightArrow,
  bottomArrow,
  leftArrow,
  answerChar,
  showAnswer,
}: Props) {
  const safeTop = (topChar || "学").slice(0, 1);
  const safeRight = (rightChar || "校").slice(0, 1);
  const safeBottom = (bottomChar || "生").slice(0, 1);
  const safeLeft = (leftChar || "先").slice(0, 1);
  const safeAnswer = (answerChar || "入").slice(0, 1);

  return (
    <div className="inline-block bg-white p-8">
      <div className="flex flex-col items-center gap-6">
        <TopArea char={safeTop} direction={topArrow} />

        <div className="flex items-center gap-6">
          <LeftArea char={safeLeft} direction={leftArrow} />

          <CenterBox answerChar={safeAnswer} showAnswer={showAnswer} />

          <RightArea char={safeRight} direction={rightArrow} />
        </div>

        <BottomArea char={safeBottom} direction={bottomArrow} />
      </div>
    </div>
  );
}