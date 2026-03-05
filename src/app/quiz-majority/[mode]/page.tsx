"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion2 from "../../components/QuizQuestion2";
import { QuizData } from "@/lib/articles2";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { useQuestionPhase } from "../../../hooks/useQuestionPhase";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { useResultModal } from "../../components/ResultModalProvider";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedMultiplayerGames from "@/app/components/RecommendedMultiplayerGames";

type AwardStatus = "idle" | "awarding" | "awarded" | "need_login" | "error";

const stagePointMap: Record<number, number> = {
  1: 10,
  2: 20,
  3: 30,
  4: 40,
  5: 50,
  6: 60,
  7: 80,
  8: 100,
  9: 200,
  10: 300,
};

const stageMessages: Record<number, string> = {
  0: "惜しい！次は仲間と作戦立てていこう🔥",
  1: "まずは1問クリア！チーム始動だ✨",
  2: "いい連携！この調子で押し切ろう👍",
  3: "ナイス判断！みんなの流れ来てる💨",
  4: "強い！チームの空気が仕上がってきた😎",
  5: "半分突破！連携が噛み合ってる👏",
  6: "かなり強い！意思統一できてる💪",
  7: "上級者チーム！読み合いが冴えてる👑",
  8: "天才ムーブ！仲間との判断が完璧🧠✨",
  9: "あと1問…！最後は全員で決めよう🔥",
  10: "完全制覇！！最高のチーム勝利だ🏆✨",
};

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
  basePoints: number;
  earnedPoints: number;
  earnedExp: number;
  isLoggedIn: boolean;
  awardStatus: AwardStatus;
  onGoLogin: () => void;
  isCodeMatch: boolean;
  onShareX: () => void;
  clearedStage: number;
}

