"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { submitGameResult } from "@/lib/gameResults";
import { buildResultModalPayload } from "@/lib/resultMessages";
import { useResultModal } from "../../components/ResultModalProvider";
import { getWeekStartJST } from "@/lib/week";
import { getMonthStartJST } from "@/lib/month";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedMultiplayerGames from "@/app/components/RecommendedMultiplayerGames";
import Image from "next/image";

type Direction = "up" | "down" | "left" | "right";

type AwardStatus = "idle" | "awarding" | "awarded" | "need_login" | "error";

type RoomPlayer = {
  socketId: string;
  playerName: string;
};

type RankRow = {
  socketId: string;
  name: string;
  score: number;
  rank: number;
  foundLetters?: number;
  correctCount?: number;
};

type WordPlayer = {
  socketId: string;
  name: string;
  x: number;
  y: number;
  alive: boolean;
  score: number;
  rank?: number;
  foundLetters?: string[] | number;
  foundLetterCount?: number;
  correctCount?: number;
  eliminatedReason?:
    | "wrong_area"
    | "timeout"
    | "unknown";
  invincibleUntil?: number;
  speedBoostUntil?: number;
  eliminatedAt?: number;
  userId?: string | null;
  skinImageUrl?: string | null;
  isCpu?: boolean;
};

type WordBookItem = {
  id: string;
  type: "letter" | "hint" | "fake";
  x: number;
  y: number;
  solved?: boolean;
  usedBy?: string[];
};


type WordQuestion = {
  question: string;
  choices: string[];
  correctIndex: number;
  displayAnswer?: string;
  explanation?: string;
};

type WordBookQuestionPayload = {
  bookId: string;
  bookType: "letter" | "hint" | "fake";
  question: WordQuestion;
};

type MazeWall = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type WordGameResult = {
  finalRanks: RankRow[];
  eliminationGroups: string[][];
  winnerSocketIds: string[];
};

type WordGameState = {
  roomCode: string;
  phase:
    | "waiting"
    | "ready"
    | "countdown"
    | "stageIntro"
    | "playing"
    | "stageResult"
    | "gameSet"
    | "gameOver";
  timeLeft: number;
  safeSize?: number;
  safeMin?: number;
  safeMax?: number;
  question: WordQuestion;
  players: WordPlayer[];
  walls?: MazeWall[];
  items: WordBookItem[];
  books?: WordBookItem[];
  targetLength?: number;
  foundLetters?: string[] | number;
  foundLetterCount?: number;
  hints?: string[];
  answerCooldownUntil?: number;
  message?: string;
  stageResultMessage?: string;
  gameResult?: WordGameResult;
};

type PendingAward = {
  points: number;
  exp: number;
  correctCount: number;
  basePoints: number;
  placementBonusPoints: number;
  survivalBonusPoints: number;
  createdAt: number;
};

const PENDING_KEY = "word_chase_award_pending_v1";

const BONUS_TABLE: Record<number, number[]> = {
  2: [300],
  3: [400, 200],
  4: [500, 250, 120],
};

const bannedWords = [
  "ばか",
  "馬鹿",
  "バカ",
  "くそ",
  "糞",
  "クソ",
  "死ね",
  "しね",
  "アホ",
  "あほ",
  "ごみ",
  "ゴミ",
  "fuck",
  "shit",
  "bastard",
  "idiot",
  "asshole",
];


const WORD_WORLD_WIDTH = 2400;
const WORD_WORLD_HEIGHT = 1700;
const WORD_ANSWER_X = WORD_WORLD_WIDTH / 2;
const WORD_ANSWER_Y = WORD_WORLD_HEIGHT / 2;
const WORD_ANSWER_RADIUS = 120;

const BOOK_EMOJIS = [
  "📖",
  "📚",
  "📘",
  "📙",
  "📕",
  "📗",
];

// const toWorldX = (value: number) =>
//   value <= 100 ? (value / 100) * WORD_WORLD_WIDTH : value;

// const toWorldY = (value: number) =>
//   value <= 100 ? (value / 100) * WORD_WORLD_HEIGHT : value;

// const toWorldW = (value: number) =>
//   value <= 100 ? (value / 100) * WORD_WORLD_WIDTH : value;

// const toWorldH = (value: number) =>
//   value <= 100 ? (value / 100) * WORD_WORLD_HEIGHT : value;

const toWorldX = (value: number) => value;
const toWorldY = (value: number) => value;
const toWorldW = (value: number) => value;
const toWorldH = (value: number) => value;

const isInsideAnswerArea = (player?: WordPlayer | null) => {
  if (!player) return false;
  const x = toWorldX(player.x);
  const y = toWorldY(player.y);
  const dx = x - WORD_ANSWER_X;
  const dy = y - WORD_ANSWER_Y;
  return Math.sqrt(dx * dx + dy * dy) <= WORD_ANSWER_RADIUS;
};

const reasonLabel = (reason?: WordPlayer["eliminatedReason"]) => {
  if (reason === "wrong_area") return "偽物本";
  if (reason === "timeout") return "時間切れ";
  return "終了";
};

const calcPlacementBonus = (
  playerCount: number,
  ranksNow: RankRow[],
  mySocketId: string,
) => {
  const table = BONUS_TABLE[playerCount] ?? [];
  const me = ranksNow.find((r) => r.socketId === mySocketId);
  if (!me) return 0;

  if (me.rank >= playerCount) return 0;

  const sameRankCount = ranksNow.filter((r) => r.rank === me.rank).length;
  if (sameRankCount !== 1) return 0;

  return table[me.rank - 1] ?? 0;
};

const buildRanksFromPlayers = (players: WordPlayer[]): RankRow[] => {
  return [...players]
    .map((p, index) => ({
      socketId: p.socketId,
      name: p.name,
      score: p.score ?? 0,
      rank: p.rank ?? index + 1,
      foundLetters: Array.isArray(p.foundLetters)
        ? p.foundLetters.length
        : p.foundLetters ?? 0,
      correctCount: p.correctCount ?? 0,
    }))
    .sort((a, b) => a.rank - b.rank || b.score - a.score);
};

const getPlayerFoundCount = (player: WordPlayer) => {
  if (Array.isArray(player.foundLetters)) {
    return player.foundLetters.length;
  }

  return player.foundLetters ?? 0;
};

const ProgressBooks = ({
  found,
  total,
}: {
  found: number;
  total: number;
}) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={`text-sm md:text-base ${
            index < found ? "opacity-100" : "opacity-30 grayscale"
          }`}
        >
          📖
        </span>
      ))}
    </div>
  );
};

const savePendingAward = (payload: PendingAward) => {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
  } catch {}
};

const clearPendingAward = () => {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {}
};

function WordGlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-amber-200/20 bg-[#4a2f1b]/85 shadow-[0_0_35px_rgba(245,158,11,0.28),0_0_80px_rgba(180,83,9,0.25)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

function WordChaseResult({
  myRank,
  ranks,
  players,
  correctCount,
  foundLetters,
  basePoints,
  placementBonusPoints,
  survivalBonusPoints,
  earnedPoints,
  earnedExp,
  awardStatus,
  isLoggedIn,
  onGoLogin,
  onShareX,
  onRematch,
  onNewMatch,
  rematchRequested,
  rematchAvailable,
  isCodeMatch,
}: {
  myRank: number | null;
  ranks: RankRow[];
  players: WordPlayer[];
  correctCount: number;
  foundLetters: number;
  basePoints: number;
  placementBonusPoints: number;
  survivalBonusPoints: number;
  earnedPoints: number;
  earnedExp: number;
  awardStatus: AwardStatus;
  isLoggedIn: boolean;
  onGoLogin: () => void;
  onShareX: () => void;
  onRematch: () => void;
  onNewMatch: () => void;
  rematchRequested: boolean;
  rematchAvailable: boolean;
  isCodeMatch: boolean;
}) {
  const [showText1, setShowText1] = useState(false);
  const [showText2, setShowText2] = useState(false);
  const [showText3, setShowText3] = useState(false);
  const [showText4, setShowText4] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowText1(true), 400));
    timers.push(setTimeout(() => setShowText2(true), 1200));
    timers.push(setTimeout(() => setShowText3(true), 2000));
    timers.push(setTimeout(() => setShowText4(true), 2600));
    timers.push(setTimeout(() => setShowButton(true), 3200));
    return () => timers.forEach(clearTimeout);
  }, []);

  const rankClass =
    myRank === 1
      ? "text-yellow-200 drop-shadow-[0_0_25px_rgba(250,204,21,0.85)]"
      : myRank === 2
        ? "text-amber-100 drop-shadow-[0_0_20px_rgba(34,211,238,0.65)]"
        : myRank === 3
          ? "text-orange-200 drop-shadow-[0_0_20px_rgba(251,146,60,0.65)]"
          : "text-white";

  return (
    <motion.div
      className="mx-auto max-w-4xl text-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="mb-2 text-sm font-black tracking-[0.45em] text-amber-200">
        WORD CHASE RESULT
      </p>

      {showText1 && (
        <motion.div
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4"
        >
          {/* <p className="text-4xl font-black text-white md:text-6xl">
            GAME SET!
          </p> */}
          {/* <p className="mt-2 text-sm font-bold text-white/65 md:text-lg">
            本の世界サバイバル終了！
          </p> */}
          <p className="mt-2 text-sm md:text-xl font-bold text-white/65 md:text-lg">
            探索結果
          </p>
        </motion.div>
      )}

      {showText2 && (
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <WordGlassCard className="p-4">
            <p className="text-xs font-bold text-white/55">クイズ正解</p>
            <p className="text-3xl font-black text-amber-200">{correctCount}</p>
          </WordGlassCard>
          <WordGlassCard className="p-4">
            <p className="text-xs font-bold text-white/55">見つけた文字</p>
            <p className="text-3xl font-black text-fuchsia-200">
              {foundLetters}
            </p>
          </WordGlassCard>
          <WordGlassCard className="p-4">
            <p className="text-xs font-bold text-white/55">獲得P</p>
            <p className="text-3xl font-black text-yellow-200">
              {earnedPoints}
            </p>
          </WordGlassCard>
          <WordGlassCard className="p-4">
            <p className="text-xs font-bold text-white/55">EXP</p>
            <p className="text-3xl font-black text-purple-200">{earnedExp}</p>
          </WordGlassCard>
        </div>
      )}

      {showText3 && (
        <motion.div
          initial={{ scale: 0.7, rotate: -6, opacity: 0 }}
          animate={{ scale: [1.15, 1], rotate: 0, opacity: 1 }}
          transition={{ duration: 0.55 }}
          className="mx-auto mb-6 rounded-[2rem] border border-yellow-200/40 bg-gradient-to-r from-yellow-300/15 via-cyan-300/10 to-fuchsia-400/15 p-5 shadow-[0_0_40px_rgba(250,204,21,0.22)]"
        >
          <p className="text-sm font-black text-white/60">あなたの結果</p>
          <p className={`text-6xl font-black md:text-8xl ${rankClass}`}>
            {myRank ? `${myRank}位` : "集計中"}
          </p>
          {myRank === 1 && (
            <p className="mt-2 text-2xl font-black text-yellow-200">
              👑 最速ワードプレイヤー！
            </p>
          )}
        </motion.div>
      )}

      {showText4 && (
        <WordGlassCard className="mb-6 p-4">
          <p className="mb-3 text-xl font-black text-amber-100">みんなの結果</p>
          <div className="space-y-2">
            {ranks.map((rank, index) => {
              const p = players.find(
                (player) => player.socketId === rank.socketId,
              );
              return (
                <div
                  key={rank.socketId}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2"
                >
                  <span
                    className={`w-14 text-center text-xl font-black ${
                      rank.rank === 1
                        ? "text-yellow-200"
                        : rank.rank === 2
                          ? "text-amber-100"
                          : rank.rank === 3
                            ? "text-orange-200"
                            : "text-white/70"
                    }`}
                  >
                    {rank.rank}位
                  </span>
                  {/* <span className="text-2xl">{PLAYER_EMOJIS[index % PLAYER_EMOJIS.length]}</span> */}
                  <span className="min-w-0 flex-1 truncate text-left font-black">
                    {rank.name}
                  </span>
                  <span className="text-sm font-bold text-white/60">
                    {rank.score}pt
                  </span>
                  {p && !p.alive && (
                    <span className="hidden rounded-full bg-red-500/20 px-2 py-1 text-xs font-bold text-red-200 md:inline">
                      {reasonLabel(p.eliminatedReason)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </WordGlassCard>
      )}

      {showButton && (
        <WordGlassCard className="mb-6 p-5">
          <div className="mb-3 text-base font-bold leading-relaxed text-white/80 md:text-lg">
            <p className="text-amber-200">
              正解ポイント：{basePoints}P（{correctCount}問 × 10P）
            </p>
            {survivalBonusPoints > 0 && (
              <p className="text-fuchsia-200">
                ステージ突破ボーナス：{survivalBonusPoints}P
              </p>
            )}
            {placementBonusPoints > 0 && (
              <p className="text-yellow-200">
                順位ボーナス：{placementBonusPoints}P
              </p>
            )}
          </div>

          <p className="text-2xl font-black text-white md:text-3xl">
            今回の獲得：
            <span className="text-yellow-200">{earnedPoints}P</span>
            <span className="mx-2 text-white/35">/</span>
            <span className="text-purple-200">{earnedExp}EXP</span>
          </p>

          {isLoggedIn ? (
            <div className="mt-3">
              {awardStatus === "awarding" && (
                <p className="font-bold text-white/70">ポイント反映中...</p>
              )}
              {awardStatus === "awarded" && (
                <p className="font-black text-emerald-200">
                  ✅ ポイント・経験値を加算しました！
                </p>
              )}
              {awardStatus === "error" && (
                <p className="font-black text-red-300">
                  ❌
                  ポイント加算に失敗しました。時間をおいて再度お試しください。
                </p>
              )}
              {awardStatus === "need_login" && (
                <p className="font-black text-yellow-200">
                  ログイン状態を確認できませんでした。
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="font-bold text-white/75">
                ※未ログインのため受け取れません。ログインすると次からポイントを受け取れます！
              </p>
              <button
                onClick={onGoLogin}
                className="mt-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2 font-black text-white"
              >
                ログインする
              </button>
            </div>
          )}
        </WordGlassCard>
      )}

      {showButton && (
        <div className="mb-8 flex flex-col items-center justify-center gap-3 md:flex-row">
          <button
            onClick={onShareX}
            className="w-full rounded-full border border-white/20 bg-black px-6 py-3 text-lg font-black text-white shadow-[0_0_20px_rgba(255,255,255,0.18)] md:w-auto"
          >
            Xで結果をシェア
          </button>

          {isCodeMatch ? (
            <button
              onClick={onRematch}
              disabled={rematchRequested}
              className={`w-full rounded-full px-6 py-3 text-lg font-black shadow-[0_0_25px_rgba(251,191,36,0.35)] md:w-auto ${
                rematchRequested
                  ? "cursor-wait bg-white/20 text-white/70"
                  : "bg-gradient-to-r from-yellow-300 to-orange-500 text-black"
              }`}
            >
              {rematchRequested
                ? "ほかのプレイヤーを待っています…"
                : "もう一回やる！"}
            </button>
          ) : (
            <button
              onClick={onNewMatch}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-3 text-lg font-black text-white shadow-[0_0_25px_rgba(34,211,238,0.35)] md:w-auto"
            >
              もう一回やる！
            </button>
          )}

          {rematchAvailable && (
            <button
              onClick={onRematch}
              className="w-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-400 px-6 py-3 text-lg font-black text-black md:w-auto"
            >
              対戦スタート！
            </button>
          )}
        </div>
      )}

      {showButton && rematchRequested && !rematchAvailable && (
        <p className="mb-6 rounded-2xl border border-cyan-300/30 bg-black/40 px-4 py-3 text-center text-lg font-black text-amber-100">
          ほかのプレイヤーの準備を待っています…
        </p>
      )}

      {showButton && (
        <RecommendedMultiplayerGames
          title="次はみんなでどれ行く？🎮"
          count={4}
          excludeHref="/quiz-word"
        />
      )}
    </motion.div>
  );
}

function ArrowIcon({ dir }: { dir: Direction }) {
  const rotate =
    dir === "up"
      ? "rotate-0"
      : dir === "right"
        ? "rotate-90"
        : dir === "down"
          ? "rotate-180"
          : "-rotate-90";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-9 w-9 ${rotate}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4v16" />
      <path d="M5 11l7-7 7 7" />
    </svg>
  );
}

function MobileControls({
  onPress,
  onRelease,
}: {
  onPress: (dir: Direction) => void;
  onRelease: (dir: Direction) => void;
}) {
  const btn =
    "pointer-events-auto flex h-20 w-20 touch-none select-none items-center justify-center rounded-3xl border border-cyan-200/60 bg-white/10 text-white shadow-[0_0_24px_rgba(34,211,238,0.35)] backdrop-blur active:scale-95";

  const bind = (dir: Direction) => ({
    onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onPress(dir);
    },
    onTouchEnd: (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onRelease(dir);
    },
    onMouseDown: () => onPress(dir),
    onMouseUp: () => onRelease(dir),
    onMouseLeave: () => onRelease(dir),
  });

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-40 w-[320px] -translate-x-1/2 rounded-3xl border border-white/15 bg-black/60 p-5 backdrop-blur">
      <div className="grid grid-cols-3 place-items-center gap-4">
        <div />
        <button aria-label="上に移動" className={btn} {...bind("up")}>
          <ArrowIcon dir="up" />
        </button>
        <div />

        <button aria-label="左に移動" className={btn} {...bind("left")}>
          <ArrowIcon dir="left" />
        </button>
        <button aria-label="下に移動" className={btn} {...bind("down")}>
          <ArrowIcon dir="down" />
        </button>
        <button aria-label="右に移動" className={btn} {...bind("right")}>
          <ArrowIcon dir="right" />
        </button>
      </div>
    </div>
  );
}

export default function WordChaseModePage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = pathname.split("/").pop() || "code";
  const code = searchParams?.get("code") || "";
  const count = searchParams?.get("count") || "2";
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const { pushModal } = useResultModal();

  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [readyToStart, setReadyToStart] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [playerCount, setPlayerCount] = useState("0/4");
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [roomFull, setRoomFull] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false);
  const [gameState, setGameState] = useState<WordGameState | null>(null);
  const [finished, setFinished] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchAvailable, setRematchAvailable] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [battleKey, setBattleKey] = useState(0);
  const [showAnswerBox, setShowAnswerBox] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [bookQuestion, setBookQuestion] = useState<WordBookQuestionPayload | null>(null);
  const [bookResultMessage, setBookResultMessage] = useState<string | null>(null);
  const answerAreaOpenedRef = useRef(false);

  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [basePoints, setBasePoints] = useState(0);
  const [placementBonusPoints, setPlacementBonusPoints] = useState(0);
  const [survivalBonusPoints, setSurvivalBonusPoints] = useState(0);
  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");

  const awardedOnceRef = useRef(false);
  const sentRef = useRef(false);
  const roomLockedRef = useRef(false);
  const pressedRef = useRef<Set<Direction>>(new Set());
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 900, height: 620 });

  const [answerSuccessMessage, setAnswerSuccessMessage] = useState<string | null>(null);
  const [showGameSetText, setShowGameSetText] = useState(false);

  const {
    joinRandom,
    joinWithCode,
    sendReady,
    resetMatch,
    players: rawPlayers,
    bothReady,
    mySocketId,
    socket,
  } = useBattle(playerName);

  useEffect(() => {
    const el = mapViewportRef.current;
    if (!el) return;

    // const update = () => {
    //   const rect = el.getBoundingClientRect();
    //   setViewportSize({ width: rect.width, height: rect.height });
    // };
    const update = () => {
      const rect = el.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) return;

      setViewportSize({
        width: rect.width,
        height: rect.height,
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [joined, bothReady]);

  const theme = {
    label: "WORD CHASE",
    bg: "from-[#4a1810] via-[#7c2d12] to-[#d97706]",
    panel: "from-amber-300/25 via-orange-300/10 to-orange-500/15",
    glow: "shadow-[0_0_35px_rgba(245,158,11,0.35)]",
    border: "border-amber-300",
    accent: "text-amber-200",
  };

  const DEFAULT_PLAYER_IMAGE = "/images/skin_chara1_ボード.png";

  const getPlayerImage = (player: WordPlayer) => {
    if (player.isCpu) return DEFAULT_PLAYER_IMAGE;

    if (player.skinImageUrl) {
      return player.skinImageUrl.startsWith("/")
        ? player.skinImageUrl
        : `/${player.skinImageUrl}`;
    }

    return DEFAULT_PLAYER_IMAGE;
  };

  const playersFromBattle: RoomPlayer[] = rawPlayers.map((p) => ({
    socketId: p.socketId,
    playerName: p.name,
  }));

  const displayPlayers: WordPlayer[] = useMemo(() => {
    if (gameState?.players?.length) return gameState.players;

    return playersFromBattle.map((p, index) => ({
      socketId: p.socketId,
      name: p.playerName,
      x: WORD_ANSWER_X - 90 + index * 60,
      y: WORD_ANSWER_Y,
      alive: true,
      score: 0,
      rank: undefined,
      foundLetters: 0,
      correctCount: 0,
    }));
  }, [gameState, playersFromBattle]);

  const me = displayPlayers.find((p) => p.socketId === mySocketId);
  const cameraTargetX = me ? toWorldX(me.x) : WORD_ANSWER_X;
  const cameraTargetY = me ? toWorldY(me.y) : WORD_ANSWER_Y;
  const safeViewportWidth =
    viewportSize.width > 0 ? viewportSize.width : 900;

  const safeViewportHeight =
    viewportSize.height > 0 ? viewportSize.height : 620;
  // const cameraX = Math.min(
  //   0,
  //   Math.max(viewportSize.width - WORD_WORLD_WIDTH, viewportSize.width / 2 - cameraTargetX),
  // );
  // const cameraY = Math.min(
  //   0,
  //   Math.max(viewportSize.height - WORD_WORLD_HEIGHT, viewportSize.height / 2 - cameraTargetY),
  // );
  const cameraX = Math.min(
    0,
    Math.max(
      safeViewportWidth - WORD_WORLD_WIDTH,
      safeViewportWidth / 2 - cameraTargetX
    ),
  );

  const cameraY = Math.min(
    0,
    Math.max(
      safeViewportHeight - WORD_WORLD_HEIGHT,
      safeViewportHeight / 2 - cameraTargetY
    ),
  );
  const allPlayersReady = roomPlayers.length >= maxPlayers;
  const isDead = !!me && !me.alive;
  const finalRanks = gameState?.gameResult?.finalRanks?.length
    ? gameState.gameResult.finalRanks
    : buildRanksFromPlayers(displayPlayers);
  const myRank =
    finalRanks.find((r) => r.socketId === mySocketId)?.rank ?? null;
  const correctCount = me?.correctCount ?? 0;

  const foundLetterList = Array.isArray(me?.foundLetters)
    ? me.foundLetters
    : [];

  const foundLetters =
    typeof me?.foundLetters === "number"
      ? me.foundLetters
      : foundLetterList.length;

  const targetLength = gameState?.targetLength ?? Math.max(5, foundLetters, 5);
  const visibleBooks = gameState?.books ?? gameState?.items ?? [];
  const totalBooks = targetLength + 2 + 3;
  const remainingBooks = visibleBooks.length;
  const myFoundLetters =
    foundLetterList.length > 0
      ? foundLetterList
      : Array.from({ length: targetLength }, (_, i) =>
          i < foundLetters ? "?" : "",
        );
  const hints = gameState?.hints ?? [];
  const cooldownMs = Math.max(
    0,
    (gameState?.answerCooldownUntil ?? 0) - Date.now(),
  );
  const cooldownSec = Math.ceil(cooldownMs / 1000);
  const inAnswerArea = isInsideAnswerArea(me);

  const ensureAuthedUserId = async (): Promise<string | null> => {
    const { data: u1, error: e1 } = await supabase.auth.getUser();
    if (!e1 && u1.user) return u1.user.id;

    await supabase.auth.refreshSession();

    const { data: u2, error: e2 } = await supabase.auth.getUser();
    if (!e2 && u2.user) return u2.user.id;

    return null;
  };

  const awardPointsAndExp = async (payload: PendingAward) => {
    if (awardedOnceRef.current) return;
    if (payload.points <= 0 && payload.exp <= 0) return;

    setAwardStatus("awarding");

    const authedUserId = await ensureAuthedUserId();
    if (!authedUserId) {
      setAwardStatus("need_login");
      return;
    }

    try {
      awardedOnceRef.current = true;

      const { data, error } = await supabase.rpc("add_points_and_exp", {
        p_user_id: authedUserId,
        p_points: payload.points,
        p_exp: payload.exp,
      });

      if (error) {
        console.error("add_points_and_exp error:", error);
        awardedOnceRef.current = false;
        setAwardStatus("error");
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const oldLevel = row?.old_level ?? 1;
      const newLevel = row?.new_level ?? 1;

      window.dispatchEvent(new Event("points:updated"));
      window.dispatchEvent(
        new CustomEvent("profile:updated", { detail: { oldLevel, newLevel } }),
      );

      if (newLevel > oldLevel) {
        try {
          const { data: r, error: rErr } = await supabase.rpc(
            "claim_levelup_rewards",
            {
              p_user_id: authedUserId,
              p_old_level: oldLevel,
              p_new_level: newLevel,
            },
          );

          if (rErr) {
            console.error("claim_levelup_rewards error:", rErr);
          } else {
            const rewardRow = Array.isArray(r) ? r[0] : r;
            const awardedPoints = Number(rewardRow?.awarded_points ?? 0);
            const awardedTitle = (rewardRow?.awarded_title ?? null) as
              | string
              | null;

            if (awardedPoints > 0 || awardedTitle) {
              window.dispatchEvent(new Event("points:updated"));
              window.dispatchEvent(
                new CustomEvent("levelup:rewarded", {
                  detail: {
                    fromLevel: oldLevel,
                    toLevel: newLevel,
                    awardedPoints,
                    awardedTitle,
                  },
                }),
              );
            }
          }
        } catch (e) {
          console.error("levelup reward error:", e);
        }
      }

      if (payload.points > 0) {
        const { error: logError } = await supabase
          .from("user_point_logs")
          .insert({
            user_id: authedUserId,
            change: payload.points,
            reason:
              `ワードチェイス獲得: 正解${payload.correctCount}問=${payload.basePoints}P` +
              (payload.survivalBonusPoints
                ? ` / 突破ボーナス${payload.survivalBonusPoints}P`
                : "") +
              (payload.placementBonusPoints
                ? ` / 順位ボーナス${payload.placementBonusPoints}P`
                : ""),
          });
        if (logError)
          console.log("insert user_point_logs error raw:", logError);
      }

      if (payload.exp > 0) {
        const { error: logError2 } = await supabase
          .from("user_exp_logs")
          .insert({
            user_id: authedUserId,
            change: payload.exp,
            reason: `ワードチェイスEXP獲得: 正解${payload.correctCount}問 → ${payload.exp}EXP`,
          });
        if (logError2)
          console.log("insert user_exp_logs error raw:", logError2);
      }

      clearPendingAward();
      setAwardStatus("awarded");
    } catch (e) {
      console.error("award points/exp error:", e);
      awardedOnceRef.current = false;
      setAwardStatus("error");
    }
  };

  const sendMove = (dir: Direction, pressed: boolean) => {
    if (!socket || !roomCode || finished) return;

    socket.emit("word_move_input", {
      roomCode,
      dir,
      pressed,
    });
  };

  const pressDirection = (dir: Direction) => {
    if (pressedRef.current.has(dir)) return;
    pressedRef.current.add(dir);
    sendMove(dir, true);
  };

  const releaseDirection = (dir: Direction) => {
    if (!pressedRef.current.has(dir)) return;
    pressedRef.current.delete(dir);
    sendMove(dir, false);
  };

  const releaseAll = () => {
    Array.from(pressedRef.current).forEach((dir) => {
      releaseDirection(dir);
    });
  };

  const resetLocalMatchState = () => {
    setFinished(false);
    setReadyToStart(false);
    setRematchRequested(false);
    setRematchAvailable(false);
    setMatchEnded(false);
    setGameState(null);
    setShowAnswerBox(false);
    setAnswerText("");
    setAnswerError(null);
    setBookQuestion(null);
    setBookResultMessage(null);
    answerAreaOpenedRef.current = false;
    setEarnedPoints(0);
    setEarnedExp(0);
    setBasePoints(0);
    setPlacementBonusPoints(0);
    setSurvivalBonusPoints(0);
    setAwardStatus("idle");
    setAnswerSuccessMessage(null);
    setShowGameSetText(false);
    awardedOnceRef.current = false;
    sentRef.current = false;
    clearPendingAward();
    releaseAll();
    pressedRef.current.clear();
    answerAreaOpenedRef.current = false;
    setBookQuestion(null);
    setBookResultMessage(null);
    setAnswerSuccessMessage(null);
    setShowGameSetText(false);
  };

  const handleJoin = () => {
    const name = playerName.trim();

    if (!name) {
      setNameError("名前を入力してください");
      return;
    }

    const lower = name.toLowerCase();
    const found = bannedWords.some((word) => lower.includes(word));
    if (found) {
      setNameError("不適切な言葉は使えません");
      return;
    }

    setNameError(null);
    setJoined(true);
    roomLockedRef.current = false;

    if (mode === "random") {
      joinRandom(
        { maxPlayers: 4, gameType: "word", userId: user?.id ?? null },
        (createdCode) => {
          setRoomCode(createdCode);

          setTimeout(() => {
            socket?.emit("word_join", {
              roomCode: createdCode,
              playerName: name,
              userId: user?.id ?? null,
            });
          }, 300);
        },
      );
    } else {
      const roomKey = `word_${code}`;

      joinWithCode(code, count, "word", user?.id ?? null);
      setRoomCode(roomKey);

      setTimeout(() => {
        socket?.emit("word_join", {
          roomCode: roomKey,
          playerName: name,
          userId: user?.id ?? null,
        });
      }, 300);
    }
  };

  const handleReady = () => {
    if (!socket || !roomCode) return;

    sendReady(0);
    setReadyToStart(true);

    socket.emit("word_ready", {
      roomCode,
    });
  };

  const handleSubmitBookAnswer = (choiceIndex: number) => {
    if (!socket || !roomCode || !bookQuestion) return;

    socket.emit("word_book_answer", {
      roomCode,
      choiceIndex,
    });

    setBookQuestion(null);
  };

  const handleSubmitAnswer = () => {
    if (!socket || !roomCode) return;
    const answer = answerText.trim();

    if (!answer) {
      setAnswerError("答えを入力してください");
      return;
    }

    if (cooldownSec > 0) {
      setAnswerError(`あと${cooldownSec}秒待ってから回答できます`);
      return;
    }

    setAnswerError(null);
    socket.emit("word_submit_answer", {
      roomCode,
      answer,
    });
  };

  const handleRematch = () => {
    if (!socket || !roomCode || rematchRequested) return;

    setRematchRequested(true);

    socket.emit("request_rematch", {
      roomCode,
      gameType: "word",
    });
  };

  const handleNewMatch = () => {
    setBattleKey((prev) => prev + 1);
    resetLocalMatchState();
    resetMatch();

    roomLockedRef.current = false;

    if (mode === "random") {
      joinRandom(
        { maxPlayers: 4, gameType: "word", userId: user?.id ?? null },
        (createdCode) => {
          setRoomCode(createdCode);

          setTimeout(() => {
            socket?.emit("word_join", {
              roomCode: createdCode,
              playerName,
              userId: user?.id ?? null,
            });
          }, 300);
        },
      );
    } else {
      joinWithCode(code, count, "word", user?.id ?? null);
      const nextRoomCode = `word_${code}`;
      setRoomCode(nextRoomCode);

      setTimeout(() => {
        socket?.emit("word_join", {
          roomCode: nextRoomCode,
          playerName,
          userId: user?.id ?? null,
        });
      }, 300);
    }
  };

  const handleShareX = () => {
    const text = [
      "【ひまQ｜ワードチェイス📚】",
      `順位：${myRank ?? "-"}位`,
      `クイズ正解：${correctCount}問`,
      `見つけた文字：${foundLetters}`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #ワードチェイス #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("room_full", () => {
      setRoomFull(true);
    });

    socket.on(
      "update_room_count",
      ({
        players,
        current,
        max,
      }: {
        players: RoomPlayer[];
        current: number;
        max: number;
      }) => {
        if (roomLockedRef.current) return;

        setRoomPlayers(players);
        setPlayerCount(`${current}/${max}`);
        setMaxPlayers(max);

        if (current >= max) {
          roomLockedRef.current = true;
        }
      },
    );

    socket.on("word_state", (state: WordGameState) => {
      setGameState(state);

      if (state.phase === "gameOver") {
        setFinished(true);
      } else {
        setFinished(false);
        setRematchRequested(false);
        setRematchAvailable(false);
      }
    });

    socket.on("word_game_result", (state: WordGameState) => {
      setGameState(state);
      setFinished(true);
    });

    socket.on("word_book_question", (payload: WordBookQuestionPayload) => {
      setBookQuestion(payload);
      setBookResultMessage(null);
      setShowAnswerBox(false);
    });

    socket.on("word_book_result", (payload: { ok: boolean; message?: string }) => {
      setBookResultMessage(payload.message ?? (payload.ok ? "正解！" : "不正解！"));
      window.setTimeout(() => setBookResultMessage(null), 2800);
    });

    socket.on("word_answer_result", (payload: { ok?: boolean; locked?: boolean; waitMs?: number; message?: string }) => {
      if (payload.ok) {
        setAnswerError(null);
        setShowAnswerBox(false);

        setAnswerSuccessMessage(
          payload.message ?? "ワード正解！"
        );

        setTimeout(() => {
          setShowGameSetText(true);
        }, 1800);

        setTimeout(() => {
          setFinished(true);
        }, 3200);

        return;
      }

      if (payload.locked) {
        setAnswerError(`まだ回答できません。あと${Math.ceil((payload.waitMs ?? 0) / 1000)}秒`);
        return;
      }

      setAnswerError(`不正解！次は${Math.ceil((payload.waitMs ?? 5000) / 1000)}秒後に回答できます`);
    });

    socket.on("word_match_ended", () => {
      setMatchEnded(true);
      setFinished(true);
    });

    socket.on("rematch_start", () => {
      resetLocalMatchState();
      setReadyToStart(true);
    });

    socket.on("word_rematch_available", () => {
      setRematchAvailable(true);
    });

    return () => {
      socket.off("room_full");
      socket.off("update_room_count");
      socket.off("word_state");
      socket.off("word_game_result");
      socket.off("word_book_question");
      socket.off("word_book_result");
      socket.off("word_answer_result");
      socket.off("word_match_ended");
      socket.off("rematch_start");
      socket.off("word_rematch_available");
    };
  }, [socket, playerName, roomCode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isArrowKey =
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight";

      if (isArrowKey) {
        e.preventDefault();
      }

      if (e.repeat || bookQuestion || showAnswerBox) return;

      if (e.key === "ArrowUp") pressDirection("up");
      if (e.key === "ArrowDown") pressDirection("down");
      if (e.key === "ArrowLeft") pressDirection("left");
      if (e.key === "ArrowRight") pressDirection("right");
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        releaseDirection("up");
      }

      if (e.key === "ArrowDown") {
        releaseDirection("down");
      }

      if (e.key === "ArrowLeft") {
        releaseDirection("left");
      }

      if (e.key === "ArrowRight") {
        releaseDirection("right");
      }

      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseAll);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseAll);
      releaseAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomCode, finished]);

  useEffect(() => {
    if (allPlayersReady && !bothReady) {
      setShowStartButton(false);

      const timer = setTimeout(() => {
        setShowStartButton(true);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [allPlayersReady, bothReady]);

  useEffect(() => {
    if (!inAnswerArea) {
      answerAreaOpenedRef.current = false;
      return;
    }

    if (
      answerAreaOpenedRef.current ||
      finished ||
      bookQuestion ||
      gameState?.phase !== "playing"
    ) return;

    answerAreaOpenedRef.current = true;
    setShowAnswerBox(true);
  }, [inAnswerArea, finished, bookQuestion]);

  useEffect(() => {
    if (!finished) return;
    if (!mySocketId) return;

    const ranks = finalRanks;
    const myRankNow =
      ranks.find((r) => r.socketId === mySocketId)?.rank ?? null;
    if (!myRankNow) return;

    const base = correctCount * 10;
    const survival = foundLetters * 20;
    const placement = calcPlacementBonus(maxPlayers, ranks, mySocketId);
    const earned = base + survival + placement;
    const expEarned = correctCount * 20 + foundLetters * 10;

    setBasePoints(base);
    setSurvivalBonusPoints(survival);
    setPlacementBonusPoints(placement);
    setEarnedPoints(earned);
    setEarnedExp(expEarned);

    if (earned <= 0 && expEarned <= 0) {
      setAwardStatus("idle");
      clearPendingAward();
      return;
    }

    const payload: PendingAward = {
      points: earned,
      exp: expEarned,
      correctCount,
      basePoints: base,
      placementBonusPoints: placement,
      survivalBonusPoints: survival,
      createdAt: Date.now(),
    };

    savePendingAward(payload);
    awardPointsAndExp(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, mySocketId]);

  useEffect(() => {
    if (!finished) return;
    if (!userLoading && !user) return;
    if (!mySocketId) return;
    if (sentRef.current) return;

    const ranks = finalRanks;
    const myRankNow =
      ranks.find((r) => r.socketId === mySocketId)?.rank ?? null;
    if (!myRankNow) return;

    sentRef.current = true;

    (async () => {
      try {
        const weekStart = getWeekStartJST();
        const monthStart = getMonthStartJST();

        const { error: weeklyErr } = await supabase.rpc("upsert_weekly_stats", {
          p_user_id: user!.id,
          p_week_start: weekStart,
          p_score_add: earnedPoints,
          p_correct_add: correctCount,
          p_play_add: 1,
          p_best_streak: foundLetters,
        });

        if (weeklyErr) {
          console.log("upsert_weekly_stats error:", weeklyErr);
        }

        const { error: monthlyErr } = await supabase.rpc(
          "upsert_monthly_stats",
          {
            p_user_id: user!.id,
            p_month_start: monthStart,
            p_score_add: earnedPoints,
            p_correct_add: correctCount,
            p_play_add: 1,
            p_best_streak: foundLetters,
          },
        );

        if (monthlyErr) {
          console.log("upsert_monthly_stats error:", monthlyErr);
        }

        const res = await submitGameResult(supabase, {
          game: "word",
          score: foundLetters,
          title: null,
          firstPlace: myRankNow === 1,
          writeLog: true,
        });

        const modal = buildResultModalPayload("word", res);
        if (modal) pushModal(modal);
      } catch (e) {
        console.error("[word_chase] submitGameResult error:", e);
      }
    })();
  }, [
    finished,
    userLoading,
    user,
    mySocketId,
    finalRanks,
    earnedPoints,
    correctCount,
    foundLetters,
    supabase,
    pushModal,
  ]);

  if (!joined) {
    return (
      <main className="overflow-hidden bg-gradient-to-b from-[#4a1810] via-[#7c2d12] to-[#d97706] text-white">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />

        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 my-20 text-center">
          <p className="mb-3 rounded-full border border-amber-300/60 bg-white/10 px-4 py-1 text-sm font-black tracking-[0.3em] text-amber-100">
            WORD CHASE
          </p>

          <WordGlassCard className="w-full max-w-md p-5">
            <p className="mb-3 text-xl font-black text-amber-100">
              ニックネームを入力してください
            </p>
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                const value = e.target.value.slice(0, 10);
                setPlayerName(value);

                const lower = value.toLowerCase();
                const found = bannedWords.some((word) => lower.includes(word));
                setNameError(found ? "不適切な言葉は使えません" : null);
              }}
              maxLength={10}
              placeholder="最大10文字"
              className="mb-3 w-full rounded-2xl border border-amber-300/60 bg-white/10 px-4 py-3 text-center text-xl font-black text-white outline-none placeholder:text-white/45"
            />

            {nameError && (
              <p className="mb-3 font-bold text-red-300">{nameError}</p>
            )}

            <button
              onClick={handleJoin}
              className="w-full rounded-full border-2 border-amber-200 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 px-8 py-3 text-xl font-black text-white shadow-[0_0_30px_rgba(245,158,11,0.45)] transition hover:scale-105"
            >
              本の世界へ出発する
            </button>

            {roomFull && (
              <p className="mt-3 font-bold text-red-300">
                このルームは満員です。
              </p>
            )}
          </WordGlassCard>
        </div>
      </main>
    );
  }

  if (!allPlayersReady) {
    return (
      <main className="bg-gradient-to-b from-[#4a1810] via-[#7c2d12] to-[#d97706] px-4 py-10 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-sm font-black tracking-[0.4em] text-amber-200">
            MATCHING
          </p>
          <h1 className="mb-6 text-4xl font-black md:text-6xl">
            プレイヤー待機中…
          </h1>

          <WordGlassCard className="p-6">
            <p className="mb-2 text-xl font-black text-amber-100">
              あなた：{playerName}
            </p>
            <p className="text-3xl font-black text-yellow-200 animate-pulse">
              {playerCount}
            </p>
            <p className="mt-3 text-sm font-bold text-white/60">
              {/* 最大4人まで。メンバーが揃うと準備画面に進みます。 */}
            </p>
          </WordGlassCard>
        </div>
      </main>
    );
  }

  if (allPlayersReady && !bothReady) {
    return (
      <main className="bg-gradient-to-b from-[#4a1810] via-[#7c2d12] to-[#d97706] px-4 py-10 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-black tracking-[0.4em] text-amber-200">
            READY ROOM
          </p>
          <h1
            className="
              mb-6
              text-4xl
              md:text-6xl
              font-black
              text-white
              drop-shadow-[0_0_8px_rgba(255,255,255,1)]
            "
          >
            メンバーが揃ったよ！
          </h1>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {roomPlayers.map((p, i) => (
              <WordGlassCard key={p.socketId} className="p-3">
                {/* <p className="text-3xl">{PLAYER_EMOJIS[i % PLAYER_EMOJIS.length]}</p> */}
                <p className="truncate font-black text-white">{p.playerName}</p>
              </WordGlassCard>
            ))}
          </div>

          <AnimatePresence>
            {!readyToStart && showStartButton && (
              <motion.div
                key="ready-box"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
              >
                <p className="mb-4 text-lg font-bold text-white/70 md:text-2xl">
                  準備できたら「対戦スタート！」を押そう！
                </p>
                <button
                  onClick={handleReady}
                  className="animate-pulse rounded-full border-2 border-yellow-100 bg-gradient-to-r from-[#6b1d1d] via-[#a16207] to-[#f59e0b] px-8 py-4 text-2xl font-black text-white shadow-[0_0_35px_rgba(245,158,11,0.55)] transition hover:scale-110"
                >
                  対戦スタート！
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {readyToStart && (
            <p className="mt-4 text-2xl font-black text-amber-100 animate-pulse">
              全員の準備を待っています…
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main
      key={battleKey}
      className={`overflow-hidden bg-gradient-to-b ${
        finished ? "from-[#4a1810] via-[#7c2d12] to-[#d97706]" : theme.bg
      } text-white`}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />

      <div className="relative mx-auto max-w-7xl px-1 py-1 md:px-6 md:py-6">
        {!finished ? (
          <>
            <div className="mb-3 grid gap-3 md:grid-cols-[1fr_280px]">
              <section className="rounded-3xl border border-white/15 bg-black/35 p-1 md:p-3 backdrop-blur">
                <div
                  className={`mb-3 rounded-3xl border ${theme.border} bg-gradient-to-r ${theme.panel} p-3 text-center ${theme.glow}`}
                >
                  <p
                    className={`text-sm md:text-md font-black ${theme.accent}`}
                  >
                    {theme.label}
                  </p>

                  <p className="mt-1 text-xl font-black text-white md:text-3xl">
                    {/* {gameState?.question?.question ??
                      "本を探してクイズに正解し、文字とヒントを集めよう！"} */}
                    {gameState?.question?.question ??
                      "📚本を探して文字を集めよう！💡ヒント本もどこかにあるかも？🔤集めた文字を並び替えて、中央の「解答の書」で解答しよう！"}
                  </p>

                  <div className="mt-1 md:mt-4 flex justify-center">
                    <div
                      className="
                        rounded-full
                        border-2 border-yellow-200/50
                        bg-black/50
                        px-4 py-1
                        md:px-8 md:py-2
                        shadow-[0_0_35px_rgba(250,204,21,0.65)]
                        backdrop-blur
                      "
                    >
                      <span className="mr-2 text-sm md:text-xl font-black text-white/60">
                        残り
                      </span>

                      <span className="text-2xl md:text-4xl font-black text-yellow-200 md:text-4xl animate-pulse">
                        {gameState?.timeLeft ?? 180}
                      </span>

                      <span className="ml-1 text-xl font-black text-yellow-100">
                        秒
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex justify-center">
                    <div className="rounded-full border-2 border-amber-200/50 bg-black/45 px-4 py-1 text-sm font-black text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.35)]">
                      📚 残り本 {remainingBooks}冊
                    </div>
                  </div>
                </div>

                <div
                  ref={mapViewportRef}
                  className={`relative mx-auto h-[60vh] md:h-[68vh] min-h-[440px] md:min-h-[520px] w-full max-w-[980px] overflow-hidden rounded-[2rem] border-4 ${theme.border} bg-[#1f1208] ${theme.glow}`}
                >
                  <div
                    className="absolute left-0 top-0"
                    style={{
                      width: WORD_WORLD_WIDTH,
                      height: WORD_WORLD_HEIGHT,
                      transform: `translate3d(${cameraX}px, ${cameraY}px, 0)`,
                      transition: "transform 80ms linear",
                    }}
                  >
                  <div className="absolute inset-0 bg-[#3a2413]" />
                  {/* <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.12)_1px,transparent_1px)] [background-size:72px_72px]" /> */}

                  {(gameState?.walls ?? []).map((wall) => (
                    <div
                      key={wall.id}
                      className="absolute rounded-md border-2 border-amber-100/60 bg-gradient-to-br from-[#d6a35a] via-[#8b5e34] to-[#3b2416] shadow-[0_0_18px_rgba(251,191,36,0.35),inset_0_2px_0_rgba(255,255,255,0.22)]"
                      style={{
                        left: `${wall.x}px`,
                        top: `${wall.y}px`,
                        width: `${wall.w}px`,
                        height: `${wall.h}px`,
                      }}
                    />
                  ))}

                  <div
                    className="absolute h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-amber-200/45 bg-yellow-200/5 shadow-[0_0_50px_rgba(251,191,36,0.35)]"
                    style={{
                      left: WORD_ANSWER_X,
                      top: WORD_ANSWER_Y,
                    }}
                  />

                  <div
                    className="absolute z-10 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 border-yellow-200 bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-500 text-black shadow-[0_0_38px_rgba(250,204,21,0.75)] md:h-44 md:w-44"
                    style={{
                      left: WORD_ANSWER_X,
                      top: WORD_ANSWER_Y,
                    }}
                  >
                    <span className="text-5xl md:text-7xl">
                      📖
                    </span>

                    <span className="text-xs font-black md:text-sm">
                      解答の書
                    </span>
                  </div>

                  {(gameState?.books ?? gameState?.items ?? [])
                    .filter((book) => !book.usedBy?.includes(mySocketId ?? ""))
                    .map((book) => {
                    const bookStyle =
                      book.type === "hint"
                        ? "border-red-200 bg-gradient-to-br from-red-500 to-rose-800 text-yellow-100 shadow-[0_0_22px_rgba(248,113,113,0.75)]"
                        : book.type === "fake"
                          ? "border-stone-300 bg-gradient-to-br from-stone-500 to-amber-900 text-stone-100 shadow-[0_0_18px_rgba(120,113,108,0.55)]"
                          : "border-emerald-200 bg-gradient-to-br from-emerald-400 to-green-800 text-yellow-100 shadow-[0_0_22px_rgba(52,211,153,0.65)]";

                    const icon =
                      BOOK_EMOJIS[
                        book.id
                          .split("")
                          .reduce((a, c) => a + c.charCodeAt(0), 0) %
                          BOOK_EMOJIS.length
                      ];

                    return (
                      <div
                        key={book.id}
                        className={`absolute flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-2xl font-black md:h-16 md:w-16 md:text-3xl ${bookStyle} ${book.solved ? "opacity-45 grayscale" : ""}`}
                        style={{
                          left: `${toWorldX(book.x)}px`,
                          top: `${toWorldY(book.y)}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        {icon}
                      </div>
                    );
                  })}

                  {displayPlayers.map((player, index) => {
                    const isMe = player.socketId === mySocketId;
                    return (
                      <motion.div
                        key={player.socketId}
                        animate={{
                          left: `${toWorldX(player.x)}px`,
                          top: `${toWorldY(player.y)}px`,
                        }}
                        transition={{ type: "tween", duration: 0.08 }}
                        style={{
                          transform: "translate(-50%, -50%)",
                        }}
                        className="absolute"
                      >
                        {!player.alive && (
                          <motion.div
                            className="absolute inset-0 z-20 flex items-center justify-center text-5xl"
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={{
                              scale: [0.6, 1.8, 1.1],
                              opacity: [0, 1, 0.9],
                            }}
                            transition={{ duration: 0.65 }}
                          >
                            💥
                          </motion.div>
                        )}

                        <Image
                          src={getPlayerImage(player)}
                          alt="player"
                          width={60}
                          height={60}
                          className={`
                            h-12 w-12 md:h-[66px] md:w-[66px]
                            object-contain

                            ${
                              isMe
                                ? "opacity-100 drop-shadow-[0_0_20px_gold]"
                                : "opacity-80"
                            }

                            ${!player.alive ? "opacity-40 grayscale" : ""}
                          `}
                        />

                        <span
                          className="
                            absolute
                            -bottom-6
                            left-1/2
                            -translate-x-1/2
                            w-20
                            truncate
                            text-center
                            text-xs
                            font-black
                            text-white
                          "
                        >
                          {isMe ? "YOU" : player.name}
                        </span>
                      </motion.div>
                    );
                  })}

                  </div>

                  {/* <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-200/40" /> */}

                  <AnimatePresence>
                    {bookQuestion && (
                      <motion.div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div
                          initial={{ scale: 0.85, opacity: 0, y: 12 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.9, opacity: 0, y: 12 }}
                          className="w-full max-w-lg rounded-[2rem] border-4 border-[#3b2416] bg-[#fff5d6] p-5 text-center text-[#3b2416] shadow-[0_8px_0_rgba(59,36,22,1)]"
                        >
                          <p className="text-sm font-black tracking-[0.25em] text-[#8b3a1f]">
                            {bookQuestion.bookType === "letter"
                              ? "文字の本"
                              : bookQuestion.bookType === "hint"
                                ? "ヒントの本"
                                : "あやしい本"}
                          </p>
                          <p className="mt-2 text-xl font-black md:text-2xl">
                            {bookQuestion.question.question}
                          </p>

                          <div className="mt-5 grid gap-3">
                            {bookQuestion.question.choices.map((choice, index) => (
                              <button
                                key={`${choice}-${index}`}
                                type="button"
                                onClick={() => handleSubmitBookAnswer(index)}
                                className="rounded-2xl border-3 border-[#3b2416] bg-white px-4 py-3 text-lg font-black text-[#3b2416] shadow-[0_4px_0_rgba(59,36,22,1)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
                              >
                                {choice}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {bookResultMessage && (
                      <motion.div
                        className="absolute left-1/2 top-4 z-40 w-[90%] max-w-md -translate-x-1/2 rounded-3xl border-3 border-[#3b2416] bg-[#fff2cf] px-4 py-3 text-center text-lg font-black text-[#3b2416] shadow-[0_5px_0_rgba(59,36,22,1)]"
                        initial={{ opacity: 0, y: -14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                      >
                        {bookResultMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showAnswerBox && (
                      <motion.div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div
                          initial={{ scale: 0.85, opacity: 0, y: 12 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.9, opacity: 0, y: 12 }}
                          className="w-full max-w-md rounded-[2rem] border-4 border-amber-300 bg-[#fff5d6] p-5 text-center text-[#2b1645] shadow-[0_8px_0_rgba(0,0,0,1)]"
                        >
                          <p className="text-sm font-black tracking-[0.25em] text-amber-700">
                            中央の辞書ページ
                          </p>
                          <p className="mt-1 text-2xl font-black md:text-3xl">
                            答えを入力！
                          </p>

                          <div className="mt-4 flex justify-center gap-2">
                            {Array.from({ length: targetLength }).map(
                              (_, i) => (
                                <span
                                  key={i}
                                  className="grid h-10 w-10 place-items-center rounded-xl border-2 border-black bg-white text-xl font-black shadow-[0_3px_0_rgba(0,0,0,1)]"
                                >
                                  {myFoundLetters[i] || "□"}
                                </span>
                              ),
                            )}
                          </div>

                          <div className="mt-4 rounded-2xl border-2 border-emerald-500 bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-900">
                            見つけた文字：
                            {foundLetterList.length > 0
                              ? foundLetterList.join(" ・ ")
                              : "まだなし"}
                          </div>

                          {hints.length > 0 && (
                            <div className="mt-4 rounded-2xl border-2 border-amber-600 bg-amber-100 px-3 py-2 text-sm font-black text-amber-900">
                              ヒント：{hints.join(" / ")}
                            </div>
                          )}

                          <input
                            value={answerText}
                            onChange={(e) => {
                              setAnswerText(e.target.value.slice(0, 12));
                              setAnswerError(null);
                            }}
                            disabled={cooldownSec > 0}
                            placeholder={
                              cooldownSec > 0
                                ? `あと${cooldownSec}秒待ってね`
                                : "ひらがなで入力"
                            }
                            className="mt-4 w-full rounded-2xl border-3 border-black bg-white px-4 py-3 text-center text-xl font-black outline-none disabled:bg-stone-200"
                          />

                          {answerError && (
                            <p className="mt-2 font-black text-red-600">
                              {answerError}
                            </p>
                          )}

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAnswerBox(false);
                                (document.activeElement as HTMLElement)?.blur();
                              }}
                              className="rounded-full border-3 border-black bg-white px-4 py-3 font-black shadow-[0_4px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                            >
                              戻る
                            </button>
                            <button
                              type="button"
                              onClick={handleSubmitAnswer}
                              disabled={cooldownSec > 0}
                              className="rounded-full border-3 border-black bg-gradient-to-r from-yellow-300 to-orange-500 px-4 py-3 font-black text-black shadow-[0_4px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:opacity-50"
                            >
                              回答する
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {answerSuccessMessage && (
                      <motion.div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 text-center backdrop-blur-sm">
                        <motion.div
                          initial={{ scale: 0.75, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="rounded-[2rem] border-4 border-yellow-200 bg-[#fff5d6] px-6 py-6 text-3xl font-black text-[#3b2416] shadow-[0_8px_0_rgba(59,36,22,1)] md:text-5xl"
                        >
                          {answerSuccessMessage}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showGameSetText && (
                      <motion.div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/85 text-center backdrop-blur-sm">
                        <motion.p
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: [1.25, 1], opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="text-6xl font-black text-yellow-200 drop-shadow-[0_0_35px_rgba(250,204,21,0.9)] md:text-8xl"
                        >
                          GAME SET!
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {gameState?.phase === "countdown" && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-black/75 text-7xl font-black"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {gameState.message ?? "START!"}
                      </motion.div>
                    )}

                    {gameState?.phase === "stageResult" && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-black/75 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div>
                          <p className="text-4xl font-black text-yellow-200 md:text-6xl">
                            判定！
                          </p>
                          <p className="mt-3 px-6 text-2xl md:text-4xl font-bold text-white/80">
                            {gameState.stageResultMessage ??
                              gameState.message ??
                              "次のステージへ…"}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {isDead && gameState?.phase === "playing" && (
                      <motion.div
                        className="absolute inset-x-4 top-4 rounded-3xl border border-red-300/40 bg-red-950/70 px-4 py-3 text-center text-sm md:text-xl font-black text-red-100 backdrop-blur"
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        終了しました：ほかのプレイヤーを見守ろう
                      </motion.div>
                    )}

                    {gameState?.phase === "stageIntro" && (
                      <motion.div
                        className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 text-center backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: [0.9, 1.08, 1], opacity: 1 }}
                          transition={{ duration: 0.45 }}
                        >
                          <p className="text-sm font-black tracking-[0.5em] text-amber-200">
                            WORD CHASE
                          </p>
                          {/* <p className="mt-3 text-2xl font-black text-yellow-200">
                            {theme.title}
                          </p> */}
                        </motion.div>
                      </motion.div>
                    )}

                    {gameState?.phase === "gameSet" && (
                      <motion.div
                        className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 text-center backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div
                          initial={{ scale: 0.65, opacity: 0, rotate: -4 }}
                          animate={{
                            scale: [0.9, 1.15, 1],
                            opacity: 1,
                            rotate: 0,
                          }}
                          transition={{ duration: 0.55 }}
                        >
                          <p className="text-7xl font-black text-white drop-shadow-[0_0_35px_rgba(255,255,255,1)] md:text-9xl">
                            GAME SET!
                          </p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              <aside className="rounded-3xl border border-white/15 bg-black/35 p-4 backdrop-blur">
                {/* <WordGlassCard className="mb-4 p-3">
                  <p className="mb-3 text-center text-sm font-black tracking-[0.25em] text-amber-200">
                    文字発見状況
                  </p>

                  <div className="space-y-2">
                    {displayPlayers.map((player) => {
                      const isMe = player.socketId === mySocketId;
                      const found = getPlayerFoundCount(player);

                      return (
                        <div
                          key={player.socketId}
                          className={`rounded-2xl border px-3 py-2 ${
                            isMe
                              ? "border-yellow-300 bg-yellow-300/20"
                              : "border-white/10 bg-white/10"
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate text-sm font-black text-white">
                              {isMe ? "YOU" : player.name}
                            </span>
                            <span className="text-xs font-black text-amber-100">
                              {found}/{targetLength}
                            </span>
                          </div>

                          <ProgressBooks found={found} total={targetLength} />
                        </div>
                      );
                    })}
                  </div>
                </WordGlassCard> */}
                <p className="mb-3 text-center text-xl font-black text-amber-100">
                  {/* プレイヤー */}
                  探索状況
                </p>

                <div className="space-y-2">
                  <AnimatePresence>
                    {showAnswerBox && (
                      <motion.div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div
                          initial={{ scale: 0.85, opacity: 0, y: 12 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.9, opacity: 0, y: 12 }}
                          className="w-full max-w-md rounded-[2rem] border-4 border-amber-300 bg-[#fff5d6] p-5 text-center text-[#2b1645] shadow-[0_8px_0_rgba(0,0,0,1)]"
                        >
                          <p className="text-sm font-black tracking-[0.25em] text-amber-700">
                            中央の辞書ページ
                          </p>
                          <p className="mt-1 text-2xl font-black md:text-3xl">
                            答えを入力！
                          </p>

                          <div className="mt-4 flex justify-center gap-2">
                            {Array.from({ length: targetLength }).map(
                              (_, i) => (
                                <span
                                  key={i}
                                  className="grid h-10 w-10 place-items-center rounded-xl border-2 border-black bg-white text-xl font-black shadow-[0_3px_0_rgba(0,0,0,1)]"
                                >
                                  {myFoundLetters[i] || "□"}
                                </span>
                              ),
                            )}
                          </div>

                          {hints.length > 0 && (
                            <div className="mt-4 rounded-2xl border-2 border-amber-600 bg-amber-100 px-3 py-2 text-sm font-black text-amber-900">
                              ヒント：{hints.join(" / ")}
                            </div>
                          )}

                          <input
                            value={answerText}
                            onChange={(e) => {
                              setAnswerText(e.target.value.slice(0, 12));
                              setAnswerError(null);
                            }}
                            disabled={cooldownSec > 0}
                            placeholder={
                              cooldownSec > 0
                                ? `あと${cooldownSec}秒待ってね`
                                : "ひらがなで入力"
                            }
                            className="mt-4 w-full rounded-2xl border-3 border-black bg-white px-4 py-3 text-center text-xl font-black outline-none disabled:bg-stone-200"
                          />

                          {answerError && (
                            <p className="mt-2 font-black text-red-600">
                              {answerError}
                            </p>
                          )}

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setShowAnswerBox(false)}
                              className="rounded-full border-3 border-black bg-white px-4 py-3 font-black shadow-[0_4px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                            >
                              戻る
                            </button>
                            <button
                              type="button"
                              onClick={handleSubmitAnswer}
                              disabled={cooldownSec > 0}
                              className="rounded-full border-3 border-black bg-gradient-to-r from-yellow-300 to-orange-500 px-4 py-3 font-black text-black shadow-[0_4px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:opacity-50"
                            >
                              回答する
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* {displayPlayers.map((player, index) => { */}
                  {[...displayPlayers]
                    .sort((a, b) => {
                      if (a.socketId === mySocketId) return -1;
                      if (b.socketId === mySocketId) return 1;
                      return 0;
                    })
                    .map((player, index) => {
                    const isMe = player.socketId === mySocketId;

                    return (
                      <div
                        key={player.socketId}
                        className={`rounded-2xl border px-3 py-2 ${
                          isMe
                            ? "border-yellow-300 bg-yellow-300/15"
                            : "border-white/15 bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-black">
                            {/* {PLAYER_EMOJIS[index % PLAYER_EMOJIS.length]}{" "} */}
                            {isMe ? "あなた" : player.name}
                          </p>
                          <p
                            className={`text-xs font-black ${
                              player.alive ? "text-emerald-300" : "text-red-300"
                            }`}
                          >
                            {player.alive
                              ? "探索中"
                              : reasonLabel(player.eliminatedReason)}
                          </p>
                        </div>
                        {/* <p className="mt-1 text-sm font-bold text-white/70">
                          見つけた文字：{player.foundLetters ?? 0} / {targetLength}
                           / クイズ：{player.correctCount ?? 0}
                        </p> */}
                        {/* {isMe && (
                          <p className="mt-1 text-sm font-bold text-white/70">
                            見つけた文字：{player.foundLetters ?? 0} / {targetLength}
                          </p>
                        )} */}
                        <p className="mt-1 text-sm font-bold text-white/70">
                          見つけた文字：
                          {isMe
                            ? (player.foundLetters ?? 0)
                            : getPlayerFoundCount(player)}
                          / {targetLength}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm font-bold text-white/60">
                  <p>PC：矢印キーで移動</p>
                  <p className="md:hidden">スマホ：下のボタンで移動</p>
                </div>
              </aside>
            </div>

            <div className="md:hidden">
              <MobileControls
                onPress={pressDirection}
                onRelease={releaseDirection}
              />
            </div>

            <p className="mt-4 hidden text-center text-sm font-bold text-white/50 md:block">
              PC操作：矢印キーで移動
            </p>
          </>
        ) : (
          <WordChaseResult
            myRank={myRank}
            ranks={finalRanks}
            players={displayPlayers}
            correctCount={correctCount}
            foundLetters={foundLetters}
            basePoints={basePoints}
            placementBonusPoints={placementBonusPoints}
            survivalBonusPoints={survivalBonusPoints}
            earnedPoints={earnedPoints}
            earnedExp={earnedExp}
            awardStatus={awardStatus}
            isLoggedIn={!!user}
            onGoLogin={() => router.push("/user/login")}
            onShareX={handleShareX}
            onRematch={handleRematch}
            onNewMatch={handleNewMatch}
            rematchRequested={rematchRequested}
            rematchAvailable={rematchAvailable}
            isCodeMatch={mode === "code"}
          />
        )}
      </div>
    </main>
  );
}
