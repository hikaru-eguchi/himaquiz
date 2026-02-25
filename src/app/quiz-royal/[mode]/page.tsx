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

type RankRow = { socketId: string; name: string; score: number; rank: number };

const buildRanks = (players: Player[]): RankRow[] => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  let lastScore: number | null = null;
  let lastRank = 0;

  return sorted.map((p, i) => {
    const rank = (lastScore === p.score) ? lastRank : (i + 1);
    lastScore = p.score;
    lastRank = rank;
    return { socketId: p.socketId, name: p.name, score: p.score, rank };
  });
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
  name: string;  // 表示用の名前
  score: number;
}

interface QuizResultProps {
  correctCount: number;
  players: Player[];
  mySocketId: string;
  matchEnded: boolean;
  rematchAvailable: boolean;
  rematchRequested: boolean;
  handleNewMatch: () => void;
  handleRematch: () => void;
  myRankState: number | null;
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
  players,
  mySocketId,
  matchEnded,
  rematchAvailable,
  rematchRequested,
  handleNewMatch,
  handleRematch,
  myRankState,
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
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowText1(true), 500));
    timers.push(setTimeout(() => setShowText2(true), 1000));
    timers.push(setTimeout(() => setShowText3(true), 2000));
    timers.push(setTimeout(() => setShowText4(true), 2500));
    timers.push(setTimeout(() => setShowButton(true), 2500));
    return () => timers.forEach(clearTimeout);
  }, []);

  
  const ranks = useMemo(() => buildRanks(players), [players]);
  const myRank = ranks.find(r => r.socketId === mySocketId)?.rank ?? null;
  const isWin = myRank === 1;
  
  return (
    <motion.div
      className={`text-center mt-6 rounded-lg`}
    >

      {/* ============================
          🔥 スコア表示
      ============================ */}
      {showText1 && (
        <>
          <p className="text-3xl md:text-5xl mb-4 md:mb-6 text-black">
            正解数：{correctCount}問
          </p>
        </>
      )}

      {showText2 && <p className="text-xl md:text-2xl text-gray-500 mb-2">あなたの順位は…</p>}

      {showText3 && myRankState !== null && myRankState !== 1 && (
        <p
          className={`text-4xl md:text-6xl font-bold ${
            myRankState === 1
              ? "text-yellow-400"   // 1位：最後まで残った人
              : myRankState === 2
              ? "text-gray-400"     // 2位
              : myRankState === 3
              ? "text-orange-600"   // 3位
              : "text-blue-600"     // その他
          }`}
        >
           {myRankState} 位！
        </p>
      )}

      {showText3 && myRankState === 1 && (
        <motion.p
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: [1.2, 1], rotate: 0 }}
          transition={{ duration: 0.6 }}
          className="
            text-4xl md:text-6xl
            font-extrabold
            text-yellow-500
            drop-shadow-[0_0_20px_gold]
          "
        >
          🏆 1 位！ 👑
        </motion.p>
      )}

      {showText4 && (
        <>
          <p className="text-xl md:text-2xl text-gray-500 mt-6">みんなの順位</p>
          <div className="mt-2 space-y-2">
            {ranks.map((r) => (
              <div
                key={r.socketId}
                className="flex items-center gap-4 px-3 py-2 bg-white rounded-lg shadow w-full max-w-md mx-auto"
              >
                <span className={`font-extrabold text-lg md:text-xl w-14 text-center ${
                  r.rank === 1 ? "text-yellow-400" :
                  r.rank === 2 ? "text-gray-400" :
                  r.rank === 3 ? "text-orange-500" :
                  "text-blue-500"
                }`}>
                  {r.rank}位
                </span>

                <span className={`font-bold text-base truncate flex-1 text-center md:text-xl ${
                  r.socketId === mySocketId ? "text-blue-600" : "text-gray-800"
                }`}>
                  {r.name}
                </span>

                <span className="font-extrabold w-16 text-right text-black md:text-xl">
                  {r.score}点
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============================
          🔥 勝ちだけキラキラ演出
      ============================ */}
      {isWin &&
        showText1 &&
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
                {/* ✅ 勝利ボーナス表示 */}
                {bonus > 0 && (
                  <p className="text-md md:text-xl font-bold text-yellow-500 mb-1">
                    順位ボーナス： {bonus} P✨
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
            excludeHref="/quiz-royal"
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

  const BONUS_TABLE: Record<number, number[]> = {
    2: [150],
    3: [200, 100],
    4: [250, 125, 60],
    5: [350, 175, 85, 40],
    6: [450, 225, 110, 55, 25],
    7: [600, 300, 150, 75, 35, 15],
    8: [750, 375, 180, 90, 45, 20, 10],
  };

  // ranks: buildRanks(players) の結果を渡す
  const calcPlacementBonus = (playerCount: number, ranksNow: RankRow[], mySocketId: string) => {
    const table = BONUS_TABLE[playerCount] ?? [];
    const me = ranksNow.find(r => r.socketId === mySocketId);
    if (!me) return 0;

    // 最下位はボーナス無し（順位が何位でも “最後” 相当は 0 にしたいならこれが安全）
    // 例: 4人なら最下位 rank=4 を弾く
    if (me.rank >= playerCount) return 0;

    // “その順位が1人だけ” のときのみ
    const sameRankCount = ranksNow.filter(r => r.rank === me.rank).length;
    if (sameRankCount !== 1) return 0;

    // table[0]=1位, table[1]=2位...
    return table[me.rank - 1] ?? 0;
  };

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
    myRank: number;
    playerCount: number;
    bonus: number;
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

      // ログ（＋）※失敗しても致命的ではない
      if (payload.points > 0) {
        const { error: logError } = await supabase.from("user_point_logs").insert({
          user_id: authedUserId,
          change: payload.points,
          reason: `クイズロワイヤルでポイント獲得（${payload.playerCount}人中${payload.myRank}位 / 自分:${payload.myScore}点${payload.bonus > 0 ? ` ボーナス+${payload.bonus}` : ""}）`,
        });
        if (logError) console.log("insert user_point_logs error raw:", logError);
      }

      if (payload.exp > 0) {
        const { error: logError2 } = await supabase.from("user_exp_logs").insert({
          user_id: authedUserId,
          change: payload.exp,
          reason: `クイズロワイヤルでEXP獲得（正解${payload.correctCount}問 → ${payload.exp}EXP）`,
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
  const [bonus, setBonus] = useState(0);

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

  const myFinalScore = me?.score ?? 0;
  const isCodeMatch = mode === "code";

  const ranks = buildRanks(players);
  const myRow = ranks.find(r => r.socketId === mySocketId);
  const myRank = myRow?.rank ?? null;

  const isWin = myRank === 1;                 // 1位なら勝ち
  const isDraw = myRank === 1 && ranks.filter(r => r.rank === 1).length > 1; // 同率1位なら引き分け演出用
  const isLose = myRank !== null && myRank > 1;
  type RoomPlayer = { socketId: string; playerName: string };

  const [playerCount, setPlayerCount] = useState("0/8");  // 表示用
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [roomLocked, setRoomLocked] = useState(false);
  const roomLockedRef = useRef(false);

  useEffect(() => {
    roomLockedRef.current = roomLocked;
  }, [roomLocked]);

  const allPlayersReady = roomPlayers.length >= maxPlayers;

  // スタートボタン演出（サバイバルと同じ）
  const [showStartButton, setShowStartButton] = useState(false);
  useEffect(() => {
    if (allPlayersReady && !bothReady) {
      setShowStartButton(false);
      const t = setTimeout(() => setShowStartButton(true), 1000);
      return () => clearTimeout(t);
    }
  }, [allPlayersReady, bothReady]);

  useEffect(() => {
    if (!socket) return;

    socket.on("update_room_count", ({ players, current, max }) => {
      if (roomLockedRef.current) return;

      // players: [{ socketId, playerName }]
      const roomPlayersNormalized: RoomPlayer[] = (players ?? []).map((p: any) => ({
        socketId: p.socketId,
        playerName: p.playerName ?? "", // 念のため
      }));
      setRoomPlayers(roomPlayersNormalized);
      setPlayerCount(`${current}/${max}`);
      setMaxPlayers(max);

      if (current >= max) setRoomLocked(true);
    });

    return () => {
      socket.off("update_room_count");
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const onStartGame = ({ roomCode }: { roomCode: string }) => {
      setRoomCode(roomCode); // ✅ これが本当の試合部屋
      timeUpSentRef.current = false; // 念のためリセット
    };

    const onStartGameWithHandicap = ({ startAt, players, questionIds, roomCode }: any) => {
      // payloadにroomCode入れてないならサーバ側で入れるのがベスト
      if (roomCode) setRoomCode(roomCode);
    };

    socket.on("start_game", onStartGame);
    socket.on("start_game_with_handicap", onStartGameWithHandicap);

    return () => {
      socket.off("start_game", onStartGame);
      socket.off("start_game_with_handicap", onStartGameWithHandicap);
    };
  }, [socket]);

  const timeUpSentRef = useRef(false);

  useEffect(() => {
    if (!socket) return;
    if (!roomCode) return;
    if (timeLeft > 0) return;

    // 1回だけ送る
    if (timeUpSentRef.current) return;
    timeUpSentRef.current = true;

    socket.emit("client_time_up", { roomCode });

  }, [timeLeft, socket, roomCode]);

  const handleJoin = () => {
    if (!playerName.trim()) { setNameError("名前を入力してください"); return; }

    const lower = playerName.toLowerCase();
    if (bannedWords.some(w => lower.includes(w))) {
      setNameError("不適切な言葉は使えません");
      return;
    }

    setNameError(null);
    setJoined(true);

    // ★追加：部屋状態リセット
    setRoomLocked(false);
    roomLockedRef.current = false;
    setRoomPlayers([]);
    setPlayerCount("0/0");

    if (mode === "random") {
      const maxP = 4;
      setMaxPlayers(maxP);
      joinRandom({ maxPlayers: maxP, gameType: "royal" }, (code) => setRoomCode(code));
    } else {
      // code match の場合も maxPlayers 決めるなら同様に
      const maxP = Math.min(8, Math.max(2, Number(searchParams?.get("count") || "2")));
      setMaxPlayers(maxP);

      joinWithCode(code, String(maxP), "royal");
      setRoomCode("royal_" + code);
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
    setBonus(0);
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
    setBonus(0);
    awardedOnceRef.current = false;
    setAwardStatus("idle");
    sentRef.current = false;
    clearPendingAward();

    setReadyToStart(false);

    resetMatch();

    setRoomLocked(false);
    roomLockedRef.current = false;
    setRoomPlayers([]);
    setPlayerCount("0/0");

    if (mode === "random") {
      const maxP = 4;
      setMaxPlayers(maxP);
      joinRandom({ maxPlayers: maxP, gameType: "royal" }, (code) => setRoomCode(code));
    } else {
      // code match の場合も maxPlayers 決めるなら同様に
      const maxP = Math.min(8, Math.max(2, Number(searchParams?.get("count") || "2")));
      setMaxPlayers(maxP);

      joinWithCode(code, String(maxP), "royal");
      setRoomCode("royal_" + code);
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

    const ranksNow = buildRanks(players);
    const myRankNow = ranksNow.find(r => r.socketId === mySocketId)?.rank ?? 999;

    const bonus = calcPlacementBonus(players.length, ranksNow, mySocketId);
    setBonus(bonus);
    const points = Math.floor(myScore / 10) + bonus;
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
      myRank: myRankNow,
      playerCount: players.length,
      bonus,
      createdAt: Date.now(),
    };

    savePendingAward(payload);
    awardPointsAndExp(payload);
  }, [finished, correctCount, me?.score, players, mySocketId]);


  // ✅ 起動時に pending があれば拾う
  useEffect(() => {
    const pending = loadPendingAward();
    if (!pending) return;

    // すでに付与済み表示なら何もしない
    if (awardStatus === "awarded") return;

    awardPointsAndExp(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [supabase]); // supabaseは固定だけど一応


  useEffect(() => {
    if (!finished) return;

    // 未ログインなら保存しない（仕様でOK）
    if (!userLoading && !user) return;

    // 自分がまだ確定してないなら待つ
    if (!me) return;

    // 順位を算出（ロワイヤル）
    const ranksNow = buildRanks(players);
    const myRankNow = ranksNow.find(r => r.socketId === mySocketId)?.rank ?? null;
    if (!myRankNow) return; // まだrankが取れないなら待つ

    if (sentRef.current) return;
    sentRef.current = true;

    (async () => {
      try {
        const score = me.score;               // ★ 最終スコア
        const won = myRankNow === 1;          // ★ ロワイヤル勝利条件
        const firstPlace = myRankNow === 1;   // ★ 1位ならtrue

        const weekStart = getWeekStartJST();
        const monthStart = getMonthStartJST();

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
          game: "battle",
          score,
          won,
          firstPlace,
          writeLog: true,
        });

        const modal = buildResultModalPayload("battle", res);
        if (modal) pushModal(modal);
      } catch (e) {
        console.error("[quiz_battle_royal] submitGameResult error:", e);
      }
    })();
  }, [finished, user, userLoading, me, players, mySocketId, correctCount, supabase, pushModal]);


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
        <p className="text-3xl md:text-5xl font-extrabold text-yellow-400 mb-6 animate-pulse drop-shadow-[0_0_10px_yellow]">
          対戦メンバーが揃ったよ！
        </p>

        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6">
          {roomPlayers.map((p) => (
            <div
              key={p.socketId}
              className="w-32 md:w-36 p-2 bg-white rounded-lg shadow-md border-2 border-gray-300"
            >
              <p className="font-bold text-lg md:text-xl truncate">{p.playerName}</p>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {!readyToStart && showStartButton && (
            <>
              <p className="text-lg md:text-2xl text-gray-500 mb-4">
                準備できたら「対戦スタート！」を押そう！全員押すと対戦が始まるよ！
              </p>

              <motion.button
                key="start-button"
                onClick={() => {
                  sendReady(handicap);
                  setReadyToStart(true);
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
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
            全員の準備を待っています…
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

  const gridColsClass =
    players.length <= 2 ? "grid-cols-2" :
    "grid-cols-4"; // 3人以上は4列、5人以上は自動で2段になる

  // Xシェア機能
  const handleShareX = () => {
    const resultText = isWin ? "勝ち🏆" : "負け…";
    const text = [
      "【ひまQ｜クイズロワイヤル♔】",
      `正解数：${correctCount}問`,
      `順位：${myRank ?? "-"}位`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() }); // ✅トップへ
  };

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-yellow-300 via-amber-200 to-blue-300">
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
            <div className={`grid ${gridColsClass} gap-1 mb-2 justify-items-center`}>
              {orderedPlayers.map((p) => {
                const isMe = p.socketId === mySocketId;
                const change = scoreChanges[p.socketId];

                return (
                  <div
                    key={p.socketId}
                    className={`
                      relative
                      w-17 md:w-28
                      aspect-square
                      rounded-lg
                      shadow-md
                      flex flex-col items-center justify-center
                      bg-white border-4
                      ${isMe ? "border-blue-500" : "border-gray-300"}
                    `}
                  >
                    {/* 加点/減点 */}
                    <AnimatePresence>
                      {change !== null && change !== undefined && (
                        <motion.div
                          key={change}
                          initial={{ opacity: 1, y: 0 }}
                          animate={{ opacity: 0, y: -20 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className={`absolute left-1/2 -translate-x-1/2 -bottom-1 font-extrabold text-lg
                            ${change > 0 ? "text-green-500" : "text-red-500"}
                          `}
                        >
                          {change > 0 ? `+${change}` : change}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* 名前 */}
                    <p className="font-bold text-gray-800 text-sm md:text-xl text-center px-1">
                      {p.name.length > 6 ? p.name.slice(0, 6) + "…" : p.name}
                    </p>

                    {/* 得点 */}
                    <p className="mt-1 text-gray-700 text-sm md:text-xl md:text-base font-extrabold">
                      {p.score}点
                    </p>

                    {/* 吹き出し */}
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
                            className={`absolute left-2 md:left-0 top-0 w-16 md:w-28 px-2 py-1 rounded shadow text-xs md:text-sm font-bold border-2
                              ${isMe ? "bg-blue-400 text-white border-blue-200" : "bg-red-400 text-white border-red-200"}
                            `}
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

          <div className="flex flex-col items-center">
            <p className={`w-[280px] md:w-[400px] text-2xl md:text-4xl font-extrabold px-4 py-2 rounded-lg shadow-lg 
                          ${timeLeft <= 30 ? 'bg-red-700 text-white animate-pulse' : 'bg-white text-black border-2 border-black'}`}>
              残り時間: {Math.floor(timeLeft / 60)}分 {timeLeft % 60}秒
            </p>
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
          players={players}
          mySocketId={mySocketId}
          matchEnded={matchEnded}
          rematchAvailable={rematchAvailable}
          rematchRequested={rematchRequested}
          handleNewMatch={handleNewMatch}
          handleRematch={handleRematch}
          myRankState={myRank}
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
