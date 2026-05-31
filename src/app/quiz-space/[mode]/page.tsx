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
  survivedStages?: number;
  correctCount?: number;
};

type SpacePlayer = {
  socketId: string;
  name: string;
  x: number;
  y: number;
  alive: boolean;
  score: number;
  rank?: number;
  survivedStages?: number;
  correctCount?: number;
  eliminatedReason?: "wrong_area" | "meteor" | "laser" | "flame" | "timeout" | "unknown";
  invincibleUntil?: number;
  speedBoostUntil?: number;
  eliminatedAt?: number;
  userId?: string | null;
  skinImageUrl?: string | null;
  isCpu?: boolean;
};

type SpaceObstacle = {
  id: string;
  type: "meteor" | "laser";
  x: number;
  y: number;
  w: number;
  h: number;
};

type SpaceItem = {
  id: string;
  type: "invincible" | "speed" | "score";
  x: number;
  y: number;
};

type SpaceFlame = {
  id: string;
  x: number;
  y: number;
  size: number;
};

type SpaceQuestion = {
  question: string;
  choices: string[];
  correctIndex: number;
  displayAnswer?: string;
  explanation?: string;
};

type SpaceGameResult = {
  finalRanks: RankRow[];
  eliminationGroups: string[][];
  winnerSocketIds: string[];
};

