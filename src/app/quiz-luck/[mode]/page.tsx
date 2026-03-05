"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { submitGameResult, calcTitle } from "@/lib/gameResults";
import { buildResultModalPayload } from "@/lib/resultMessages";
import { useResultModal } from "../../components/ResultModalProvider";
import { getWeekStartJST } from "@/lib/week";
import { getMonthStartJST } from "@/lib/month";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedSoloGames from "@/app/components/RecommendedSoloGames";

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

function calcQuizEarnedPoints(correctCount: number) {
  let total = 0;
  for (let i = 1; i <= correctCount; i++) {
    const tier = Math.floor((i - 1) / 3); // 0,1,2...
    const per = 5 * (tier + 1); // 5,10,15...
    total += per;
  }
  return total;
}

// EXPは「正解数 × 20」
function calcEarnedExp(correctCount: number) {
  return correctCount * 20;
}

type AwardStatus = "idle" | "awarding" | "awarded" | "need_login" | "error";

const QuizResult = ({
  correctCount,
  earnedPoints,
  earnedExp,
  isLoggedIn,
  awardStatus,
  titles,
  onGoLogin,
  onShareX,
  onRetry,
}: {
  correctCount: number;
  earnedPoints: number;
  earnedExp: number;
  isLoggedIn: boolean;
  awardStatus: AwardStatus;
  titles: { threshold: number; title: string }[];
  onGoLogin: () => void;
  onShareX: () => void;
  onRetry: () => void;
}) => {
  const [showScore, setShowScore] = useState(false);
  // const [showText, setShowText] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowScore(true), 500));
    // timers.push(setTimeout(() => setShowText(true), 1000));
    timers.push(setTimeout(() => setShowRank(true), 1000));
    timers.push(setTimeout(() => setShowButton(true), 1000));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="text-center mt-6">
      {showScore && (
        <p className="text-3xl md:text-5xl mb-4 md:mb-6">
          正解数： {correctCount}問
        </p>
      )}

      {showRank && (
        <>
          <div className="mx-auto inline-block mb-6">
            <div className="bg-gradient-to-b from-yellow-100 via-white to-yellow-200 rounded-3xl px-8 py-5 md:px-12 md:py-7 shadow-xl">
              <p className="text-xl md:text-3xl font-extrabold text-gray-900">
                ✨ 今回の報酬 ✨
              </p>
              <p className="mt-1 text-4xl md:text-6xl font-extrabold text-green-600 drop-shadow">
                {earnedPoints}P！
              </p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center mb-10 gap-4 md:gap-10">
            <img
              src="/images/quiz.png"
              alt="クイズ"
              className="w-0 h-0 md:w-36 md:h-55 ml-15"
            />
            <div className="flex flex-row md:flex-row items-center justify-center gap-8">
              <img
                src="/images/quiz.png"
                alt="クイズ"
                className="w-20 h-30 md:w-0 md:h-0"
              />
              <img
                src="/images/quiz_woman.png"
                alt="クイズ"
                className="w-20 h-30 md:w-36 md:h-55"
              />
            </div>
          </div>
        </>
      )}
      
      {/* ★ 獲得ポイント表示（ログイン有無で文言変更） */}
      {showRank && (
        <div className="mx-auto max-w-[520px] bg-white border-2 border-black rounded-xl p-4 shadow mt-2">
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
        </div>
      )}

      {showButton && (
        <>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <button
                className="px-6 py-3 bg-black text-white border border-black rounded-lg font-bold text-xl hover:opacity-80 cursor-pointer"
                onClick={onShareX}
              >
                Xで結果をシェア
              </button>

              <button
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold text-xl hover:bg-blue-600 cursor-pointer"
                onClick={onRetry}
              >
                もう一回挑戦する
              </button>
            </div>
          </div>

          <RecommendedSoloGames
            title="次はどれで遊ぶ？🎮"
            count={4}
            excludeHref="/quiz-luck" // 今のページを出したくないなら
          />
        </>
      )}
    </div>
  );
};

