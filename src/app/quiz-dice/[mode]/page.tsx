"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";
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
import Image from "next/image";

type AwardStatus = "idle" | "awarding" | "awarded" | "need_login" | "error";

type ItemType = "DOUBLE" | "FORCE_6" | "PLUS_3";

type SelectedItem = {
  type: ItemType;
  label: string;
  // 4問目で選んだ、という情報（ズレ防止用）
  chosenAtQuestionIndex: number; // 3 固定になる想定
};

function DiceOverlay({
  open,
  onSubmit,
  deadlineMs = 10000,
}: {
  open: boolean;
  onSubmit: (face: number) => void;
  deadlineMs?: number;
}) {
  const [face, setFace] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [locked, setLocked] = useState(false);
  const [remain, setRemain] = useState(deadlineMs);

  const faceRef = useRef(1);
  const submittedRef = useRef(false);

  const lockedRef = useRef(false);
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    faceRef.current = face;
  }, [face]);

  useEffect(() => {
    if (!open) return;

    submittedRef.current = false;
    setLocked(false);
    setRolling(true);
    setRemain(deadlineMs);

    const rollTimer = setInterval(() => {
      setFace(Math.floor(Math.random() * 6) + 1);
    }, 80);

    const start = Date.now();
    const remainTimer = setInterval(() => {
      const r = Math.max(0, deadlineMs - (Date.now() - start));
      setRemain(r);
      if (r <= 0) {
        forceSubmit(); // 時間切れで確定
      }
    }, 100);

    const forceSubmit = () => {
      if (submittedRef.current) return;
      submittedRef.current = true;

      setLocked(true);
      setRolling(false);

      clearInterval(rollTimer);
      clearInterval(remainTimer);

      // 親へ「確定した面」を通知（閉じるのは親が担当）
      onSubmit(faceRef.current);
    };

    // どこでもタップで確定
    const handlePointerDown = () => {
    if (lockedRef.current) return;
    forceSubmit();
  };

    // overlay開いている間だけ有効にする
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    return () => {
      clearInterval(rollTimer);
      clearInterval(remainTimer);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deadlineMs]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
      <div className="relative w-[360px] md:w-[420px] text-center">
        {/* キラキラ背景（装飾） */}
        <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-r from-yellow-300 via-pink-300 to-sky-300 opacity-70" />

        {/* 本体カード */}
        <div className="relative bg-white/95 backdrop-blur rounded-[26px] p-6 md:p-8 shadow-2xl border-4 border-black overflow-hidden">
          {/* 上の装飾ライン */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-yellow-300 to-pink-400" />

          <p className="text-2xl md:text-3xl font-extrabold mb-2 drop-shadow">
            {locked ? "🎉 確定！！" : "🎲 サイコロを止めよう！"}
          </p>

          <p className="text-sm md:text-base text-gray-700 mb-4 font-bold">
            {locked ? "結果を反映中…" : `画面どこでもタップで確定！ 残り ${Math.ceil(remain / 1000)} 秒`}
          </p>

          {/* サイコロを大きく */}
          <div className="mx-auto w-[240px] h-[240px] md:w-[280px] md:h-[280px] flex items-center justify-center">
            <div
              className={`rounded-2xl ${
                locked ? "animate-bounce" : "animate-pulse"
              }`}
            >
              <Image
                src={`/images/dice${face}.png`}
                alt={`dice ${face}`}
                width={280}
                height={280}
                className="select-none"
                priority
              />
            </div>
          </div>

          <p className="mt-4 text-lg md:text-2xl font-extrabold">
            {locked ? "✅ OK！" : "タップでストップ！"}
          </p>

          {locked && (
            <p className="mt-2 text-sm md:text-base text-gray-600 font-bold">
              （2秒後に自動で閉じます）
            </p>
          )}

          {/* 下の小さい装飾 */}
          <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-yellow-200 opacity-60" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-sky-200 opacity-60" />
        </div>
      </div>
    </div>
  );
}

type ItemResult = {
  itemId: string;
  label: string;
  // 例：効果（お好みで）
  bonusPoints?: number;
  bonusExp?: number;
  // 例：演出用
  rarity?: "N" | "R" | "SR";
};

function ItemChanceOverlay({
  open,
  deadlineMs = 8000,
  onSubmit,
}: {
  open: boolean;
  deadlineMs?: number;
  onSubmit: (item: SelectedItem) => void;
}) {
  const [locked, setLocked] = useState(false);
  const [remain, setRemain] = useState(deadlineMs);
  const submittedRef = useRef(false);

  const choices: SelectedItem[] = [
    { type: "DOUBLE", label: "次の出目2倍🔥", chosenAtQuestionIndex: 3 },
    { type: "FORCE_6", label: "次の出目6確定🎯", chosenAtQuestionIndex: 3 },
    { type: "PLUS_3", label: "次の出目+3💪", chosenAtQuestionIndex: 3 },
  ];

  useEffect(() => {
    if (!open) return;

    submittedRef.current = false;
    setLocked(false);
    setRemain(deadlineMs);

    const start = Date.now();
    const t = setInterval(() => {
      const r = Math.max(0, deadlineMs - (Date.now() - start));
      setRemain(r);
      if (r <= 0) {
        // 時間切れのデフォルト（任意）：DOUBLEなど
        if (!submittedRef.current) {
          submittedRef.current = true;
          setLocked(true);
          // onSubmit(choices[0]);
        }
      }
    }, 100);

    return () => clearInterval(t);
  }, [open, deadlineMs]);

  if (!open) return null;

  const pick = (item: SelectedItem) => {
    if (locked) return;
    if (submittedRef.current) return;
    submittedRef.current = true;

    setLocked(true);
    onSubmit(item);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80">
      <div className="relative w-[360px] md:w-[420px] text-center">
        <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-r from-pink-300 via-yellow-300 to-sky-300 opacity-70" />
        <div className="relative bg-white/95 backdrop-blur rounded-[26px] p-6 md:p-8 shadow-2xl border-4 border-black overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-300 via-emerald-300 to-pink-300" />

          <p className="text-2xl md:text-3xl font-extrabold mb-2">
            {locked ? "✅ アイテム決定！" : "🎁 アイテムチャンス！"}
          </p>

          {!locked && (
            <p className="text-sm md:text-base text-gray-700 mb-4 font-bold">
              選んだ効果が5問目で発動するよ！ <span className="text-blue-400">残り {Math.ceil(remain / 1000)} 秒</span>
            </p>
          )}

          <div className="mt-3 grid grid-cols-1 gap-3">
            {choices.map((c) => (
              <button
                key={c.type}
                onClick={() => pick(c)}
                className="
                  w-full py-3 rounded-xl border-4 border-black
                  bg-gradient-to-b from-white to-yellow-100
                  text-xl font-extrabold hover:scale-[1.02] transition
                "
                disabled={locked}
              >
                {c.label}
              </button>
            ))}
          </div>

          {locked && (
            <p className="mt-4 text-lg md:text-xl font-extrabold">
              5問目に正解したら発動するよ🔥
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

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
  myRankState: number | null;
  eliminationGroups: string[][];
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
  playerPoints: Record<string, number>;
}

const QuizResult = ({
  correctCount,
  onRetry,
  matchEnded,
  rematchAvailable,
  rematchRequested,
  handleNewMatch,
  handleRematch,
  myRankState,
  eliminationGroups,
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
  playerPoints,
}: QuizResultProps) => {
  const [showText1, setShowText1] = useState(false);
  const [showText2, setShowText2] = useState(false);
  const [showText3, setShowText3] = useState(false);
  const [showText4, setShowText4] = useState(false);
  const [showText5, setShowText5] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    console.log("eliminationGroups", eliminationGroups);
  }, [eliminationGroups]);

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
            text-yellow-400
            drop-shadow-[0_0_20px_gold]
          "
        >
          🏆 1 位！ 👑
        </motion.p>
      )}

      {showText4 && <p className="text-xl md:text-2xl text-gray-600 mt-6">みんなの順位</p>}
      {showText4 && eliminationGroups.length > 0 && (
        <div className="mt-2 space-y-2">
          {[...eliminationGroups].reverse().map((group, reverseIndex) => {
            const rank = reverseIndex + 1; // 1位から順に

            return group.map(socketId => {
              const player = players.find(p => p.socketId === socketId);
              const pts = playerPoints?.[socketId] ?? 0;
              if (!player) return null;

              return (
                <div
                  key={`${rank}-${socketId}`}
                  className="flex items-center gap-4 px-3 py-2 bg-white rounded-lg shadow w-full max-w-md mx-auto"
                >
                  {/* 何位 */}
                  <span
                    className={`font-extrabold text-lg w-10 text-center ${
                      rank === 1
                        ? "text-yellow-400"
                        : rank === 2
                        ? "text-gray-400"
                        : rank === 3
                        ? "text-orange-500"
                        : "text-blue-500"
                    }`}
                  >
                    {rank}位
                  </span>

                  {/* 名前 */}
                  <span className="font-bold text-base truncate flex-1 text-center">
                    {player.playerName}
                  </span>

                  {/* ✅ 右端：点数 */}
                  <span className="font-extrabold text-base text-emerald-700 whitespace-nowrap w-16 text-right">
                    {pts}点
                  </span>
                </div>
              );
            });
          })}
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

export default function QuizModePage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = pathname.split("/").pop() || "random";
  const code = searchParams?.get("code") || ""; 
  const count = searchParams?.get("count") || ""; 
  const genre = searchParams?.get("genre") || "";
  const level = searchParams?.get("level") || "";
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

  // eliminationGroups から作った allRanks を使ってボーナス計算（同率は0、最下位は0）
  const calcPlacementBonusFromAllRanks = (
    playerCount: number,
    allRanksNow: { socketId: string; rank: number }[],
    mySocketId: string
  ) => {
    const table = BONUS_TABLE[playerCount] ?? [];
    const me = allRanksNow.find(r => r.socketId === mySocketId);
    if (!me) return 0;

    // 最下位はボーナス無し
    if (me.rank >= playerCount) return 0;

    // 同率はボーナス無し（その順位が1人だけのときのみ）
    const sameRankCount = allRanksNow.filter(r => r.rank === me.rank).length;
    if (sameRankCount !== 1) return 0;

    // table[0]=1位, table[1]=2位...
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
    predictionBonusPoints: number;
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

      // ログ（＋）※失敗しても致命的ではない
      const reasonPoint =
        `サイコロクイズ獲得: 正解${payload.correctCount}問=${payload.basePoints}P` +
        (payload.firstBonusPoints ? ` / 順位ボーナス${payload.firstBonusPoints}P` : "");

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
          reason: `サイコロクイズEXP獲得: 正解${payload.correctCount}問 → ${payload.exp}EXP`,
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
  const [firstBonusPoints, setFirstBonusPoints] = useState(0);
  const [predictionBonusPoints, setPredictionBonusPoints] = useState(0);

  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>({});
  const [diceOpen, setDiceOpen] = useState(false);
  const [diceEligible, setDiceEligible] = useState(false); // 自分が振れるか（=今回正解か）
  const diceSubmittedRef = useRef(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [itemEligible, setItemEligible] = useState(false);
  const itemSubmittedRef = useRef(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const selectedItemRef = useRef<SelectedItem | null>(null);
  useEffect(() => { selectedItemRef.current = selectedItem; }, [selectedItem]);
  const itemShownRef = useRef(false); // 4問目で1回だけ出す用

  const [lastItem, setLastItem] = useState<ItemResult | null>(null);

  type ServerItemId = "double" | "force6" | "plus3";

  const [roomItemChoices, setRoomItemChoices] = useState<Record<string, ServerItemId>>({});
  const [itemDeadlineMs, setItemDeadlineMs] = useState(8000);

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);
  const [wrongStreak, setWrongStreak] = useState(0);
  const wrongStreakRef = useRef(0);
  const [scoreChanges, setScoreChanges] = useState<Record<string, number | null>>({});
  const [readyToStart, setReadyToStart] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
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
  const [showDiceWaitMessage, setShowDiceWaitMessage] = useState(false);

  const pendingDiceOpenRef = useRef<{
    correctSocketIds: string[];
    deadlineMs: number;
    questionIndex: number;
  } | null>(null);

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

  const questionPhase = useQuestionPhase(
    socket,
    roomCode
  );

  const groups = lastPlayerElimination?.eliminationGroups ?? [];
  const winnerGroup = groups.length ? groups[groups.length - 1] : [];
  const isSoloWinner = winnerGroup.length === 1;          // 単独勝者か
  const amIWinner = winnerGroup.includes(mySocketId);     // 自分が勝者か
  const firstBonus = (isSoloWinner && amIWinner) ? 300 : 0;
  const phase = questionPhase?.phase ?? "question";
  const results = questionPhase?.results ?? [];
  const canAnswer = questionPhase?.canAnswer ?? false;
  const currentIndex = questionPhase?.currentIndex ?? 0;
  const questionTimeLeft = questionPhase?.questionTimeLeft ?? 20;
  const submitAnswer = questionPhase?.submitAnswer ?? (() => {});
  const [displayLives, setDisplayLives] = useState<Record<string, number>>({});
  const [showStartButton, setShowStartButton] = useState(false);
  const [diceDeadlineMs, setDiceDeadlineMs] = useState(4000);
  const [playerLastDiceFace, setPlayerLastDiceFace] = useState<Record<string, number>>({});
  const diceQuestionIndexRef = useRef(0);
  
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
      joinRandom({ maxPlayers: 4, gameType:"dice" }, (code) => setRoomCode(code)); // コールバックで state にセット
    } else {
      joinWithCode(code,count,"dice");
      setRoomCode("dice_" + code); // 入力済みコードを state にセット
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
    setPlayerPoints({});
    setDiceOpen(false);
    setDiceEligible(false);
    diceSubmittedRef.current = false;
    setDiceDeadlineMs(4000);
    diceQuestionIndexRef.current = 0;
    setSelectedItem(null);
    selectedItemRef.current = null;
    itemShownRef.current = false;
    setItemOpen(false);
    setRoomItemChoices({});
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
    setFinished(false);
    setCountdown(null);
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
    setPlayerPoints({});
    setDiceOpen(false);
    setDiceEligible(false);
    diceSubmittedRef.current = false;
    setDiceDeadlineMs(4000);
    diceQuestionIndexRef.current = 0;
    setSelectedItem(null);
    selectedItemRef.current = null;
    itemShownRef.current = false;
    setItemOpen(false);
    setRoomItemChoices({});

    setReadyToStart(false);

    resetMatch();

    if (mode === "random") {
      joinRandom({ maxPlayers: 4, gameType:"dice" }, (code) => setRoomCode(code));
    } else {
      joinWithCode(code, count,"dice");
      setRoomCode("dice_" + code);
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

  useEffect(() => {
    if (!isGameOver) return;

    const finishTimer  = setTimeout(() => {
      setFinished(true);
    }, 4000); // ← 正解発表演出のあと

    return () => {
      clearTimeout(finishTimer);
    };
  }, [phase, isGameOver]);

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
      setShowDiceWaitMessage(false);
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

      const diceWaitTimer = setTimeout(() => setShowDiceWaitMessage(true), 6000);

      // ダメージ表示
      const damageTimer = setTimeout(() => setShowDamageResult(true), 3000);

      return () => {
        clearTimeout(answerTextTimer);
        clearTimeout(answerTimer);
        clearTimeout(explanationTimer);
        clearTimeout(diceWaitTimer);
        clearTimeout(correctCountTimer);
        clearTimeout(damageTimer);
      };
    }
  }, [phase]);

  useEffect(() => {
    // result中で、解説表示が出たタイミングだけ
    if (phase !== "result") return;
    if (!showExplanation) return;

    const pending = pendingDiceOpenRef.current;
    if (!pending) return;

    const { correctSocketIds, deadlineMs, questionIndex } = pending;

    // この問題indexの dice_open だけ開く（ズレ防止）
    if (questionIndex !== currentIndex) return;

    // 自分が正解者か？
    const ok = correctSocketIds.includes(mySocketId);
    setDiceEligible(ok);

    diceSubmittedRef.current = false;

    if (ok) {
      setDiceOpen(true);
      diceQuestionIndexRef.current = questionIndex;
      setDiceDeadlineMs(deadlineMs);
    }

    // ✅ 消費（同じ問題で二回開かない）
    pendingDiceOpenRef.current = null;
  }, [phase, showExplanation, currentIndex, mySocketId]);

  useEffect(() => {
    if (phase === "question") {
      setDiceOpen(false);
      setDiceEligible(false);
      diceSubmittedRef.current = false;
      pendingDiceOpenRef.current = null; // ✅ 追加
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
    if (!lastPlayerElimination) return;

    const playerCountNow = players.length; // 基本4人なら 4 でもOK
    const base = correctCount * 10;

    // allRanks はあなたがすでに作ってる state（socketId, rank）
    const bonus = calcPlacementBonusFromAllRanks(playerCountNow, allRanks, mySocketId);

    const points = base + bonus;
    const expEarned = correctCount * 20;

    setBasePoints(base);
    setFirstBonusPoints(bonus);
    setPredictionBonusPoints(0);

    setEarnedPoints(points);
    setEarnedExp(expEarned);

    if (points <= 0 && expEarned <= 0) {
      setAwardStatus("idle");
      clearPendingAward();
      return;
    }

    const payload: PendingAward = {
      points,
      exp: expEarned,
      correctCount,
      basePoints: base,
      firstBonusPoints: bonus,
      predictionBonusPoints: 0,
      predictedWinner,
      hasPredicted,
      winnerSocketIds: (lastPlayerElimination.eliminationGroups ?? []).slice(-1)[0] ?? [],
      createdAt: Date.now(),
    };

    savePendingAward(payload);
    awardPointsAndExp(payload);
  }, [
    finished,
    lastPlayerElimination,
    correctCount,
    players.length,
    allRanks,
    mySocketId,
    hasPredicted,
    predictedWinner,
  ]);

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
      // 再戦開始
      handleRetry();      // 問題やスコアをリセット
      setRematchRequested(false);
      setRematchAvailable(false);
      setMatchEnded(false);
      setCountdown(null);

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
        setCountdown(null);
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

  useEffect(() => {
    if (!socket) return;

    const onScoreUpdate = ({
      socketId,
      score,
      face,
    }: {
      socketId: string;
      score: number;
      face?: number;
    }) => {
      setPlayerPoints(prev => ({ ...prev, [socketId]: score }));

      if (typeof face === "number") {
        // ① まず表示
        setPlayerLastDiceFace(prev => ({ ...prev, [socketId]: face }));

        // ② 数秒後に消す（上書き対策で face が変わってたら消さない）
        const shownFace = face;
        setTimeout(() => {
          setPlayerLastDiceFace(prev => {
            if (prev[socketId] !== shownFace) return prev; // 途中で更新されたら維持
            const next = { ...prev };
            delete next[socketId];
            return next;
          });
        }, 3000); // ← 表示時間（お好みで）
      }
    };

    socket.on("score_update", onScoreUpdate);
    return () => {
      socket.off("score_update", onScoreUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const onLocked = ({ choices }: { choices: Record<string, ServerItemId> }) => {
      setRoomItemChoices(choices ?? {});
    };

    socket.on("item_chance_locked", onLocked);
    return () => {
      socket.off("item_chance_locked", onLocked);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const onOpen = ({ deadlineMs }: { deadlineMs: number }) => {
      // サーバーが「今からアイテム選択」と言ったら開く
      setItemDeadlineMs(deadlineMs);
      setItemOpen(true);

      // ここで「4問目で出した」扱いにしたいなら
      itemShownRef.current = true;
    };

    socket.on("item_chance_open", onOpen);
    return () => {
      socket.off("item_chance_open", onOpen);
    };
  }, [socket]);

  useEffect(() => {
    if (phase === "question") {
      setPlayerLastDiceFace({});
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "question") {
      setDiceOpen(false);
      setDiceEligible(false);
      diceSubmittedRef.current = false;
      pendingDiceOpenRef.current = null;

      // ✅ アイテムもリセット
      setItemOpen(false);
      setItemEligible(false);
      itemSubmittedRef.current = false;
    }
  }, [phase]);

  useEffect(() => {
    if (!socket) return;

    const onDiceOpen = ({ correctSocketIds, deadlineMs, questionIndex, openAt }: {
      correctSocketIds: string[];
      deadlineMs: number;
      questionIndex: number;
      openAt: number;
    }) => {
      // 問題index確認（ズレ防止）
      if (questionIndex !== currentIndex) {
        // ただし currentIndex は hooks の値なので、ここは ref を使うのがより安全
      }

      const ok = correctSocketIds.includes(mySocketId);
      setDiceEligible(ok);
      diceSubmittedRef.current = false;

      if (!ok) return;

      diceQuestionIndexRef.current = questionIndex;
      setDiceDeadlineMs(deadlineMs);

      const delay = Math.max(0, openAt - Date.now());
      setTimeout(() => {
        setDiceOpen(true);
      }, delay);
    };

    socket.on("dice_open", onDiceOpen);
    return () => {
      socket.off("dice_open", onDiceOpen);
    };
  }, [socket, mySocketId]);

  const checkAnswer = () => {
    if (userAnswer == null) return;

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
  const orderedPlayers = [...players].sort((a, b) => {
    if (a.socketId === mySocketId) return -1;
    if (b.socketId === mySocketId) return 1;
    return 0;
  });

  // Xシェア機能
  const handleShareX = () => {
    const text = [
      "【ひまQ｜サイコロクイズ🎲】",
      `正解数：${correctCount}問`,
      `順位：${myRankState}位`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() }); // ✅トップへ
  };

  const applyItemToFace = (face: number, item: SelectedItem | null) => {
    if (!item) return face;

    switch (item.type) {
      case "FORCE_6":
        return 6;
      case "PLUS_3":
        return face + 3;
      case "DOUBLE":
        return face * 2;
      default:
        return face;
    }
  };

  const itemImageSrc = (id?: "double" | "force6" | "plus3") => {
    if (!id) return null;
    if (id === "double") return "/images/dice_double.png";
    if (id === "force6") return "/images/dice_force6.png";
    if (id === "plus3") return "/images/dice_plus3.png";
    return null;
  };

  const toServerItemId = (t: ItemType): ServerItemId => {
    if (t === "DOUBLE") return "double";
    if (t === "FORCE_6") return "force6";
    return "plus3";
  };

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-green-300 via-amber-200 to-emerald-300" key={battleKey}>
      <DiceOverlay
        open={diceOpen}
        deadlineMs={diceDeadlineMs}
        onSubmit={(face) => {
          if (!socket) return;
          if (!diceEligible) { setDiceOpen(false); return; }
          if (diceSubmittedRef.current) return;
          diceSubmittedRef.current = true;

          const qIndex = diceQuestionIndexRef.current;

          socket.emit("dice_submit", {
            roomCode,
            face,
            questionIndex: qIndex,
          });

          if (qIndex === 4) {
            setSelectedItem(null);
            selectedItemRef.current = null;
          }

          setTimeout(() => setDiceOpen(false), 2000);
        }}
      />

      <ItemChanceOverlay
        open={itemOpen}
        deadlineMs={itemDeadlineMs}
        onSubmit={(item) => {
          setSelectedItem(item);
          setItemOpen(false);

          socket?.emit("item_select", {
            roomCode,
            itemId: toServerItemId(item.type),
          });

          // ✅ 自分だけ即表示したいなら先に埋めておく（lockedが来るまでの保険）
          setRoomItemChoices(prev => ({ ...prev, [mySocketId]: toServerItemId(item.type) }));
        }}
      />

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

      {!finished ? (
        <>
          <div className="mb-2 md:text-xl">
            <p>正解してサイコロを振ろう！出目×100 が点数に入るよ 🎲</p>
          </div>
          <div className="flex flex-col items-center">
            {/* 第◯問ラベル */}
            <div className="
              inline-flex items-center gap-2
              px-5 py-2 md:px-7 md:py-3
              rounded-full
              bg-white/95
              border-4 border-gray-200
              text-lg md:text-2xl
              font-extrabold
              text-gray-900
              mb-3
            ">
              <span className="whitespace-nowrap">
                🎯第{currentIndex + 1}問
              </span>
              <span className="text-gray-500 text-base md:text-xl font-bold">
                / 全5問
              </span>
            </div>
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
                
                const pts = playerPoints[p.socketId] ?? 0;
                const itemId = roomItemChoices[p.socketId]; // "double" | "force6" | "plus3" | undefined
                const itemSrc = itemImageSrc(itemId);

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
                      bg-white
                      border-4
                      ${borderColorClass}
                    `}
                  >
                    <p className="font-bold text-gray-800 text-lg md:text-xl text-center">
                      {p.playerName.length > 5 ? p.playerName.slice(0, 5) + "..." : p.playerName}
                    </p>

                    <p className="text-md md:text-lg font-extrabold text-emerald-700">
                      {pts}点
                    </p>

                    {itemSrc && (
                      <div className="mt-1">
                        <Image
                          src={itemSrc}
                          alt={`item ${itemId}`}
                          width={36}
                          height={36}
                          className="select-none"
                        />
                      </div>
                    )}

                    {/* 結果表示 */}
                    <p
                      className={`
                        text-lg md:text-xl font-bold mt-1
                        ${
                          phase === "result"
                            ? result?.isCorrect
                              ? "text-green-600"
                              : "text-red-600"
                            : result
                            ? "text-gray-800"
                            : "text-gray-600"
                        }
                      `}
                    >
                      {
                        phase === "result" && playerLastDiceFace[p.socketId] ? (
                          <span className="inline-flex items-center justify-center">
                            <Image
                              src={`/images/dice${playerLastDiceFace[p.socketId]}.png`}
                              alt="last dice"
                              width={36}
                              height={36}
                              className="select-none"
                            />
                          </span>
                        ) : (
                          phase === "result"
                            ? showDamageResult
                              ? result
                                ? result.isCorrect
                                  ? "正解〇"
                                  : "誤答×"
                                : "未回答"
                              : "　"
                            : result
                            ? "？"
                            : ""
                        )
                      }
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

          {isGameOver && (
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

                {phase === "result" && showDiceWaitMessage && (
                  <p className="mt-2 text-lg md:text-2xl font-extrabold text-gray-700 animate-pulse">
                    他の人がサイコロを振ってます…🎲
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
                    <QuizQuestion
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
          onRetry={handleRetry}
          matchEnded={matchEnded}
          rematchAvailable={rematchAvailable}
          rematchRequested={rematchRequested}
          handleNewMatch={handleNewMatch}
          handleRematch={handleRematch}
          myRankState={myRankState}
          eliminationGroups={lastPlayerElimination?.eliminationGroups ?? []}
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
          playerPoints={playerPoints}
        />
      )}
    </div>
  );
}
