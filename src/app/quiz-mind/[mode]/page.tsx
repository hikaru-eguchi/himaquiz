"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion3 from "../../components/QuizQuestion3";
import { QuizData } from "@/lib/articles3";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { submitGameResult, calcTitle } from "@/lib/gameResults";
import { buildResultModalPayload } from "@/lib/resultMessages";
import { useResultModal } from "../../components/ResultModalProvider";
import { getWeekStartJST } from "@/lib/week";
import { getMonthStartJST } from "@/lib/month";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import { useCallback } from "react";

type RankRow = { socketId: string; name: string; score: number; rank: number };

const buildRanksFromScores = (players: Player[], scores: Record<string, number>): RankRow[] => {
  const rows = players.map(p => ({
    socketId: p.socketId,
    name: p.playerName,
    score: scores[p.socketId] ?? 0,
  }));

  const sorted = [...rows].sort((a, b) => b.score - a.score);

  let lastScore: number | null = null;
  let lastRank = 0;

  return sorted.map((p, i) => {
    const rank = (lastScore === p.score) ? lastRank : (i + 1);
    lastScore = p.score;
    lastRank = rank;
    return { ...p, rank };
  });
};

const BONUS_TABLE: Record<number, number[]> = {
  2: [150],
  3: [200, 100],
  4: [250, 125, 60],
  5: [350, 175, 85, 40],
  6: [450, 225, 110, 55, 25],
  7: [600, 300, 150, 75, 35, 15],
  8: [750, 375, 180, 90, 45, 20, 10],
};

const calcPlacementBonus = (playerCount: number, ranksNow: RankRow[], mySocketId: string) => {
  const table = BONUS_TABLE[playerCount] ?? [];
  const me = ranksNow.find(r => r.socketId === mySocketId);
  if (!me) return 0;

  // 最下位はボーナス無し
  if (me.rank >= playerCount) return 0;

  // 同順位が1人だけのときのみ
  const sameRankCount = ranksNow.filter(r => r.rank === me.rank).length;
  if (sameRankCount !== 1) return 0;

  return table[me.rank - 1] ?? 0;
};

type AwardStatus = "idle" | "awarding" | "awarded" | "need_login" | "error";

interface ArticleData {
  id: string;
  title: string;
  genre: string;
  quiz?: {
    title: string;
    question: string;
    answer: string | number;
    displayAnswer?: string;
    choices?: (string | number)[];
    genre: string;
    level: string;
    answerExplanation?: string;
    trivia?: string;
  };
}

interface Player {
  socketId: string;
  playerName: string;
}

interface QuizResultProps {
  correctCount: number;
  onRetry: () => void;
  matchEnded: boolean;
  rematchAvailable: boolean;
  rematchRequested : boolean;
  handleNewMatch: () => void;
  handleRematch: () => void;
  players: Player[];
  predictedWinner: string | null;
  hasPredicted: boolean;
  basePoints: number;
  firstBonusPoints: number;
  predictionBonusPoints: number;
  earnedPoints: number;
  earnedExp: number;
  isLoggedIn: boolean;
  awardStatus: AwardStatus;
  onGoLogin: () => void;
  isCodeMatch: boolean;
  onShareX: () => void;
  myRankNow: number | null;
  finalRanks: RankRow[];
}

const QuizResult = ({
  correctCount,
  onRetry,
  matchEnded,
  rematchAvailable,
  rematchRequested,
  handleNewMatch,
  handleRematch,
  players,
  predictedWinner,
  hasPredicted,
  basePoints,
  firstBonusPoints,
  predictionBonusPoints,
  earnedPoints,
  earnedExp,
  isLoggedIn,
  awardStatus,
  onGoLogin,
  isCodeMatch,
  onShareX,
  myRankNow,
  finalRanks,
}: QuizResultProps) => {
  const [showText1, setShowText1] = useState(false);
  const [showText2, setShowText2] = useState(false);
  const [showText3, setShowText3] = useState(false);
  const [showText4, setShowText4] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowText1(true), 500));
    timers.push(setTimeout(() => setShowText2(true), 1500));
    timers.push(setTimeout(() => setShowText3(true), 2500));
    timers.push(setTimeout(() => setShowText4(true), 3000));
    timers.push(setTimeout(() => setShowButton(true), 3500));
    return () => timers.forEach(clearTimeout);
  }, []);


  return (
    <motion.div
      className={`text-center mt-6 md:p-8 rounded-lg`}
    >

      {/* ============================
          🔥 スコア表示
      ============================ */}
      {showText1 && (
        <>
          <p className="text-3xl md:text-5xl mb-2 md:mb-6">
            正解数：{correctCount}問
          </p>
        </>
      )}

      {showText2 && <p className="text-xl md:text-2xl text-gray-600 mb-2">あなたの順位は…</p>}

      {showText3 && myRankNow !== null && myRankNow !== 1 && (
        <p
          className={`text-4xl md:text-6xl font-bold ${
            myRankNow === 1
              ? "text-yellow-400"
              : myRankNow === 2
              ? "text-gray-400"
              : myRankNow === 3
              ? "text-orange-600"
              : "text-blue-600"
          }`}
        >
          {myRankNow} 位！
        </p>
      )}

      {showText3 && myRankNow === 1 && (
        <motion.p
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: [1.2, 1], rotate: 0 }}
          transition={{ duration: 0.6 }}
          className="
            text-4xl md:text-6xl
            font-extrabold
            text-yellow-300
            drop-shadow-[0_0_20px_gold]
          "
        >
          🏆 1 位！ 👑
        </motion.p>
      )}

      {showText4 && <p className="text-xl md:text-2xl text-gray-600 mt-6">みんなの順位</p>}

      {showText4 && finalRanks.length > 0 && (
        <div className="mt-2 space-y-2">
          {finalRanks.map((r) => (
            <div
              key={r.socketId}
              className="flex items-center gap-4 px-3 py-2 bg-white rounded-lg shadow w-full max-w-md mx-auto"
            >
              {/* 何位 */}
              <span
                className={`font-extrabold text-lg w-10 text-center ${
                  r.rank === 1
                    ? "text-yellow-400"
                    : r.rank === 2
                    ? "text-gray-400"
                    : r.rank === 3
                    ? "text-orange-500"
                    : "text-blue-500"
                }`}
              >
                {r.rank}位
              </span>

              {/* 名前 */}
              <span className="font-bold text-base truncate flex-1 text-center">
                {r.name}
              </span>

              {/* 点数 */}
              <span className="font-extrabold text-base w-16 text-right">
                {r.score}点
              </span>
            </div>
          ))}
        </div>
      )}

      {showButton && (
        <div className="mx-auto max-w-[520px] bg-white border-2 border-black rounded-xl p-4 shadow mt-6">
          <>
              <div className="mb-2 text-lg md:text-xl text-gray-700 font-bold">
                <p className="text-blue-500">正解数ポイント：{basePoints}P（{correctCount}問 × 10P）</p>
                {firstBonusPoints > 0 && (
                  <p className="text-yellow-500">順位ボーナス✨：{firstBonusPoints}P</p>
                )}
              </div>

              <p className="text-xl md:text-2xl font-extrabold text-gray-800">
                今回の獲得ポイント： <span className="text-green-600">{earnedPoints} P</span>
              </p>
              <p className="text-xl md:text-2xl font-extrabold text-gray-800 mt-2">
                今回の獲得経験値： <span className="text-purple-600">{earnedExp} EXP</span>
              </p>

              {isLoggedIn ? (
                <>
                  {awardStatus === "awarding" && (
                    <p className="text-md md:text-xl text-gray-600 mt-2">
                      ポイント反映中...
                    </p>
                  )}
                  {awardStatus === "awarded" && (
                    <p className="text-md md:text-xl text-green-700 font-bold mt-2">
                      ✅ ポイントを加算しました！
                    </p>
                  )}
                  {awardStatus === "error" && (
                    <p className="text-md md:text-xl text-red-600 font-bold mt-2">
                      ❌ ポイント加算に失敗しました。時間をおいて再度お試しください。
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-2">
                  <p className="text-md md:text-xl text-gray-700 font-bold">
                    ※未ログインのため受け取れません。ログイン（無料）すると次からポイントを受け取れます！
                  </p>
                  <button
                    onClick={onGoLogin}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 cursor-pointer"
                  >
                    ログインする
                  </button>
                  <p className="text-md md:text-xl text-gray-700 font-bold mt-2">
                    ログインなしでも、引き続き遊べます👇
                  </p>
                </div>
              )}
            </>
        </div>
      )}

      {/* ============================
          🔥 リトライボタン
      ============================ */}
      {showButton && (  
        matchEnded ? (
          <div className="text-center mt-10">
            <p className="text-3xl md:text-5xl mb-6 text-red-500">マッチが終了しました</p>
            <button
              onClick={handleNewMatch}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg text-xl"
            >
              別の人とマッチする
            </button>
          </div>
        ) : rematchAvailable ? (
          <div className="text-center mt-10">
            <button
              onClick={handleRematch}
              className="px-6 py-3 bg-green-500 text-white rounded-lg text-xl"
            >
              対戦スタート！
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  className="px-6 py-3 bg-black text-white border border-black rounded-lg font-bold text-xl hover:opacity-80 cursor-pointer"
                  onClick={onShareX}
                >
                  Xで結果をシェア
                </button>

                {/* 合言葉マッチだけ */}
                {isCodeMatch && (
                  <button
                    onClick={handleRematch}
                    className="
                      w-full md:w-auto
                      px-6 py-3
                      bg-blue-500 hover:bg-blue-600
                      text-white text-xl md:text-xl
                      font-semibold
                      rounded-lg shadow-md
                      transition-all duration-300
                    "
                  >
                    もう一回対戦する！
                  </button>
                )}

                {/* ランダムだけ */}
                {!isCodeMatch && (
                  <button
                    onClick={handleNewMatch}
                    className="
                      w-full md:w-auto
                      px-6 py-3
                      bg-blue-500 hover:bg-blue-600
                      text-white text-xl md:text-xl
                      font-semibold
                      rounded-lg shadow-md
                      transition-all duration-300
                    "
                  >
                    もう一戦いく！
                  </button>
                )}
              </div>
            </div>
            {/* 対戦相手待ちメッセージを下に隔離 */}
            {rematchRequested && !rematchAvailable && (
              <p className="text-center text-2xl md:text-3xl text-gray-700 bg-white rounded-xl p-2 mt-4 md:mt-2">
                対戦相手の準備を待っています…
              </p>
            )}
          </div>
        )
      )}
    </motion.div>
  );
};