export default function QuizModePage() {
  const pathname = usePathname();
  const router = useRouter();
  const mode = pathname.split("/").pop() || "random";
  const searchParams = useSearchParams();
  const genre = searchParams?.get("genre") || "";
  const level = searchParams?.get("level") || "";

  type GamePhase = "intro" | "playing" | "between" | "rouletteIntro" | "roulette" | "baseRoulette" | "finished";
  const CHALLENGE_TARGETS = [3, 5, 10, 20, 30] as const; // 1回目2連続 / 2回目3連続 / 3回目5連続

  const randChoice = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>(
    []
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [flashMilestone, setFlashMilestone] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);

  // ★ リザルト用：獲得ポイントと付与状態
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");
  const awardedOnceRef = useRef(false); // 二重加算防止
  const sentRef = useRef(false);        // ★ 成績/称号送信用（二重送信防止）
  const { pushModal } = useResultModal();

  const [phase, setPhase] = useState<GamePhase>("intro");

  const [challengeIndex, setChallengeIndex] = useState(0); // 0,1,2
  const [streakInChallenge, setStreakInChallenge] = useState(0); // 連続正解（チャレンジ内）
  const [baseReward, setBaseReward] = useState<number | null>(null); // 100/200/300
  const [reward, setReward] = useState(0); // 現在の未確定報酬
  const [failReward, setFailReward] = useState(0); // 失敗時の取得ポイント（半分→4分の1）
  const [lastMultiplier, setLastMultiplier] = useState<number | null>(null); // 2~4(演出用)
  const [finalReward, setFinalReward] = useState(0); // 確定して結果に渡すポイント
  const [prevReward, setPrevReward] = useState<number | null>(null);

  const finishedRef = useRef(finished);
  const showCorrectRef = useRef(showCorrectMessage);
  const rewardAppliedRef = useRef<{ [k: number]: boolean }>({});

  // ★ ルーレット倍率（betweenで決める）
  const [mulRolling, setMulRolling] = useState(false);
  const [mulCandidate, setMulCandidate] = useState<number>(2); // 表示中の数字
  const [mulLocked, setMulLocked] = useState<number | null>(null); // タップで確定した倍率

  // ✅ 最初の報酬ルーレット（50/100/150）
  const BASE_LIST = [50, 100, 150] as const;
  const [baseRolling, setBaseRolling] = useState(false);
  const [baseCandidate, setBaseCandidate] = useState<number>(BASE_LIST[0]);
  const [baseLocked, setBaseLocked] = useState<number | null>(null);
  const baseTimerRef = useRef<number | null>(null);

  // ============================
  // ✅ 取りこぼし防止：pending key
  // ============================
  const PENDING_KEY = "fate_award_pending_v1"; // ← streak と別キーにする

  // ✅ 付与直前に “いまログインできてるか” を確認して userId を返す
  const ensureAuthedUserId = async (): Promise<string | null> => {
    const { data: u1, error: e1 } = await supabase.auth.getUser();
    if (!e1 && u1.user) return u1.user.id;

    await supabase.auth.refreshSession();
    const { data: u2, error: e2 } = await supabase.auth.getUser();
    if (!e2 && u2.user) return u2.user.id;

    return null;
  };

  const savePendingAward = (payload: { correctCount: number; points: number; exp: number }) => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({ ...payload, at: Date.now() }));
    } catch {}
  };

  const loadPendingAward = (): null | { correctCount: number; points: number; exp: number } => {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const clearPendingAward = () => {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {}
  };

  // ✅ “付与”の本体（何回でも呼べる）
  const awardPointsAndExp = async (payload?: { correctCount: number; points: number; exp: number }) => {
    if (awardedOnceRef.current) return;

    const p = payload ?? loadPendingAward();
    if (!p) return;

    if (p.points <= 0 && p.exp <= 0) {
      clearPendingAward();
      setAwardStatus("idle");
      return;
    }

    setAwardStatus("awarding");

    const uid = await ensureAuthedUserId();
    if (!uid) {
      savePendingAward(p);
      setAwardStatus("need_login");
      return;
    }

    // ✅ ここで初めて二重加算防止フラグ（未ログイン時に立てない）
    awardedOnceRef.current = true;

    try {
      let oldLevel: number | null = null;
      let newLevel: number | null = null;

      // 事前に現在レベルを読んでおく（RPCがold/newを返すなら無駄になるけど安全）
      try {
        const { data: before } = await supabase
          .from("profiles")
          .select("level")
          .eq("user_id", uid)
          .maybeSingle();
        oldLevel = typeof before?.level === "number" ? before.level : null;
      } catch {}

      const { data, error } = await supabase.rpc("add_points_and_exp", {
        p_user_id: uid,
        p_points: p.points,
        p_exp: p.exp,
      });

      if (error) {
        console.error("add_points_and_exp error:", error);
        savePendingAward(p);
        awardedOnceRef.current = false;
        setAwardStatus("error");
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const rpcOld = row?.old_level;
      const rpcNew = row?.new_level;

      if (typeof rpcOld === "number") oldLevel = rpcOld;
      if (typeof rpcNew === "number") newLevel = rpcNew;

      // 返ってこない場合は後段で “今のレベル” を読み直す
      if (newLevel == null) {
        try {
          const { data: after } = await supabase
            .from("profiles")
            .select("level")
            .eq("user_id", uid)
            .maybeSingle();
          newLevel = typeof after?.level === "number" ? after.level : null;
        } catch {}
      }

      // UI更新イベント
      window.dispatchEvent(new Event("points:updated"));

      if (oldLevel != null && newLevel != null) {
        window.dispatchEvent(new CustomEvent("profile:updated", { detail: { oldLevel, newLevel } }));
      }

      if (oldLevel != null && newLevel != null && newLevel > oldLevel) {
        try {
          const { data: r, error: rErr } = await supabase.rpc("claim_levelup_rewards", {
            p_user_id: uid,
            p_old_level: oldLevel,
            p_new_level: newLevel,
          });

          if (rErr) {
            console.error("claim_levelup_rewards error:", rErr);
          } else {
            const rr = Array.isArray(r) ? r[0] : r;
            const awardedPoints = Number(rr?.awarded_points ?? 0);
            const awardedTitle = (rr?.awarded_title ?? null) as string | null;

            // 付与があった時だけ “レベルアップ/得点モーダル” を出すトリガー
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

      // ログ（失敗しても致命的じゃない運用でOK）
      await supabase.from("user_point_logs").insert({
        user_id: uid,
        change: p.points,
        reason: `運命のクイズでポイント獲得（正解数 ${p.correctCount}問）`,
      });

      await supabase.from("user_exp_logs").insert({
        user_id: uid,
        change: p.exp,
        reason: `運命のクイズでEXP獲得（正解数 ${p.correctCount}問）`,
      });

      clearPendingAward();
      setAwardStatus("awarded");
    } catch (e) {
      console.error("award points/exp error:", e);
      savePendingAward(p);
      awardedOnceRef.current = false;
      setAwardStatus("error");
    }
  };

  const getFailFinalReward = () => {
    // ルーレット後（倍率を適用した直後のチャレンジ中）なら
    // prevReward = 倍率を掛ける前の報酬 が入ってる
    if (lastMultiplier != null && prevReward != null) {
      return Math.floor(prevReward / 5);
    }
    // それ以外（1回目など）は今まで通り
    return Math.floor(reward / 5);
  };

  const titles = [
    { threshold: 3, title: "優等生" },
    { threshold: 5, title: "異端児" },
    { threshold: 8, title: "賢者" },
    { threshold: 10, title: "博識者" },
    { threshold: 13, title: "クイズ研究家" },
    { threshold: 15, title: "クイズ学者" },
    { threshold: 18, title: "クイズ教授" },
    { threshold: 20, title: "クイズ名人" },
    { threshold: 23, title: "クイズ達人" },
    { threshold: 25, title: "クイズ仙人" },
    { threshold: 28, title: "クイズ星人" },
    { threshold: 30, title: "知識マスター" },
    { threshold: 33, title: "天才クイズプレイヤー" },
    { threshold: 35, title: "脳内図書館 " },
    { threshold: 38, title: "クイズマシーン " },
    { threshold: 40, title: "問題バスター " },
    { threshold: 43, title: "答えの支配者 " },
    { threshold: 45, title: "クイズモンスター " },
    { threshold: 48, title: "答えの錬金術師" },
    { threshold: 50, title: "ひらめきの妖精" },
    { threshold: 53, title: "クイズ帝王" },
    { threshold: 55, title: "問題ハンター" },
    { threshold: 58, title: "記憶の魔術師" },
    { threshold: 60, title: "IQ200超えの賢者" },
    { threshold: 65, title: "クイズ鬼人" },
    { threshold: 70, title: "クイズ竜王" },
    { threshold: 75, title: "クイズ魔人" },
    { threshold: 80, title: "クイズ覇王" },
    { threshold: 85, title: "クイズオリンポスの支配者" },
    { threshold: 90, title: "レジェンドクイズマスター" },
    { threshold: 95, title: "究極クイズマスター" },
    { threshold: 100, title: "神（ゴッド）🌟" },
  ];

  const resetGame = () => {
    // 進行リセット
    setCurrentIndex(0);
    setUserAnswer(null);
    setCorrectCount(0);
    setFinished(false);

    // 画面/演出
    setShowCorrectMessage(false);
    setFlashMilestone(null);
    setIncorrectMessage(null);
    setTimeLeft(30);

    // 追加：運命チャレンジ用
    setPhase("intro");
    setChallengeIndex(0);
    setStreakInChallenge(0);
    setBaseReward(null);
    setReward(0);
    setFailReward(0);
    setLastMultiplier(null);
    setFinalReward(0);
    setBaseRolling(false);
    setBaseCandidate(BASE_LIST[0]);
    setBaseLocked(null);

    // リザルト関連
    setEarnedPoints(0);
    setEarnedExp(0);
    setAwardStatus("idle");
    awardedOnceRef.current = false;
    sentRef.current = false;
    rewardAppliedRef.current = {};

    finishedRef.current = false;
    showCorrectRef.current = false;

    clearPendingAward();

    setQuestions((prev) => shuffleArray(prev));
  };

  const startFirstChallenge = () => {
    // 最初から始める
    setPhase("playing");
    setChallengeIndex(0);
    setStreakInChallenge(0);
    setBaseReward(null);
    setReward(0);
    setFailReward(0);
    setLastMultiplier(null);
    rewardAppliedRef.current = {};

    // クイズ開始準備
    setCurrentIndex(0);
    setCorrectCount(0);
    setFinished(false);
    setShowCorrectMessage(false);
    setIncorrectMessage(null);
    setTimeLeft(30);
    setBaseRolling(false);
    setBaseLocked(null);

    // シャッフル（任意だけどおすすめ）
    setQuestions((prev) => shuffleArray(prev));
  };

  const lockMul = () => {
    if (!mulRolling) return;

    // いま表示中の数字で確定
    setMulRolling(false);
    setMulLocked(mulCandidate);

    // interval 停止
    if (mulTimerRef.current) {
      window.clearInterval(mulTimerRef.current);
      mulTimerRef.current = null;
    }
  };

  const startNextChallengeFromRoulette = () => {
    if (mulLocked == null) return;

    const mul = mulLocked;

    setLastMultiplier(mul);
    setReward((r) => {
      setPrevReward(r);
      const next = r * mul;
      setFailReward(Math.floor(next / 5));
      return next;
    });

    // ✅ ここでは次チャレンジを開始しない（betweenへ戻す）
    setPhase("between");
  };

  const mulTimerRef = useRef<number | null>(null);

  // ルーレット倍率候補
  const MUL_LIST = [2, 2.5, 3] as const;

  useEffect(() => {
    const shouldRoulette = phase === "roulette" && mulLocked == null;

    if (!shouldRoulette) {
      if (mulTimerRef.current) {
        window.clearInterval(mulTimerRef.current);
        mulTimerRef.current = null;
      }
      setMulRolling(false);
      return;
    }

    setMulRolling(true);
    setMulCandidate(MUL_LIST[0]);

    mulTimerRef.current = window.setInterval(() => {
      setMulCandidate((prev) => {
        const idx = MUL_LIST.indexOf(prev as any);
        return MUL_LIST[(idx + 1) % MUL_LIST.length];
      });
    }, 90);

    return () => {
      if (mulTimerRef.current) {
        window.clearInterval(mulTimerRef.current);
        mulTimerRef.current = null;
      }
    };
  }, [phase, mulLocked]);

  const lockBase = () => {
    if (!baseRolling) return;
    setBaseRolling(false);
    setBaseLocked(baseCandidate);

    if (baseTimerRef.current) {
      window.clearInterval(baseTimerRef.current);
      baseTimerRef.current = null;
    }
  };

  const applyBaseAndGoBetween = () => {
    if (baseLocked == null) return;

    setBaseReward(baseLocked);
    setReward(baseLocked);
    setFailReward(Math.floor(baseLocked / 5));
    setLastMultiplier(null);

    // ✅ 次は「between（続ける/やめる選択）」へ
    setPhase("between");
  };

  const startBaseRoulette = () => {
    // すでに確定済み/回転中なら何もしない
    if (baseLocked != null) return;
    if (baseRolling) return;

    setBaseCandidate(BASE_LIST[0]);
    setBaseRolling(true); // ✅ これで useEffect が回し始める
  };

  useEffect(() => {
    // ✅ baseRolling が true のときだけ回す（= ボタン押した後）
    const should = phase === "baseRoulette" && baseRolling && baseLocked == null;

    if (!should) {
      if (baseTimerRef.current) {
        window.clearInterval(baseTimerRef.current);
        baseTimerRef.current = null;
      }
      return;
    }

    baseTimerRef.current = window.setInterval(() => {
      setBaseCandidate((prev) => {
        const idx = BASE_LIST.indexOf(prev as any);
        return BASE_LIST[(idx + 1) % BASE_LIST.length];
      });
    }, 90);

    return () => {
      if (baseTimerRef.current) {
        window.clearInterval(baseTimerRef.current);
        baseTimerRef.current = null;
      }
    };
  }, [phase, baseRolling, baseLocked]);

  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);
  useEffect(() => {
    showCorrectRef.current = showCorrectMessage;
  }, [showCorrectMessage]);
  useEffect(() => {
    rewardAppliedRef.current[challengeIndex] = false;
  }, [challengeIndex]);

  // useEffect(() => {
  //   (async () => {
  //     const pending = loadPendingAward();
  //     if (!pending) return;
  //     await awardPointsAndExp(pending);
  //   })();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/articles");
        const data: ArticleData[] = await res.json();
        let all: ArticleData[] = data;

        if (mode === "genre" && genre) {
          all = all.filter((a) => a.quiz?.genre === genre);
        }
        if (mode === "level" && level) {
          all = all.filter((a) => a.quiz?.level === level);
        }

        const quizQuestions: { id: string; quiz: QuizData }[] = all
          .filter((a) => a.quiz)
          .map((a) => ({
            id: a.id,
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
            },
          }));

        setQuestions(shuffleArray(quizQuestions));
      } catch (error) {
        console.error("クイズ問題の取得に失敗しました:", error);
      }
    };

    fetchArticles();
  }, [mode, genre, level]);

  const shuffleArray = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  useEffect(() => {
    if (phase !== "playing") return;
    if (finished) return;
    if (showCorrectMessage) return;

    const timer = setInterval(() => {
      if (phase !== "playing") return;
      if (finishedRef.current || showCorrectRef.current) return;

      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setFinished(true);
          setFinalReward(getFailFinalReward()); // 時間切れは失敗扱い：半分→4分の1（※1回目はreward=0なので0）
          setPhase("finished");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentIndex, finished, showCorrectMessage, reward]);

  const checkAnswer = () => {
    const correctAnswer = questions[currentIndex].quiz?.answer;
    const displayAnswer = questions[currentIndex].quiz?.displayAnswer;

    if (userAnswer === correctAnswer) {
      setCorrectCount((c) => c + 1);

      setStreakInChallenge((prev) => {
        const nextStreak = prev + 1;
        // ✅ ここでは phase を変えない（成功しても画面はそのまま）
        return nextStreak;
      });

      setShowCorrectMessage(true);
    } else {
      setIncorrectMessage(`ざんねん！\n答えは" ${displayAnswer} "でした！`);
      setFinalReward(getFailFinalReward());
    }

    setUserAnswer(null);
  };

  const nextQuestion = () => {
    setShowCorrectMessage(false);

    const need = CHALLENGE_TARGETS[challengeIndex];

    if (streakInChallenge >= need) {
      // ✅ 1回目成功 → 最初の報酬ルーレット（今まで通り）
      if (challengeIndex === 0 && reward === 0) {
        setPhase("baseRoulette");
        return;
      }

      // ✅ 2回目以降の成功 → 倍率ルーレット案内へ（まだ回さない）
      if (challengeIndex >= 1 && challengeIndex <= 3) {
        setPhase("rouletteIntro");
        return;
      }

      // ✅ 最終成功（challengeIndex===4）などは通常betweenへ
      setPhase("between");
      return;
    }

    // 通常：次の問題
    if (currentIndex + 1 >= questions.length) {
      setFinalReward(Math.floor(reward / 5));
      setFinished(true);
      setPhase("finished");
    } else {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(30);
    }
  };

  const finishQuiz = () => {
    setFinished(true);
    setPhase("finished");
  };

  const goNextChallenge = () => {
    if (challengeIndex >= 4) return;

    // ✅ 次のチャレンジ開始（ルーレットは成功後にやる）
    setChallengeIndex((v) => v + 1);
    setStreakInChallenge(0);
    setShowCorrectMessage(false);
    setIncorrectMessage(null);
    setTimeLeft(30);

    setMulLocked(null); // 念のため
    setPhase("playing");

    // 次の問題へ（between の時点の問題はもう終わってるので次へ進める）
    setCurrentIndex((i) => i + 1);
  };

  const takeRewardAndFinish = () => {
    setFinalReward(reward);
    setFinished(true);
    setPhase("finished");
  };

  const getTitle = () => {
    let title = "クイズ初心者";
    titles.forEach((t) => {
      if (correctCount >= t.threshold) title = t.title;
    });
    return title;
  };

  // ★ finished になったタイミングで「獲得ポイント計算」→「ログインなら加算」
  useEffect(() => {
    if (phase !== "finished") return;
    if (userLoading) return; // streak と同じく、判定が揺れてる時は待つ

    const points = finalReward; // ✅ 運命の確定報酬
    const exp = calcEarnedExp(correctCount);

    setEarnedPoints(points);
    setEarnedExp(exp);

    // ✅ finished になったら必ず pending を作る（取りこぼしゼロ）
    savePendingAward({ correctCount, points, exp });

    // ✅ そのまま付与を試す（ログインできれば即付与、できなければ need_login）
    awardPointsAndExp({ correctCount, points, exp });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, finalReward, correctCount, userLoading]);

  useEffect(() => {
    const onVisibility = async () => {
      if (document.visibilityState !== "visible") return;

      await supabase.auth.refreshSession();

      if (phase === "finished" && !awardedOnceRef.current) {
        await awardPointsAndExp();
      }
    };

    const onFocus = async () => {
      await supabase.auth.refreshSession();

      if (phase === "finished" && !awardedOnceRef.current) {
        await awardPointsAndExp();
      }
    };

    // document.addEventListener("visibilitychange", onVisibility);
    // window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ★ 連続正解チャレンジ：成績(最高連続正解数)＆称号を保存 → 新記録/新称号ならモーダル
  useEffect(() => {
    if (!finished) return;
    if (sentRef.current) return;
    sentRef.current = true;

    // 未ログインなら保存しない（任意）
    if (!userLoading && !user) return;

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
          p_best_streak: correctCount,
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
          p_best_streak: correctCount,
        });
        if (monthlyErr) console.log("upsert_monthly_stats error:", monthlyErr);

        // 連続正解数から称号を計算
        const title = calcTitle(titles, correctCount);

        const res = await submitGameResult(supabase, {
          game: "streak",       // ← 連続正解チャレンジ用の識別子（あなたの設計に合わせて）
          streak: correctCount, // ✅ 連続正解数は streak で送る
          score: 0,
          stage: 0,
          title,
          writeLog: true,
        });

        // 新記録 or 新称号 のときだけモーダルを出す
        const modal = buildResultModalPayload("streak", res);
        if (modal) pushModal(modal);
      } catch (e) {
        console.error("[streak] submitGameResult error:", e);
        // 成績保存が失敗してもゲームは止めない
      }
    })();
  }, [finished, userLoading, user, correctCount, titles, supabase, pushModal]);

  if (questions.length === 0) return <p></p>;

  // Xシェア機能
  const handleShareX = () => {
    const text = [
      "【ひまQ｜運命のクイズ🎲】",
      `正解数：${correctCount}問`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() }); // ✅トップへ
  };

  if (questions.length === 0) return <p></p>;

  // =========================
  // intro 画面
  // =========================
  if (phase === "intro") {
    return (
      <div className="container mx-auto p-8 text-center bg-gradient-to-b from-green-50 via-green-100 to-green-200">
        <p className="text-4xl md:text-6xl font-extrabold text-orange-500 drop-shadow mb-6">
          最初のチャレンジ！
        </p>

        <p className="text-xl md:text-3xl font-bold text-gray-700 mb-10">
          間違えずに <span className="text-red-500">3問連続</span>で正解したらチャレンジ成功！
        </p>

        <button
          onClick={startFirstChallenge}
          className="px-8 py-4 bg-purple-500 text-white text-2xl md:text-3xl font-extrabold rounded-full border-2 border-black shadow-lg hover:scale-105 transition"
        >
          チャレンジする！
        </button>
      </div>
    );
  }

  // =========================
  // between 画面
  // =========================
  if (phase === "between") {
    const nextIndex = challengeIndex + 1;
    const hasNext = nextIndex <= 4;
    const nextNeed = hasNext ? CHALLENGE_TARGETS[nextIndex] : null;

    return (
      <div className="container mx-auto p-8 text-center bg-gradient-to-b from-green-200 via-green-100 to-green-200">
        <div className="relative inline-block mb-6">
        {/* キラキラ背景（ぼかし光） */}
        <div className="absolute -inset-3 md:-inset-4 rounded-3xl bg-gradient-to-r from-yellow-200 via-pink-200 to-sky-200 blur-xl opacity-90" />

        {/* ちょいキラ粒 */}
        <div className="absolute -top-3 -left-2 text-2xl md:text-3xl animate-pulse">✨</div>
        <div className="absolute -top-4 -right-2 text-2xl md:text-3xl animate-pulse">✨</div>
        <div className="absolute -bottom-4 left-4 text-xl md:text-2xl animate-pulse">🌟</div>

        {/* 本体 */}
        <p className="relative px-6 py-3 md:px-10 md:py-4 text-4xl md:text-6xl font-extrabold text-orange-500 drop-shadow text-center leading-tight">
          チャレンジ
          <br className="md:hidden" />
          <span className="hidden md:inline"> </span>
          成功！
        </p>
      </div>
      <div>
        {lastMultiplier && prevReward !== null && (
          <div className="mx-auto inline-block mb-3 bg-white/70 border border-black rounded-xl px-4 py-2 shadow">
            <p className="text-lg md:text-2xl font-extrabold text-gray-800">
              {prevReward}P（前回の報酬） × {lastMultiplier}（今回の報酬倍率） ＝{" "}
              <span className="text-green-700">{reward}P</span>
            </p>
          </div>
        )}
      </div>
        <p className="text-xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-8">
          ここで終了すれば{" "}
          <span className="text-green-600">{reward}P</span>！
        </p>

        {hasNext ? (
          <p className="text-md md:text-2xl font-bold text-gray-700 mb-10 whitespace-pre-line">
            次のチャレンジは <span className="text-red-500">{nextNeed}問連続正解</span>で成功！{"\n"}
            成功すると報酬が2〜3倍のどれかにアップ！{"\n"}
            ただし失敗したら <span className="text-orange-600">{failReward}P</span> に下がるよ。
          </p>
        ) : (
          <p className="relative mx-auto inline-block mb-10 px-8 py-6 md:px-12 md:py-8 text-2xl md:text-4xl font-extrabold text-white text-center rounded-3xl shadow-2xl bg-gradient-to-r from-pink-400 via-yellow-400 to-green-400 animate-pulse">
            🎊全てのチャレンジに成功！<br />
            <span className="text-3xl md:text-5xl drop-shadow">
              おめでとう！✨
            </span>
          </p>
        )}

        <div className="flex flex-col md:flex-row justify-center gap-4">
          {hasNext && (
            <button
              onClick={goNextChallenge}
              className="px-6 py-4 bg-blue-500 text-white text-xl md:text-2xl font-bold rounded-xl shadow hover:bg-blue-600"
            >
              次のチャレンジをする！
            </button>
          )}

          <button
            onClick={takeRewardAndFinish}
            className="px-6 py-4 bg-yellow-500 text-white text-xl md:text-2xl font-bold rounded-xl shadow hover:bg-yellow-600"
          >
            終了して報酬を受け取る
          </button>
        </div>
      </div>
    );
  }

  if (phase === "baseRoulette") {
    const isStarted = baseRolling || baseLocked != null;

    return (
      <div className="container mx-auto p-8 text-center bg-gradient-to-b from-green-200 via-green-100 to-green-200">
        <p className="text-4xl md:text-6xl font-extrabold text-orange-500 drop-shadow mb-4">
          最初のチャレンジ成功！✨
        </p>

        <p className="text-lg md:text-2xl font-bold text-gray-700 mb-6">
          ルーレットを回して報酬を決めよう！
        </p>

        {/* ✅ まだ開始してないとき：開始ボタン */}
        {!isStarted && (
          <button
            onClick={startBaseRoulette}
            className="px-8 py-4 bg-blue-500 text-white text-2xl md:text-3xl font-extrabold rounded-full border-2 border-black shadow-lg hover:bg-blue-600 hover:scale-105 transition"
          >
            ルーレットを回す
          </button>
        )}

        {/* ✅ 開始後：ルーレット本体 */}
        {isStarted && (
          <div className="mx-auto max-w-[520px] mt-6">
            <button
              onClick={() => {
                // 回転中だけ止められる
                if (baseLocked == null) lockBase();
              }}
              className={[
                "w-full rounded-3xl border-2 border-black shadow-xl px-6 py-8",
                "bg-gradient-to-r from-yellow-200 via-white to-yellow-100",
                "hover:scale-[1.02] active:scale-[0.98] transition",
              ].join(" ")}
            >
              <div className="text-sm md:text-lg font-bold text-gray-700">
                {baseLocked == null ? "👆 タップでストップ！（止めてね）" : "✅ これに決定！"}
              </div>

              <div className="mt-3 text-6xl md:text-8xl font-extrabold text-gray-900 drop-shadow">
                {baseLocked ?? baseCandidate}P
              </div>
            </button>

            {baseLocked != null && (
              <button
                onClick={applyBaseAndGoBetween}
                className="mt-6 px-8 py-4 bg-blue-500 text-white text-2xl md:text-3xl font-extrabold rounded-full border-2 border-black shadow-lg hover:bg-blue-600 hover:scale-105 transition"
              >
                OK！
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (phase === "rouletteIntro") {
    return (
      <div className="container mx-auto p-8 text-center bg-gradient-to-b from-green-200 via-green-100 to-green-200">
        <p className="text-4xl md:text-6xl font-extrabold text-orange-500 drop-shadow mb-4">
          チャレンジ成功！✨
        </p>

        <p className="text-lg md:text-2xl font-bold text-gray-700 mb-6">
          ルーレットを回して倍率を決めよう！
        </p>

        <button
          onClick={() => {
            setMulLocked(null);   // 念のため
            setPhase("roulette"); // ✅ ここで初めて回転開始（今の useEffect が回す）
          }}
          className="px-8 py-4 bg-blue-500 text-white text-2xl md:text-3xl font-extrabold rounded-full border-2 border-black shadow-lg hover:bg-blue-600 hover:scale-105 transition"
        >
          ルーレットを回す
        </button>
      </div>
    );
  }

  // =========================
  // roulette 画面（倍率を決める）
  // =========================
  if (phase === "roulette") {
    return (
      <div className="container mx-auto p-8 text-center bg-gradient-to-b from-green-200 via-green-100 to-green-200">
        <p className="text-3xl md:text-5xl font-extrabold text-gray-800 mb-4">
          報酬倍率ルーレット！🎰
        </p>

        <p className="text-lg md:text-2xl font-bold text-gray-700 mb-6">
          タップで倍率を決定しよう！
        </p>

        <div className="mx-auto max-w-[520px]">
          <button
            onClick={() => {
              if (mulLocked == null) lockMul(); // まず確定
            }}
            className={[
              "w-full rounded-3xl border-2 border-black shadow-xl px-6 py-8",
              "bg-gradient-to-r from-pink-300 via-yellow-200 to-green-200",
              "hover:scale-[1.02] active:scale-[0.98] transition",
            ].join(" ")}
          >
            <div className="text-sm md:text-lg font-bold text-gray-700">
              {mulLocked == null ? "👆 タップで決定！（止めてね）" : "✅ これに決定！"}
            </div>

            <div className="mt-3 text-6xl md:text-8xl font-extrabold text-gray-900 drop-shadow">
              ×{mulLocked ?? mulCandidate}
            </div>

            {/* {mulLocked == null && (
              <div className="mt-3 text-xs md:text-sm text-gray-600">2〜4のどれか！</div>
            )} */}
          </button>

          {mulLocked != null && (
            <button
              onClick={startNextChallengeFromRoulette}
              className="mt-6 px-8 py-4 bg-blue-500 text-white text-2xl md:text-3xl font-extrabold rounded-full border-2 border-black shadow-lg hover:bg-blue-600 hover:scale-105 transition"
            >
              OK！
            </button>
          )}
        </div>
      </div>
    );
  }

  const need = CHALLENGE_TARGETS[challengeIndex];
  const remaining = Math.max(0, need - streakInChallenge);
  const label =
    challengeIndex === 4 ? "最終チャレンジ" : `${challengeIndex + 1}回目のチャレンジ`;

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-green-50 via-green-100 to-green-200">
      {phase !== "finished" ? (
        <>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 md:mb-8 text-orange-500 drop-shadow-lg">
            {label}
          </h2>

          <p className="text-xl md:text-2xl font-bold text-gray-700 mb-4">
            達成まであと <span className="text-red-600">{remaining}</span> 問
          </p>

          {!incorrectMessage && (
            <p className="text-2xl md:text-3xl font-bold mb-4 text-red-500">
              回答タイマー: {timeLeft} 秒
            </p>
          )}

          {questions[currentIndex].quiz && (
            <>
              {(showCorrectMessage || incorrectMessage) && (
                <>
                  {showCorrectMessage && (
                    <p className="text-4xl md:text-6xl font-extrabold mb-2 text-green-600 drop-shadow-lg animate-bounce animate-pulse">
                      ◎正解！🎉
                    </p>
                  )}
                  {incorrectMessage && (
                    <p className="text-3xl md:text-4xl font-extrabold mb-2 text-red-500 drop-shadow-lg animate-shake whitespace-pre-line">
                      {incorrectMessage}
                    </p>
                  )}

                  {(() => {
                    const currentQuiz = questions[currentIndex].quiz;
                    const answerExplanation = currentQuiz?.answerExplanation;
                    const trivia = currentQuiz?.trivia;

                    return (
                      <>
                        {answerExplanation && (
                          <div className="mt-5 md:mt-15 text-center">
                            <p className="text-xl md:text-2xl font-bold text-blue-600">解説📖</p>
                            <p className="mt-1 md:mt-2 text-lg md:text-xl text-gray-700">
                              {answerExplanation}
                            </p>
                          </div>
                        )}

                        {trivia && (
                          <div className="mt-5 md:mt-10 text-center">
                            <p className="text-xl md:text-2xl font-bold text-yellow-600">知って得する豆知識💡</p>
                            <p className="mt-1 md:mt-2 text-lg md:text-xl text-gray-700">{trivia}</p>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div className="mt-10">
                    {showCorrectMessage && (
                      <button
                        className="px-5 py-3 md:px-6 md:py-3 bg-blue-500 text-white text-lg md:text-xl font-medium rounded hover:bg-blue-600 cursor-pointer"
                        onClick={nextQuestion}
                      >
                        次の問題へ
                      </button>
                    )}
                    {incorrectMessage && (
                      <button
                        className="px-5 py-3 md:px-6 md:py-3 bg-blue-500 text-white text-lg md:text-xl font-medium rounded hover:bg-blue-600 cursor-pointer"
                        onClick={finishQuiz}
                      >
                        終了する
                      </button>
                    )}
                  </div>
                </>
              )}

              {!showCorrectMessage && !incorrectMessage && (
                <>
                  <QuizQuestion
                    quiz={questions[currentIndex].quiz}
                    userAnswer={userAnswer}
                    setUserAnswer={setUserAnswer}
                  />
                  <button
                    className="px-5 py-3 md:px-6 md:py-3 bg-blue-500 text-white text-lg md:text-xl font-medium rounded mt-4 hover:bg-blue-600 cursor-pointer font-extrabold"
                    onClick={checkAnswer}
                    disabled={userAnswer === null}
                  >
                    回答
                  </button>
                </>
              )}
            </>
          )}

          {flashMilestone && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 text-yellow-400 text-5xl md:text-7xl font-extrabold animate-pulse">
              {flashMilestone}
            </div>
          )}
        </>
      ) : (
        <QuizResult
          correctCount={correctCount}
          earnedPoints={earnedPoints}
          earnedExp={earnedExp}
          isLoggedIn={!!user}
          awardStatus={awardStatus}
          titles={[]}
          onGoLogin={() => router.push("/user/login")}
          onShareX={handleShareX}
          onRetry={resetGame}
        />
      )}
    </div>
  );
}
