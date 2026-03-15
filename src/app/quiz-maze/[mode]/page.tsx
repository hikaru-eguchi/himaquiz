"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { mazeQuizData, type MazeQuiz } from "@/lib/mazeQuizData";

type Cell = "W" | "." | "S" | "G" | "K" | "Q" | "U" | "D" | "O" | "B";

type StageId = "stage1" | "stage2" | "stage3";

type StageConfig = {
  id: StageId;
  number: number;
  title: string;
  subtitle: string;
  difficulty: string;
  map: string[];
  quizzes: MazeQuiz[];
  switchDoors?: Array<{
    switchPos: [number, number];
    doors: [number, number][];
  }>;
};

type Position = {
  x: number;
  y: number;
};

type PlayerDirection = "down" | "up" | "left" | "right";

type QuizModalState = {
  open: boolean;
  quiz: MazeQuiz | null;
  posKey: string | null;
};

type ClearModalState = {
  open: boolean;
  title: string;
  text: string;
};

type QuizResultModalState = {
  open: boolean;
  isCorrect: boolean;
  title: string;
  text: string;
};

type NeedKeyModalState = {
  open: boolean;
  title: string;
  text: string;
};

// const CELL_SIZE = 56;
const VIEWPORT_CELLS = 7;
// const VIEWPORT_SIZE = CELL_SIZE * VIEWPORT_CELLS;

const STAGES: StageConfig[] = [
  {
    id: "stage1",
    number: 1,
    title: "はじまりの迷路",
    subtitle: "クイズゲートを突破して、カギを取ってゴールを目指せ！",
    difficulty: "かんたん",
    map: [
      "WWWWWWWWWWWWW",
      "WS....W.....W",
      "WWW.W.W.WWW.W",
      "W...W.W...W.W",
      "W.WWW.W.W.W.W",
      "W.W...W.W.W.W",
      "W.W.WWW.W.W.W",
      "W.W.WQ..W.W.W",
      "WWW.W.W.WWW.W",
      "W...W.W.WK..W",
      "W.WWW.W.WWWWW",
      "W.....W....GW",
      "WWWWWWWWWWWWW",
    ],
    quizzes: mazeQuizData.stage1,
  },
  {
    id: "stage2",
    number: 2,
    title: "ひらけ！スイッチ迷路",
    subtitle: "クイズゲートを越えて、スイッチで扉を開けよう！",
    difficulty: "ふつう",
    map: [
      "WWWWWWWWWWWWWWWWW",
      "WS..W....W......W",
      "W.W.W.WWWW.WWWW.W",
      "W.W...WW...WWWW.W",
      "W.WWW.WW.W.WWWW.W",
      "W...W....W.W....W",
      "WWW.W.WWWW.W.WWWW",
      "W...W.W....W....W",
      "W.WWW.W.WWWWWWW.W",
      "W.W...W.......W.W",
      "W.W.WWWWWWWWWWW.W",
      "W.W.W.Q.KW...WW.W",
      "W.W.W.WWWW.W.WW.W",
      "W.W...WU.Q.W....W",
      "W.WWWWWWWWWWWWWWW",
      "W.....D........GW",
      "WWWWWWWWWWWWWWWWW",
    ],
    quizzes: mazeQuizData.stage2,
    switchDoors: [
      {
        switchPos: [7, 13],
        doors: [[6, 15]],
      },
    ],
  },
  {
    id: "stage3",
    number: 3,
    title: "おしこみブロック迷路",
    subtitle: "ブロックを動かして道をひらき、カギを取ってクリア！",
    difficulty: "ややむず",
    map: [
      "WWWWWWWWWWWWWWWWWWWWWWW",
      "WS....W......W.....B.WW",
      "W.WWW.W.WWWWWW.W...B.GW",
      "W.W.W...W....W.W...B.WW",
      "W.W.WWW.W.WW.W.WWWWWW.W",
      "W...W...W.W..W......Q.W",
      "WWW.W.WWW.W.WWWWWWWWW.W",
      "W...W.W...W......WWWW.W",
      "W.WWW.W.WWWWWWWW.WWWW.W",
      "W.W...W....WWW...W...BW",
      "W.W.WWWWWW.Q.W.WWW.WW.W",
      "W.W.W....W.W.W.....WW.W",
      "WWW.W.WW.W.W.WWWWWWWW.W",
      "W...W.WW....B......WW.W",
      "W.WWW.WWWWWW.W.WWW.WW.W",
      "W.W...WWWWWWWW.WWW.WW.W",
      "W.W.W........W.WWW.WW.W",
      "W.W.WWWWWWWW.W...W....W",
      "W.W.......WW.WWWWWWWWWW",
      "W...WWWWW..W..........W",
      "WWWWW...WW.WWWWWWWWWWQW",
      "WK........B...........W",
      "WWWWWWWWWWWWWWWWWWWWWWW",
      ],
    quizzes: mazeQuizData.stage3,
  },
];

