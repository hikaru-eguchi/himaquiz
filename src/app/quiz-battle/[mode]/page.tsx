"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";
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
  name: string;  // 表示用の名前
  score: number;
}

interface QuizResultProps {
  correctCount: number;
  myScore: number;
  opponentScore: number;
  onRetry: () => void;
  matchEnded: boolean;
  rematchAvailable: boolean;
  rematchRequested : boolean;
  handleNewMatch: () => void;
  handleRematch: () => void;
  earnedPoints: number;
  earnedExp: number;
  isLoggedIn: boolean;
  awardStatus: AwardStatus;
  onGoLogin: () => void;
  isCodeMatch: boolean;
  isWin: boolean;
  onShareX: () => void;
}

const QuizResult = ({
  correctCount,
  myScore,
  opponentScore,
  onRetry,
  matchEnded,
  rematchAvailable,
  rematchRequested,
  handleNewMatch,
  handleRematch,
  earnedPoints,
  earnedExp,
  isLoggedIn,
  awardStatus,
  onGoLogin,
  isCodeMatch,
  isWin,
  onShareX,
}: QuizResultProps) => {
  const [showScore, setShowScore] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowScore(true), 500));
    timers.push(setTimeout(() => setShowText(true), 1000));
    timers.push(setTimeout(() => setShowButton(true), 1500));
    return () => timers.forEach(clearTimeout);
  }, []);

  // ============================
  // 🔥 勝敗判定
  // ============================
  const isLose = myScore < opponentScore;
  const isDraw = myScore === opponentScore;

  // ============================
  // 🔥 演出用スタイル
  // ============================
  const bgClass = isWin
    ? "bg-gradient-to-b from-yellow-200 via-pink-200 to-white"
    : isLose
    ? "bg-gray-900/80 text-gray-200"
    : "bg-white";

  return (
    <motion.div
      className={`text-center mt-6 p-3 md:p-8 rounded-lg ${bgClass}`}
      initial={isLose ? { opacity: 0 } : false}
      animate={isLose ? { opacity: 1 } : false}
      transition={isLose ? { duration: 3 } : undefined} // ★ ゆっくり暗転
    >

      {/* ============================
          🔥 勝敗メッセージ
      ============================ */}
      {showText && (
        <>
          {isWin && (
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-extrabold text-yellow-500 mb-6"
            >
              あなたの勝ち！やったね！🎉✨
            </motion.p>
          )}

          {isLose && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 2.5,      // ★ ゆっくり
                ease: "easeOut",    // ★ 優しい減速
              }}
              className="text-3xl md:text-5xl font-extrabold text-gray-300 mb-6"
            >
              あなたの負け、、次は頑張ろう！💪
            </motion.p>
          )}

          {isDraw && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1.2, 1], opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="mb-6 p-6 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-white shadow-lg"
            >
              <p className="text-4xl md:text-6xl font-extrabold text-gray-700">
                引き分け！いい勝負だったね！🤝
              </p>

              {/* 軽くキラキラ演出 */}
              {[...Array(10)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                  initial={{ x: Math.random() * 100 - 50, y: Math.random() * 50 - 25, opacity: 1 }}
                  animate={{ y: -40, opacity: 0 }}
                  transition={{ duration: 1.5, delay: Math.random() }}
                />
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* ============================
          🔥 スコア表示
      ============================ */}
      {showScore && (
        <>
          <p className="text-2xl md:text-4xl mb-2">
            正解数：{correctCount}問
          </p>

          <p className="text-2xl md:text-4xl font-bold mb-2">
            あなた：{myScore} 点
          </p>

          <p className="text-2xl md:text-4xl font-bold mb-6">
            相手：{opponentScore} 点
          </p>
        </>
      )}

      {/* ============================
          🔥 勝ちだけキラキラ演出
      ============================ */}
      {isWin &&
        showText &&
        [...Array(20)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-3 h-3 bg-yellow-400 rounded-full"
            initial={{
              x: Math.random() * 300 - 150,
              y: Math.random() * 200 - 100,
              opacity: 1,
            }}
            animate={{ y: -200, opacity: 0 }}
            transition={{ duration: 2, delay: Math.random() }}
          />
        ))}

      {showButton && (
        <>
          <div className="mx-auto max-w-[520px] bg-white border-2 border-black rounded-xl p-4 shadow mt-4">
              <>
                {/* ✅ 勝利ボーナス表示（合言葉マッチではここに来ない） */}
                {isWin && (
                  <p className="text-md md:text-xl font-bold text-yellow-600 mb-1">
                    勝利ボーナス 300P✨
                  </p>
                )}

                <p className="text-xl md:text-2xl font-extrabold text-gray-800">
                  今回の獲得ポイント：{" "}
                  <span className="text-green-600">{earnedPoints} P</span>
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
        </>
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
            {/* 相手待ちメッセージを下に隔離 */}
            {rematchRequested && !rematchAvailable && (
              <p className="text-center text-2xl md:text-3xl text-gray-700 bg-white rounded-xl p-2 mt-4 md:mt-2">
                相手の準備を待っています…
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
            excludeHref="/quiz-battle"
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
  const genre = searchParams?.get("genre") || "";
  const level = searchParams?.get("level") || "";
  const timeParam = searchParams?.get("time") || "2";
  const totalTime = parseInt(timeParam) * 60;

  const router = useRouter();

  // ★ Supabase & ユーザー
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  // =====================
  // ✅ pending（付与待ち）管理
  // =====================
  const PENDING_KEY = "battle_award_pending_v1";

  type PendingAward = {
    points: number;
    exp: number;
    correctCount: number;
    myScore: number;
    opponentScore: number;
    isWin: boolean;
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
        awardedOnceRef.current = false; // ←失敗時は再試行できるよう戻す
        setAwardStatus("error");
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const oldLevel = row?.old_level ?? 1;
      const newLevel = row?.new_level ?? 1;

      window.dispatchEvent(new Event("points:updated"));
      window.dispatchEvent(new CustomEvent("profile:updated", { detail: { oldLevel, newLevel } }));

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
      if (payload.points > 0) {
        const { error: logError } = await supabase.from("user_point_logs").insert({
          user_id: authedUserId,
          change: payload.points,
          reason: `クイズバトルでポイント獲得（自分:${payload.myScore} 相手:${payload.opponentScore} ${payload.isWin ? "勝利ボーナス+300" : ""}）`,
        });
        if (logError) console.log("insert user_point_logs error raw:", logError);
      }

      if (payload.exp > 0) {
        const { error: logError2 } = await supabase.from("user_exp_logs").insert({
          user_id: authedUserId,
          change: payload.exp,
          reason: `クイズバトルでEXP獲得（正解${payload.correctCount}問 → ${payload.exp}EXP）`,
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


  // ★ リザルト用：獲得ポイントと付与状態（二重加算防止）
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");
  const awardedOnceRef = useRef(false);
  const { pushModal } = useResultModal();
  const sentRef = useRef(false); // ★ 成績保存 二重送信防止

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
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
  const [roomReady, setRoomReady] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [answeredAll, setAnsweredAll] = useState(false);
  const [messages, setMessages] = useState<{ fromId: string; message: string }[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<{ fromId: string; message: string }[]>([]);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchAvailable, setRematchAvailable] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [roomCode, setRoomCode] = useState<string>("");
  const [bothReadyState, setBothReadyState] = useState(false);
  const [handicap, setHandicap] = useState<number>(0);

  const {
    joinRandom,
    joinWithCode,
    updateScore,
    sendReady,
    sendMessage,
    resetMatch,
    updateStartAt,
    players: rawPlayers,
    questionIds,
    matched,
    bothReady,
    startAt,
    mySocketId,
    socket,
  } = useBattle(playerName);
  
  const players: Player[] = rawPlayers.map((p) => ({
    socketId: p.socketId,
    name: p.name,
    score: p.score,
  }));
  
  const me = players.find(p => p.socketId === mySocketId);
  const opponent = players.find(p => p.socketId !== mySocketId);

  const myFinalScore = me?.score ?? 0;
  const opponentFinalScore = opponent?.score ?? 0;
  const isWin = myFinalScore > opponentFinalScore;
  const isCodeMatch = mode === "code";

  // --- プレイヤー人数監視 ---
  useEffect(() => {
    if (players.length >= 2) setRoomReady(true);
  }, [players]);

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
    if (mode === "random") {
      joinRandom({ maxPlayers: 2, gameType:"quiz" },(code) => setRoomCode(code)); // コールバックで state にセット
    } else {
      joinWithCode(code,"2","quiz");
      setRoomCode("quiz_" + code); // 入力済みコードを state にセット
    }
  };

  const handleRetry = () => {
    setCorrectCount(0);
    setFinished(false);
    setAnsweredAll(false);
    setWrongStreak(0);
    wrongStreakRef.current = 0;
    setScoreChanges({});
    setCurrentIndex(0);
    setUserAnswer(null);
    setIncorrectMessage(null);
    setShowCorrectMessage(false);
    setEarnedPoints(0);
    setEarnedExp(0);
    awardedOnceRef.current = false;
    setAwardStatus("idle");
    sentRef.current = false;
    clearPendingAward();
  };

  const handleNewMatch = () => {
    setRematchRequested(false);
    setRematchAvailable(false);
    setMatchEnded(false);
    setTimeUp(false);
    setFinished(false);
    setCountdown(null);
    setTimeLeft(totalTime);
    setAnsweredAll(false);
    setCorrectCount(0);
    setWrongStreak(0);
    wrongStreakRef.current = 0;
    setScoreChanges({});
    setCurrentIndex(0);
    setUserAnswer(null);
    setIncorrectMessage(null);
    setShowCorrectMessage(false);
    setEarnedPoints(0);
    setEarnedExp(0);
    awardedOnceRef.current = false;
    setAwardStatus("idle");
    sentRef.current = false;
    clearPendingAward();

    setReadyToStart(false);

    resetMatch();

    if (mode === "random") {
      joinRandom({ maxPlayers: 2, gameType:"quiz" },(code) => setRoomCode(code));
    } else {
      joinWithCode(code,"2","quiz");
      setRoomCode("quiz_" + code);
    }
  };

  const handleRematch = () => {
    if (!roomCode) return;

    // ★ 再戦準備の前に false に戻す
    setBothReadyState(false);

    setRematchRequested(true); // 自分が再戦希望を出した状態
    console.log("sending send_ready"); 
    socket?.emit("send_ready", { roomCode });
  };

  /* ---------- クイズ取得 ---------- */
  const [allQuestions, setAllQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      const res = await fetch("/api/articles");
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
      const elapsed = Math.floor((Date.now() - startAt) / 1000);
      const remain = Math.max(0, totalTime - elapsed + 3);
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
    }, 1000);

    return () => clearTimeout(timeout);
  }, [timeLeft]);

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
          }, 800);

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

        // 状態をリセット
        handleRetry();           // 問題やスコアをリセット
        setRematchRequested(false);
        setRematchAvailable(false);
        setMatchEnded(false);
        setTimeUp(false);
        setCountdown(null);
        setTimeLeft(totalTime);

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
    };
  }, [socket]);

  const checkAnswer = () => {
    const correctAnswer = questions[currentIndex].quiz?.answer;
    const displayAnswer = questions[currentIndex].quiz?.displayAnswer;
    const level = questions[currentIndex].quiz?.level;
    const myId = mySocketId;

    if (userAnswer === correctAnswer) {
      setCorrectCount(c => c + 1);
      wrongStreakRef.current = 0;
      setWrongStreak(0);

      let add = 0;
      if (level === "かんたん") add = 50;
      if (level === "ふつう") add = 100;
      if (level === "難しい") add = 150;
      setScoreChanges(prev => ({
        ...prev,
        [myId]: add,
      }));
      setTimeout(() => {
        setScoreChanges(prev => ({
          ...prev,
          [myId]: null,
        }));
      }, 800);
      updateScore(add); // ★ 差分のみ送信

      setShowCorrectMessage(true);
    } else {
      wrongStreakRef.current++;
      setWrongStreak(wrongStreakRef.current);
      if (wrongStreakRef.current >= 3) {
        const currentScore = me?.score ?? 0;

        if (currentScore > 0) {
          const penalty = Math.min(100, currentScore);

          setScoreChanges(prev => ({
            ...prev,
            [myId]: -penalty,
          }));
          setTimeout(() => {
            setScoreChanges(prev => ({
              ...prev,
              [myId]: null,
            }));
          }, 800);
          updateScore(-penalty); // ★ 差分のみ
        }
        wrongStreakRef.current = 0;
        setWrongStreak(0);
      }
      setIncorrectMessage(`ざんねん！\n答えは" ${displayAnswer} "でした！`);
    }
    setUserAnswer(null);
  };

  useEffect(() => {
    if (!finished) return;

    const myScore = me?.score ?? 0;
    const opponentScore = opponent?.score ?? 0;
    const isWinLocal = myScore > opponentScore;

    const points = Math.floor(myScore / 10) + (isWinLocal ? 150 : 0);
    const exp = correctCount * 20;

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
      myScore,
      opponentScore,
      isWin: isWinLocal,
      createdAt: Date.now(),
    };

    // ✅ まずpending保存（ここが重要）
    savePendingAward(payload);

    // ✅ その場で付与を試す（ログイン揺れでも ensureAuthedUserId が面倒みる）
    awardPointsAndExp(payload);
  }, [finished, mode, me?.score, opponent?.score, correctCount]);

  // ✅ 起動時に pending があれば拾う
  // useEffect(() => {
  //   const pending = loadPendingAward();
  //   if (!pending) return;

  //   // すでに付与済み表示なら何もしない
  //   if (awardStatus === "awarded") return;

  //   awardPointsAndExp(pending);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // ✅ タブ復帰 / フォーカス復帰でも拾う（ログイン直後の揺れ対策）
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
  }, [supabase]); // supabaseは固定だけど一応


  useEffect(() => {
    if (!finished) return;

    // 未ログインなら保存しない（仕様でOK）
    if (!userLoading && !user) return;

    // スコアがまだ確定してないなら待つ
    if (!me || !opponent) return;

    if (sentRef.current) return;
    sentRef.current = true;

    (async () => {
      try {
        const score = me.score; // ★ 最終スコア
        const won = me.score > opponent.score;
        const firstPlace = won; 

        const weekStart = getWeekStartJST();
        const monthStart = getMonthStartJST();

        // ✅ 週間ランキングに反映したい値を決める
        // score: 今回獲得ポイントを加算、correct: 正解数、play: 1回、best_streak: max更新
        const { error: weeklyErr } = await supabase.rpc("upsert_weekly_stats", {
          p_user_id: user!.id,
          p_week_start: weekStart,
          p_score_add: score,
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
          p_score_add: score,
          p_correct_add: correctCount,
          p_play_add: 1,
          p_best_streak: 0,
        });
        if (monthlyErr) console.log("upsert_monthly_stats error:", monthlyErr);

        const res = await submitGameResult(supabase, {
          game: "battle", // ←あなたの識別子に合わせて（例: quiz / battle / quiz2p 等）
          score,
          won,
          firstPlace,
          writeLog: true,
        });

        const modal = buildResultModalPayload("battle", res);
        if (modal) pushModal(modal);
      } catch (e) {
        console.error("[quiz_battle] submitGameResult error:", e);
      }
    })();
  }, [finished, mode, user, userLoading, me, opponent, supabase, pushModal]);

  const nextQuestion = () => {
    setShowCorrectMessage(false);
    setIncorrectMessage(null);
    if (currentIndex + 1 >= questions.length) {
      // 全問回答済み
      setAnsweredAll(true); // ★自分は終わった状態にする
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  // --- 不適切ワードリスト ---
  const bannedWords = [
    "ばか","馬鹿","バカ","くそ","糞","クソ","死ね","しね","アホ","あほ","ごみ","ゴミ",
    "fuck", "shit", "bastard", "idiot", "asshole",
  ]

  if (joined && questions.length === 0)
    return (
      <div className="text-center">
        {/* 自分のニックネーム */}
        {playerName && (
          <p className="text-xl md:text-3xl mb-6 font-bold text-gray-700">
            あなた：{playerName}
          </p>
        )}

        <p className="text-3xl md:text-5xl animate-pulse">
          対戦相手を探しています...
        </p>
      </div>
    );

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

  if (!roomReady || !matched) {
    return (
      <div className="container p-8 text-center">
        <p className="text-3xl md:text-5xl mt-35 text-center animate-pulse">対戦相手を探しています...</p>
      </div>
    );
  }

  if (matched && !bothReady) {
    return (
      <div className="container p-8 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 md:mb-6">
          {opponent
            ? `${opponent.name} さんとマッチしました！`
            : "マッチしました！"}
        </h2>
        <p className="text-lg md:text-2xl text-gray-500 mb-4">準備できたら「対戦スタート！」を押そう！お互い押すとクイズバトルが始まるよ！</p>
        {!readyToStart ? (
          <button
            onClick={() => {
              sendReady(handicap);
              setReadyToStart(true);
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
          </button>
        ) : (
          <p className="text-xl md:text-3xl mt-2">
            {opponent
              ? `${opponent.name}さんのスタートを待っています…`
              : "マッチ相手のスタートを待っています…"}
          </p>
        )}
        {mode === "code" && !readyToStart && (
          <div className="mt-8">
            <label className="text-xl md:text-3xl font-bold">
              もらうハンデ：
              <input
                type="number"
                value={handicap}
                min={0}
                max={10000}
                step={100}
                onChange={(e) => {
                  // 入力途中はそのまま
                  setHandicap(Number(e.target.value));
                }}
                onBlur={() => {
                  // フォーカスを外した瞬間に丸める
                  setHandicap((prev) =>
                    Math.min(10000, Math.max(0, Math.floor(prev / 100) * 100))
                  );
                }}
                className="ml-2 border px-2 py-1 w-24 text-center"
              />
              点
            </label>
            <p className="mt-2 md:text-lg">※100 の単位で設定できます</p>
          </div>
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
    const resultText = isWin ? "勝ち🏆" : "負け…";
    const text = [
      "【ひまQ｜クイズバトル👊】",
      `正解数：${correctCount}問`,
      `勝敗：${resultText}`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() }); // ✅トップへ
  };

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-pink-200 via-yellow-200 to-green-200">
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
          <div className="flex flex-col items-center">
            <p className={`w-[280px] md:w-[400px] text-2xl md:text-4xl font-extrabold mb-2 px-4 py-2 rounded-lg shadow-lg 
                          ${timeLeft <= 30 ? 'bg-red-700 text-white animate-pulse' : 'bg-white text-black border-2 border-black'}`}>
              残り時間: {Math.floor(timeLeft / 60)}分 {timeLeft % 60}秒
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex justify-center gap-2 md:gap-4 mb-2">
              {orderedPlayers.map((p) => {
                const isMe = p.socketId === mySocketId;
                const change = scoreChanges[p.socketId];

                return (
                  <div
                    key={p.socketId}
                    className={`
                      relative
                      w-40 md:w-50 p-2 rounded-lg
                      bg-white
                      border-4
                      ${isMe ? "border-blue-500" : "border-red-500"}
                      shadow-md
                    `}
                  >
                    {/* ★ 加点・減点アニメーション */}
                    <AnimatePresence>
                      {change !== null && change !== undefined && (
                        <motion.div
                          key={change}
                          initial={{ opacity: 1, y: 0 }}
                          animate={{ opacity: 0, y: -20 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className={`absolute left-1/2 -translate-x-1/2 -bottom-1
                            font-extrabold text-2xl
                            ${change > 0 ? "text-green-500" : "text-red-500"}
                          `}
                        >
                          {change > 0 ? `+${change}` : change}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p
                      className={`font-extrabold text-lg md:text-xl ${
                        isMe ? "text-blue-600" : "text-red-600"
                      }`}
                    >
                      {isMe ? "自分" : "相手"}
                    </p>

                    <p className="font-bold text-gray-800 text-lg md:text-2xl">{p.name}</p>

                    <p className="mt-1 text-gray-700 text-lg md:text-2xl">
                      得点： <span className="font-bold">{p.score}</span>
                    </p>

                    {/* 吹き出し表示 */}
                    <div className="absolute -bottom-1 w-36 md:w-46">
                      {visibleMessages
                        .filter(m => m.fromId === p.socketId)
                        .map((m, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.8 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className={`absolute left-0 top-0 w-34 md:w-44 px-2 py-1 rounded shadow text-md md:text-lg font-bold border-2 ${
                              p.socketId === mySocketId ? "bg-blue-400 text-white border-blue-200" : "bg-red-400 text-white border-red-200"
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

          {/* 相手がまだ回答中のときのメッセージ */}
          {answeredAll && !finished && (
            <p className="text-xl md:text-2xl font-bold text-gray-700 mb-4">
              相手が終わるまで待ってね…
            </p>
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

                  <button
                    className="px-5 py-3 md:px-6 md:py-3 bg-blue-500 text-white text-lg md:text-xl font-medium rounded mt-4 hover:bg-blue-600 cursor-pointer"
                    onClick={nextQuestion}
                  >
                    次の問題へ
                  </button>
                </>
              ) : (
                <>
                  <QuizQuestion
                    quiz={questions[currentIndex].quiz}
                    userAnswer={userAnswer}
                    setUserAnswer={setUserAnswer}
                  />
                  <button
                    className="px-5 py-3 md:px-6 md:py-3 bg-blue-500 text-white text-lg md:text-xl font-medium rounded hover:bg-blue-600 cursor-pointer font-extrabold"
                    onClick={checkAnswer}
                    disabled={userAnswer === null}
                  >
                    回答
                  </button>
                </>
              )}
            </>
          )}

          <div className="flex flex-col items-center mt-3">
            {/* メッセージボタン */}
            <div className="text-center border border-black p-1 rounded-xl bg-white">
              {["よろしく👋", "強いな👏", "負けないぞ✊", "ありがとう❤"].map((msg) => (
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
          myScore={me?.score ?? 0}
          opponentScore={opponent?.score ?? 0}
          onRetry={handleRetry}
          matchEnded={matchEnded}
          rematchAvailable={rematchAvailable}
          rematchRequested={rematchRequested}
          handleNewMatch={handleNewMatch}
          handleRematch={handleRematch}
          earnedPoints={earnedPoints}
          earnedExp={earnedExp}
          isLoggedIn={!!user}
          awardStatus={awardStatus}
          onGoLogin={() => router.push("/user/login")}
          isCodeMatch={mode === "code"}
          isWin={(me?.score ?? 0) > (opponent?.score ?? 0)}
          onShareX={handleShareX}
        />
      )}
    </div>
  );
}