type SpaceGameState = {
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
  stage: number;
  timeLeft: number;
  safeSize?: number;
  safeMin?: number;
  safeMax?: number;
  question: SpaceQuestion;
  players: SpacePlayer[];
  obstacles: SpaceObstacle[];
  items: SpaceItem[];
  flames: SpaceFlame[];
  message?: string;
  stageResultMessage?: string;
  gameResult?: SpaceGameResult;
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

const PENDING_KEY = "space_survive_award_pending_v1";

// const PLAYER_EMOJIS = ["🛸", "🚀", "👾", "🌟"];

const BONUS_TABLE: Record<number, number[]> = {
  2: [300],
  3: [400, 200],
  4: [500, 250, 120],
};

const STAGE_THEME: Record<
  number,
  {
    label: string;
    title: string;
    bg: string;
    panel: string;
    glow: string;
    border: string;
    accent: string;
  }
> = {
  1: {
    label: "STAGE 1",
    title: "平和",
    bg: "from-emerald-500/30 via-cyan-500/20 to-slate-950",
    panel: "from-emerald-400/25 to-cyan-400/10",
    glow: "shadow-[0_0_35px_rgba(52,211,153,0.45)]",
    border: "border-emerald-300",
    accent: "text-emerald-200",
  },
  2: {
    label: "STAGE 2",
    title: "注意",
    bg: "from-yellow-400/30 via-orange-500/20 to-slate-950",
    panel: "from-yellow-300/25 to-orange-500/10",
    glow: "shadow-[0_0_35px_rgba(251,191,36,0.45)]",
    border: "border-yellow-300",
    accent: "text-yellow-200",
  },
  3: {
    label: "STAGE 3",
    title: "危険",
    bg: "from-red-500/30 via-pink-600/20 to-slate-950",
    panel: "from-red-500/25 to-pink-600/10",
    glow: "shadow-[0_0_35px_rgba(244,63,94,0.45)]",
    border: "border-red-300",
    accent: "text-red-200",
  },
  4: {
    label: "STAGE 4",
    title: "カオス",
    bg: "from-purple-600/35 via-fuchsia-600/25 to-slate-950",
    panel: "from-purple-500/30 to-fuchsia-600/15",
    glow: "shadow-[0_0_35px_rgba(217,70,239,0.5)]",
    border: "border-fuchsia-300",
    accent: "text-fuchsia-200",
  },
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

const reasonLabel = (reason?: SpacePlayer["eliminatedReason"]) => {
  if (reason === "wrong_area") return "ハズレエリア";
  if (reason === "meteor") return "隕石に直撃";
  if (reason === "laser") return "レーザー命中";
  if (reason === "flame") return "炎に接触";
  if (reason === "timeout") return "時間切れ";
  return "脱落";
};

const calcPlacementBonus = (
  playerCount: number,
  ranksNow: RankRow[],
  mySocketId: string
) => {
  const table = BONUS_TABLE[playerCount] ?? [];
  const me = ranksNow.find((r) => r.socketId === mySocketId);
  if (!me) return 0;

  if (me.rank >= playerCount) return 0;

  const sameRankCount = ranksNow.filter((r) => r.rank === me.rank).length;
  if (sameRankCount !== 1) return 0;

  return table[me.rank - 1] ?? 0;
};

const buildRanksFromPlayers = (players: SpacePlayer[]): RankRow[] => {
  return [...players]
    .map((p, index) => ({
      socketId: p.socketId,
      name: p.name,
      score: p.score ?? 0,
      rank: p.rank ?? index + 1,
      survivedStages: p.survivedStages ?? 0,
      correctCount: p.correctCount ?? 0,
    }))
    .sort((a, b) => a.rank - b.rank || b.score - a.score);
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

function SpaceGlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/15 bg-black/35 shadow-[0_0_35px_rgba(34,211,238,0.55),0_0_80px_rgba(168,85,247,0.35)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

function SpaceResult({
  myRank,
  ranks,
  players,
  correctCount,
  survivedStages,
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
  players: SpacePlayer[];
  correctCount: number;
  survivedStages: number;
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
      ? "text-cyan-100 drop-shadow-[0_0_20px_rgba(34,211,238,0.65)]"
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
      <p className="mb-2 text-sm font-black tracking-[0.45em] text-cyan-200">
        SPACE SURVIVE RESULT
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
            宇宙サバイバル終了！
          </p> */}
          <p className="mt-2 text-sm md:text-xl font-bold text-white/65 md:text-lg">
            最終結果
          </p>
        </motion.div>
      )}

      {showText2 && (
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SpaceGlassCard className="p-4">
            <p className="text-xs font-bold text-white/55">正解数</p>
            <p className="text-3xl font-black text-cyan-200">{correctCount}</p>
          </SpaceGlassCard>
          <SpaceGlassCard className="p-4">
            <p className="text-xs font-bold text-white/55">突破ステージ</p>
            <p className="text-3xl font-black text-fuchsia-200">
              {survivedStages}
            </p>
          </SpaceGlassCard>
          <SpaceGlassCard className="p-4">
            <p className="text-xs font-bold text-white/55">獲得P</p>
            <p className="text-3xl font-black text-yellow-200">{earnedPoints}</p>
          </SpaceGlassCard>
          <SpaceGlassCard className="p-4">
            <p className="text-xs font-bold text-white/55">EXP</p>
            <p className="text-3xl font-black text-purple-200">{earnedExp}</p>
          </SpaceGlassCard>
        </div>
      )}

      {showText3 && (
        <motion.div
          initial={{ scale: 0.7, rotate: -6, opacity: 0 }}
          animate={{ scale: [1.15, 1], rotate: 0, opacity: 1 }}
          transition={{ duration: 0.55 }}
          className="mx-auto mb-6 rounded-[2rem] border border-yellow-200/40 bg-gradient-to-r from-yellow-300/15 via-cyan-300/10 to-fuchsia-400/15 p-5 shadow-[0_0_40px_rgba(250,204,21,0.22)]"
        >
          <p className="text-sm font-black text-white/60">あなたの順位</p>
          <p className={`text-6xl font-black md:text-8xl ${rankClass}`}>
            {myRank ? `${myRank}位` : "集計中"}
          </p>
          {myRank === 1 && (
            <p className="mt-2 text-2xl font-black text-yellow-200">
              👑 宇宙No.1サバイバー！
            </p>
          )}
        </motion.div>
      )}

      {showText4 && (
        <SpaceGlassCard className="mb-6 p-4">
          <p className="mb-3 text-xl font-black text-cyan-100">みんなの順位</p>
          <div className="space-y-2">
            {ranks.map((rank, index) => {
              const p = players.find((player) => player.socketId === rank.socketId);
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
                        ? "text-cyan-100"
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
        </SpaceGlassCard>
      )}

      {showButton && (
        <SpaceGlassCard className="mb-6 p-5">
          <div className="mb-3 text-base font-bold leading-relaxed text-white/80 md:text-lg">
            <p className="text-cyan-200">
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
                  ❌ ポイント加算に失敗しました。時間をおいて再度お試しください。
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
        </SpaceGlassCard>
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
              {rematchRequested ? "ほかのサバイバーを待っています…" : "もう一回サバイブ！"}
            </button>
          ) : (
            <button
              onClick={onNewMatch}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-3 text-lg font-black text-white shadow-[0_0_25px_rgba(34,211,238,0.35)] md:w-auto"
            >
              もう一戦いく！
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
        <p className="mb-6 rounded-2xl border border-cyan-300/30 bg-black/40 px-4 py-3 text-center text-lg font-black text-cyan-100">
          ほかのサバイバーの準備を待っています…
        </p>
      )}

      {showButton && (
        <RecommendedMultiplayerGames
          title="次はみんなでどれ行く？🎮"
          count={4}
          excludeHref="/quiz-space"
        />
      )}
    </motion.div>
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
    "flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-200/60 bg-white/10 text-4xl font-black text-white shadow-[0_0_24px_rgba(34,211,238,0.35)] backdrop-blur active:scale-95";

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
    <div className="fixed bottom-4 left-1/2 z-40 w-[320px] -translate-x-1/2 rounded-3xl border border-white/15 bg-black/60 p-5 backdrop-blur">
      <div className="grid grid-cols-3 gap-4">
        <div />
        <button className={btn} {...bind("up")}>
          ↑
        </button>
        <div />

        <button className={btn} {...bind("left")}>
          ←
        </button>
        <button className={btn} {...bind("down")}>
          ↓
        </button>
        <button className={btn} {...bind("right")}>
          →
        </button>
      </div>
    </div>
  );
}

export default function SpaceSurviveModePage() {
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
  const [gameState, setGameState] = useState<SpaceGameState | null>(null);
  const [finished, setFinished] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchAvailable, setRematchAvailable] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [battleKey, setBattleKey] = useState(0);

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

  const theme = STAGE_THEME[gameState?.stage ?? 1] ?? STAGE_THEME[1];

  const DEFAULT_PLAYER_IMAGE = "/images/space_player.png";

  const getPlayerImage = (player: SpacePlayer) => {
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

  const displayPlayers: SpacePlayer[] = useMemo(() => {
    if (gameState?.players?.length) return gameState.players;

    return playersFromBattle.map((p, index) => ({
      socketId: p.socketId,
      name: p.playerName,
      x: 18 + index * 18,
      y: 50,
      alive: true,
      score: 0,
      rank: undefined,
      survivedStages: 0,
      correctCount: 0,
    }));
  }, [gameState, playersFromBattle]);

  const me = displayPlayers.find((p) => p.socketId === mySocketId);
  const allPlayersReady = roomPlayers.length >= maxPlayers;
  const isDead = !!me && !me.alive;
  const finalRanks = gameState?.gameResult?.finalRanks?.length
    ? gameState.gameResult.finalRanks
    : buildRanksFromPlayers(displayPlayers);
  const myRank = finalRanks.find((r) => r.socketId === mySocketId)?.rank ?? null;
  const correctCount = me?.correctCount ?? 0;
  const survivedStages = me?.survivedStages ?? 0;

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
        new CustomEvent("profile:updated", { detail: { oldLevel, newLevel } })
      );

      if (newLevel > oldLevel) {
        try {
          const { data: r, error: rErr } = await supabase.rpc(
            "claim_levelup_rewards",
            {
              p_user_id: authedUserId,
              p_old_level: oldLevel,
              p_new_level: newLevel,
            }
          );

          if (rErr) {
            console.error("claim_levelup_rewards error:", rErr);
          } else {
            const rewardRow = Array.isArray(r) ? r[0] : r;
            const awardedPoints = Number(rewardRow?.awarded_points ?? 0);
            const awardedTitle = (rewardRow?.awarded_title ?? null) as string | null;

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
                })
              );
            }
          }
        } catch (e) {
          console.error("levelup reward error:", e);
        }
      }

      if (payload.points > 0) {
        const { error: logError } = await supabase.from("user_point_logs").insert({
          user_id: authedUserId,
          change: payload.points,
          reason:
            `スペースサバイブ獲得: 正解${payload.correctCount}問=${payload.basePoints}P` +
            (payload.survivalBonusPoints
              ? ` / 突破ボーナス${payload.survivalBonusPoints}P`
              : "") +
            (payload.placementBonusPoints
              ? ` / 順位ボーナス${payload.placementBonusPoints}P`
              : ""),
        });
        if (logError) console.log("insert user_point_logs error raw:", logError);
      }

      if (payload.exp > 0) {
        const { error: logError2 } = await supabase.from("user_exp_logs").insert({
          user_id: authedUserId,
          change: payload.exp,
          reason: `スペースサバイブEXP獲得: 正解${payload.correctCount}問 → ${payload.exp}EXP`,
        });
        if (logError2) console.log("insert user_exp_logs error raw:", logError2);
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

    socket.emit("space_move_input", {
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
    setEarnedPoints(0);
    setEarnedExp(0);
    setBasePoints(0);
    setPlacementBonusPoints(0);
    setSurvivalBonusPoints(0);
    setAwardStatus("idle");
    awardedOnceRef.current = false;
    sentRef.current = false;
    clearPendingAward();
    releaseAll();
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
      joinRandom({ maxPlayers: 4, gameType: "space", userId: user?.id ?? null }, (createdCode) => {
        setRoomCode(createdCode);

        setTimeout(() => {
          socket?.emit("space_join", {
            roomCode: createdCode,
            playerName: name,
            userId: user?.id ?? null,
          });
        }, 300);
      });
    } else {
      const roomKey = `space_${code}`;

      joinWithCode(code, count, "space", user?.id ?? null);
      setRoomCode(roomKey);

      setTimeout(() => {
        socket?.emit("space_join", {
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

    socket.emit("space_ready", {
      roomCode,
    });
  };

  const handleRematch = () => {
    if (!socket || !roomCode || rematchRequested) return;

    setRematchRequested(true);

    socket.emit("send_ready", {
      roomCode,
      gameType: "space",
    });
  };

  const handleNewMatch = () => {
    setBattleKey((prev) => prev + 1);
    resetLocalMatchState();
    resetMatch();

    roomLockedRef.current = false;

    if (mode === "random") {
      joinRandom({ maxPlayers: 4, gameType: "space", userId: user?.id ?? null }, (createdCode) => {
        setRoomCode(createdCode);

        setTimeout(() => {
          socket?.emit("space_join", {
            roomCode: createdCode,
            playerName,
            userId: user?.id ?? null,
          });
        }, 300);
      });
    } else {
      joinWithCode(code, count, "space", user?.id ?? null);
      const nextRoomCode = `space_${code}`;
      setRoomCode(nextRoomCode);

      setTimeout(() => {
        socket?.emit("space_join", {
          roomCode: nextRoomCode,
          playerName,
          userId: user?.id ?? null,
        });
      }, 300);
    }
  };

  const handleShareX = () => {
    const text = [
      "【ひまQ｜スペースサバイブ🛸】",
      `順位：${myRank ?? "-"}位`,
      `正解数：${correctCount}問`,
      `突破ステージ：${survivedStages}`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #スペースサバイブ #クイズゲーム",
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
      }
    );

    socket.on("space_state", (state: SpaceGameState) => {
      setGameState(state);

      if (state.phase === "gameOver") {
        setFinished(true);
      } else {
        setFinished(false);
        setRematchRequested(false);
        setRematchAvailable(false);
      }
    });

    socket.on("space_game_result", (state: SpaceGameState) => {
      setGameState(state);
      setFinished(true);
    });

    socket.on("space_match_ended", () => {
      setMatchEnded(true);
      setFinished(true);
    });

    socket.on("space_rematch_start", () => {
      resetLocalMatchState();
      setReadyToStart(true);
    });

    socket.on("space_rematch_available", () => {
      setRematchAvailable(true);
    });

    return () => {
      socket.off("room_full");
      socket.off("update_room_count");
      socket.off("space_state");
      socket.off("space_game_result");
      socket.off("space_match_ended");
      socket.off("space_rematch_start");
      socket.off("space_rematch_available");
    };
  }, [socket, playerName, roomCode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        pressDirection("up");
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        pressDirection("down");
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        pressDirection("left");
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        pressDirection("right");
      }
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
    };

    window.addEventListener("keydown", onKeyDown);
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
    if (!finished) return;
    if (!mySocketId) return;

    const ranks = finalRanks;
    const myRankNow = ranks.find((r) => r.socketId === mySocketId)?.rank ?? null;
    if (!myRankNow) return;

    const base = correctCount * 10;
    const survival = survivedStages * 20;
    const placement = calcPlacementBonus(maxPlayers, ranks, mySocketId);
    const earned = base + survival + placement;
    const expEarned = correctCount * 20 + survivedStages * 10;

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
    const myRankNow = ranks.find((r) => r.socketId === mySocketId)?.rank ?? null;
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
          p_best_streak: survivedStages,
        });

        if (weeklyErr) {
          console.log("upsert_weekly_stats error:", weeklyErr);
        }

        const { error: monthlyErr } = await supabase.rpc("upsert_monthly_stats", {
          p_user_id: user!.id,
          p_month_start: monthStart,
          p_score_add: earnedPoints,
          p_correct_add: correctCount,
          p_play_add: 1,
          p_best_streak: survivedStages,
        });

        if (monthlyErr) {
          console.log("upsert_monthly_stats error:", monthlyErr);
        }

        const res = await submitGameResult(supabase, {
          game: "space",
          score: survivedStages,
          title: null,
          firstPlace: myRankNow === 1,
          writeLog: true,
        });

        const modal = buildResultModalPayload("space", res);
        if (modal) pushModal(modal);
      } catch (e) {
        console.error("[space_survive] submitGameResult error:", e);
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
    survivedStages,
    supabase,
    pushModal,
  ]);

  if (!joined) {
    return (
      <main className="overflow-hidden bg-gradient-to-b from-[#020617] via-[#0c1635] to-[#2a0b45] text-white">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />

        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 my-20 text-center">
          <p className="mb-3 rounded-full border border-cyan-300/60 bg-white/10 px-4 py-1 text-sm font-black tracking-[0.3em] text-cyan-100">
            SPACE SURVIVE
          </p>

          <SpaceGlassCard className="w-full max-w-md p-5">
            <p className="mb-3 text-xl font-black text-cyan-100">
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
              className="mb-3 w-full rounded-2xl border border-cyan-300/60 bg-white/10 px-4 py-3 text-center text-xl font-black text-white outline-none placeholder:text-white/40"
            />

            {nameError && (
              <p className="mb-3 font-bold text-red-300">{nameError}</p>
            )}

            <button
              onClick={handleJoin}
              className="w-full rounded-full border-2 border-cyan-200 bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 px-8 py-3 text-xl font-black text-white shadow-[0_0_30px_rgba(34,211,238,0.45)] transition hover:scale-105"
            >
              宇宙へ出発する
            </button>

            {roomFull && (
              <p className="mt-3 font-bold text-red-300">
                このルームは満員です。
              </p>
            )}
          </SpaceGlassCard>
        </div>
      </main>
    );
  }

  if (!allPlayersReady) {
    return (
      <main className="bg-gradient-to-b from-[#020617] via-[#0c1635] to-[#2a0b45] px-4 py-10 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-sm font-black tracking-[0.4em] text-cyan-200">
            MATCHING
          </p>
          <h1 className="mb-6 text-4xl font-black md:text-6xl">
            サバイバー待機中…
          </h1>

          <SpaceGlassCard className="p-6">
            <p className="mb-2 text-xl font-black text-cyan-100">
              あなた：{playerName}
            </p>
            <p className="text-3xl font-black text-yellow-200 animate-pulse">
              {playerCount}
            </p>
            <p className="mt-3 text-sm font-bold text-white/60">
              {/* 最大4人まで。メンバーが揃うと準備画面に進みます。 */}
            </p>
          </SpaceGlassCard>
        </div>
      </main>
    );
  }

  if (allPlayersReady && !bothReady) {
    return (
      <main className="bg-gradient-to-b from-[#020617] via-[#0c1635] to-[#2a0b45] px-4 py-10 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-black tracking-[0.4em] text-cyan-200">
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
              <SpaceGlassCard key={p.socketId} className="p-3">
                {/* <p className="text-3xl">{PLAYER_EMOJIS[i % PLAYER_EMOJIS.length]}</p> */}
                <p className="truncate font-black text-white">{p.playerName}</p>
              </SpaceGlassCard>
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
                  準備できたら「サバイブ開始！」を押そう！
                </p>
                <button
                  onClick={handleReady}
                  className="animate-pulse rounded-full border-2 border-yellow-100 bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 px-8 py-4 text-2xl font-black text-white shadow-[0_0_35px_rgba(217,70,239,0.55)] transition hover:scale-110"
                >
                  サバイブ開始！
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {readyToStart && (
            <p className="mt-4 text-2xl font-black text-cyan-100 animate-pulse">
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
        finished
          ? "from-[#020617] via-[#0c1635] to-[#2a0b45]"
          : theme.bg
      } text-white`}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />

      <div className="relative mx-auto max-w-7xl px-3 py-3 md:px-6 md:py-6">
        {!finished ? (
          <>
            <div className="mb-3 grid gap-3 md:grid-cols-[1fr_280px]">
              <section className="rounded-3xl border border-white/15 bg-black/35 p-3 backdrop-blur">
                <div
                  className={`mb-3 rounded-3xl border ${theme.border} bg-gradient-to-r ${theme.panel} p-3 text-center ${theme.glow}`}
                >
                  <p className={`text-sm md:text-md font-black ${theme.accent}`}>
                    {theme.label}
                  </p>

                  <p className="mt-1 text-2xl font-black text-white md:text-4xl">
                    {gameState?.question?.question ??
                      "問題待機中：サーバーから問題が届くとここに表示されます"}
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
                        {gameState?.timeLeft ?? 10}
                      </span>

                      <span className="ml-1 text-xl font-black text-yellow-100">
                        秒
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`relative mx-auto aspect-square w-full max-w-[680px] overflow-hidden rounded-[2rem] border-4 ${theme.border} bg-slate-950/80 ${theme.glow}`}
                >
                  {gameState?.safeMin != null && gameState?.safeMax != null && (
                    <div
                      className="pointer-events-none absolute border-4 border-cyan-200/70 bg-cyan-300/5 shadow-[0_0_40px_rgba(34,211,238,0.55)]"
                      style={{
                        left: `${gameState.safeMin}%`,
                        top: `${gameState.safeMin}%`,
                        width: `${gameState.safeMax - gameState.safeMin}%`,
                        height: `${gameState.safeMax - gameState.safeMin}%`,
                      }}
                    />
                  )}
                  <div
                    className="
                      absolute
                      grid
                      grid-cols-2
                      grid-rows-2
                      rounded-[2rem]
                      overflow-hidden
                      border-2
                      border-white/20
                      shadow-[0_0_25px_rgba(255,255,255,0.15)]
                    "
                    style={{
                      left: `${gameState?.safeMin ?? 0}%`,
                      top: `${gameState?.safeMin ?? 0}%`,
                      width: `${(gameState?.safeMax ?? 100) - (gameState?.safeMin ?? 0)}%`,
                      height: `${(gameState?.safeMax ?? 100) - (gameState?.safeMin ?? 0)}%`,
                    }}
                  >
                    {(gameState?.question?.choices ?? [
                      "りんご",
                      "バナナ",
                      "みかん",
                      "ロケット",
                    ]).map((choice, index) => (
                      <div
                        key={`${choice}-${index}`}
                        className="
                          flex
                          items-center
                          justify-center
                          border
                          border-white/10
                          bg-black/25
                          backdrop-blur
                          text-center
                          font-black
                          text-white
                          text-sm
                          md:text-3xl
                        "
                      >
                        {choice}
                      </div>
                    ))}
                  </div>

                  {gameState?.flames?.map((flame) => (
                    <div
                      key={flame.id}
                      className="
                        absolute
                        flex
                        items-center
                        justify-center
                        rounded-full
                        bg-red-500/20
                        text-2xl
                        shadow-[0_0_22px_rgba(248,113,113,0.9)]
                        md:text-4xl
                        animate-pulse
                      "
                      style={{
                        left: `${flame.x}%`,
                        top: `${flame.y}%`,
                        width: `${flame.size}%`,
                        height: `${flame.size}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      🔥
                    </div>
                  ))}

                  {gameState?.obstacles?.map((obstacle) => (
                    <div
                      key={obstacle.id}
                      className={`absolute flex items-center justify-center font-black ${
                        obstacle.type === "meteor"
                          ? "rounded-full bg-orange-500 text-3xl shadow-[0_0_22px_rgba(251,146,60,0.95)]"
                          : "rounded-full bg-gradient-to-r from-red-200 via-red-500 to-red-200 shadow-[0_0_35px_rgba(239,68,68,1),0_0_70px_rgba(248,113,113,0.75)]"
                      }`}
                      style={{
                        left: `${obstacle.x}%`,
                        top: `${obstacle.y}%`,
                        width: `${obstacle.w}%`,
                        height: `${obstacle.h}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {obstacle.type === "meteor" ? "☄️" : ""}
                    </div>
                  ))}

                  {gameState?.items?.map((item) => (
                    <div
                      key={item.id}
                      className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-yellow-300 text-lg shadow-[0_0_18px_rgba(250,204,21,0.9)] md:h-10 md:w-10"
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      ⭐
                    </div>
                  ))}

                  {displayPlayers.map((player, index) => {
                    const isMe = player.socketId === mySocketId;
                    const hasShield =
                      typeof player.invincibleUntil === "number" &&
                      player.invincibleUntil > Date.now();

                    return (
                      <motion.div
                        key={player.socketId}
                        animate={{
                          left: `${player.x}%`,
                          top: `${player.y}%`,
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
                            h-10 w-10 md:h-[66px] md:w-[66px]
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
                        脱落しました：ほかのサバイバーを見守ろう
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
                          <p className="text-sm font-black tracking-[0.5em] text-cyan-200">
                            SPACE SURVIVE
                          </p>
                          <p className="mt-2 text-6xl font-black text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] md:text-8xl">
                            STAGE {gameState.stage}
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
                          animate={{ scale: [0.9, 1.15, 1], opacity: 1, rotate: 0 }}
                          transition={{ duration: 0.55 }}
                        >
                          <p className="text-7xl font-black text-white drop-shadow-[0_0_35px_rgba(255,255,255,1)] md:text-9xl">
                            GAME SET!
                          </p>
                          {/* <p className="mt-4 text-xl font-black text-cyan-100 md:text-3xl">
                            宇宙サバイバル終了！
                          </p> */}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              <aside className="rounded-3xl border border-white/15 bg-black/35 p-4 backdrop-blur">
                <p className="mb-3 text-center text-xl font-black text-cyan-100">
                  プレイヤー
                </p>

                <div className="space-y-2">
                  {displayPlayers.map((player, index) => {
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
                            {player.alive ? "生存" : reasonLabel(player.eliminatedReason)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm font-bold text-white/70">
                          SCORE：{player.score}
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
          <SpaceResult
            myRank={myRank}
            ranks={finalRanks}
            players={displayPlayers}
            correctCount={correctCount}
            survivedStages={survivedStages}
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