function keyOf(x: number, y: number) {
  return `${x},${y}`;
}

function cloneMap(map: Cell[][]) {
  return map.map((row) => [...row]);
}

function parseMap(rawMap: string[]) {
  const map = rawMap.map((row) => row.split("") as Cell[]);
  let start: Position = { x: 0, y: 0 };
  const quizPositions: Position[] = [];

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const cell = map[y][x];
      if (cell === "S") {
        start = { x, y };
      }
      if (cell === "Q") {
        quizPositions.push({ x, y });
      }
    }
  }

  return {
    map,
    start,
    quizPositions,
  };
}

function getCellClass(cell: Cell) {
  switch (cell) {
    case "W":
      return "border border-stone-600 bg-[url('/images/block1.png')] bg-cover bg-center bg-no-repeat";
    case "G":
      return "bg-transparent";
    case "K":
      return "bg-transparent";
    case "Q":
      return "bg-transparent";
    case "U":
      return "bg-transparent";
    case "D":
      return "bg-transparent";
    case "O":
      return "bg-gradient-to-br from-cyan-200 via-sky-200 to-blue-200 border border-cyan-400";
    case "B":
      return "bg-transparent";
    case "S":
    case ".":
    default:
      return "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-100";
  }
}

function getCellImageSrc(cell: Cell) {
  switch (cell) {
    case "G":
      return "/images/goal.png";
    case "K":
      return "/images/key.png";
    case "Q":
      return "/images/quizgate.png";
    case "U":
      return "/images/switch.png";
    case "D":
      return "/images/gate2.png";
    case "B":
      return "/images/block2.png";
    default:
      return null;
  }
}

