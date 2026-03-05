"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion4 from "../../components/QuizQuestion4";
import { QuizData } from "@/lib/articles4";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { useQuestionPhase } from "../../../hooks/useQuestionPhase";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { submitGameResult, calcTitle } from "@/lib/gameResults";
import { buildResultModalPayload } from "@/lib/resultMessages";
import { useResultModal } from "../../components/ResultModalProvider";
import { getWeekStartJST } from "@/lib/week";
import { getMonthStartJST } from "@/lib/month";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedMultiplayerGames from "@/app/components/RecommendedMultiplayerGames";

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
  ranks: { socketId: string; name: string; correct: number; rank: number }[];
  mySocketId: string;
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
  earnedPoints: number;
  earnedExp: number;
  isLoggedIn: boolean;
  awardStatus: AwardStatus;
  onGoLogin: () => void;
  isCodeMatch: boolean;
  onShareX: () => void;
  bonus: number;
}

const QuizResult = ({
  correctCount,
  ranks,
  mySocketId,
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
  earnedPoints,
  earnedExp,
  isLoggedIn,
  awardStatus,
  onGoLogin,
  isCodeMatch,
  onShareX,
  bonus,
}: QuizResultProps) => {
  const [showText1, setShowText1] = useState(false);
  const [showText2, setShowText2] = useState(false);
  const [showText3, setShowText3] = useState(false);
  const [showText4, setShowText4] = useState(false);
  const [showText5, setShowText5] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowText1(true), 500));
    timers.push(setTimeout(() => setShowText2(true), 1500));
    timers.push(setTimeout(() => setShowText3(true), 2500));
    timers.push(setTimeout(() => setShowText4(true), 3000));
    timers.push(setTimeout(() => setShowText5(true), 3500));
    timers.push(setTimeout(() => setShowButton(true), 3500));
    return () => timers.forEach(clearTimeout);
  }, []);

  const myRank = ranks.find(r => r.socketId === mySocketId)?.rank ?? null;

  return (
    <motion.div
      className={`text-center mt-6 rounded-lg`}
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

      {showText3 && myRank !== null && myRank !== 1 && (
        <p
          className={`text-4xl md:text-6xl font-bold ${
            myRank === 1
              ? "text-yellow-400"   // 1位：最後まで残った人
              : myRank === 2
              ? "text-gray-400"     // 2位
              : myRank === 3
              ? "text-orange-600"   // 3位
              : "text-blue-600"     // その他
          }`}
        >
           {myRank} 位！
        </p>
      )}

      {showText3 && myRank === 1 && (
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

      {showText4 && (
        <>
          <p className="text-xl md:text-2xl text-gray-600 mt-6">みんなの順位</p>
          <div className="mt-2 space-y-2">
            {ranks.map((r) => (
              <div
                key={r.socketId}
                className="flex items-center gap-4 px-3 py-2 bg-white rounded-lg shadow w-full max-w-md mx-auto"
              >
                <span className={`font-extrabold text-lg w-14 text-center ${
                  r.rank === 1 ? "text-yellow-400" :
                  r.rank === 2 ? "text-gray-400" :
                  r.rank === 3 ? "text-orange-500" :
                  "text-blue-500"
                }`}>
                  {r.rank}位
                </span>

                <span className={`font-bold text-base truncate flex-1 text-center ${
                  r.socketId === mySocketId ? "text-blue-600" : "text-gray-800"
                }`}>
                  {r.name}
                </span>

                <span className="font-extrabold w-16 text-right text-black">
                  {r.correct}問
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {showButton && (
        <div className="mx-auto max-w-[520px] bg-white border-2 border-black rounded-xl p-4 shadow mt-6">
          <>
              <div className="mb-2 text-lg md:text-xl text-gray-700 font-bold">
                <p className="text-blue-500">正解数ポイント：{basePoints}P（{correctCount}問 × 10P）</p>
                {bonus > 0 && (
                  <p className="text-md md:text-xl font-bold text-yellow-500 mb-1">
                    順位ボーナス： {bonus} P✨
                  </p>
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
                      bg-yellow-500 hover:bg-yellow-600
                      text-white text-xl md:text-xl
                      font-semibold
                      rounded-lg shadow-md
                      transition-all duration-300
                    "
                  >
                    もう一回対戦する
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
      {showButton && (
        <>
          <RecommendedMultiplayerGames
            title="次はみんなでどれ行く？🎮"
            count={4}
            excludeHref="/quiz-quick"
          />
        </>
      )}
    </motion.div>
  );
};

export default function QuizModePage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = pathname.split("/").pop() || "random";
  const code = searchParams?.get("code") || ""; 
  const count = searchParams?.get("count") || ""; 
  const genre = searchParams?.get("genre") || "";
  const level = searchParams?.get("level") || "";
  // const timeParam = searchParams?.get("time") || "5";
  // const totalTime = parseInt(timeParam) * 60;
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const BONUS_TABLE: Record<number, number[]> = {
    2: [150],
    3: [200, 100],
    4: [250, 125, 60],
    5: [350, 175, 85, 40],
    6: [450, 225, 110, 55, 25],
    7: [600, 300, 150, 75, 35, 15],
    8: [750, 375, 180, 90, 45, 20, 10],
  };

  const calcPlacementBonusSafe = (
    playerCount: number,
    ranksNow: { socketId: string; rank: number }[],
    mySocketId: string
  ) => {
    const table = BONUS_TABLE[playerCount] ?? [];
    const me = ranksNow.find(r => r.socketId === mySocketId);
    if (!me) return 0;

    const maxRank = Math.max(...ranksNow.map(r => r.rank));
    const isLast = me.rank === maxRank;
    if (isLast) return 0;

    const sameRankCount = ranksNow.filter(r => r.rank === me.rank).length;
    if (sameRankCount !== 1) return 0;

    return table[me.rank - 1] ?? 0;
  };

  // =====================
  // ✅ pending（付与待ち）管理：確実付与用
  // =====================
  const PENDING_KEY = "survival_award_pending_v1";

  type PendingAward = {
    points: number;
    exp: number;
    correctCount: number;
    basePoints: number;
    firstBonusPoints: number;
    predictedWinner: string | null;
    hasPredicted: boolean;
    winnerSocketIds: string[]; // 勝者判定ログ用（winnerGroup）
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

      // ✅ レベルアップ特典（Lv×100P + 称号）を“DBで一回だけ”付与
      if (newLevel > oldLevel) {
        try {
          const { data: r, error: rErr } = await supabase.rpc("claim_levelup_rewards", {
            p_user_id: authedUserId,
            p_old_level: oldLevel,
            p_new_level: newLevel,
          });

          if (rErr) {
            console.error("claim_levelup_rewards error:", rErr);
          } else {
            const row = Array.isArray(r) ? r[0] : r;
            const awardedPoints = Number(row?.awarded_points ?? 0);
            const awardedTitle = (row?.awarded_title ?? null) as string | null;

            // 付与があった時だけUI出す
            if (awardedPoints > 0 || awardedTitle) {
              window.dispatchEvent(new Event("points:updated"));
              // 称号表示などがあるなら、profile:updated相当も再通知したい場合は別イベントでもOK
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

      // ログ（＋）※失敗しても致命的ではない
      const reasonPoint =
        `瞬発力クイズ獲得: 正解${payload.correctCount}問=${payload.basePoints}P` +
        (payload.firstBonusPoints ? ` / 順位ボーナス${payload.firstBonusPoints}P` : "")

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
          reason: `瞬発力クイズEXP獲得: 正解${payload.correctCount}問 → ${payload.exp}EXP`,
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


  const [correctByPlayer, setCorrectByPlayer] = useState<Record<string, number>>({});
  const scoredQuestionRef = useRef<string>(""); // 二重加算防止
  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");
  const awardedOnceRef = useRef(false);
  const { pushModal } = useResultModal();
  const sentRef = useRef(false); // ★ 成績保存の二重送信防止

  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [basePoints, setBasePoints] = useState(0);

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);
  // const [timeLeft, setTimeLeft] = useState(totalTime);
  const [wrongStreak, setWrongStreak] = useState(0);
  const wrongStreakRef = useRef(0);
  const [scoreChanges, setScoreChanges] = useState<Record<string, number | null>>({});
  const [readyToStart, setReadyToStart] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  // const [timeUp, setTimeUp] = useState(false);
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

  const [gaugeReady, setGaugeReady] = useState(false);

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
    lastPlayerElimination,
  } = useBattle(playerName);

  const questionPhase = useQuestionPhase(
    socket,
    roomCode,
    battleKey
  );

  const groups = lastPlayerElimination?.eliminationGroups ?? [];
  const winnerGroup = groups.length ? groups[groups.length - 1] : [];
  const isSoloWinner = winnerGroup.length === 1;          // 単独勝者か
  const amIWinner = winnerGroup.includes(mySocketId);     // 自分が勝者か
  const phase = questionPhase?.phase ?? "question";
  const results = questionPhase?.results ?? [];
  const canAnswer = questionPhase?.canAnswer ?? false;
  const currentIndex = questionPhase?.currentIndex ?? 0;
  const questionTimeLeft = questionPhase?.questionTimeLeft ?? 20;
  const submitAnswer = questionPhase?.submitAnswer ?? (() => {});
  const [showStartButton, setShowStartButton] = useState(false);

  const MAX_QUESTIONS = 5;
  // const QUESTION_LIMIT = 2; // 3秒固定（サーバ側も3にする）
  const QUESTION_LIMIT = 1.5;
  const QUESTION_MS = QUESTION_LIMIT * 1000;

  // ✅ クライアント強制ゲージ
  const [clientRatio, setClientRatio] = useState(1);
  const rafRef = useRef<number | null>(null);
  const gaugeStartRef = useRef<number | null>(null);

  const [qCountdown, setQCountdown] = useState<number | null>(null);
  const lastCountdownKeyRef = useRef<string>(""); // 同じ問題で二重起動しない
  const [showGameSetOverlay, setShowGameSetOverlay] = useState(false);
  const gameSetOnceRef = useRef(false);
  const gameSetDelayTimerRef = useRef<number | null>(null);
  const gameSetOverlayTimerRef = useRef<number | null>(null);
  const resultAnimKeyRef = useRef<string>("");

  const [bonus, setBonus] = useState(0);
  
  const playersMemo = useMemo<Player[]>(() => {
    return rawPlayers.map((p) => ({
      socketId: p.socketId,
      playerName: p.name,
    }));
  }, [rawPlayers]);
  
  const me = playersMemo.find(p => p.socketId === mySocketId);
  const opponent = playersMemo.find(p => p.socketId !== mySocketId);

  const allPlayersReady = roomPlayers.length >= maxPlayers;

  // --- プレイヤー人数監視 ---
  useEffect(() => {
    if (!socket) return;

    socket.on("room_full", () => {
      setRoomPlayers(playersMemo);
      setRoomFull(true);
    });

    return () => {
      socket.off("room_full");
    };
  }, [socket, playersMemo]);

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
      joinRandom({ maxPlayers: 4, gameType:"quick" }, (code) => setRoomCode(code)); // コールバックで state にセット
    } else {
      joinWithCode(code,count,"quick");
      setRoomCode("quick_" + code); // 入力済みコードを state にセット
    }
  };

  const handleRetry = () => {
    setCorrectCount(0);
    setFinished(false);
    setShowAnswer(false);
    setShowAnswerText(false);
    setShowExplanation(false);
    setShowCorrectCount(false);
    setShowDamageResult(false);
    setShowGameSetOverlay(false);
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
    setEarnedExp(0);
    setBonus(0);
    sentRef.current = false;
    clearPendingAward();
    setCorrectByPlayer({});
    scoredQuestionRef.current = "";
    gameSetOnceRef.current = false;
    resetGameSetAndResultTimers();
    resultAnimKeyRef.current = "";
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
    // setTimeUp(false);
    setFinished(false);
    setCountdown(null);
    // setTimeLeft(totalTime);
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
    setEarnedExp(0);
    setBonus(0);
    sentRef.current = false;
    clearPendingAward();
    setCorrectByPlayer({});
    scoredQuestionRef.current = "";
    gameSetOnceRef.current = false;
    setShowAnswer(false);
    setShowAnswerText(false);
    setShowExplanation(false);
    setShowCorrectCount(false);
    setShowDamageResult(false);
    setShowGameSetOverlay(false);
    resultAnimKeyRef.current = "";

    setReadyToStart(false);

    resetGameSetAndResultTimers();
    resetMatch();

    if (mode === "random") {
      joinRandom({ maxPlayers: 4, gameType:"quick" }, (code) => setRoomCode(code));
    } else {
      joinWithCode(code, count,"quick");
      setRoomCode("quick_" + code);
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

  /* ---------- クイズ取得 ---------- */
  const [allQuestions, setAllQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);

  useEffect(() => {
    // question じゃないならカウントダウンは切る（詰まり防止）
    if (phase !== "question") {
      setQCountdown(null);
      setGaugeReady(false);
      return;
    }

    const key = `${roomCode}:${currentIndex}`;
    if (lastCountdownKeyRef.current === key) return;
    lastCountdownKeyRef.current = key;

    setGaugeReady(false);
    setQCountdown(5);

    const interval = setInterval(() => {
      setQCountdown(prev => {
        if (prev === null) return null;
        if (prev === 1) {
          clearInterval(interval);
          setTimeout(() => {
            setQCountdown(null);
            setGaugeReady(true);
          }, 700);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, currentIndex, roomCode]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    gaugeStartRef.current = null;

    if (!gaugeReady || phase !== "question") {
      setClientRatio(1);
      return;
    }
    if (!canAnswer) {
      // 今の表示のまま止める
      return;
    }

    gaugeStartRef.current = performance.now();

    const tick = (now: number) => {
      const start = gaugeStartRef.current ?? now;
      const elapsed = now - start;
      const ratio = Math.max(0, 1 - elapsed / QUESTION_MS);
      setClientRatio(ratio);
      if (ratio > 0) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [gaugeReady, phase, canAnswer, currentIndex, QUESTION_MS]);

  const resetGameSetAndResultTimers = () => {
    gameSetOnceRef.current = false;
    resultAnimKeyRef.current = "";

    if (gameSetDelayTimerRef.current) {
      window.clearTimeout(gameSetDelayTimerRef.current);
      gameSetDelayTimerRef.current = null;
    }
    if (gameSetOverlayTimerRef.current) {
      window.clearTimeout(gameSetOverlayTimerRef.current);
      gameSetOverlayTimerRef.current = null;
    }

    setShowGameSetOverlay(false);
  };

  useEffect(() => {
    const fetchArticles = async () => {
      const res = await fetch("/api/articles4");
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

  useEffect(() => {
    if (phase !== "result") return;
    if (currentIndex >= MAX_QUESTIONS) return;

    // この問題でまだ加算してないか
    const key = `${roomCode}:${currentIndex}`;
    if (scoredQuestionRef.current === key) return;

    // 結果が揃ってない時があるので、resultsが空なら待つ
    if (!results || results.length === 0) return;

    scoredQuestionRef.current = key;

    setCorrectByPlayer(prev => {
      const next = { ...prev };

      results.forEach(r => {
        if (r.isCorrect) {
          next[r.socketId] = (next[r.socketId] ?? 0) + 1;
        }
      });

      // ✅ 自分の正解数（correctCount）もここで確定させる（1回だけ）
      const myCorrect = next[mySocketId] ?? 0;
      setCorrectCount(myCorrect);

      return next;
    });
  }, [phase, results, currentIndex, roomCode, mySocketId]);

  type CorrectRankRow = {
    socketId: string;
    name: string;
    correct: number;
    rank: number;
  };

  const buildRanksByCorrect = (
    players: { socketId: string; playerName: string }[],
    correctByPlayer: Record<string, number>
  ): CorrectRankRow[] => {
    const rows = players.map(p => ({
      socketId: p.socketId,
      name: p.playerName,
      correct: correctByPlayer[p.socketId] ?? 0,
    }));

    rows.sort((a, b) => b.correct - a.correct);

    let lastCorrect: number | null = null;
    let lastRank = 0;

    return rows.map((r, i) => {
      const rank = (lastCorrect === r.correct) ? lastRank : (i + 1);
      lastCorrect = r.correct;
      lastRank = rank;
      return { ...r, rank };
    });
  };

  const correctRanks = useMemo(() => {
    if (!finished) return [];
    return buildRanksByCorrect(playersMemo, correctByPlayer);
  }, [finished, playersMemo, correctByPlayer]);

  const myRankByCorrectMemo = useMemo(() => {
    if (!finished) return null;
    return correctRanks.find(r => r.socketId === mySocketId)?.rank ?? null;
  }, [finished, correctRanks, mySocketId]);

  

  useEffect(() => {
    if (!bothReady) return;

    setCountdown(5);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev === 1) {
          clearInterval(interval);

          setTimeout(() => {
            setCountdown(null);
            setDungeonStart(true);
            setShowStageEvent(true);
          }, 800);
          setShowStageEvent(false);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [bothReady]);

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
    if (phase !== "result") return;

    const key = `${roomCode}:${currentIndex}`;
    if (resultAnimKeyRef.current === key) return;
    resultAnimKeyRef.current = key;

    setShowAnswerText(false);
    setShowAnswer(false);
    setShowExplanation(false);
    setShowCorrectCount(false);
    setShowDamageResult(false);

    const answerTextTimer = setTimeout(() => setShowAnswerText(true), 200);
    const answerTimer = setTimeout(() => setShowAnswer(true), 1000);
    const explanationTimer = setTimeout(() => setShowExplanation(true), 2000);
    const correctCountTimer = setTimeout(() => setShowCorrectCount(true), 3000);
    const damageTimer = setTimeout(() => setShowDamageResult(true), 3000);

    return () => {
      clearTimeout(answerTextTimer);
      clearTimeout(answerTimer);
      clearTimeout(explanationTimer);
      clearTimeout(correctCountTimer);
      clearTimeout(damageTimer);
    };
  }, [phase, currentIndex, roomCode]);

  useEffect(() => {
    setShowDamageResult(false);
  }, [phase]);

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
    if (finished) return;
    if (phase !== "result") return;
    if (currentIndex !== MAX_QUESTIONS - 1) return;
    if (!showExplanation) return;

    if (gameSetOnceRef.current) return;
    gameSetOnceRef.current = true;

    // 念のため既存タイマーを消す（多重起動防止）
    if (gameSetDelayTimerRef.current) window.clearTimeout(gameSetDelayTimerRef.current);
    if (gameSetOverlayTimerRef.current) window.clearTimeout(gameSetOverlayTimerRef.current);

    gameSetDelayTimerRef.current = window.setTimeout(() => {
      setShowGameSetOverlay(true);

      gameSetOverlayTimerRef.current = window.setTimeout(() => {
        setShowGameSetOverlay(false);
        setFinished(true);
      }, 2000);
    }, 4000);

    // ★ここでcleanupしない（依存変化で殺されるのを防ぐ）
  }, [finished, phase, currentIndex, showExplanation, MAX_QUESTIONS]);

  useEffect(() => {
    return () => {
      if (gameSetDelayTimerRef.current) window.clearTimeout(gameSetDelayTimerRef.current);
      if (gameSetOverlayTimerRef.current) window.clearTimeout(gameSetOverlayTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!finished) return;

    const ranksNow = buildRanksByCorrect(playersMemo, correctByPlayer);

    const bonusNow = calcPlacementBonusSafe(playersMemo.length, ranksNow, mySocketId);
    setBonus(bonusNow);

    const base = correctCount * 10;
    const points = base + bonusNow;
    const exp = correctCount * 20;

    setBasePoints(base);
    setEarnedPoints(points);
    setEarnedExp(exp);

    if (points <= 0 && exp <= 0) {
      setAwardStatus("idle");
      clearPendingAward();
      return;
    }

    const payload: PendingAward = {
      points,
      exp,
      correctCount,
      basePoints: base,
      firstBonusPoints: bonusNow,
      predictedWinner,
      hasPredicted,
      winnerSocketIds: [],
      createdAt: Date.now(),
    };

    savePendingAward(payload);
    awardPointsAndExp(payload);
  }, [finished, correctCount, playersMemo, correctByPlayer, mySocketId]);


  // useEffect(() => {
  //   const pending = loadPendingAward();
  //   if (!pending) return;

  //   if (awardStatus === "awarded") return;

  //   awardPointsAndExp(pending);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

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

    // window.addEventListener("focus", onFocus);
    // document.addEventListener("visibilitychange", onVis);
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

        const score = correctCount; // サバイバルは「正解数」がスコアでOK

        const isFirstPlace = amIWinner;

        const res = await submitGameResult(supabase, {
          game: "survival",
          score: correctCount,
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
      setBattleKey(prev => prev + 1);
      // 再戦開始
      handleRetry();      // 問題やスコアをリセット
      setRematchRequested(false);
      setRematchAvailable(false);
      setMatchEnded(false);
      // setTimeUp(false);
      setCountdown(null);
      // setTimeLeft(totalTime);

      sendReady(handicap);
    });

    // 再戦開始通知
    socket.on("rematch_start", ({ startAt }) => {
        console.log("[rematch_start]再戦開始通知", startAt);

        setPredictedWinner(null);
        setHasPredicted(false);

        // 状態をリセット
        setCorrectCount(0)
        handleRetry();           // 問題やスコアをリセット
        setRematchRequested(false);
        setRematchAvailable(false);
        setMatchEnded(false);
        setCountdown(null);
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

  const answeredKeyRef = useRef<string>("");

  const submitByChoice = (pickedIndex: number) => {
    if (phase !== "question") return;
    if (!canAnswer) return;

    // 1問につき1回だけ送る
    const key = `${roomCode}:${currentIndex}`;
    if (answeredKeyRef.current === key) return;
    answeredKeyRef.current = key;

    const correctAnswer = questions[currentIndex].quiz?.answer;
    submitAnswer(pickedIndex === correctAnswer);

    // UI的に選択状態を残したいなら残す（不要なら消してOK）
    setUserAnswer(pickedIndex);
  };

  useEffect(() => {
    answeredKeyRef.current = ""; // 次の問題で送れるように
    setUserAnswer(null);
  }, [currentIndex, roomCode]);

  // --- 不適切ワードリスト ---
  const bannedWords = [
    "ばか","馬鹿","バカ","くそ","糞","クソ","死ね","しね","アホ","あほ","ごみ","ゴミ",
    "fuck", "shit", "bastard", "idiot", "asshole",
  ]

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

  // --- 自分を常に左に表示するための並び替え ---
  const orderedPlayers = [...playersMemo].sort((a, b) => {
    if (a.socketId === mySocketId) return -1;
    if (b.socketId === mySocketId) return 1;
    return 0;
  });

  // Xシェア機能
  const handleShareX = () => {
    const text = [
      "【ひまQ｜瞬発力クイズ🚀】",
      `正解数：${correctCount}問`,
      `順位：${myRankState}位`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() });
  };

  const isOverlay = countdown !== null || qCountdown !== null;

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-cyan-400 via-sky-100 to-cyan-400" key={battleKey}>
      {(countdown !== null || qCountdown !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
          <div className="text-center text-white">

            {/* 第〇問 */}
            <p className="mb-2 text-2xl md:text-4xl font-extrabold drop-shadow">
              第{Math.min(currentIndex + 1, MAX_QUESTIONS)}問 / 全{MAX_QUESTIONS}問
            </p>

            {/* 上のメッセージ */}
            <p className="mb-4 text-xl md:text-3xl font-bold animate-pulse">
              {(countdown ?? qCountdown) === 0
                ? ""
                : "回答時間は2秒！集中してね🔥"}
            </p>

            {/* 数字 / START */}
            <motion.div
              key={countdown ?? qCountdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-7xl font-extrabold"
            >
              {(countdown ?? qCountdown) === 0
                ? "スタート！！🚀"
                : (countdown ?? qCountdown)}
            </motion.div>

          </div>
        </div>
      )}

      {!finished ? (
        <>
          <div className="mb-2 md:mb-4">
            <p className="text-4xl md:text-6xl font-extrabold text-gray-800 drop-shadow">
              第{Math.min(currentIndex + 1, MAX_QUESTIONS)}問
            </p>
            <p className="text-lg md:text-2xl text-gray-600 font-bold">
              （全{MAX_QUESTIONS}問）
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-4 md:grid-cols-4 gap-1 md:gap-2 mb-1 justify-items-center">
              {orderedPlayers.map((p) => {
                const isMe = p.socketId === mySocketId;
                const change = scoreChanges[p.socketId];
                const result = results.find(r => r.socketId === p.socketId); // ← 結果取得
                    
                let borderColorClass = "border-gray-300"; // デフォルト（問題中）
                if (phase === "result" && showDamageResult) {
                  if (result === undefined) {
                    borderColorClass = "border-gray-300"; // 未回答
                  } else if (result.isCorrect) {
                    borderColorClass = "border-green-500";
                  } else {
                    borderColorClass = "border-red-500";
                  }
                }
                
                const correctNum = correctByPlayer[p.socketId] ?? 0;
                
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
                    <p className="font-bold text-gray-800 text-lg md:text-xl text-center">
                      {p.playerName.length > 5 ? p.playerName.slice(0, 5) + "..." : p.playerName}
                    </p>

                    {/* 結果表示 */}
                    <p className="text-lg md:text-xl font-extrabold mt-1 text-emerald-600">
                      得点: {correctNum}
                    </p>

                    {phase === "result" && showDamageResult && (
                      <p className={`text-sm md:text-base font-bold ${result?.isCorrect ? "text-green-600" : "text-red-600"}`}>
                        {result ? (result.isCorrect ? "正解〇" : "誤答×") : "未回答"}
                      </p>
                    )}

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

          {showGameSetOverlay && (
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
  
          {phase === "result" && !allPlayersDead &&(
            <>
              <div>
                {showAnswerText && (
                  <p className="mt-2 text-lg md:text-xl text-gray-700">
                    正解は、、
                  </p>
                )}

                {showAnswer && (
                  <p className="mt-2 text-xl md:text-3xl text-gray-900 font-extrabold">
                   「 {questions[currentIndex].quiz.displayAnswer}」
                  </p>
                )}

                {showExplanation && (
                  <p className="mt-2 mb-3 text-md md:text-xl text-gray-600">
                    {questions[currentIndex].quiz.answerExplanation}
                  </p>
                )}
              </div>
            </>
          )}

          {questions[currentIndex]?.quiz && (
            <>
              {(showCorrectMessage || incorrectMessage) ? (
                <>
                  {showCorrectMessage && <p className="text-4xl md:text-6xl font-extrabold mb-2 text-green-600 drop-shadow-lg animate-bounce animate-pulse">◎正解！🎉</p>}
                  {incorrectMessage && <p className="text-3xl md:text-4xl font-extrabold mb-2 text-red-500 drop-shadow-lg animate-shake whitespace-pre-line">{incorrectMessage}</p>}

                  {questions[currentIndex].quiz.answerExplanation && (
                    <div className="mt-5 md:mt-15 text-center">
                      <p className="text-xl md:text-2xl font-bold text-blue-600">解説📖</p>
                      <p className="mt-1 md:mt-2 text-lg md:text-xl text-gray-700">{questions[currentIndex].quiz.answerExplanation}</p>
                    </div>
                  )}

                  {questions[currentIndex].quiz.trivia && (
                    <div className="mt-5 md:mt-10 text-center">
                      <p className="text-xl md:text-2xl font-bold text-yellow-600">知って得する豆知識💡</p>
                      <p className="mt-1 md:mt-2 text-lg md:text-xl text-gray-700">{questions[currentIndex].quiz.trivia}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {phase !== "result" && (
                    <div className="w-full max-w-md mx-auto mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-lg md:text-2xl font-bold text-gray-700">
                          回答タイム
                        </p>
                        <p className={`text-lg md:text-2xl font-extrabold ${questionTimeLeft <= 1 ? "text-red-500 animate-pulse" : "text-gray-700"}`}>
                          {questionTimeLeft}s
                        </p>
                      </div>

                      <div className="h-4 md:h-5 w-full bg-white border-2 border-black rounded-full overflow-hidden shadow">
                        <div
                          className={`h-full ${questionTimeLeft <= 1 ? "bg-red-500" : "bg-blue-500"}`}
                          style={{ width: `${clientRatio * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                
                  {phase !== "result" && !isOverlay && (
                    <QuizQuestion4
                      quiz={questions[currentIndex].quiz}
                      userAnswer={userAnswer}
                      setUserAnswer={setUserAnswer}
                      onPick={submitByChoice}
                    />
                  )}
                  {/* 回答フェーズ */}
                  {phase === "question" && !(canAnswer && qCountdown === null) && (
                    <p className="mt-4 text-xl md:text-2xl font-bold text-gray-600 animate-pulse">
                      {qCountdown !== null ? "カウントダウン中…" : "他の人の回答を待っています…"}
                    </p>
                  )}
                </>
              )}
            </>
          )}

          <div className="flex flex-col items-center mt-2 md:mt-3">
            {/* メッセージボタン */}
            <div className="text-center border border-black p-1 rounded-xl bg-white">
              {["よろしく👋", "やったね✌", "負けないぞ✊", "ありがとう❤"].map((msg) => (
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
          ranks={correctRanks}
          mySocketId={mySocketId}
          onRetry={handleRetry}
          matchEnded={matchEnded}
          rematchAvailable={rematchAvailable}
          rematchRequested={rematchRequested}
          handleNewMatch={handleNewMatch}
          handleRematch={handleRematch}
          players={playersMemo}
          predictedWinner={predictedWinner}
          hasPredicted={hasPredicted}
          basePoints={basePoints}
          earnedPoints={earnedPoints}
          earnedExp={earnedExp}
          isLoggedIn={!!user}
          awardStatus={awardStatus}
          onGoLogin={() => router.push("/user/login")}
          isCodeMatch={mode === "code"}
          onShareX={handleShareX}
          bonus={bonus}
        />
      )}
    </div>
  );
}