type MindSlotOpenPayload = { deadlineMs: number; totalRounds: number };
type MindOrderDecidedPayload = {
  order: string[];
  slotValues: Record<string, number>;
  totalRounds: number;
};
type MindRepStartPayload = {
  repId: string;
  roundIndex: number;
  totalRounds: number;
  questionIndex: number;
};
type MindGuessStartPayload = { repId: string };
type MindRoundResultPayload = { scores: Record<string, number> };

export default function QuizModePage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = pathname.split("/").pop() || "random";
  const code = searchParams?.get("code") || ""; 
  const count = searchParams?.get("count") || ""; 
  const genre = searchParams?.get("genre") || "";
  const level = searchParams?.get("level") || "";
  const timeParam = searchParams?.get("time") || "5";
  const totalTime = parseInt(timeParam) * 60;
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  // =====================
  // ✅ pending（付与待ち）管理：確実付与用
  // =====================
  const PENDING_KEY = "survival_award_pending_v1";

  type PendingAward = {
    points: number;
    exp: number;
    correctCount: number;
    basePoints: number;          // correctCount*10
    firstBonusPoints: number;    // ここに順位ボーナスを入れる（名前はそのままでOK）
    predictionBonusPoints: number; // 0固定でOK（UI崩したくなければ残す）
    myRank: number;
    playerCount: number;
    createdAt: number;
  };

  const savePendingAward = (payload: PendingAward) => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
    } catch {}
  };
  const loadPendingAward = (): PendingAward | null => {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      return raw ? (JSON.parse(raw) as PendingAward) : null;
    } catch {
      return null;
    }
  };
  const clearPendingAward = () => {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {}
  };

  // ✅ 付与直前に “いまログインできてるか” を確認して userId を返す
  const ensureAuthedUserId = async (): Promise<string | null> => {
    const { data: u1, error: e1 } = await supabase.auth.getUser();
    if (!e1 && u1.user) return u1.user.id;

    // タブ復帰直後などの揺れ対策
    await supabase.auth.refreshSession();

    const { data: u2, error: e2 } = await supabase.auth.getUser();
    if (!e2 && u2.user) return u2.user.id;

    return null;
  };

  // ✅ 実際の付与処理（pendingがあれば何度でも拾える）
  const awardPointsAndExp = async (payload: PendingAward) => {
    if (awardedOnceRef.current) return;

    // 0/0は安全のため何もしない
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
        awardedOnceRef.current = false; // 失敗時は再試行できるよう戻す
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

      // ログ（＋）※失敗しても致命的ではない
      const reasonPoint =
        `心理当てバトル獲得: 正解${payload.correctCount}問=${payload.basePoints}P` +
        (payload.firstBonusPoints ? ` / 順位ボーナス${payload.firstBonusPoints}P（${payload.playerCount}人中${payload.myRank}位）` : "");

      if (payload.points > 0) {
        const { error: logError } = await supabase.from("user_point_logs").insert({
          user_id: authedUserId,
          change: payload.points,
          reason: reasonPoint,
        });
        if (logError) console.log("insert user_point_logs error raw:", logError);
      }

      if (payload.exp > 0) {
        const { error: logError2 } = await supabase.from("user_exp_logs").insert({
          user_id: authedUserId,
          change: payload.exp,
          reason: `心理当てバトルEXP獲得: 正解${payload.correctCount}問 → ${payload.exp}EXP`,
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

  type MindPhase = "slot" | "orderReveal" | "repIntro" | "repQuestion" | "guess" | "revealWait" | "revealAnswer" | "roundResult" | "end" | "idle";
  type MindChoice = "A" | "B" | "C";
  type MindFrameResult = {
    isCorrect: boolean;
    text: string;
  };

  // 制限時間（秒）
  const REP_LIMIT_SEC = 15;
  const GUESS_LIMIT_SEC = 15;

  // カウントダウン表示用
  const [repSecondsLeft, setRepSecondsLeft] = useState<number>(0);
  const [guessSecondsLeft, setGuessSecondsLeft] = useState<number>(0);

  // タイマー制御
  const phaseDeadlineAtRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 追加：タイマーを握って前のを消せるようにする（連続イベント対策）
  const revealTimersRef = useRef<NodeJS.Timeout[]>([]);

  const clearRevealTimers = () => {
    revealTimersRef.current.forEach(t => clearTimeout(t));
    revealTimersRef.current = [];
  };

  const [mindFrameResults, setMindFrameResults] =
    useState<Record<string, MindFrameResult>>({});

  const [mindPhase, setMindPhase] = useState<MindPhase>("idle");
  const [mindOrder, setMindOrder] = useState<string[]>([]);
  const [mindSlotValues, setMindSlotValues] = useState<Record<string, number>>({});
  const [mindRepId, setMindRepId] = useState<string | null>(null);
  const [mindRoundIndex, setMindRoundIndex] = useState(0);
  const [mindTotalRounds, setMindTotalRounds] = useState(0);
  const [mindQuestionIndex, setMindQuestionIndex] = useState(0);

  const [slotSpinningValue, setSlotSpinningValue] = useState(1);
  const [slotStopped, setSlotStopped] = useState(false);

  const [repChoice, setRepChoice] = useState<MindChoice | null>(null);
  const [guessChoice, setGuessChoice] = useState<MindChoice | null>(null);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [displayScores, setDisplayScores] = useState<Record<string, number>>({});

  const [slotSecondsLeft, setSlotSecondsLeft] = useState<number>(0);
  const [slotFinalValue, setSlotFinalValue] = useState<number | null>(null);

  const [repUserAnswer, setRepUserAnswer] = useState<number | null>(null);
  const [guessUserAnswer, setGuessUserAnswer] = useState<number | null>(null);

  const [revealedRepAnswer, setRevealedRepAnswer] = useState<"A"|"B"|"C"|null>(null);
  const [showRevealText, setShowRevealText] = useState(false);


  const pendingOrderDecidedRef = useRef<MindOrderDecidedPayload | null>(null);
  const [slotStoppedAt, setSlotStoppedAt] = useState<number | null>(null);


  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");
  const awardedOnceRef = useRef(false);
  const { pushModal } = useResultModal();
  const sentRef = useRef(false); // ★ 成績保存の二重送信防止

  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [basePoints, setBasePoints] = useState(0);
  const [firstBonusPoints, setFirstBonusPoints] = useState(0);
  const [predictionBonusPoints, setPredictionBonusPoints] = useState(0);

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [wrongStreak, setWrongStreak] = useState(0);
  const wrongStreakRef = useRef(0);
  const [scoreChanges, setScoreChanges] = useState<Record<string, number | null>>({});
  const [readyToStart, setReadyToStart] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [showGameSet, setShowGameSet] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState<{ fromId: string; message: string }[]>([]);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchAvailable, setRematchAvailable] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [roomCode, setRoomCode] = useState<string>("");
  const [bothReadyState, setBothReadyState] = useState(false);
  const [handicap, setHandicap] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [roomFull, setRoomFull] = useState(false);
  const [showStageEvent, setShowStageEvent] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showAnswerText, setShowAnswerText] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showDamageResult, setShowDamageResult] = useState(false);
  const [showCorrectCount, setShowCorrectCount] = useState(false);
  const [dungeonStart, setDungeonStart] = useState(false);
  const [playerCount, setPlayerCount] = useState("0/4");
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [roomLocked, setRoomLocked] = useState(false);
  const [allPlayersDead, setAllPlayersDead] = useState(false);
  const [battleKey, setBattleKey] = useState(0);
  const [myRankState, setMyRankState] = useState<number | null>(null);
  const [allRanks, setAllRanks] = useState<
    { socketId: string; rank: number }[]
  >([]);

  const roomLockedRef = useRef(false);
  useEffect(() => {
    roomLockedRef.current = roomLocked;
  }, [roomLocked]);

  const [predictedWinner, setPredictedWinner] = useState<string | null>(null);
  const [hasPredicted, setHasPredicted] = useState(false);

  const questionsRef = useRef<{ id: string; quiz: QuizData }[]>([]);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  const roomCodeRef = useRef<string>("");
  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  const lastOrderDecidedKeyRef = useRef<string | null>(null);

  const titles = [
    { threshold: 2, title: "クイズ戦士" },
    { threshold: 5, title: "謎解きファイター" },
    { threshold: 7, title: "頭脳の騎士" },
    { threshold: 10, title: "ひらめきハンター" },
    { threshold: 15, title: "真理の探究者" },
    { threshold: 20, title: "知恵の勇者 🛡️" },
    { threshold: 25, title: "クイズ大賢者 ⭐" },
    { threshold: 30, title: "答えの覇者 🌀" },
    { threshold: 35, title: "クイズ超越者 🌌" },
    { threshold: 40, title: "フロアマスター 🏆" },
    { threshold: 45, title: "グランドマスター 🏆" },
    { threshold: 50, title: "クイズマスター 🏆" },
    { threshold: 65, title: "レジェンドクイズマスター 🌟" },
    { threshold: 80, title: "✨クイズ王👑" },
    { threshold: 100, title: "💫クイズ神💫" },
  ];

  const {
    joinRandom,
    joinWithCode,
    sendReady,
    sendMessage,
    resetMatch,
    updateStartAt,
    players: rawPlayers,
    questionIds,
    bothReady,
    startAt,
    mySocketId,
    socket,
    playerLives,
    isGameOver,
    lastPlayerElimination,
    gameSetScheduled,
  } = useBattle(playerName);

  const groups = lastPlayerElimination?.eliminationGroups ?? [];
  const winnerGroup = groups.length ? groups[groups.length - 1] : [];
  const isSoloWinner = winnerGroup.length === 1;          // 単独勝者か
  const amIWinner = winnerGroup.includes(mySocketId);     // 自分が勝者か
  const firstBonus = (isSoloWinner && amIWinner) ? 300 : 0;
  const [displayLives, setDisplayLives] = useState<Record<string, number>>({});
  const [showStartButton, setShowStartButton] = useState(false);

  const slotValueRef = useRef(1);
  const slotStoppedRef = useRef(false);

  const mindPhaseRef = useRef<MindPhase>("idle");
  useEffect(() => {
    mindPhaseRef.current = mindPhase;
  }, [mindPhase]);

  const slotStoppedAtRef = useRef<number | null>(null);
  useEffect(() => {
    slotStoppedAtRef.current = slotStoppedAt;
  }, [slotStoppedAt]);

  useEffect(() => {
    slotValueRef.current = slotSpinningValue;
  }, [slotSpinningValue]);

  useEffect(() => {
    slotStoppedRef.current = slotStopped;
  }, [slotStopped]);

  useEffect(() => {
    // 既存タイマーを止める
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    // フェーズに応じて開始
    if (mindPhase === "repQuestion") {
      phaseDeadlineAtRef.current = Date.now() + REP_LIMIT_SEC * 1000;

      const tick = () => {
        const msLeft = (phaseDeadlineAtRef.current ?? 0) - Date.now();
        const secLeft = Math.max(0, Math.ceil(msLeft / 1000));
        setRepSecondsLeft(secLeft);

        if (secLeft <= 0) {
          // 表示停止（ここでは “表示を止めるだけ”）
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      };

      tick();
      countdownTimerRef.current = setInterval(tick, 200);
      return;
    }

    if (mindPhase === "guess") {
      phaseDeadlineAtRef.current = Date.now() + GUESS_LIMIT_SEC * 1000;

      const tick = () => {
        const msLeft = (phaseDeadlineAtRef.current ?? 0) - Date.now();
        const secLeft = Math.max(0, Math.ceil(msLeft / 1000));
        setGuessSecondsLeft(secLeft);

        if (secLeft <= 0) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      };

      tick();
      countdownTimerRef.current = setInterval(tick, 200);
      return;
    }

    // それ以外のフェーズでは表示をリセット
    setRepSecondsLeft(0);
    setGuessSecondsLeft(0);
    phaseDeadlineAtRef.current = null;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mindPhase, mindRoundIndex, mindQuestionIndex, mindRepId]);

  
  const players: Player[] = rawPlayers.map((p) => ({
    socketId: p.socketId,
    playerName: p.name,
  }));

  const ranksNow = useMemo(() => buildRanksFromScores(players, scores), [players, scores]);
  const myRankNow = ranksNow.find(r => r.socketId === mySocketId)?.rank ?? null;

  // =====================
  // ✅ 「周」表示用（1周＝全員が1回主役）
  // =====================
  const playerCountNow = Math.max(1, players.length);

  const totalCycles = useMemo(() => {
    if (playerCountNow <= 3) return 3;   // 2-3人 => 3周
    if (playerCountNow <= 5) return 2;   // 4-5人 => 2周
    return 1;                             // 6-8人 => 1周
  }, [playerCountNow]);

  const cycleNow = useMemo(() => {
    return Math.min(totalCycles, Math.floor(mindRoundIndex / playerCountNow) + 1);
  }, [mindRoundIndex, playerCountNow, totalCycles]);

  const turnInCycle = useMemo(() => {
    return (mindRoundIndex % playerCountNow) + 1; // 今周の「何人目の主役」か
  }, [mindRoundIndex, playerCountNow]);

  const finalRanks = useMemo(() => {
    return buildRanksFromScores(players, scores);
  }, [players, scores]);

  const myFinalRank = useMemo(() => {
    return finalRanks.find(r => r.socketId === mySocketId)?.rank ?? null;
  }, [finalRanks, mySocketId]);
  
  const orderedPlayers = useMemo(() => {
    if (mindOrder.length > 0) {
      const map = new Map(players.map(p => [p.socketId, p]));
      return mindOrder.map(id => map.get(id)).filter(Boolean) as Player[];
    }
    // 既存：自分左
    return [...players].sort((a, b) => {
      if (a.socketId === mySocketId) return -1;
      if (b.socketId === mySocketId) return 1;
      return 0;
    });
  }, [players, mySocketId, mindOrder]);

  const playersRef = useRef<Player[]>([]);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  
  const me = players.find(p => p.socketId === mySocketId);
  const opponent = players.find(p => p.socketId !== mySocketId);

  const allPlayersReady = roomPlayers.length >= maxPlayers;
  const myLife = playerLives[mySocketId] ?? 3;
  const isDead = myLife <= 0;

  // --- プレイヤー人数監視 ---
  useEffect(() => {
    if (!socket) return;

    socket.on("room_full", () => {
      setRoomPlayers(players);
      setRoomFull(true);
    });

    return () => {
      socket.off("room_full");
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("update_room_count", ({ players, current, max }) => {
      if (roomLockedRef.current) return;

      setRoomPlayers(players);
      setPlayerCount(`${current}/${max}`);
      setMaxPlayers(max);

      if (current >= max) {
        setRoomLocked(true); // 4人揃ったらロック
      }
    });

    return () => {
      socket.off("update_room_count");
    };
  }, [socket]);

  const handleJoin = () => {
    if (!playerName.trim()) {
      setNameError("名前を入力してください");
      return;
    }

    // 不適切ワードが含まれていないか確認
    const lower = playerName.toLowerCase();
    const found = bannedWords.some(word => lower.includes(word));
    if (found) {
      setNameError("不適切な言葉は使えません");
      return;
    }

    setNameError(null);
    setJoined(true);

    // ★ ここで roomLocked をリセット
    setRoomLocked(false);
    roomLockedRef.current = false;

    if (mode === "random") {
      joinRandom({ maxPlayers: 4, gameType:"mind" }, (code) => setRoomCode(code)); // コールバックで state にセット
    } else {
      joinWithCode(code,count,"mind");
      setRoomCode("mind_" + code); // 入力済みコードを state にセット
    }
  };

  const resetMindState = () => {
    clearRevealTimers();

    setScores({});
    setMindFrameResults({});
    setRevealedRepAnswer(null);

    setMindPhase("idle");
    setMindOrder([]);
    setMindSlotValues({});
    setMindRepId(null);
    setMindRoundIndex(0);
    setMindTotalRounds(0);
    setMindQuestionIndex(0);

    setSlotSpinningValue(1);
    setSlotStopped(false);
    setSlotSecondsLeft(0);
    setSlotFinalValue(null);
    setSlotStoppedAt(null);

    setRepUserAnswer(null);
    setGuessUserAnswer(null);
    setRepChoice(null);
    setGuessChoice(null);
    setScores({});
    setDisplayScores({});
  };

  const handleRetry = () => {
    setCorrectCount(0);
    setFinished(false);
    setWrongStreak(0);
    wrongStreakRef.current = 0;
    setScoreChanges({});
    setIncorrectMessage(null);
    setShowCorrectMessage(false);
    setMyRankState(null);
    setAllRanks([]);
    setPredictedWinner(null);
    setHasPredicted(false);
    setUserAnswer(null);
    awardedOnceRef.current = false;
    setAwardStatus("idle");
    setEarnedPoints(0);
    setBasePoints(0);
    setFirstBonusPoints(0);
    setPredictionBonusPoints(0);
    setEarnedExp(0);
    sentRef.current = false;
    clearPendingAward();
    resetMindState();
  };

  const handleNewMatch = () => {
    setBattleKey((prev) => prev + 1);
    // 状態をリセット
    // ★ ここで roomLocked をリセット
    setRoomLocked(false);
    roomLockedRef.current = false;

    setRematchRequested(false);
    setRematchAvailable(false);
    setMatchEnded(false);
    setTimeUp(false);
    setFinished(false);
    setTimeLeft(totalTime);
    setCorrectCount(0);
    setWrongStreak(0);
    wrongStreakRef.current = 0;
    setScoreChanges({});
    setIncorrectMessage(null);
    setShowCorrectMessage(false);
    setAllPlayersDead(false);
    setPredictedWinner(null);
    setHasPredicted(false);
    awardedOnceRef.current = false;
    setAwardStatus("idle");
    setEarnedPoints(0);
    setBasePoints(0);
    setFirstBonusPoints(0);
    setPredictionBonusPoints(0);
    setEarnedExp(0);
    sentRef.current = false;
    clearPendingAward();
    resetMindState();

    setReadyToStart(false);

    resetMatch();

    if (mode === "random") {
      joinRandom({ maxPlayers: 4, gameType:"mind" }, (code) => setRoomCode(code));
    } else {
      joinWithCode(code, count,"mind");
      setRoomCode("mind_" + code);
    }
  };

  const handleRematch = () => {
    if (!roomCode) return;

    // ★ 再戦準備の前に false に戻す
    setBothReadyState(false);
    sentRef.current = false;

    setRematchRequested(true); // 自分が再戦希望を出した状態
    console.log("sending send_ready"); 
    socket?.emit("send_ready", { roomCode });
  };

  const sendRepAnswer = (choice: MindChoice) => {
    if (!mindRepId || mySocketId !== mindRepId) return;
    const q = questions[mindQuestionIndex]?.quiz;
    if (!q) return;

    // choice を 実際の選択肢に変換する（あなたのQuizQuestion3が number answer なら整える）
    // ここはQuizQuestion3の仕様次第なので、例だけ：
    const isCorrect = (() => {
      // A/B/C -> choices[0/1/2]
      const idx = choice === "A" ? 0 : choice === "B" ? 1 : 2;
      const selected = q.choices?.[idx];
      // q.answer が number なら String比較など調整
      return String(selected) === String(q.answer);
    })();

    socket?.emit("mind_rep_answer", { roomCode, choice, isCorrect });
  };

  const applyRepStart = useCallback(
    ({ repId, roundIndex, totalRounds, questionIndex }: MindRepStartPayload) => {
      setMindRepId(repId);
      setMindRoundIndex(roundIndex);
      setMindTotalRounds(totalRounds);
      setMindQuestionIndex(questionIndex);
      setRevealedRepAnswer(null);
      setShowRevealText(false);

      setRepChoice(null);
      setGuessChoice(null);

      setMindPhase("repIntro");

      setTimeout(() => {
        setMindPhase("repQuestion");
      }, 2500);
    },
    []
  );

  /* ---------- クイズ取得 ---------- */
  const [allQuestions, setAllQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);

  const pendingRepStartRef = useRef<MindRepStartPayload | null>(null);

  const onRepStart = useCallback((payload: MindRepStartPayload) => {
    const phase = mindPhaseRef.current;

    // ✅ ここが重要：問題がまだ準備できてないなら保留
    const q = questionsRef.current[payload.questionIndex];
    if (!q?.quiz) {
      pendingRepStartRef.current = payload;
      console.log("[mind] repStart pending (question not ready)", payload);
      return;
    }

    if (phase === "orderReveal" || phase === "revealAnswer" || phase === "revealWait") {
      pendingRepStartRef.current = payload;
      return;
    }

    applyRepStart(payload);
  }, [applyRepStart]);

  useEffect(() => {
    const fetchArticles = async () => {
      const res = await fetch("/api/articles3");
      const data: ArticleData[] = await res.json();
      let all = data;
      if (mode === "genre" && genre) all = all.filter(a => a.quiz?.genre === genre);
      if (mode === "level" && level) all = all.filter(a => a.quiz?.level === level);

      const quizQuestions = all
        .filter(a => a.quiz)
        .map((a, index) => ({
          id: `q${index + 1}`,
          quiz: {
            title: a.title,
            question: a.quiz!.question,
            answer: Number(a.quiz!.answer),
            displayAnswer: a.quiz!.displayAnswer,
            choices: a.quiz!.choices ? a.quiz!.choices.map(String) : [],
            genre: a.quiz!.genre,
            level: a.quiz!.level,
            answerExplanation: a.quiz!.answerExplanation,
            trivia: a.quiz!.trivia,
          } as QuizData,
        }));
      setAllQuestions(quizQuestions);
    };
    fetchArticles();
  }, [mode, genre, level]);

  // --- questionIds に従い並び替え ---
  useEffect(() => {
    if (!questionIds || questionIds.length === 0 || allQuestions.length === 0) return;
    const ordered = questionIds
      .map(id => allQuestions.find(q => q.id === id))
      .filter(Boolean) as { id: string; quiz: QuizData }[];
    setQuestions(ordered);
  }, [questionIds, allQuestions]);

  // --- タイマー ---
  useEffect(() => {
    if (!startAt) return;

    const tick = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startAt) / 1000);

      const baseRemain =
        totalTime - elapsed + 3;

      const remain = Math.max(0, baseRemain);

      setTimeLeft(remain);
    };

    tick(); // 即1回計算
    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, [startAt, totalTime]);

  useEffect(() => {
    if (timeLeft > 0) return;

    setTimeUp(true);

    const timeout = setTimeout(() => {
      setFinished(true);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [timeLeft]);

  useEffect(() => {
    if (!isGameOver) return;

    const deadTimer  = setTimeout(() => {
      setAllPlayersDead(true);
    }, 4000);

    const finishTimer  = setTimeout(() => {
      setFinished(true);
    }, 6000); // ← 正解発表演出のあと

    return () => {
      clearTimeout(deadTimer);
      clearTimeout(finishTimer);
    };
  }, [isGameOver]);

  useEffect(() => {
    if (!socket) return;
      socket.on("receive_message", ({ fromId, message }) => {
      const newMsg = { fromId, message };
      setVisibleMessages(prev => [...prev, newMsg]);

      // 1.5秒後に非表示
      setTimeout(() => {
        setVisibleMessages(prev => prev.filter(m => m !== newMsg));
      }, 1500);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const onSlotOpen = ({ deadlineMs, totalRounds }: MindSlotOpenPayload) => {
      setMindPhase("slot");
      setMindTotalRounds(totalRounds);

      setSlotStopped(false);
      setSlotFinalValue(null);
      slotStoppedRef.current = false;

      setRepChoice(null);
      setGuessChoice(null);

      // ✅ カウントダウン初期化（例: 10秒）
      setSlotSecondsLeft(Math.ceil(deadlineMs / 1000));

      // ✅ 数字回転
      const t = setInterval(() => {
        setSlotSpinningValue(prev => {
          const next = prev >= 10 ? 1 : prev + 1;
          slotValueRef.current = next;
          return next;
        });
      }, 80);

      // ✅ 1秒ごとカウントダウン
      const countdown = setInterval(() => {
        setSlotSecondsLeft(prev => Math.max(0, prev - 1));
      }, 1000);

      // ✅ 自動停止
      const auto = setTimeout(() => {
        // ここで全部止める
        clearInterval(t);
        clearInterval(countdown);

        if (!slotStoppedRef.current) {
          slotStoppedRef.current = true;
          setSlotStopped(true);
          const final = slotValueRef.current;
          setSlotFinalValue(final);
          setSlotStoppedAt(Date.now());
          socket.emit("mind_slot_stop", { roomCode, value: final });
        }
      }, deadlineMs);

      // ✅ クリック側から止められるよう保存
      (socket as any).__mindSlotTimers = { t, auto, countdown };
    };

    const onOrderDecided = (payload: MindOrderDecidedPayload) => {
      // ✅ 同じ order/slotValues の重複通知を無視
      const key = JSON.stringify({
        order: payload.order,
        slotValues: payload.slotValues,
        totalRounds: payload.totalRounds,
      });

      if (lastOrderDecidedKeyRef.current === key) {
        console.log("[mind_order_decided] duplicate ignored");
        return;
      }
      lastOrderDecidedKeyRef.current = key;

      const justStopped =
        slotStoppedAtRef.current != null &&
        Date.now() - slotStoppedAtRef.current < 2000;

      const showOrderReveal = (p: MindOrderDecidedPayload) => {
        setMindOrder(p.order);
        setMindSlotValues(p.slotValues);
        setMindTotalRounds(p.totalRounds);
        setMindPhase("orderReveal");

        // ✅ orderReveal を閉じる
        clearRevealTimers();
        revealTimersRef.current.push(setTimeout(() => {
          setMindPhase("idle");

          const pending = pendingRepStartRef.current;
          if (pending) {
            pendingRepStartRef.current = null;
            applyRepStart(pending);
          }
        }, 2000));
      };

      if (mindPhaseRef.current === "slot" && justStopped) {
        pendingOrderDecidedRef.current = payload;

        setTimeout(() => {
          const p = pendingOrderDecidedRef.current;
          if (!p) return;
          pendingOrderDecidedRef.current = null;

          showOrderReveal(p); // ✅ 出す & 閉じる
        }, 2000);

        return;
      }

      showOrderReveal(payload); // ✅ 通常ルートも同じ関数へ
    };

    const onGuessStart = ({ repId }: MindGuessStartPayload) => {
      setMindPhase("guess");
      setMindRepId(repId);
      setGuessChoice(null);
    };

    const choiceToIndex = (c: "A" | "B" | "C") => (c === "A" ? 0 : c === "B" ? 1 : 2);

    const buildRepPickedText = (repAnswer: "A" | "B" | "C") => {
      const q = questions[mindQuestionIndex]?.quiz;
      if (!q?.choices) return repAnswer;
      const idx = choiceToIndex(repAnswer);
      return String(q.choices[idx] ?? repAnswer);
    };

    const onMindRoundResult = (payload: any) => {
      const { scores, repAnswer, repId, guesses, repIsCorrect, roundIndex, totalRounds } = payload;

      // =====================
      // ✅ 自分が正解したか判定
      // =====================
      const myGuess = guesses?.[mySocketId];

      if (myGuess && myGuess === repAnswer) {
        setCorrectCount(prev => prev + 1);
      }

      clearRevealTimers();

      setRevealedRepAnswer(repAnswer);
      setScores(scores);

      // 枠の正誤表示用map
      const currentPlayers = playersRef.current;
      const map: Record<string, MindFrameResult> = {};
       
      currentPlayers.forEach((p) => {
        if (p.socketId === repId) {
          map[p.socketId] = { isCorrect: !!repIsCorrect, text: "主役" };
          return;
        } const g = guesses?.[p.socketId];
        if (!g) map[p.socketId] = { isCorrect: false, text: "未回答" };
        else if (g === repAnswer) map[p.socketId] = { isCorrect: true, text: "正解〇" };
        else map[p.socketId] = { isCorrect: false, text: "誤答×" };
      }); setMindFrameResults(map);
      
      // ▼ ここから演出タイミング
      setShowRevealText(false); // 「『〇〇』」は一旦隠す
      setShowDamageResult(false); // 正誤枠も一旦隠す
      setMindPhase("revealAnswer"); // 「○○さんが選んだのは、、」を出す

      // 1) 1秒後に回答表示
      revealTimersRef.current.push(setTimeout(() => setShowRevealText(true), 1000));

      // 2) 2.5秒後に正誤表示
      revealTimersRef.current.push(setTimeout(() => setShowDamageResult(true), 2500));
      
      // 2) 2.5秒後にスコア反映
      revealTimersRef.current.push(setTimeout(() => {
        setDisplayScores(scores);
      }, 2500));

      const isLastRound = typeof roundIndex === "number" && typeof totalRounds === "number"
        ? roundIndex >= totalRounds - 1
        : false;

      // 3) 5秒後に閉じる（通常）
      revealTimersRef.current.push(setTimeout(() => {
        setShowRevealText(false);
        setShowDamageResult(false);

        if (isLastRound) {
          // ★最後だけ：GAME SET → finished
          setShowGameSet(true);

          setTimeout(() => {
            setShowGameSet(false);
            setMindPhase("end");
            setFinished(true);
          }, 2000);

          return;
        }

        setMindPhase("idle");
      }, 5000));
    };

    const onEnd = () => {
      setMindPhase("end");
      // setFinished(true);
    };

    socket.on("mind_slot_open", onSlotOpen);
    socket.on("mind_order_decided", onOrderDecided);
    socket.on("mind_guess_start", onGuessStart);
    socket.on("mind_round_result", onMindRoundResult);
    socket.on("mind_game_end", onEnd);

    return () => {
      socket.off("mind_slot_open", onSlotOpen);
      socket.off("mind_order_decided", onOrderDecided);
      socket.off("mind_guess_start", onGuessStart);
      socket.off("mind_round_result", onMindRoundResult);
      socket.off("mind_game_end", onEnd);

      const timers = (socket as any).__mindSlotTimers;
      if (timers?.t) clearInterval(timers.t);
      if (timers?.auto) clearTimeout(timers.auto);
      if (timers?.countdown) clearInterval(timers.countdown);
    };
  }, [socket, roomCode]);

  useEffect(() => {
    if (!socket) return;

    socket.off("mind_rep_question_start", onRepStart);
    socket.on("mind_rep_question_start", onRepStart);

    return () => {
      socket.off("mind_rep_question_start", onRepStart);
    };
  }, [socket, onRepStart]);

  useEffect(() => {
    if (mindPhase !== "idle") return;

    const pending = pendingRepStartRef.current;
    if (!pending) return;

    pendingRepStartRef.current = null;
    applyRepStart(pending);
  }, [mindPhase]);

  useEffect(() => {
    if (allPlayersReady && !bothReady) {
      setShowStartButton(false);

      const timer = setTimeout(() => {
        setShowStartButton(true);
      }, 1000); // ← 2秒後

      return () => clearTimeout(timer);
    }
  }, [allPlayersReady, bothReady]);

  useEffect(() => {
    if (!lastPlayerElimination) {
      setMyRankState(null);
      return;
    }

    const groups = lastPlayerElimination.eliminationGroups;

    const index = groups.findIndex(group =>
      group.includes(mySocketId)
    );

    if (index === -1) {
      setMyRankState(null);
      return;
    }

    const rank = groups.length - index;
    setMyRankState(rank);

  }, [lastPlayerElimination, mySocketId]);

  useEffect(() => {
    if (!lastPlayerElimination) {
      setAllRanks([]);
      return;
    }

    const groups = lastPlayerElimination.eliminationGroups;
    const totalGroups = groups.length;

    const ranks: { socketId: string; rank: number }[] = [];

    groups.forEach((group, index) => {
      const rank = totalGroups - index;

      group.forEach(socketId => {
        ranks.push({ socketId, rank });
      });
    });

    setAllRanks(ranks);
  }, [lastPlayerElimination]);

  useEffect(() => {
    if (!gameSetScheduled) return;

    const deadTimer  = setTimeout(() => {
      setAllPlayersDead(true);
    }, 4000);

    const finishTimer = setTimeout(() => {
      setFinished(true); // QuizResult へ
    }, 6000);

    return () => {
      clearTimeout(deadTimer);
      clearTimeout(finishTimer);
    };
  }, [gameSetScheduled]);
  
  useEffect(() => {
    if (!finished) return;

    // ランキング（scores）から最終順位を計算
    const ranksNow = finalRanks; // buildRanksFromScores(players, scores) の結果
    const myRankNow = ranksNow.find(r => r.socketId === mySocketId)?.rank ?? null;

    // mySocketId がまだ無い/順位が取れないなら待つ
    if (!mySocketId || !myRankNow) return;

    const base = correctCount * 10; // ✅ 1問10P

    // ✅ 順位ボーナス（ロワイヤルと同じ）
    const bonus = calcPlacementBonus(players.length, ranksNow, mySocketId);

    const earned = base + bonus;
    const expEarned = correctCount * 20;

    setBasePoints(base);
    setFirstBonusPoints(bonus);        // ← UIの「順位ボーナス✨」に出る
    setPredictionBonusPoints(0);       // 使わないなら0固定
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
      firstBonusPoints: bonus,
      predictionBonusPoints: 0,
      myRank: myRankNow,
      playerCount: players.length,
      createdAt: Date.now(),
    };

    // ✅ まずpending保存
    savePendingAward(payload);

    // ✅ その場で付与を試す
    awardPointsAndExp(payload);
  }, [finished, correctCount, finalRanks, mySocketId, players.length]);

  useEffect(() => {
    const pending = loadPendingAward();
    if (!pending) return;

    if (awardStatus === "awarded") return;

    awardPointsAndExp(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onFocus = async () => {
      const pending = loadPendingAward();
      if (!pending) return;
      await supabase.auth.refreshSession();
      await awardPointsAndExp(pending);
    };

    const onVis = async () => {
      if (document.visibilityState !== "visible") return;
      const pending = loadPendingAward();
      if (!pending) return;
      await supabase.auth.refreshSession();
      await awardPointsAndExp(pending);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [supabase]);


  useEffect(() => {
    if (!finished) return;

    // 未ログインなら保存しない（任意：ランキング機能をログイン必須にする場合）
    if (!userLoading && !user) return;

    // 勝敗情報が欲しいなら lastPlayerElimination を待つ（称号に順位を使うなら必須）
    if (!lastPlayerElimination) return;

    if (sentRef.current) return;
    sentRef.current = true;

    (async () => {
      try {
        const weekStart = getWeekStartJST();
        const monthStart = getMonthStartJST();

        // ✅ 週間ランキングに反映したい値を決める
        // score: 今回獲得ポイントを加算、correct: 正解数、play: 1回、best_streak: max更新
        const { error: weeklyErr } = await supabase.rpc("upsert_weekly_stats", {
          p_user_id: user!.id,
          p_week_start: weekStart,
          p_score_add: 0,
          p_correct_add: correctCount,
          p_play_add: 1,
          p_best_streak: 0,
        });

        if (weeklyErr) {
          console.log("upsert_weekly_stats error:", weeklyErr);
          // ランキング保存失敗してもゲームは止めない
        }

        // ✅ 月
        const { error: monthlyErr } = await supabase.rpc("upsert_monthly_stats", {
          p_user_id: user!.id,
          p_month_start: monthStart,
          p_score_add: 0,
          p_correct_add: correctCount,
          p_play_add: 1,
          p_best_streak: 0,
        });
        if (monthlyErr) console.log("upsert_monthly_stats error:", monthlyErr);

        const score = correctCount;

        const isFirstPlace = amIWinner;

        const res = await submitGameResult(supabase, {
          game: "survival",
          title: null, 
          firstPlace: isFirstPlace,
          writeLog: true,
          // ここに必要なら extra で順位なども（あなたの実装次第）
        });

        const modal = buildResultModalPayload("survival", res);
        if (modal) pushModal(modal);
      } catch (e) {
        console.error("[survival] submitGameResult error:", e);
        // 失敗してもゲーム体験は壊さない方針でOK
      }
    })();
  }, [
    finished,
    mode,
    correctCount,
    titles,
    user,
    userLoading,
    supabase,
    pushModal,
    lastPlayerElimination,
    mySocketId,
  ]);

  useEffect(() => {
    if (!socket) return;

    socket.on("both_rematch_ready", () => {
      // 再戦開始
      handleRetry();      // 問題やスコアをリセット
      setRematchRequested(false);
      setRematchAvailable(false);
      setMatchEnded(false);
      setTimeUp(false);
      setTimeLeft(totalTime);

      sendReady(handicap);
    });

    // 再戦開始通知
    socket.on("rematch_start", ({ startAt }) => {
        console.log("[rematch_start]再戦開始通知", startAt);

        setBattleKey(prev => prev + 1);

        setPredictedWinner(null);
        setHasPredicted(false);

        // 状態をリセット
        setCorrectCount(0)
        handleRetry();           // 問題やスコアをリセット
        setRematchRequested(false);
        setRematchAvailable(false);
        setMatchEnded(false);
        setTimeUp(false);
        setTimeLeft(totalTime);
        setDisplayLives({});
        setAllPlayersDead(false);

        // 新しいゲーム開始
        updateStartAt(startAt);

        // ★ ここで questions を再設定する
        if (questionIds && questionIds.length > 0 && allQuestions.length > 0) {
          const ordered = questionIds
            .map(id => allQuestions.find(q => q.id === id))
            .filter(Boolean) as { id: string; quiz: QuizData }[];
          setQuestions(ordered);
        }

        setBothReadyState(true);
    });

    // 両方が ready になったら startAt が送られてくる
    socket.on("both_ready_start", ({ startAt }) => {
      updateStartAt(startAt);  // タイマー開始
      // カウントダウン開始
      setBothReadyState(true);     
    });

    return () => {
      socket.off("both_rematch_ready");
      socket.off("rematch_start");
      socket.off("both_ready_start");
      socket.off("answer_result");
      socket.off("question_start");
    };
  }, [socket]);

  // --- 不適切ワードリスト ---
  const bannedWords = [
    "ばか","馬鹿","バカ","くそ","糞","クソ","死ね","しね","アホ","あほ","ごみ","ゴミ",
    "fuck", "shit", "bastard", "idiot", "asshole",
  ]

  const repName =
    players.find((p) => p.socketId === mindRepId)?.playerName ?? "主役";

  const repPickedText = useMemo(() => {
    if (!revealedRepAnswer) return "";
    const q = questions[mindQuestionIndex]?.quiz;
    if (!q?.choices) return revealedRepAnswer;

    const idx = revealedRepAnswer === "A" ? 0 : revealedRepAnswer === "B" ? 1 : 2;
    return String(q.choices[idx] ?? revealedRepAnswer);
  }, [revealedRepAnswer, questions, mindQuestionIndex]);

  const orderRows = useMemo(() => {
    if (!mindOrder || mindOrder.length === 0) return [];
    return mindOrder.map((socketId, idx) => {
      const p = players.find(pp => pp.socketId === socketId);
      return {
        rank: idx + 1,
        socketId,
        name: p?.playerName ?? "???",
        value: mindSlotValues?.[socketId] ?? 0,
      };
    });
  }, [mindOrder, mindSlotValues, players]);

  if (!joined) {
    return (
      <div className="container p-8 text-center">
        <h2 className="text-3xl md:text-5xl mb-2 md:mb-4">あなたのニックネームを入力してください</h2>
        <p className="text-xl md:text-2xl text-gray-500 mb-4 md:mb-6">※最大10文字まで入力できます</p>
        <input
          type="text"
          value={playerName}
          onChange={(e) => {
            const value = e.target.value.slice(0, 10); // 最大10文字
            setPlayerName(value);

            // 不適切ワードチェック
            const lower = value.toLowerCase();
            const found = bannedWords.some(word => lower.includes(word));
            if (found) {
              setNameError("不適切な言葉は使えません");
            } else {
              setNameError(null);
            }
          }}
          maxLength={10}
          className="border px-2 py-1 text-xl md:text-3xl"
        />
        {/* ★ ここでエラー表示 */}
        {nameError && (
          <p className="mt-4 text-red-600 text-xl md:text-2xl font-bold">
            {nameError}
          </p>
        )}
        <br />
        <button
          onClick={handleJoin}
          className="
            mt-6 md:mt-10
            px-6 py-3
            bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500
            text-white font-bold text-xl md:text-2xl
            rounded-full
            shadow-lg
            hover:scale-105 hover:shadow-2xl
            transition-all duration-300
          "
        >
          対戦相手を探す
        </button>
      </div>
    );
  }

  if (!allPlayersReady) {
    return (
      <>
        <div className="text-center">
          {/* 自分のニックネーム */}
          {playerName && (
            <p className="text-xl md:text-3xl mb-6 font-bold text-gray-700">
              あなた：{playerName}
            </p>
          )}
        </div>
        <div className="text-center">
          <p className="text-3xl animate-pulse">
            対戦相手を探しています（{playerCount}）
          </p>
        </div>
      </>
    );
  }

  if (allPlayersReady && !bothReady) {
    return (
      <div className="container p-8 text-center">
        <div>
          <p className="text-3xl md:text-5xl font-extrabold text-yellow-400 mb-6 animate-pulse drop-shadow-[0_0_10px_yellow]">
            対戦メンバーが揃ったよ！
          </p>

          {/* ルームメンバー表示 */}
          <div className="flex flex-wrap justify-center gap-1 md:gap-4 mb-6">
            {roomPlayers.map((p, i) => (
              <div
                key={p.socketId}
                className="w-32 md:w-32 p-2 bg-white rounded-lg shadow-md border-2 border-gray-300"
              >
                <p className="font-bold text-lg md:text-xl truncate">{p.playerName}</p>
              </div>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {!readyToStart && showStartButton && (
            <>
              <p className="text-lg md:text-2xl text-gray-500 mb-4">準備できたら「対戦スタート！」を押そう！全員押すと対戦が始まるよ！</p>
              <motion.button
                key="start-button"
                onClick={() => {
                  sendReady(handicap);
                  setReadyToStart(true);
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                }}
                className="
                  px-8 py-4
                  text-2xl font-extrabold
                  text-white
                  bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500
                  rounded-full
                  shadow-xl
                  border-4 border-white
                  hover:scale-110
                  hover:shadow-2xl
                  transition-all duration-300
                  animate-pulse
                "
              >
                対戦スタート！
              </motion.button>
            </>
          )}
        </AnimatePresence>
        {readyToStart && (
          <p className="text-xl md:text-3xl mt-2">
            {opponent
              ? `全員の準備を待っています…`
              : "対戦相手の準備を待っています…"}
          </p>
        )}
      </div>
    );
  }

  // Xシェア機能
  const handleShareX = () => {
    const text = [
      "【ひまQ｜心理当てバトル🧠】",
      `正解数：${correctCount}問`,
      `順位：${myRankState}位`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() }); // ✅トップへ
  };

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-pink-400 via-rose-100 to-amber-400" key={battleKey}>
      {mindPhase === "slot" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="
              relative w-[340px] text-center
              rounded-3xl p-5
              border-4 border-black
              shadow-[0_20px_60px_rgba(0,0,0,0.35)]
              bg-gradient-to-b from-pink-200 via-white to-yellow-200
              overflow-hidden
            "
          >
            {/* 背景キラキラ */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-pink-400 blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-yellow-300 blur-2xl" />
            </div>

            <motion.p
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="relative text-2xl font-extrabold drop-shadow"
            >
              🎰 順番決めスロット！
            </motion.p>

            <p className="relative text-sm text-gray-700 font-bold mt-1">
              タップで止めてね！💥
            </p>

            {/* スロット窓 */}
            <div className="relative mt-4 mx-auto w-[220px] h-[120px] rounded-2xl border-4 border-black bg-white shadow-inner flex items-center justify-center">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-16 rounded-full bg-black/10" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-16 rounded-full bg-black/10" />

              <motion.div
                key={slotFinalValue ?? slotSpinningValue}
                initial={{ scale: 0.9 }}
                animate={{ scale: [1.15, 1] }}
                transition={{ duration: 0.18 }}
                className="text-7xl font-extrabold tracking-wider"
              >
                {slotFinalValue ?? slotSpinningValue}
              </motion.div>
            </div>

            <button
              disabled={slotStopped}
              onClick={() => {
                if (slotStoppedRef.current) return;

                const timers = (socket as any).__mindSlotTimers;
                if (timers?.t) clearInterval(timers.t);
                if (timers?.countdown) clearInterval(timers.countdown);
                if (timers?.auto) clearTimeout(timers.auto);

                slotStoppedRef.current = true;
                setSlotStopped(true);
                setSlotSecondsLeft(0);

                const final = slotValueRef.current;
                setSlotFinalValue(final);
                setSlotStoppedAt(Date.now());
                socket?.emit("mind_slot_stop", { roomCode, value: final });
              }}
              className={`
                relative mt-4 w-full py-3 rounded-2xl
                text-white font-extrabold text-xl
                border-4 border-black
                transition-all
                ${slotStopped
                  ? "bg-gray-400"
                  : "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:scale-[1.02] active:scale-[0.98]"
                }
              `}
            >
              {slotStopped ? "STOP！✅" : "タップで止める！🔥"}
            </button>

            <p className="relative text-sm text-gray-700 font-bold mt-3">
              ⏳ 自動停止まで：{slotSecondsLeft}秒
            </p>
          </motion.div>
        </div>
      )}

      {mindPhase === "orderReveal" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="
              relative w-[360px] md:w-[420px]
              rounded-3xl p-5
              border-4 border-black
              shadow-[0_20px_60px_rgba(0,0,0,0.35)]
              bg-gradient-to-b from-yellow-200 via-white to-pink-200
              overflow-hidden
            "
          >
            {/* うっすらキラ背景 */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-yellow-300 blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-pink-300 blur-2xl" />
            </div>

            <motion.p
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="relative text-2xl md:text-3xl font-extrabold drop-shadow"
            >
              🎉 順番決定！
            </motion.p>

            <p className="relative text-sm md:text-base text-gray-700 font-bold mt-1">
              1番から順に主役になるよ！
            </p>

            <div className="relative mt-4 space-y-2">
              {orderRows.map((r) => (
                <div
                  key={r.socketId}
                  className="
                    flex items-center justify-between
                    px-3 py-2
                    bg-white
                    rounded-xl
                    border-2 border-black
                    shadow
                  "
                >
                  <div className="flex items-center gap-3">
                    <div className="
                      w-10 h-10 rounded-full
                      bg-blue-500 text-white
                      flex items-center justify-center
                      font-extrabold
                    ">
                      {r.rank}
                    </div>

                    <div className="font-extrabold text-lg md:text-xl max-w-[200px] truncate">
                      {r.name}
                    </div>
                  </div>

                  {/* スロット値 */}
                  <div className="
                    min-w-[60px]
                    px-3 py-1
                    rounded-full
                    bg-yellow-300
                    border-2 border-black
                    text-center
                    font-extrabold
                    text-lg md:text-xl
                  ">
                    {r.value}
                  </div>
                </div>
              ))}
            </div>

            <p className="relative text-xs md:text-sm text-gray-600 font-bold mt-3">
              まもなく1番目の主役へ…✨
            </p>
          </motion.div>
        </div>
      )}

      {!finished ? (
        <>
          {/* {mindTotalRounds > 0 && (
            <div className="mb-2 flex justify-center">
              <div
                className="
                  inline-flex items-center gap-2
                  px-4 py-2
                  rounded-full
                  bg-white/90
                  border-2 border-black
                "
              >
                <span className="text-lg md:text-xl font-extrabold text-gray-900">
                  {mindRoundIndex + 1}
                  <span className="text-md md:text-xl font-bold text-gray-600"> / {mindTotalRounds}</span>
                </span>
                <span className="text-md md:text-xl font-extrabold text-gray-700">周目</span>
              </div>
            </div>
          )} */}
          {mindTotalRounds > 0 && (
            <div className="mb-2 flex flex-col items-center gap-2">
              {/* 1行目：説明 */}
              <div>
                <span className="text-md md:text-xl font-extrabold text-white drop-shadow">
                  ✨主役の心理を当てたら得点ゲット！✨
                </span>
              </div>

              {/* 2行目：周表示 */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border-2 border-gray-400">
                <span className="text-lg md:text-xl font-extrabold text-gray-900">
                  {cycleNow}
                  <span className="text-md md:text-xl font-bold text-gray-600"> / {totalCycles}</span>
                </span>
                <span className="text-md md:text-xl font-extrabold text-gray-700">周目</span>

                <span className="text-sm md:text-base font-bold text-gray-600">
                  （{turnInCycle}/{playerCountNow}人目）
                </span>
              </div>
            </div>
          )}
          <div className="flex flex-col items-center">
            {/* ✅ いまの出題者 表示（mind用） */}
            {mindRepId && mindPhase !== "idle" && mindPhase !== "slot" && mindPhase !== "orderReveal" && (
              <div className="mb-4 flex justify-center">
                <div
                  className="
                    inline-flex items-center gap-2
                    px-4 py-2
                    rounded-full
                    bg-white/90
                    border-3 border-blue-600
                    shadow
                    relative
                    overflow-hidden
                  "
                >
                  {/* うっすらキラ背景（形状は崩さない） */}
                  <span className="absolute inset-0 opacity-25 pointer-events-none">
                    <span className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-pink-400 blur-xl" />
                    <span className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-yellow-300 blur-xl" />
                  </span>

                  {/* 中身 */}
                  <span className="relative text-lg md:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                    <span
                      className="
                        w-8 h-8 md:w-9 md:h-9
                        rounded-full
                        border-2 border-yellow-500
                        bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500
                        text-white
                        flex items-center justify-center
                        shadow
                      "
                    >
                      👑
                    </span>
                    いまの主役：
                  </span>

                  <span
                    className="
                      relative
                      text-lg md:text-xl
                      font-extrabold
                      bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
                      bg-clip-text text-transparent
                      drop-shadow-sm
                    "
                  >
                    {repName}さん
                  </span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 md:grid-cols-4 gap-1 md:gap-2 mb-1 justify-items-center">
              {orderedPlayers.map((p) => {
                const isMe = p.socketId === mySocketId;
                const change = scoreChanges[p.socketId];
                const isRepNow =
                  mindRepId != null &&
                  p.socketId === mindRepId &&
                  mindPhase !== "idle" &&
                  mindPhase !== "slot" &&
                  mindPhase !== "orderReveal";
                
                const mindRes = mindFrameResults[p.socketId];
                const isRevealNow = mindPhase === "revealAnswer"; // mindだけ

                let borderColorClass = "border-gray-300";

                if (isRevealNow && showDamageResult) {
                  if (!mindRes) borderColorClass = "border-gray-300";
                  else if (mindRes.text === "主役") borderColorClass = "border-blue-500";
                  else if (mindRes.isCorrect) borderColorClass = "border-green-500";
                  else borderColorClass = "border-red-500";
                }
                
                return (
                  <div
                    key={p.socketId}
                    className={`
                      relative
                      w-17 md:w-22
                      aspect-square
                      rounded-lg
                      shadow-md
                      flex flex-col items-center justify-center
                      bg-white border-4 ${borderColorClass}
                    `}
                  >
                    {isRepNow && (
                      <div className="w-full absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-1 bg-blue-500 text-white text-xs font-extrabold rounded-full border-2 border-white shadow">
                        主役
                      </div>
                    )}
                    <p className="font-bold text-gray-800 text-lg md:text-xl text-center">
                      {p.playerName.length > 5 ? p.playerName.slice(0, 5) + "..." : p.playerName}
                    </p>

                    <p className="text-md md:text-lg font-bold text-green-600">
                      {displayScores[p.socketId] ?? 0} 点
                    </p>

                    {/* 結果表示 */}
                    <p
                      className={`text-lg md:text-xl font-bold mt-1 ${
                        isRevealNow
                          ? mindRes?.text === "主役"
                            ? "text-blue-600"
                            : mindRes?.isCorrect
                            ? "text-green-600"
                            : "text-red-600"
                          : "text-green-500"
                      }`}
                    >
                      {isRevealNow ? (showDamageResult ? (mindRes?.text ?? "　") : "　") : ""}
                    </p>

                    {/* 吹き出し表示 */}
                    <div className="absolute -bottom-1 w-20 md:w-28">
                      {visibleMessages
                        .filter(m => m.fromId === p.socketId)
                        .map((m, i) => (
                          <motion.div
                            key={i}
                            style={{ zIndex: i + 10 }}
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.8 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className={`absolute right-2 md:right-4 top-0 w-16 md:w-20 px-2 py-1 rounded shadow text-sm md:text-md font-bold border-2 ${
                              isMe ? "bg-blue-400 text-white border-blue-200" : "bg-red-400 text-white border-red-200"
                            }`}
                          >
                            {m.message}
                          </motion.div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {showGameSet && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.3, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-white text-6xl md:text-8xl font-extrabold"
              >
                GAME SET!
              </motion.div>
            </div>
          )}

          {mindPhase === "repIntro" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className="bg-white rounded-2xl p-6 w-[360px] text-center border-4 border-black">
                {/* <p className="text-2xl text-blue-500 font-extrabold">
                  {mindRoundIndex + 1}回目！
                </p> */}
                {/* <p className="text-xl font-bold mt-2">
                  {`${mindRoundIndex + 1}周目 / 全${mindTotalRounds}周`}
                </p> */}
                <p className="text-xl font-bold mt-2">
                  {`${cycleNow}周目 / 全${totalCycles}周（${turnInCycle}/${playerCountNow}人目）`}
                </p>

                <p className="text-lg md:text-xl text-pink-500 mt-3 font-extrabold">
                  {repName}さんの心理を当てよう！
                </p>
              </div>
            </div>
          )}

          {mindPhase === "repQuestion" && mySocketId === mindRepId && (
            <div className="mt-4">
              <p className="text-2xl font-extrabold">{repName}さん、今の心理を選んでね！</p>
              <p className="text-md text-gray-600 mt-1">
                制限時間： {repSecondsLeft} 秒
              </p>

              <QuizQuestion3
                quiz={questions[mindQuestionIndex].quiz}
                userAnswer={repUserAnswer}
                setUserAnswer={setRepUserAnswer}
              />

              <button
                disabled={repUserAnswer == null}
                onClick={() => {
                  const q = questions[mindQuestionIndex]?.quiz;
                  if (!q?.choices || repUserAnswer == null) return;

                  const idx = q.choices.findIndex(c => String(c) === String(repUserAnswer));
                  const safeIdx = idx >= 0 ? idx : (Number(repUserAnswer) ?? -1);
                  if (safeIdx < 0 || safeIdx > 2) return;

                  const choice = (["A","B","C"] as const)[safeIdx];

                  // 代表の回答を送信（isCorrectは今まで通り）
                  const selected = q.choices[safeIdx];
                  const isCorrect = String(selected) === String(q.answer);

                  socket?.emit("mind_rep_answer", { roomCode, choice, isCorrect });

                  // UIリセット
                  setRepChoice(choice);
                }}
                className="mt-3 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold text-xl disabled:bg-gray-400"
              >
                決定！
              </button>
            </div>
          )}

          {mindPhase === "guess" && mySocketId !== mindRepId && (
            <div className="mt-4">
              <p className="text-2xl font-extrabold">{repName}さんの答えを予想してね！</p>
              <p className="text-md text-gray-600 mt-1">
                制限時間： {guessSecondsLeft} 秒
              </p>

              <QuizQuestion3
                quiz={questions[mindQuestionIndex].quiz}
                userAnswer={guessUserAnswer}
                setUserAnswer={setGuessUserAnswer}
              />

              <button
                disabled={guessUserAnswer == null}
                onClick={() => {
                  const q = questions[mindQuestionIndex]?.quiz;
                  if (!q?.choices || guessUserAnswer == null) return;

                  // guessUserAnswer が「選択肢の値」なら idx を探す
                  const idx = q.choices.findIndex(c => String(c) === String(guessUserAnswer));
                  // もし QuizQuestion3 が index(0/1/2)を返す仕様なら、ここを idx = guessUserAnswer に変えてOK
                  const safeIdx = idx >= 0 ? idx : (Number(guessUserAnswer) ?? -1);

                  if (safeIdx < 0 || safeIdx > 2) return;

                  const choice = (["A", "B", "C"] as const)[safeIdx];
                  setGuessChoice(choice);
                  socket?.emit("mind_guess_answer", { roomCode, choice });

                  // 送ったら待機フェーズへ
                  setMindPhase("revealWait"); // ★後述のフェーズ
                }}
                className="mt-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xl disabled:bg-gray-400"
              >
                決定！
              </button>
            </div>
          )}

          {mindPhase === "repQuestion" && mySocketId !== mindRepId && (
            <div className="mt-6 p-4 bg-white rounded-xl border-2 border-black max-w-md mx-auto">
              <p className="text-2xl font-extrabold">
                <span className="text-blue-600">{repName}さん</span>
                が心理を選んでるよ…
              </p>
              <p className="text-lg text-gray-600 mt-2">ちょっと待ってね🙏</p>
              <p className="text-md text-gray-600 mt-1">
                制限時間： {repSecondsLeft} 秒
              </p>
            </div>
          )}

          {mindPhase === "guess" && mySocketId === mindRepId && (
            <div className="mt-6 p-4 bg-white rounded-xl border-2 border-black max-w-md mx-auto">
              <p className="text-2xl font-extrabold">みんなが回答してるよ…</p>
              <p className="text-lg text-gray-600 mt-2">ちょっと待ってね🙏</p>
              <p className="text-md text-gray-600 mt-1">
                制限時間： {guessSecondsLeft} 秒
              </p>
            </div>
          )}

          {mindPhase === "revealWait" && (
            <div className="mt-6 p-4 bg-white rounded-xl border-2 border-black max-w-md mx-auto">
              <p className="text-2xl font-extrabold">みんなの回答を待ってるよ…</p>
              <p className="text-lg text-gray-600 mt-2">ちょっと待ってね🙏</p>
            </div>
          )}
  
          {mindPhase === "revealAnswer" && (
            <div className="mt-3">
              <p className="mt-2 text-lg md:text-xl text-gray-700">
                {repName}さんが選んだのは、、
              </p>

              {showRevealText && (
                <p className="mt-2 text-xl md:text-3xl text-gray-900 font-extrabold">
                  「 {repPickedText} 」
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col items-center mt-2 md:mt-3">
            {/* メッセージボタン */}
            <div className="text-center border border-black p-1 rounded-xl bg-white">
              {["よろしく👋", "やったね✌", "どれだろう🤔", "ありがとう❤"].map((msg) => (
                <button
                  key={msg}
                  onClick={() => sendMessage(msg)}
                  className="mx-1 my-1 px-2 py-1 text-md md:text-lg md:text-xl rounded-full border-2 border-gray-500 bg-white hover:bg-gray-200"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <QuizResult
          correctCount={correctCount}
          onRetry={handleRetry}
          matchEnded={matchEnded}
          rematchAvailable={rematchAvailable}
          rematchRequested={rematchRequested}
          handleNewMatch={handleNewMatch}
          handleRematch={handleRematch}
          players={players}
          predictedWinner={predictedWinner}
          hasPredicted={hasPredicted}
          basePoints={basePoints}
          firstBonusPoints={firstBonusPoints}
          predictionBonusPoints={predictionBonusPoints}
          earnedPoints={earnedPoints}
          earnedExp={earnedExp}
          isLoggedIn={!!user}
          awardStatus={awardStatus}
          onGoLogin={() => router.push("/user/login")}
          isCodeMatch={mode === "code"}
          onShareX={handleShareX}
          myRankNow={myFinalRank}
          finalRanks={finalRanks}
        />
      )}
    </div>
  );
}