export default function QuizMazePage() {
  const [selectedStageId, setSelectedStageId] = useState<StageId | null>(null);
  const [stageMap, setStageMap] = useState<Cell[][]>([]);
  const [player, setPlayer] = useState<Position>({ x: 0, y: 0 });
  const [playerDirection, setPlayerDirection] = useState<PlayerDirection>("down");
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const [hasKey, setHasKey] = useState(false);
  const [statusText, setStatusText] = useState("ステージを選んでスタート！");
  const [quizModal, setQuizModal] = useState<QuizModalState>({
    open: false,
    quiz: null,
    posKey: null,
  });
  const [quizAnswerIndex, setQuizAnswerIndex] = useState<number | null>(null);
  const [clearModal, setClearModal] = useState<ClearModalState>({
    open: false,
    title: "",
    text: "",
  });
  const [quizResultModal, setQuizResultModal] = useState<QuizResultModalState>({
    open: false,
    isCorrect: true,
    title: "",
    text: "",
  });
  const [needKeyModal, setNeedKeyModal] = useState<NeedKeyModalState>({
    open: false,
    title: "",
    text: "",
  });
  const [clearedStageIds, setClearedStageIds] = useState<StageId[]>([]);
  const [solvedQuizKeys, setSolvedQuizKeys] = useState<Record<string, boolean>>({});
  const [quizLookup, setQuizLookup] = useState<Record<string, MazeQuiz>>({});

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  const CELL_SIZE = isMobile ? 48 : 75;
  const VIEWPORT_SIZE = CELL_SIZE * VIEWPORT_CELLS;

  const selectedStage = useMemo(
    () => STAGES.find((stage) => stage.id === selectedStageId) ?? null,
    [selectedStageId]
  );

  const loadStage = useCallback((stageId: StageId) => {
    const stage = STAGES.find((item) => item.id === stageId);
    if (!stage) return;

    const { map, start, quizPositions } = parseMap(stage.map);

    const nextQuizLookup: Record<string, MazeQuiz> = {};
    quizPositions.forEach((pos, index) => {
      const quiz = stage.quizzes[index];
      if (quiz) {
        nextQuizLookup[keyOf(pos.x, pos.y)] = quiz;
      }
    });

    setPlayerDirection("down");
    setSelectedStageId(stageId);
    setStageMap(cloneMap(map));
    setPlayer(start);
    setStartPos(start);
    setHasKey(false);
    setSolvedQuizKeys({});
    setQuizLookup(nextQuizLookup);
    setQuizModal({
      open: false,
      quiz: null,
      posKey: null,
    });
    setQuizAnswerIndex(null);
    setClearModal({
      open: false,
      title: "",
      text: "",
    });
    setQuizResultModal({
      open: false,
      isCorrect: true,
      title: "",
      text: "",
    });
    setNeedKeyModal({
      open: false,
      title: "",
      text: "",
    });
    setStatusText(`ステージ${stage.number} スタート！ カギを見つけてゴールへ！`);
  }, []);

  const backToStageSelect = useCallback(() => {
    setSelectedStageId(null);
    setStageMap([]);
    setPlayer({ x: 0, y: 0 });
    setHasKey(false);
    setSolvedQuizKeys({});
    setQuizLookup({});
    setQuizModal({
      open: false,
      quiz: null,
      posKey: null,
    });
    setQuizAnswerIndex(null);
    setClearModal({
      open: false,
      title: "",
      text: "",
    });
    setQuizResultModal({
      open: false,
      isCorrect: true,
      title: "",
      text: "",
    });
    setStatusText("ステージを選んでスタート！");
  }, []);

  useEffect(() => {
    if (!statusText) return;
    const timer = setTimeout(() => {
      setStatusText((prev) => (prev === statusText ? "" : prev));
    }, 2000);

    return () => clearTimeout(timer);
  }, [statusText]);

  const canWalk = useCallback((cell?: Cell) => {
    if (!cell) return false;
    return cell !== "W" && cell !== "D" && cell !== "B";
  }, []);

  const canPushBlockTo = useCallback((cell?: Cell) => {
    if (!cell) return false;
    return cell === "." || cell === "S" || cell === "O";
  }, []);

  const handleLanding = useCallback(
    (x: number, y: number, nextMap: Cell[][]) => {
      const cell = nextMap[y]?.[x];
      if (!cell) return;

      if (cell === "K") {
        nextMap[y][x] = ".";
        setStageMap(cloneMap(nextMap));
        setHasKey(true);
        setStatusText("カギをゲット！ ゴールに向かおう！");
        return;
      }

      if (cell === "U" && selectedStage?.switchDoors?.length) {
        const updated = cloneMap(nextMap);

        selectedStage.switchDoors.forEach((rule) => {
          const [sx, sy] = rule.switchPos;
          if (sx === x && sy === y) {
            rule.doors.forEach(([dx, dy]) => {
              if (updated[dy]?.[dx] === "D") {
                updated[dy][dx] = "O";
              }
            });
          }
        });

        updated[y][x] = ".";
        setStageMap(updated);
        setStatusText("スイッチON！ どこかの扉が開いた！");
        return;
      }

      if (cell === "Q") {
        const posKey = keyOf(x, y);
        const quiz = quizLookup[posKey];
        if (quiz && !solvedQuizKeys[posKey]) {
          setQuizAnswerIndex(null);
          setQuizModal({
            open: true,
            quiz,
            posKey,
          });
          setStatusText("クイズゲート！ 正解すれば進める！");
        }
        return;
      }

      if (cell === "G") {
        if (!hasKey) {
          setStatusText("カギがない！ 先にカギを見つけよう！");
          setNeedKeyModal({
            open: true,
            title: "まだ出られない！",
            text: "カギがないとゴールできないよ！先にカギを見つけよう！",
          });
          return;
        }

        setClearModal({
          open: true,
          title: `ステージ${selectedStage?.number ?? ""} クリア！`,
          text: `ステージ${selectedStage?.number ?? ""} をクリアした！`,
        });

        if (selectedStageId && !clearedStageIds.includes(selectedStageId)) {
          setClearedStageIds((prev) => [...prev, selectedStageId]);
        }
      }
    },
    [clearedStageIds, hasKey, quizLookup, selectedStage, selectedStageId, solvedQuizKeys]
  );

  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (!selectedStageId) return;
      if (quizModal.open) return;
      if (clearModal.open) return;
      if (quizResultModal.open) return;
      if (needKeyModal.open) return;
      if (dx === 1) {
        setPlayerDirection("right");
      } else if (dx === -1) {
        setPlayerDirection("left");
      } else if (dy === -1) {
        setPlayerDirection("up");
      } else if (dy === 1) {
        setPlayerDirection("down");
      }

      const currentMap = cloneMap(stageMap);
      const nextX = player.x + dx;
      const nextY = player.y + dy;

      const targetCell = currentMap[nextY]?.[nextX];
      if (!targetCell) return;

      if (targetCell === "B") {
        const pushX = nextX + dx;
        const pushY = nextY + dy;
        const pushToCell = currentMap[pushY]?.[pushX];

        if (!canPushBlockTo(pushToCell)) {
          setStatusText("ブロックはそこへ動かせない！");
          return;
        }

        currentMap[pushY][pushX] = "B";
        currentMap[nextY][nextX] = ".";
        setStageMap(currentMap);
        setPlayer({ x: nextX, y: nextY });
        setStatusText("ブロックを押した！");
        handleLanding(nextX, nextY, currentMap);
        return;
      }

      if (!canWalk(targetCell)) {
        return;
      }

      setPlayer({ x: nextX, y: nextY });
      setStageMap(currentMap);
      handleLanding(nextX, nextY, currentMap);
    },
    [canPushBlockTo, canWalk, clearModal.open, handleLanding, needKeyModal.open, player.x, player.y, quizModal.open, quizResultModal.open, selectedStageId, stageMap]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedStageId) return;

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        movePlayer(0, -1);
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        movePlayer(0, 1);
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        movePlayer(-1, 0);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        movePlayer(1, 0);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [movePlayer, selectedStageId]);

  const handleQuizConfirm = () => {
    if (!quizModal.quiz || quizAnswerIndex === null || !quizModal.posKey || !selectedStageId) return;

    const isCorrect = quizAnswerIndex === quizModal.quiz.answerIndex;

    if (isCorrect) {
      const updatedMap = cloneMap(stageMap);
      const [x, y] = quizModal.posKey.split(",").map(Number);

      if (updatedMap[y]?.[x] === "Q") {
        updatedMap[y][x] = ".";
      }

      setStageMap(updatedMap);
      setSolvedQuizKeys((prev) => ({
        ...prev,
        [quizModal.posKey!]: true,
      }));

      setQuizModal({
        open: false,
        quiz: null,
        posKey: null,
      });
      setQuizAnswerIndex(null);

      setQuizResultModal({
        open: true,
        isCorrect: true,
        title: "正解！✨",
        text: "ここを通れるようになった！先に進もう！",
      });

      setStatusText("正解！ クイズゲートが開いた！");
    } else {
      setQuizModal({
        open: false,
        quiz: null,
        posKey: null,
      });
      setQuizAnswerIndex(null);

      setQuizResultModal({
        open: true,
        isCorrect: false,
        title: "残念…！不正解！",
        text: "スタート地点に戻るよ。もう一回挑戦しよう！",
      });

      setStatusText("不正解… スタートに戻る！");
    }
  };

  // const handleCloseQuizResultModal = () => {
  //   const wasCorrect = quizResultModal.isCorrect;

  //   setQuizResultModal({
  //     open: false,
  //     isCorrect: true,
  //     title: "",
  //     text: "",
  //   });

  //   if (!wasCorrect && selectedStageId) {
  //     loadStage(selectedStageId);
  //   }
  // };

  const handleCloseQuizResultModal = () => {
    const wasCorrect = quizResultModal.isCorrect;

    setQuizResultModal({
      open: false,
      isCorrect: true,
      title: "",
      text: "",
    });

    if (!wasCorrect) {
      setPlayer(startPos);
      setPlayerDirection("down");
      setStatusText("スタート地点に戻った！もう一回挑戦しよう！");
    }
  };

  const playerImageSrc = useMemo(() => {
    switch (playerDirection) {
      case "up":
        return "/images/boukenka_up.png";
      case "left":
        return "/images/boukenka_left.png";
      case "right":
        return "/images/boukenka_right.png";
      case "down":
      default:
        return "/images/boukenka_down.png";
    }
  }, [playerDirection]);

  const translateX = VIEWPORT_SIZE / 2 - (player.x + 0.5) * CELL_SIZE;
  const translateY = VIEWPORT_SIZE / 2 - (player.y + 0.5) * CELL_SIZE;

  if (!selectedStage) {
    return (
      <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fbdb5e,_#fc8b2e_45%,_#81361d_100%)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-8 w-28 h-28 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute top-32 right-10 w-40 h-40 rounded-full bg-yellow-200/10 blur-3xl" />
          <div className="absolute bottom-16 left-1/4 w-52 h-52 rounded-full bg-orange-200/10 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 border border-amber-200 text-amber-800 font-bold shadow-md">
              <span>🗺️</span>
              <span>ひまQ 迷路ゲーム</span>
            </div>

            <h1
              className="mt-5 text-4xl md:text-6xl font-extrabold text-white leading-tight"
              style={{
                textShadow: `
                  2px 2px 0 #000,
                  -2px 2px 0 #000,
                  2px -2px 0 #000,
                  -2px -2px 0 #000,
                  0 0 14px rgba(255,220,120,0.5)
                `,
              }}
            >
              クイズ迷路に挑戦しよう！
            </h1>

            <p className="mt-4 text-white/95 text-base md:text-xl max-w-3xl mx-auto leading-relaxed">
              クイズゲートを突破して、
              <span className="font-extrabold text-yellow-100"> カギ </span>
              を取ってゴールを目指せ！
            </p>

            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/85 px-4 py-3 shadow-xl border border-amber-200 text-sm md:text-base">
              <span className="font-bold text-amber-800">ルール：</span>
              <span className="text-gray-700">クイズを間違えるとスタートに戻るよ！</span>
              <span className="text-gray-700">🗝️ カギがないとクリアできないよ！</span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {STAGES.map((stage) => {
              const cleared = clearedStageIds.includes(stage.id);

              return (
                <button
                  key={stage.id}
                  onClick={() => loadStage(stage.id)}
                  className="group relative overflow-hidden rounded-[2rem] bg-white p-6 text-left shadow-2xl border-4 border-amber-200 hover:border-yellow-400 hover:-translate-y-1 transition cursor-pointer"
                >
                  <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-yellow-200/50 group-hover:bg-yellow-300/60 transition" />
                  <div className="absolute bottom-0 right-0 text-7xl opacity-10 select-none">
                    🗺️
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 text-2xl shadow-md border-2 border-black">
                        {stage.number}
                      </div>

                      <div className="flex items-center gap-2">
                        {cleared && (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs md:text-sm font-bold border border-emerald-300">
                            CLEAR済み
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs md:text-sm font-bold border border-amber-300">
                          {stage.difficulty}
                        </span>
                      </div>
                    </div>

                    <h2 className="mt-5 text-2xl md:text-3xl font-extrabold text-amber-900">
                      {stage.title}
                    </h2>

                    <div className="mt-6 inline-flex items-center gap-2 text-lg font-extrabold text-orange-700 group-hover:translate-x-1 transition">
                      <span>スタートする</span>
                      <span>→</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fef3c7,_#fdba74_35%,_#7c2d12_100%)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-8 left-8 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
        <div className="absolute top-28 right-8 w-32 h-32 bg-yellow-200/15 rounded-full blur-3xl" />
        <div className="absolute bottom-12 left-1/4 w-40 h-40 bg-orange-200/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* 左UI */}
          <div className="w-full lg:w-[360px] shrink-0">
            <div className="rounded-[2rem] bg-white/95 border-4 border-amber-200 shadow-2xl p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-bold border border-amber-300">
                    <span>🗺️</span>
                    <span>ステージ {selectedStage.number}</span>
                  </div>
                  <h1 className="mt-3 text-2xl md:text-3xl font-extrabold text-amber-900">
                    {selectedStage.title}
                  </h1>
                </div>

                <div className="text-5xl select-none">🏰</div>
              </div>

              {/* <p className="mt-3 text-gray-700 leading-relaxed">{selectedStage.subtitle}</p> */}

              <div className="hidden lg:block">
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-yellow-50 border border-yellow-300 p-4">
                    <p className="text-sm text-yellow-700 font-bold">カギ</p>
                    <p className="mt-1 text-xl font-extrabold text-amber-900">
                      {hasKey ? "GET!" : "まだ"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-violet-50 border border-violet-300 p-4">
                    <p className="text-sm text-violet-700 font-bold">操作</p>
                    <p className="mt-1 text-base md:text-lg font-extrabold text-violet-900">
                      矢印 / WASD
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 border border-amber-300 p-4 min-h-[84px]">
                  <p className="text-sm font-bold text-amber-700">ひまQメッセージ</p>
                  <p className="mt-1 text-gray-800 font-bold leading-relaxed">
                    {statusText || "迷路を進もう！"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => loadStage(selectedStage.id)}
                  className="px-4 py-3 rounded-2xl bg-white border-2 border-amber-400 text-amber-800 font-extrabold shadow hover:bg-amber-50 transition cursor-pointer"
                >
                  リセット
                </button>
                <button
                  onClick={backToStageSelect}
                  className="px-4 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-black border-2 border-black font-extrabold shadow hover:brightness-95 transition cursor-pointer"
                >
                  ステージ選択
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="font-extrabold text-slate-800 mb-3">アイコン説明</p>
                <div className="grid grid-cols-2 gap-3 text-sm md:text-base">
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <img
                      src="/images/quizgate.png"
                      alt="クイズゲート"
                      className="w-7 h-7 object-contain shrink-0"
                      draggable={false}
                    />
                    <span>クイズゲート</span>
                  </div>

                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <img
                      src="/images/key.png"
                      alt="カギ"
                      className="w-7 h-7 object-contain shrink-0"
                      draggable={false}
                    />
                    <span>カギ</span>
                  </div>

                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <img
                      src="/images/goal.png"
                      alt="ゴール"
                      className="w-7 h-7 object-contain shrink-0"
                      draggable={false}
                    />
                    <span>ゴール</span>
                  </div>

                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <img
                      src="/images/switch.png"
                      alt="スイッチ"
                      className="w-7 h-7 object-contain shrink-0"
                      draggable={false}
                    />
                    <span>スイッチ</span>
                  </div>

                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <img
                      src="/images/gate2.png"
                      alt="扉"
                      className="w-7 h-7 object-contain shrink-0"
                      draggable={false}
                    />
                    <span>扉</span>
                  </div>

                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <img
                      src="/images/block2.png"
                      alt="ブロック"
                      className="w-7 h-7 object-contain shrink-0"
                      draggable={false}
                    />
                    <span>ブロック</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 迷路画面 */}
          <div className="w-full flex-1 flex flex-col items-center">
            <div className="relative">
              <div className="relative rounded-[2rem] border-[6px] border-amber-200 bg-slate-900 shadow-2xl p-3 md:p-4">
                <div
                  className="relative overflow-hidden rounded-[1.5rem] border-4 border-yellow-300 bg-[radial-gradient(circle_at_center,_#fff7ed,_#fde68a_40%,_#fb923c_100%)]"
                  style={{
                    width: VIEWPORT_SIZE,
                    height: VIEWPORT_SIZE,
                  }}
                >
                  {/* マップ */}
                  <div
                    className="absolute left-0 top-0 transition-transform duration-150"
                    style={{
                      transform: `translate(${translateX}px, ${translateY}px)`,
                    }}
                  >
                    {stageMap.map((row, y) => (
                      <div key={y} className="flex">
                        {row.map((cell, x) => (
                          <div
                            key={`${x}-${y}`}
                            className={`relative flex items-center justify-center text-xl font-black select-none ${getCellClass(
                              cell
                            )}`}
                            style={{
                              width: CELL_SIZE,
                              height: CELL_SIZE,
                            }}
                          >
                            {getCellImageSrc(cell) ? (
                              <img
                                src={getCellImageSrc(cell)!}
                                alt={cell}
                                className="pointer-events-none select-none drop-shadow-sm"
                                style={{
                                  width: CELL_SIZE * 0.68,
                                  height: CELL_SIZE * 0.68,
                                  objectFit: "contain",
                                }}
                                draggable={false}
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* 中央主人公（仮） */}
                  <div
                    className="absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                    style={{
                      width: CELL_SIZE - 2,
                      height: CELL_SIZE - 2,
                    }}
                  >
                    <img
                      src={playerImageSrc}
                      alt="主人公"
                      className="select-none pointer-events-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        imageRendering: "auto",
                      }}
                      draggable={false}
                    />
                  </div>

                  {/* 視界中心の演出 */}
                  <div className="pointer-events-none absolute inset-0 ring-4 ring-white/20 rounded-[1.2rem]" />
                  <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_rgba(0,0,0,0.28)] rounded-[1.2rem]" />
                </div>
              </div>
            </div>

            {/* スマホ操作ボタン：迷路の下 */}
            <div className="mt-4 lg:hidden rounded-[2rem] bg-white/95 border-4 border-amber-200 shadow-xl p-4 w-full max-w-[420px]">
              <p className="text-center font-extrabold text-amber-900 mb-3">タップ操作</p>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => movePlayer(0, -1)}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 border-2 border-black text-2xl shadow-md cursor-pointer"
                >
                  ⬆️
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => movePlayer(-1, 0)}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 border-2 border-black text-2xl shadow-md cursor-pointer"
                  >
                    ⬅️
                  </button>
                  <button
                    onClick={() => movePlayer(0, 1)}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 border-2 border-black text-2xl shadow-md cursor-pointer"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => movePlayer(1, 0)}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 border-2 border-black text-2xl shadow-md cursor-pointer"
                  >
                    ➡️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* クイズモーダル */}
      {quizModal.open && quizModal.quiz && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white border-4 border-violet-300 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-6 py-4 text-white">
              <h2 className="text-2xl md:text-3xl font-extrabold mt-1 text-center">
                ❓ クイズゲート ❓
              </h2>
              <p className="mt-4 text-center text-sm md:text-base text-gray-100 font-bold">
                クイズに正解して迷路を進もう！不正解だとスタート地点に戻ってしまう！
              </p>
            </div>

            <div className="p-5 md:p-7">
              <p className="text-xl md:text-3xl font-extrabold text-slate-800 leading-relaxed text-center">
                {quizModal.quiz.question}
              </p>

              <div className="mt-6 grid gap-3">
                {quizModal.quiz.choices.map((choice, index) => {
                  const selected = quizAnswerIndex === index;

                  return (
                    <button
                      key={choice}
                      onClick={() => setQuizAnswerIndex(index)}
                      className={`w-full rounded-2xl border-2 px-4 py-4 text-left text-base md:text-xl font-bold transition cursor-pointer ${
                        selected
                          ? "bg-violet-600 text-white border-violet-700"
                          : "bg-white text-slate-800 border-violet-200 hover:bg-violet-50"
                      }`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleQuizConfirm}
                  disabled={quizAnswerIndex === null}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-black border-2 border-black font-extrabold shadow-lg hover:brightness-95 transition disabled:opacity-50 cursor-pointer"
                >
                  これで答える
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {quizResultModal.open && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-xl rounded-[2rem] bg-white border-4 shadow-2xl overflow-hidden text-center ${
              quizResultModal.isCorrect ? "border-emerald-300" : "border-rose-300"
            }`}
          >
            <div
              className={`px-6 py-5 ${
                quizResultModal.isCorrect
                  ? "bg-gradient-to-r from-emerald-400 via-green-400 to-lime-400"
                  : "bg-gradient-to-r from-rose-400 via-pink-400 to-orange-400"
              }`}
            >
              <p
                className="text-3xl md:text-4xl font-extrabold text-white"
                style={{
                  textShadow: `
                    2px 2px 0 #000,
                    -2px 2px 0 #000,
                    2px -2px 0 #000,
                    -2px -2px 0 #000
                  `,
                }}
              >
                {quizResultModal.title}
              </p>
            </div>

            <div className="px-6 py-8">
              <div className="text-6xl mb-4">
                {quizResultModal.isCorrect ? "🎉" : ""}
              </div>

              <p className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                {quizResultModal.text}
              </p>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleCloseQuizResultModal}
                  className={`px-6 py-3 rounded-2xl text-black border-2 border-black font-extrabold shadow-lg transition cursor-pointer ${
                    quizResultModal.isCorrect
                      ? "bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 hover:brightness-95"
                      : "bg-gradient-to-r from-rose-300 via-pink-300 to-orange-300 hover:brightness-95"
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {needKeyModal.open && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-[2rem] bg-white border-4 border-amber-300 shadow-2xl overflow-hidden text-center">
            <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 px-6 py-5">
              <p
                className="text-3xl md:text-4xl font-extrabold text-white"
                style={{
                  textShadow: `
                    2px 2px 0 #000,
                    -2px 2px 0 #000,
                    2px -2px 0 #000,
                    -2px -2px 0 #000
                  `,
                }}
              >
                {needKeyModal.title}
              </p>
            </div>

            <div className="px-6 py-8">
              <div className="text-6xl mb-4">🗝️</div>

              <p className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                {needKeyModal.text}
              </p>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() =>
                    setNeedKeyModal({
                      open: false,
                      title: "",
                      text: "",
                    })
                  }
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-black border-2 border-black font-extrabold shadow-lg hover:brightness-95 transition cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* クリアモーダル */}
      {clearModal.open && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-[2rem] bg-white border-4 border-yellow-300 shadow-2xl overflow-hidden text-center">
            <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 px-6 py-5">
              <p
                className="text-4xl md:text-5xl font-extrabold text-white"
                style={{
                  textShadow: `
                    2px 2px 0 #000,
                    -2px 2px 0 #000,
                    2px -2px 0 #000,
                    -2px -2px 0 #000
                  `,
                }}
              >
                {clearModal.title}
              </p>
            </div>

            <div className="px-6 py-8">
              <div className="text-7xl mb-4">🎉</div>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{clearModal.text}</p>
              <p className="mt-3 text-slate-600 font-medium">
                他のステージも挑戦してみよう！
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={backToStageSelect}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-black border-2 border-black font-extrabold shadow-lg hover:brightness-95 transition cursor-pointer"
                >
                  ステージ選択へ
                </button>

                <button
                  onClick={() => loadStage(selectedStage.id)}
                  className="px-6 py-3 rounded-2xl bg-white text-slate-800 border-2 border-slate-300 font-extrabold shadow hover:bg-slate-50 transition cursor-pointer"
                >
                  もう一回あそぶ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}