const QuizResult = ({
  correctCount,
  onRetry,
  matchEnded,
  rematchAvailable,
  rematchRequested,
  handleNewMatch,
  handleRematch,
  basePoints,
  earnedPoints,
  earnedExp,
  isLoggedIn,
  awardStatus,
  onGoLogin,
  isCodeMatch,
  onShareX,
  clearedStage,
}: QuizResultProps) => {
  const [showText1, setShowText1] = useState(false);
  const [showText2, setShowText2] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowText1(true), 500));
    timers.push(setTimeout(() => setShowText2(true), 1500));
    timers.push(setTimeout(() => setShowButton(true), 2500));
    return () => timers.forEach(clearTimeout);
  }, []);

  const stageMessage =
    stageMessages[Math.min(10, Math.max(0, clearedStage))] ??
    "ナイスプレイ！🔥";

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
            ステージ{clearedStage}までクリア！
          </p>
        </>
      )}

      {showText2 && (
        <p className="text-xl md:text-2xl text-gray-600 mb-2">
          {stageMessage}
        </p>
      )}

      {showButton && (
        <div className="mx-auto max-w-[520px] bg-white border-2 border-black rounded-xl p-4 shadow mt-6">
            <>
              <div className="mb-2 text-lg md:text-xl text-gray-700 font-bold">
                <p className="text-blue-500">正解数ポイント：{basePoints}P（{correctCount}問 × 10P）</p>
              </div>
              <div className="mb-2 text-lg md:text-xl text-gray-700 font-bold">
                <p className="text-blue-500">クリアステージボーナス：{earnedPoints}P</p>
              </div>

              <p className="text-xl md:text-2xl font-extrabold text-gray-800">
                今回の獲得ポイント： <span className="text-green-600">{earnedPoints+basePoints} P</span>
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
                    className="mt-2 px-4 py-2 bg-blue-500 text-white  rounded-lg font-bold hover:bg-blue-600 cursor-pointer"
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
              ゲームスタート！
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
                    もう一回挑戦する
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
                    もう一回挑戦！
                  </button>
                )}
              </div>
            </div>
            {/* 待ちメッセージを下に隔離 */}
            {rematchRequested && !rematchAvailable && (
              <p className="text-center text-2xl md:text-3xl text-gray-700 bg-white rounded-xl p-2 mt-4 md:mt-2">
                仲間の準備を待っています…
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
            excludeHref="/quiz-majority"
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
  const timeParam = searchParams?.get("time") || "5";
  const totalTime = parseInt(timeParam) * 60;
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  // =====================
  // ✅ pending（付与待ち）管理：多数決クイズ用
  // =====================
  const PENDING_KEY = "majority_award_pending_v1";

  type PendingAward = {
    points: number;
    exp: number;
    correctCount: number;
    basePoints: number;
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

      const reasonPoint =
        `多数決クイズ獲得: 正解${payload.correctCount}問=${payload.basePoints}P + ステージ${Math.min(10, Math.max(0, payload.correctCount))}ボーナス`
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
          reason: `多数決クイズEXP獲得: 正解${payload.correctCount}問 → ${payload.exp}EXP`,
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

  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");
  const awardedOnceRef = useRef(false);
  const { pushModal } = useResultModal();
  const sentRef = useRef(false); // ★ 成績保存の二重送信防止

  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [basePoints, setBasePoints] = useState(0);
  const [clearedStage, setClearedStage] = useState(0);

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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);
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
  const [battleKey, setBattleKey] = useState(0);

  const roomLockedRef = useRef(false);
  useEffect(() => {
    roomLockedRef.current = roomLocked;
  }, [roomLocked]);

  const [predictedWinner, setPredictedWinner] = useState<string | null>(null);
  const [hasPredicted, setHasPredicted] = useState(false);

  const {
    joinRandom,
    joinWithCode,
    sendReady,
    sendMessage,
    resetMatch,
    updateStartAt,
    leaveRoom,
    players: rawPlayers,
    questionIds,
    bothReady,
    startAt,
    mySocketId,
    socket,
    playerLives,
    gameSetScheduled,
  } = useBattle(playerName);

  const questionPhase = useQuestionPhase(
    socket,
    roomCode
  );

  const phase = questionPhase?.phase ?? "question";
  const results = questionPhase?.results ?? [];
  const canAnswer = questionPhase?.canAnswer ?? false;
  const currentIndex = questionPhase?.currentIndex ?? 0;
  const stageNumber = currentIndex + 1; // 何問目（1始まり）
  const questionTimeLeft = questionPhase?.questionTimeLeft ?? 20;
  const submitAnswer = questionPhase?.submitAnswer ?? (() => {});
  const [displayLives, setDisplayLives] = useState<Record<string, number>>({});
  const [showStartButton, setShowStartButton] = useState(false);
  type TeamChoice = "A" | "B" | null;
  const [teamChoice, setTeamChoice] = useState<TeamChoice>(null);
  const [teamChoiceDecidedBy, setTeamChoiceDecidedBy] = useState<"majority" | "random" | null>(null);
  const [gameSet, setGameSet] = useState(false);
  const [showTeamJudgeOverlay, setShowTeamJudgeOverlay] = useState(false);
  const [teamJudge, setTeamJudge] = useState<"correct" | "wrong" | null>(null);

  const endOnceRef = useRef(false);
  const [isTeamAnswerWrong, setIsTeamAnswerWrong] = useState(false); // チーム回答が違った（=ゲームオーバー扱い）
  const [showStageOverlay, setShowStageOverlay] = useState(false);
  const [stageOverlayNumber, setStageOverlayNumber] = useState<number>(1);
  const prevStageRef = useRef<number>(0);

  const isResultPhase = phase === "result";
  const isQuestionPhase = phase === "question";


  // ✅ サーバーから受け取る「チーム投票状況」想定
  type TeamVotes = {
    a: number;
    b: number;
    answered: number; // 回答済み人数
    total: number;    // 参加人数（例:4）
  };

  const [teamVotes, setTeamVotes] = useState<TeamVotes>({
    a: 0,
    b: 0,
    answered: 0,
    total: maxPlayers,
  });
  
  const players: Player[] = rawPlayers.map((p) => ({
    socketId: p.socketId,
    playerName: p.name,
  }));
  
  const me = players.find(p => p.socketId === mySocketId);
  const opponent = players.find(p => p.socketId !== mySocketId);

  const allPlayersReady = roomPlayers.length >= maxPlayers;

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
      joinRandom({ maxPlayers: 4, gameType:"majority" }, (code) => setRoomCode(code)); // コールバックで state にセット
    } else {
      joinWithCode(code,count,"majority");
      setRoomCode("majority_" + code); // 入力済みコードを state にセット
    }
  };

  const handleRetry = () => {
    setCorrectCount(0);
    setFinished(false);
    setWrongStreak(0);
    wrongStreakRef.current = 0;
    setScoreChanges({});
    setIncorrectMessage(null);
    setShowCorrectMessage(false);
    setPredictedWinner(null);
    setHasPredicted(false);
    setUserAnswer(null);
    awardedOnceRef.current = false;
    setAwardStatus("idle");
    setEarnedPoints(0);
    setBasePoints(0);
    setEarnedExp(0);
    sentRef.current = false;
    clearPendingAward();
    endOnceRef.current = false;
    setIsTeamAnswerWrong(false);
    setGameSet(false);
    setShowStageOverlay(false);
    prevStageRef.current = 0;
    setClearedStage(0);
  };

  const handleNewMatch = () => {
    const old = roomCode;   // ★今の部屋
    if (old) leaveRoom(old); // ★抜ける（emit）

    setRoomCode(""); 

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
    setCountdown(null);
    setTimeLeft(totalTime);
    setCorrectCount(0);
    setWrongStreak(0);
    wrongStreakRef.current = 0;
    setScoreChanges({});
    setIncorrectMessage(null);
    setShowCorrectMessage(false);
    setPredictedWinner(null);
    setHasPredicted(false);
    awardedOnceRef.current = false;
    setAwardStatus("idle");
    setEarnedPoints(0);
    setBasePoints(0);
    setEarnedExp(0);
    sentRef.current = false;
    clearPendingAward();
    endOnceRef.current = false;
    setIsTeamAnswerWrong(false);
    setGameSet(false);
    setShowStageOverlay(false);
    prevStageRef.current = 0;
    setClearedStage(0);

    setReadyToStart(false);

    resetMatch();

    if (mode === "random") {
      joinRandom({ maxPlayers: 4, gameType:"majority" }, (code) => setRoomCode(code));
    } else {
      joinWithCode(code, count,"majority");
      setRoomCode("majority_" + code);
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
    const fetchArticles = async () => {
      const res = await fetch("/api/articles2");
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
    if (!isTeamAnswerWrong) return;

    const deadTimer  = setTimeout(() => {
      setGameSet(true);
    }, 6000);

    const finishTimer  = setTimeout(() => {
      setFinished(true);
    }, 8000); // ← 正解発表演出のあと

    return () => {
      clearTimeout(finishTimer);
    };
  }, [isTeamAnswerWrong]);

  useEffect(() => {
    if (!bothReady) return;

    setCountdown(3);

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
    if (!bothReadyState) return;

    const resetLives: Record<string, number> = {};
    players.forEach(p => {
      resetLives[p.socketId] = 3;
    });

    setDisplayLives(resetLives);

    // まず3秒にリセット
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev === 1) {
          clearInterval(interval);

          setTimeout(() => {
            setCountdown(null);
          }, 800);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval); // ★ intervalは必ずクリーンアップ
  }, [bothReadyState]);

  useEffect(() => {
    if (phase === "result") {
      setShowAnswerText(false);
      setShowAnswer(false);
      setShowExplanation(false);
      setShowCorrectCount(false);
      setShowDamageResult(false);
      
      // 正解は、、を表示
      const answerTextTimer = setTimeout(() => setShowAnswerText(true), 200);

      // 答えを表示
      const answerTimer = setTimeout(() => setShowAnswer(true), 1000);

      // 解説を表示
      const explanationTimer = setTimeout(() => setShowExplanation(true), 2000);

      // 正解人数表示
      const correctCountTimer = setTimeout(() => setShowCorrectCount(true), 3000);

      // ダメージ表示
      const damageTimer = setTimeout(() => setShowDamageResult(true), 3000);

      return () => {
        clearTimeout(answerTextTimer);
        clearTimeout(answerTimer);
        clearTimeout(explanationTimer);
        clearTimeout(correctCountTimer);
        clearTimeout(damageTimer);
      };
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "result") return;

    const timer = setTimeout(() => {
      setDisplayLives(playerLives);
    }, 600); // ← 正解発表演出のあと

    return () => clearTimeout(timer);
  }, [phase, playerLives]);

  useEffect(() => {
    setShowDamageResult(false);
  }, [phase]);

  useEffect(() => {
    // すでに終了済みなら何もしない
    if (endOnceRef.current) return;

    // resultフェーズで、チーム回答が確定していて、問題が存在する時だけ判定
    if (phase !== "result") return;
    if (!teamChoice) return;
    if (!questions[currentIndex]?.quiz) return;

    const correct = questions[currentIndex].quiz.answer; // 0 or 1想定
    const correctChoice = correct === 0 ? "A" : "B";
    const isCorrect = teamChoice === correctChoice;

    if (isCorrect) {
      // ✅ ここで「チームとしてクリアしたステージ数」を増やす
      setClearedStage(prev => Math.max(prev, currentIndex + 1));
    }

    // チーム回答が間違っていたら終了
    if (teamChoice !== correctChoice) {
      endOnceRef.current = true;

      setIsTeamAnswerWrong(true);
    }
  }, [phase, teamChoice, questions, currentIndex]);

  useEffect(() => {
    // result フェーズで、チーム回答と問題が揃ってるときだけ
    if (phase !== "result") {
      setShowTeamJudgeOverlay(false);
      setTeamJudge(null);
      return;
    }
    if (!teamChoice) return;
    if (!questions[currentIndex]?.quiz) return;

    const correct = questions[currentIndex].quiz.answer; // 0 or 1想定
    const correctChoice = correct === 0 ? "A" : "B";
    const isCorrect = teamChoice === correctChoice;

    // 一旦、今回の判定をセット
    setTeamJudge(isCorrect ? "correct" : "wrong");
    setShowTeamJudgeOverlay(false);

    // ✅ 2秒後にドーン！と表示
    const t = setTimeout(() => {
      setShowTeamJudgeOverlay(true);
    }, 3000);

    return () => clearTimeout(t);
  }, [phase, teamChoice, questions, currentIndex]);

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
    if (finished || gameSet || countdown !== null || phase !== "question") {
      setShowStageOverlay(false);
      return;
    }

    // 初回は出さない（好みで：初回も出したいならこの if を消す）
    if (prevStageRef.current === 0) {
      prevStageRef.current = stageNumber;
      return;
    }

    // ステージが変わった時だけ
    if (prevStageRef.current !== stageNumber) {
      prevStageRef.current = stageNumber;

      setStageOverlayNumber(stageNumber);
      setShowStageOverlay(true);

      const t = setTimeout(() => setShowStageOverlay(false), 2000);
      return () => clearTimeout(t);
    }
  }, [stageNumber, finished, countdown, phase]);

  useEffect(() => {
    if (!gameSetScheduled) return;

    const deadTimer  = setTimeout(() => {
      setGameSet(true);
    }, 6000);

    const finishTimer = setTimeout(() => {
      setFinished(true); // QuizResult へ
    }, 8000);

    return () => {
      clearTimeout(finishTimer);
    };
  }, [gameSetScheduled]);

  useEffect(() => {
    // まだゲーム中のみ
    if (finished) return;

    // ステージ10到達でゲーム終了
    if (correctCount >= 10) {
      const deadTimer  = setTimeout(() => {
        setGameSet(true);
        setShowStageOverlay(false);
      }, 6000);

      const t = setTimeout(() => {
        setFinished(true);   // 結果画面へ
      }, 8000); // GAME SET を少し見せてから結果へ

      return () => clearTimeout(t);
    }
  }, [correctCount, finished]);
  
  useEffect(() => {
    if (!finished) return;

    // ✅ 到達ステージに応じた獲得ポイント（10以上は10扱い）
    const reachedStage = Math.min(10, Math.max(0, clearedStage));
    const earned = stagePointMap[reachedStage] ?? 0;

    const base = correctCount * 10;
    const totalPoints = earned + base;
    const expEarned = correctCount * 20;

    setBasePoints(base);
    setEarnedPoints(earned);
    setEarnedExp(expEarned);

    if (earned <= 0 && expEarned <= 0) {
      setAwardStatus("idle");
      clearPendingAward();
      return;
    }

    const payload: PendingAward = {
      points: totalPoints,
      exp: expEarned,
      correctCount,
      basePoints: base,
      createdAt: Date.now(),
    };

    savePendingAward(payload);
    awardPointsAndExp(payload);

  }, [finished,mySocketId,clearedStage,correctCount,]);

  // useEffect(() => {
  //   const pending = loadPendingAward();
  //   if (!pending) return;

  //   // 既に付与済みなら何もしない
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
    if (!socket) return;

    const onTeamVotesUpdate = (payload: TeamVotes) => {
      setTeamVotes(payload);
    };

    socket.on("team_votes_update", onTeamVotesUpdate);

    return () => {
      socket.off("team_votes_update", onTeamVotesUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const onTeamAnswerDecided = (payload: {
      choice: "A" | "B";
      a: number;
      b: number;
      answered: number;
      total: number;
      decidedBy: "majority" | "random";
    }) => {
      setTeamChoice(payload.choice);
      setTeamChoiceDecidedBy(payload.decidedBy);

      // 票数も確定値で揃えたいならここで上書きしてもOK
      setTeamVotes({
        a: payload.a,
        b: payload.b,
        answered: payload.answered,
        total: payload.total,
      });
    };

    socket.on("team_answer_decided", onTeamAnswerDecided);

    return () => {
      socket.off("team_answer_decided", onTeamAnswerDecided);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const onQuestionStart = ({ deadline, index }: { deadline: number; index: number }) => {
      setTeamChoice(null);
      setTeamChoiceDecidedBy(null);

      // 前問のオーバーレイを消す
      setShowTeamJudgeOverlay(false);
      setTeamJudge(null);
    };

    socket.on("question_start", onQuestionStart);
    return () => {
      socket.off("question_start", onQuestionStart);
    };
  }, [socket]);

  useEffect(() => {
    setTeamVotes(prev => ({ ...prev, total: maxPlayers }));
  }, [maxPlayers]);


  useEffect(() => {
    if (!socket) return;

    socket.on("both_rematch_ready", () => {
      // 再戦開始
      handleRetry();      // 問題やスコアをリセット
      setRematchRequested(false);
      setRematchAvailable(false);
      setMatchEnded(false);
      setTimeUp(false);
      setCountdown(null);
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
        setCountdown(null);
        setTimeLeft(totalTime);
        setDisplayLives({});
        setGameSet(false);

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

  // A/B 投票送信（多数決モード用）
  const submitMajorityVote = (choice: "A" | "B") => {
    if (!socket || !roomCode) return;

    // 念のため：質問中しか送らない
    if (phase !== "question") return;
    if (!canAnswer) return;

    socket.emit("submit_majority_vote", { roomCode, choice });
  };

  const checkAnswer = () => {
    if (userAnswer == null) return;

    // ✅ 多数決：A/B投票を送る（ボード更新用）
    if (userAnswer === 0) submitMajorityVote("A");
    if (userAnswer === 1) submitMajorityVote("B");

    const correctAnswer = questions[currentIndex].quiz?.answer;

    if (userAnswer === correctAnswer) {
      submitAnswer(true)
      setCorrectCount(prev => prev + 1);
    } else {
      submitAnswer(false)
    }
    setUserAnswer(null);
  };

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
          仲間を探す
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
            仲間を探しています（{playerCount}）
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
            仲間が揃ったよ！
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
              <p className="text-lg md:text-2xl text-gray-500 mb-4">準備できたら「ゲームスタート！」を押そう！全員押すとゲームが始まるよ！</p>
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
                ゲームスタート！
              </motion.button>
            </>
          )}
        </AnimatePresence>
        {readyToStart && (
          <p className="text-xl md:text-3xl mt-2">
            {opponent
              ? `全員の準備を待っています…`
              : "仲間の準備を待っています…"}
          </p>
        )}
      </div>
    );
  }

  // --- 自分を常に左に表示するための並び替え ---
  const orderedPlayers = [...players].sort((a, b) => {
    if (a.socketId === mySocketId) return -1;
    if (b.socketId === mySocketId) return 1;
    return 0;
  });

  // Xシェア機能
  const handleShareX = () => {
    const text = [
      "【ひまQ｜多数決クイズ🗳️】",
      `正解数：${correctCount}問`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() }); // ✅トップへ
  };

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-blue-400 via-red-100 to-red-400" key={battleKey}>
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-white text-6xl md:text-8xl font-extrabold"
          >
            {countdown === 0 ? "START!" : countdown}
          </motion.div>
        </div>
      )}

      {showStageOverlay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
          <motion.div
            key={stageOverlayNumber}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="text-white text-5xl md:text-7xl font-extrabold drop-shadow"
          >
            ステージ{stageOverlayNumber}に挑戦！
          </motion.div>
        </div>
      )}

      {timeUp && !finished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-white text-6xl md:text-8xl font-extrabold"
          >
            TIME UP！
          </motion.div>
        </div>
      )}

      {!finished ? (
        <>
          <div>
            <p className="text-md md:text-xl text-white mb-3">チームで力を合わせてクイズに挑戦！全10ステージクリアを目指そう！</p>
          </div>
          {/* =========================
              🗳️ チームの回答ボード
          ========================= */}
          <div className="mx-auto max-w-[720px] mb-3">
            <div className="flex items-center justify-center mb-2">
              <motion.div
                key={stageNumber}
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="
                  relative
                  px-5 py-2
                  rounded-full
                  border-2 border-white/80
                  shadow-xl
                  text-white font-extrabold
                  text-lg md:text-2xl
                  tracking-wider
                  bg-black/35
                  backdrop-blur
                "
              >
                {/* うっすら光る演出 */}
                <span className="absolute inset-0 rounded-full blur-xl opacity-40 bg-white" />

                <span className="relative flex items-center">
                  <span className="drop-shadow">ステージ</span>
                  <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full text-yellow-300">
                    {stageNumber}
                  </span>
                </span>
              </motion.div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border-4 border-white shadow-xl">
              <AnimatePresence>
                {showTeamJudgeOverlay && teamJudge && (
                  <motion.div
                    key={teamJudge}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className={`
                      absolute inset-0 z-40
                      flex items-center justify-center
                      text-white font-extrabold
                      text-4xl md:text-6xl
                      drop-shadow-[0_6px_0_rgba(0,0,0,0.25)]
                    `}
                  >
                    {/* 背景（正解/不正解で色を変える） */}
                    <div
                      className={`
                        absolute inset-0
                        ${teamJudge === "correct"
                          ? "bg-gradient-to-br from-green-400 via-emerald-500 to-green-700"
                          : "bg-gradient-to-br from-red-400 via-rose-500 to-red-700"}
                        opacity-95
                      `}
                    />
                    {/* キラっとした演出 */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                      <div className="absolute -bottom-10 right-10 w-52 h-52 bg-white rounded-full blur-3xl" />
                    </div>

                    {/* 文字 */}
                    <div
                      className={`
                        relative
                        px-8 py-4
                        rounded-2xl
                        border-4
                        shadow-xl
                        bg-white
                        ${
                          teamJudge === "correct"
                            ? "border-green-500"
                            : "border-red-500"
                        }
                      `}
                    >
                      {/* 追加：上の行（黒） */}
                      <p className="text-black text-lg md:text-2xl font-extrabold mb-2">
                        チームの回答は…
                      </p>

                      {/* 既存：正解/不正解 */}
                      <div
                        className={`
                          text-4xl md:text-6xl font-extrabold
                          ${teamJudge === "correct" ? "text-green-600" : "text-red-600"}
                        `}
                      >
                        {teamJudge === "correct" ? "◎正解！🎉" : "×不正解…"}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 背景（楽しい感じ） */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400" />
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-white rounded-full blur-2xl" />
                <div className="absolute top-4 right-6 w-16 h-16 bg-white rounded-full blur-2xl" />
                <div className="absolute -bottom-8 left-1/2 w-32 h-32 bg-white rounded-full blur-3xl -translate-x-1/2" />
              </div>

              <div className="relative p-3 md:p-4">
                {isResultPhase && (
                  <>
                    {/* 1行目：タイトル */}
                    <p className="text-white font-extrabold text-lg md:text-2xl drop-shadow text-center">
                      チームの回答
                    </p>

                    {/* 2行目：A / B */}
                    <div className="mt-1 flex items-center justify-center gap-10 md:gap-16">
                      {/* A */}
                      <div
                        className={`
                          px-5 py-1 rounded-xl border-2 border-black shadow transition-all duration-300
                          ${
                            teamChoice === "A"
                              ? "scale-110 ring-4 ring-yellow-400 bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-300 shadow-[0_0_20px_rgba(255,200,0,0.8)]"
                              : "bg-white/95 opacity-80"
                          }
                        `}
                      >
                        <p className="text-3xl md:text-5xl font-extrabold text-gray-900">A</p>
                      </div>

                      {/* B */}
                      <div
                        className={`
                          px-5 py-1 rounded-xl border-2 border-black shadow transition-all duration-300
                          ${
                            teamChoice === "B"
                              ? "scale-110 ring-4 ring-yellow-400 bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-300 shadow-[0_0_20px_rgba(255,200,0,0.8)]"
                              : "bg-white/95 opacity-80"
                          }
                        `}
                      >
                        <p className="text-3xl md:text-5xl font-extrabold text-gray-900">B</p>
                      </div>
                    </div>

                    {teamChoice && (
                      <p className="mt-2 text-white font-extrabold drop-shadow text-sm md:text-lg">
                        チーム回答：{teamChoice}
                        {teamChoiceDecidedBy === "random" && "（同数/未回答のためランダム）"}
                      </p>
                    )}
                  </>
                )}

                {/* 3行目：A票/B票 をまとめて表示 */}
                <div className="mt-2 mx-auto w-fit px-4 py-2 rounded-full bg-black/45 text-white font-extrabold text-lg md:text-2xl">
                  A票：{teamVotes.a}　B票：{teamVotes.b}
                </div>

                {isQuestionPhase && (
                  <>
                    {/* 任意：ゲージ（見た目がさらに楽しくなる） */}
                    <div className="mt-3 grid grid-cols-2 gap-2 md:gap-4">
                      <div className="bg-white/95 rounded-xl border-2 border-black p-2 shadow">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold">A</span>
                          <span className="font-bold">{teamVotes.a}票</span>
                        </div>
                        <div className="mt-2 h-4 rounded-full bg-gray-200 border border-black overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${teamVotes.total ? (teamVotes.a / teamVotes.total) * 100 : 0}%`,
                            }}
                            transition={{ type: "spring", stiffness: 120, damping: 14 }}
                            className="h-full bg-green-400"
                          />
                        </div>
                      </div>

                      <div className="bg-white/95 rounded-xl border-2 border-black p-2 shadow">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold">B</span>
                          <span className="font-bold">{teamVotes.b}票</span>
                        </div>
                        <div className="mt-2 h-4 rounded-full bg-gray-200 border border-black overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${teamVotes.total ? (teamVotes.b / teamVotes.total) * 100 : 0}%`,
                            }}
                            transition={{ type: "spring", stiffness: 120, damping: 14 }}
                            className="h-full bg-red-400"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                

                {/* 追加：回答済み人数（お好み） */}
                {/* <div className="mt-2 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/90 border-2 border-black text-gray-900 font-bold text-sm md:text-lg">
                    {teamVotes.answered}/{teamVotes.total} 回答済み
                  </span>
                </div> */}
              </div>
            </div>
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

                const statusClass =
                  phase === "result" && showDamageResult
                    ? result
                      ? result.isCorrect
                        ? "text-green-600"
                        : "text-red-500"
                      : "text-gray-500"
                    : "text-gray-500";
                
                return (
                  <div
                    key={p.socketId}
                    className={`
                      relative
                      w-17 md:w-22
                      aspect-square
                      rounded-lg
                      shadow-md
                      flex flex-col items-center justify-center bg-white border-4 ${borderColorClass}
                    `}
                  >
                    <p className="font-bold text-gray-800 text-lg md:text-xl text-center">
                      {p.playerName.length > 5 ? p.playerName.slice(0, 5) + "..." : p.playerName}
                    </p>

                    {/* 結果表示 */}
                    <p className={`text-lg md:text-xl font-bold mt-1 ${statusClass}`}>
                      {phase === "result"
                        ? showDamageResult
                          ? result
                            ? result.isCorrect
                              ? "正解〇"
                              : "誤答×"
                            : "未回答"
                          : "　"
                        : "回答中"}
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

          {gameSet && (
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
  
          {phase === "result" &&(
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
                    <p
                      className={`text-xl md:text-3xl text-center mb-2 font-bold ${
                        questionTimeLeft <= 5 ? "text-red-500 animate-pulse" : "text-gray-700"
                      }`}
                      >
                      回答タイマー：{questionTimeLeft}秒
                    </p>
                  )}
                
                  {phase !== "result" && (
                    <QuizQuestion2
                      quiz={questions[currentIndex].quiz}
                      userAnswer={userAnswer}
                      setUserAnswer={setUserAnswer}
                    />
                  )}
                  {/* 回答フェーズ */}
                  {phase === "question" && (
                    <>
                      {canAnswer ? (
                        <button
                          onClick={checkAnswer}
                          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-extrabold"
                        >
                          回答
                        </button>
                      ) : (
                        <p className="mt-4 text-xl md:text-2xl font-bold text-gray-600 animate-pulse">
                          他の人の回答を待っています…
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          <div className="flex flex-col items-center mt-2 md:mt-3">
            {/* メッセージボタン */}
            <div className="text-center border border-black p-1 rounded-xl bg-white">
              {["よろしく👋", "Aだと思う！", "Bだと思う！", "どっち？？"].map((msg) => (
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
          basePoints={basePoints}
          earnedPoints={earnedPoints}
          earnedExp={earnedExp}
          isLoggedIn={!!user}
          awardStatus={awardStatus}
          onGoLogin={() => router.push("/user/login")}
          isCodeMatch={mode === "code"}
          onShareX={handleShareX}
          clearedStage={clearedStage}
        />
      )}
    </div>
  );
}
