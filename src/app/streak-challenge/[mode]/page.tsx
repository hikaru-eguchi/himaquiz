"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { submitGameResult, calcTitle } from "@/lib/gameResults";
import { buildResultModalPayload } from "@/lib/resultMessages";
import { useResultModal } from "../../components/ResultModalProvider";
import { getWeekStartJST } from "@/lib/week";
import { getMonthStartJST } from "@/lib/month";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import StreakRankingTop10 from "../../components/StreakRankingTop10";
import { Top3CommentModal } from "../../components/Top3CommentModal";
import { motion } from "framer-motion";
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

/**
 * 3問ごとにUP（5点）
 * 1〜3問目: 5P
 * 4〜6問目: 10P
 * 7〜9問目: 15P
 * 10〜12問目: 20P ...
 */
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

// 正解数に応じて出すコメント
const rankComments = [
  { threshold: 0, comment: "これからが始まり！まずは肩慣らしだね！" },
  { threshold: 3, comment: "優等生デビュー！いいスタートだ、頭のキレが光ってる！" },
  { threshold: 5, comment: "異端児級の発想力！普通じゃない才能が見えてきたぞ…！" },
  { threshold: 8, comment: "賢者レベル到達！知識の風が君の味方をしている！" },
  { threshold: 10, comment: "博識者の風格！どんな問題も冷静に捌いていく姿が見える！" },
  { threshold: 13, comment: "クイズ研究家並みの洞察力！その分析力はガチで本物！" },
  { threshold: 15, comment: "クイズ学者級！知識量がもう一般人のそれじゃない…！" },
  { threshold: 18, comment: "クイズ教授の域に到達！説明したら講義が開けるレベルだ！" },
  { threshold: 20, comment: "クイズ名人の実力！どんなクイズも楽しんで倒していく強さがある！" },
  { threshold: 23, comment: "クイズ達人の風格！読みも早い、ひらめきも鋭い！完璧か！" },
  { threshold: 25, comment: "クイズ仙人級！悟りを開き、問題の未来すら見えている…？" },
  { threshold: 28, comment: "クイズ星人！地球の常識を超えた動きだ…異次元！" },
  { threshold: 30, comment: "知識マスター認定！君の脳内には百科事典が入ってるだろ！？" },
  { threshold: 33, comment: "天才クイズプレイヤー！天才と言うより天災級の強さ！" },
  { threshold: 35, comment: "脳内図書館レベル！その頭の中、何階建てなんだ！？" },
  { threshold: 38, comment: "クイズマシーン化！もはや動きが機械的に正確すぎる！" },
  { threshold: 40, comment: "問題バスター！問題が君に立ち向かっては消えていく…！" },
  { threshold: 43, comment: "答えの支配者！答えの方から君に寄ってきてる感じすらある！" },
  { threshold: 45, comment: "クイズモンスター降臨！解答速度も正確さも怪物級！" },
  { threshold: 48, comment: "答えの錬金術師！知識を組み合わせて正解を生み出す様は芸術！" },
  { threshold: 50, comment: "ひらめきの妖精！君の頭の中、ずっと光ってるだろ！" },
  { threshold: 53, comment: "クイズ帝王の貫禄！問題たちがひれ伏すレベルの威圧感！" },
  { threshold: 55, comment: "問題ハンター！問題を次々狩っていく爽快な強さだ！" },
  { threshold: 58, comment: "記憶の魔術師！どんな知識も自由自在に操る魔法級の頭脳！" },
  { threshold: 60, comment: "IQ200超えの賢者！ついに常識を突破した…！" },
  { threshold: 65, comment: "クイズ鬼人！もう人間の枠を外れた強さだ…！" },
  { threshold: 70, comment: "クイズ竜王！燃えるような知識の炎がほとばしっている！" },
  { threshold: 75, comment: "クイズ魔人！正解を食らい尽くす圧倒的存在感！" },
  { threshold: 80, comment: "クイズ覇王！すべてを見通したかのような絶対的支配力だ！" },
  { threshold: 85, comment: "オリンポスの支配者級！知識の神々が君を迎え入れたぞ…！" },
  { threshold: 90, comment: "レジェンドクイズマスター！伝説の名の通り、後世に語り継がれる強さ！" },
  { threshold: 95, comment: "究極クイズマスター！到達者ほぼゼロの究極領域！" },
  { threshold: 100, comment: "神（ゴッド）…！凄すぎて何も言えないよ！最高ランクに到達だ！" },
];

type AwardStatus = "idle" | "awarding" | "awarded" | "need_login" | "error";

type StreakRankRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  best_streak: number;
};

const QuizResult = ({
  correctCount,
  earnedPoints,
  earnedExp,
  isLoggedIn,
  awardStatus,
  getTitle,
  titles,
  onGoLogin,
  onShareX,
  onRetry,
  streakTop10,
  rankLoading,
  topPercent,
  percentLoading,
}: {
  correctCount: number;
  earnedPoints: number;
  earnedExp: number;
  isLoggedIn: boolean;
  awardStatus: AwardStatus;
  getTitle: () => string;
  titles: { threshold: number; title: string }[];
  onGoLogin: () => void;
  onShareX: () => void;
  onRetry: () => void;
  streakTop10: { user_id: string; username: string | null; avatar_url: string | null; best_streak: number }[];
  rankLoading: boolean;
  topPercent: number | null;
  percentLoading: boolean;
}) => {
  const [showScore, setShowScore] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const getRankComment = () => {
    let comment = "";
    rankComments.forEach((r) => {
      if (correctCount >= r.threshold) comment = r.comment;
    });
    return comment;
  };

  const formatTopPercent = (p: number) => {
    // 上位1%未満だけ小数1桁、それ以外は整数
    return p < 1 ? p.toFixed(1) : String(Math.round(p));
  };

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowScore(true), 500));
    timers.push(setTimeout(() => setShowText(true), 1000));
    timers.push(setTimeout(() => setShowRank(true), 1500));
    timers.push(setTimeout(() => setShowButton(true), 1500));
    return () => timers.forEach(clearTimeout);
  }, []);

  const showLoginUI = !isLoggedIn && awardStatus === "need_login";

  return (
    <div className="text-center mt-6">
      {showScore && (
        <p className="text-3xl md:text-5xl mb-4 md:mb-6">連続正解数： {correctCount}問</p>
      )}

      {showRank && (
        <div className="mx-auto max-w-[520px] my-10">
          {percentLoading ? (
            <p className="text-lg md:text-xl font-extrabold text-gray-700">
              上位％を計算中...
            </p>
          ) : topPercent !== null ? (
            <p className="text-xl md:text-3xl font-extrabold text-gray-900">
              あなたのスコアは{" "}
              <span className="text-red-600">上位{formatTopPercent(topPercent)}%</span>！
            </p>
          ) : (
            <p className="text-sm md:text-base font-bold text-gray-600">
              ※上位％の取得に失敗しました
            </p>
          )}
        </div>
      )}

      {showText && (
        <p className="text-xl md:text-2xl text-gray-600 mb-2 mt-6">あなたの称号は…</p>
      )}

      {showRank && (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center mb-10 gap-4 md:gap-10">
            <img src="/images/quiz.png" alt="クイズ" className="w-0 h-0 md:w-36 md:h-55 ml-15" />
            <p className="text-4xl md:text-6xl font-bold text-blue-600 drop-shadow-lg text-center animate-pulse">
              {getTitle()}
            </p>
            <div className="flex flex-row md:flex-row items-center justify-center gap-8">
              <img src="/images/quiz.png" alt="クイズ" className="w-20 h-30 md:w-0 md:h-0" />
              <img src="/images/quiz_woman.png" alt="クイズ" className="w-20 h-30 md:w-36 md:h-55" />
            </div>
          </div>

          {getRankComment() && (
            <p className="text-lg md:text-2xl text-gray-800 mb-8 font-bold whitespace-pre-line">
              {getRankComment()}
            </p>
          )}
        </>
      )}

      {/* ★ 獲得ポイント表示（ログイン有無で文言変更） */}
      {showRank && (
        <div className="mx-auto max-w-[520px] bg-white border-2 border-black rounded-xl p-4 shadow mt-2">
          <p className="text-xl md:text-2xl font-extrabold text-gray-800">
            今回の獲得ポイント： <span className="text-green-600">{earnedPoints} P</span>
          </p>
          <p className="text-xl md:text-2xl font-extrabold text-gray-800 mt-2">
            今回の獲得経験値： <span className="text-purple-600">{earnedExp} EXP</span>
          </p>

          {showLoginUI ? (
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
          ) : (
            <>
              {awardStatus === "awarding" && (
                <p className="text-md md:text-xl text-gray-600 mt-2">ポイント反映中...</p>
              )}
              {awardStatus === "awarded" && (
                <p className="text-md md:text-xl text-green-700 font-bold mt-2">✅ ポイントを加算しました！</p>
              )}
              {awardStatus === "error" && (
                <p className="text-md md:text-xl text-red-600 font-bold mt-2">
                  ❌ ポイント加算に失敗しました。時間をおいて再度お試しください。
                </p>
              )}
            </>
          )}
        </div>
      )}

      {showButton && (
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <button
              className="px-6 py-3 bg-black text-white border border-black rounded-lg font-bold text-xl hover:opacity-80 cursor-pointer"
              onClick={onShareX}
            >
              Xで結果をシェア
            </button>

            <button
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold text-xl hover:bg-green-600 cursor-pointer"
              onClick={onRetry}
            >
              もう一回挑戦する
            </button>
          </div>
        </div>
      )}

      {showButton && (
        <div className="mt-6">
          {!isLoggedIn && (
            <p className="mx-auto max-w-[720px] text-sm md:text-base font-bold text-gray-700 mb-2">
              ※ログイン（無料）すると、あなたの最高記録もランキングに反映されます！
            </p>
          )}

          {rankLoading ? (
            <p className="text-gray-600 font-bold">ランキング読み込み中...</p>
          ) : (
            <StreakRankingTop10 rows={streakTop10} />
          )}

          <RecommendedSoloGames
            title="次はどれで遊ぶ？🎮"
            count={4}
            excludeHref="/streak-challenge" // 今のページを出したくないなら
          />
        </div>
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

  const { user, loading: userLoading, supabase } = useSupabaseUser();

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [flashMilestone, setFlashMilestone] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);

    // ✅ 出題開始ゲート（カウントダウンが終わるまで問題＆タイマーを止める）
  const [ready, setReady] = useState(false);

  // ✅ 3,2,1,START! 表示用（null=非表示, 3..0=表示）
  const [countdown, setCountdown] = useState<number | null>(3);

  // ★ リザルト用：獲得ポイントと付与状態
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");
  const awardedOnceRef = useRef(false); // 二重加算防止
  const sentRef = useRef(false); // ★ 成績/称号送信用（二重送信防止）
  const { pushModal } = useResultModal();
  const [streakTop10, setStreakTop10] = useState<StreakRankRow[]>([]);
  const [rankLoading, setRankLoading] = useState(false);

  const finishedRef = useRef(finished);
  const showCorrectRef = useRef(showCorrectMessage);
  const userIdRef = useRef<string | null>(null);

  const [myTopComment, setMyTopComment] = useState<string>(""); // 自分のコメント
  const [showTop3Modal, setShowTop3Modal] = useState(false);
  const [top3Rank, setTop3Rank] = useState<number | null>(null);

  // ✅ スキップ（最大3回）
  const MAX_SKIP = 3;
  const [skipLeft, setSkipLeft] = useState(MAX_SKIP);
  const [openSkipModal, setOpenSkipModal] = useState(false);

  const [topPercent, setTopPercent] = useState<number | null>(null);
  const [percentLoading, setPercentLoading] = useState(false);

  const ANON_KEY = "himaq_anon_id_v1";

  const getAnonId = () => {
    try {
      const existing = localStorage.getItem(ANON_KEY);
      if (existing) return existing;
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      localStorage.setItem(ANON_KEY, id);
      return id;
    } catch {
      return null;
    }
  };

  // ============================
  // ✅ 取りこぼし防止：pending key
  // ============================
  const PENDING_KEY = "streak_award_pending_v1";

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
    // 既に付与済みなら何もしない
    if (awardedOnceRef.current) return;

    const p = payload ?? loadPendingAward();
    if (!p) return;

    // 0以下は付与しない（pending も消す）
    if (p.points <= 0 && p.exp <= 0) {
      clearPendingAward();
      setAwardStatus("idle");
      return;
    }

    setAwardStatus("awarding");

    const uid = await ensureAuthedUserId();
    if (!uid) {
      // ✅ 未ログインなら “取りこぼさないよう保留”
      savePendingAward(p);
      setAwardStatus("need_login");
      return;
    }

    // ✅ ここで初めて二重加算防止フラグを立てる（未ログイン時に立てない）
    awardedOnceRef.current = true;

    try {
      const { data, error } = await supabase.rpc("add_points_and_exp", {
        p_user_id: uid,
        p_points: p.points,
        p_exp: p.exp,
      });

      if (error) {
        console.error("add_points_and_exp error:", error);
        // 失敗時は pending を残す（取りこぼし防止）
        savePendingAward(p);
        awardedOnceRef.current = false; // リトライできるよう戻す
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
            p_user_id: uid,
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

      await supabase.from("user_point_logs").insert({
        user_id: uid,
        change: p.points,
        reason: `連続正解チャレンジでポイント獲得（連続正解数 ${p.correctCount}問）`,
      });

      await supabase.from("user_exp_logs").insert({
        user_id: uid,
        change: p.exp,
        reason: `連続正解チャレンジでEXP獲得（連続正解数 ${p.correctCount}問）`,
      });

      // ✅ 成功したら pending を消す
      clearPendingAward();
      setAwardStatus("awarded");
    } catch (e) {
      console.error("award points/exp error:", e);
      savePendingAward(p);
      awardedOnceRef.current = false;
      setAwardStatus("error");
    }
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

  const shuffleArray = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const resetGame = () => {
    // 進行リセット
    setCurrentIndex(0);
    setUserAnswer(null);
    setCorrectCount(0);
    setFinished(false);

    // 表示/演出リセット
    setShowCorrectMessage(false);
    setFlashMilestone(null);
    setIncorrectMessage(null);
    setSkipLeft(MAX_SKIP);
    setOpenSkipModal(false);

    // タイマーリセット（各問30秒）
    setTimeLeft(30);
    setReady(false);
    setCountdown(3);

    // リザルト関連リセット
    setEarnedPoints(0);
    setEarnedExp(0);
    setAwardStatus("idle");
    awardedOnceRef.current = false;
    sentRef.current = false;

    // ref も同期（あなたのタイマー制御が ref を見てるので重要）
    finishedRef.current = false;
    showCorrectRef.current = false;

    // ✅ 次プレイに持ち越さない（任意：残したいなら消さなくてOK）
    clearPendingAward();

    // 問題順もシャッフルし直す（任意だけどおすすめ）
    setQuestions((prev) => shuffleArray(prev));
  };

  useEffect(() => {
    // finished中はやらない
    if (finished) return;

    // 問題がまだないなら待つ
    if (questions.length === 0) return;

    // 既にreadyなら何もしない
    if (ready) return;

    // countdownを3から開始
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;

        if (prev === 1) {
          clearInterval(interval);

          // START! を一瞬見せてから開始
          setTimeout(() => {
            setCountdown(null);
            setReady(true); // ✅ ここで出題解禁
          }, 800);

          return 0; // 0 を START! 表示に使う
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [questions.length, finished, ready]);

  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);

  useEffect(() => {
    showCorrectRef.current = showCorrectMessage;
  }, [showCorrectMessage]);

  useEffect(() => {
    if (user?.id) userIdRef.current = user.id;
  }, [user]);

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

  useEffect(() => {
    if (!ready) return;
    if (finished) return;
    if (showCorrectMessage) return;

    const timer = setInterval(() => {
      if (finishedRef.current || showCorrectRef.current) return;
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, finished, showCorrectMessage, ready]);

  const checkAnswer = () => {
    const correctAnswer = questions[currentIndex].quiz?.answer;
    const displayAnswer = questions[currentIndex].quiz?.displayAnswer;

    if (userAnswer === correctAnswer) {
      setCorrectCount((c) => {
        const newCount = c + 1;

        if (newCount % 10 === 0) {
          setFlashMilestone(`${newCount}問突破！`);
          setTimeout(() => setFlashMilestone(null), 1000);
        }

        return newCount;
      });

      setShowCorrectMessage(true);
    } else {
      setIncorrectMessage(`ざんねん！\n答えは" ${displayAnswer} "でした！`);
    }

    setUserAnswer(null);
  };

  const nextQuestion = () => {
    setShowCorrectMessage(false);

    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(30);
    }
  };

  const doSkip = () => {
    if (skipLeft <= 0) return;

    // 残り回数を減らす
    setSkipLeft((v) => Math.max(0, v - 1));

    // 表示状態リセット
    setShowCorrectMessage(false);
    setIncorrectMessage(null);
    setUserAnswer(null);

    // ✅ 「第◯問」はそのまま、問題だけ差し替える
    setQuestions((prev) => {
      if (prev.length <= 1) return prev;

      // 現在の問題を避けてランダムに1つ選ぶ（なるべく被りを防ぐ）
      const pool = prev.filter((_, i) => i !== currentIndex);
      const pick = pool[Math.floor(Math.random() * pool.length)];

      // currentIndex の位置だけ差し替え
      const next = [...prev];
      next[currentIndex] = pick;
      return next;
    });

    // ✅ タイマーはリセットしたいなら戻す（不要なら消してOK）
    setTimeLeft(30);

    setOpenSkipModal(false);
  };

  const finishQuiz = () => {
    setFinished(true);
  };

  const getTitle = () => {
    let title = "クイズ初心者";
    titles.forEach((t) => {
      if (correctCount >= t.threshold) title = t.title;
    });
    return title;
  };

  // ============================
  // ✅ 取りこぼし防止：マウント時に pending を拾う
  // ============================
  useEffect(() => {
    (async () => {
      const pending = loadPendingAward();
      if (!pending) return;
      await awardPointsAndExp(pending);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================
  // ✅ finished 時：計算 → pending 保存 → 付与を試す
  // ============================
  useEffect(() => {
    if (!finished) return;
    if (userLoading) return;

    const points = calcQuizEarnedPoints(correctCount);
    const exp = calcEarnedExp(correctCount);

    setEarnedPoints(points);
    setEarnedExp(exp);

    // ✅ finished になったら必ず “保留” を作る（取りこぼしゼロ）
    savePendingAward({ correctCount, points, exp });

    // ✅ そのまま付与を試す（ログインできてれば即付与、できなければ need_login）
    awardPointsAndExp({ correctCount, points, exp });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, correctCount, userLoading]);

  // ============================
  // ✅ タブ復帰/フォーカス復帰で pending を拾って再付与
  // ============================
  useEffect(() => {
    const onVisibility = async () => {
      if (document.visibilityState !== "visible") return;

      await supabase.auth.refreshSession();

      if (finishedRef.current && !awardedOnceRef.current) {
        await awardPointsAndExp();
      }
    };

    const onFocus = async () => {
      await supabase.auth.refreshSession();

      if (finishedRef.current && !awardedOnceRef.current) {
        await awardPointsAndExp();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStreakRanking = async () => {
    setRankLoading(true);
    try {
      const res = await fetch("/api/rankings/streak", { cache: "no-store" });
      const data = (await res.json()) as StreakRankRow[];
      setStreakTop10(Array.isArray(data) ? data : []);
    } catch {
      setStreakTop10([]);
    } finally {
      setRankLoading(false);
    }
  };

  useEffect(() => {
    if (!finished) return;
    fetchStreakRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  useEffect(() => {
    const onUpdated = () => {
      if (finished) fetchStreakRanking();
    };
    window.addEventListener("ranking:updated", onUpdated);
    return () => window.removeEventListener("ranking:updated", onUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  useEffect(() => {
    if (!finished) return;

    (async () => {
      setPercentLoading(true);
      try {
        const anonId = getAnonId();

        // ログインしてればuserId送る（未ログインはnull）
        const { data: u } = await supabase.auth.getUser();
        const userId = u?.user?.id ?? null;

        const res = await fetch("/api/streak/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            streak: correctCount,
            anonId,
            userId,
            mode,
            genre,
            level,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "failed");

        setTopPercent(typeof json.topPercent === "number" ? json.topPercent : null);
      } catch (e) {
        console.error("record top percent error:", e);
        setTopPercent(null);
      } finally {
        setPercentLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  useEffect(() => {
    if (!finished) return;
    if (!user?.id) return;
    if (rankLoading) return;
    if (streakTop10.length === 0) return;

    // 自分がTOP3か？
    const idx = streakTop10.slice(0, 3).findIndex((r) => r.user_id === user.id);
    if (idx === -1) return;

    const rank = idx + 1;
    setTop3Rank(rank);

    // 何度も出ないように（同じ記録で連打を防ぐ）
    const key = `top3_modal_seen_v1:${user.id}:${correctCount}`;
    if (localStorage.getItem(key) === "1") return;

    (async () => {
      // コメントを取りに行く（未設定なら null/空のはず）
      const { data, error } = await supabase
        .from("streak_top_comments")
        .select("comment")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) return;

      const comment = data?.comment ?? "";
      setMyTopComment(comment);

      // 未設定ならモーダル表示
      if (!comment) {
        setShowTop3Modal(true);
        localStorage.setItem(key, "1");
      }
    })();
  }, [finished, user?.id, streakTop10, rankLoading, correctCount, supabase]);

  // ★ 連続正解チャレンジ：成績(最高連続正解数)＆称号を保存 → 新記録/新称号ならモーダル
  useEffect(() => {
    if (!finished) return;
    if (sentRef.current) return;
    sentRef.current = true;

    (async () => {
      // 未ログインなら保存しない（任意）
      const { data: u, error } = await supabase.auth.getUser();
      if (error || !u.user) return;

      const uid = u.user.id;

      try {
        const weekStart = getWeekStartJST();
        const monthStart = getMonthStartJST();

        const { error: weeklyErr } = await supabase.rpc("upsert_weekly_stats", {
          p_user_id: uid,
          p_week_start: weekStart,
          p_score_add: 0,
          p_correct_add: correctCount,
          p_play_add: 1,
          p_best_streak: correctCount,
        });

        if (weeklyErr) {
          console.log("upsert_weekly_stats error:", weeklyErr);
        }

        // ✅ 月
        const { error: monthlyErr } = await supabase.rpc("upsert_monthly_stats", {
          p_user_id: uid,
          p_month_start: monthStart,
          p_score_add: 0,
          p_correct_add: correctCount,
          p_play_add: 1,
          p_best_streak: correctCount,
        });
        if (monthlyErr) console.log("upsert_monthly_stats error:", monthlyErr);

        const title = calcTitle(titles, correctCount);

        const res = await submitGameResult(supabase, {
          game: "streak",
          streak: correctCount,
          score: 0,
          stage: 0,
          title,
          writeLog: true,
        });

        const modal = buildResultModalPayload("streak", res);
        if (modal) pushModal(modal);

        const { error: bsErr } = await supabase.rpc("update_best_streak", {
          p_user_id: uid,
          p_best_streak: correctCount,
        });
        if (bsErr) console.log("update_best_streak error:", bsErr);

        // （必要ならランキング更新イベントを飛ばす）
        window.dispatchEvent(new Event("ranking:updated"));
      } catch (e) {
        console.error("[streak] submitGameResult error:", e);
      }
    })();
  }, [finished, correctCount, titles, supabase, pushModal]);

  if (questions.length === 0) return <p></p>;

  // Xシェア機能
  const handleShareX = () => {
    const text = [
      "【ひまQ｜連続正解チャレンジ🔥】",
      `連続正解数：${correctCount}問`,
      `称号：${getTitle()}`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() }); // ✅トップへ
  };

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-yellow-50 via-yellow-100 to-yellow-200">
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-white text-6xl md:text-8xl font-extrabold"
          >
            {countdown === 0 ? "START!" : countdown}
          </motion.div>
        </div>
      )}
      {/* ✅ スキップ確認モーダル */}
      {openSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-[92%] max-w-[520px] rounded-2xl bg-white border-4 border-black p-6 text-center shadow-xl">
            <p className="text-2xl md:text-3xl font-extrabold text-gray-900">
              この問題をスキップする？
            </p>

            <p className="mt-3 text-lg md:text-xl font-bold text-gray-700">
              スキップできるのはあと <span className="text-red-600">{skipLeft}</span> 回です。
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              {/* 左：やめる */}
              <button
                className="px-6 py-3 rounded-lg font-extrabold text-lg bg-gray-200 hover:bg-gray-300 border-2 border-gray-400"
                onClick={() => setOpenSkipModal(false)}
              >
                やめる
              </button>

              {/* 右：スキップ */}
              <button
                className={[
                  "px-6 py-3 rounded-lg font-extrabold text-lg border-2 border-black",
                  "bg-yellow-400 hover:bg-yellow-500",
                  skipLeft <= 0 ? "opacity-40 cursor-not-allowed" : "",
                ].join(" ")}
                onClick={doSkip}
                disabled={skipLeft <= 0}
              >
                スキップ
              </button>
            </div>
          </div>
        </div>
      )}
      {!finished ? (
        <>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-yellow-500 drop-shadow-lg">
            第 {currentIndex + 1} 問
          </h2>

          {!incorrectMessage && (
            <p className="text-2xl md:text-3xl font-bold mb-4 text-red-500">回答タイマー: {timeLeft} 秒</p>
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
                            <p className="mt-1 md:mt-2 text-lg md:text-xl text-gray-700">{answerExplanation}</p>
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
                  {!ready ? (
                    <p className="text-2xl md:text-3xl font-bold text-gray-700 mt-8">
                      準備中…
                    </p>
                  ) : (
                    <>
                      <QuizQuestion
                        quiz={questions[currentIndex].quiz}
                        userAnswer={userAnswer}
                        setUserAnswer={setUserAnswer}
                      />
                      <div className="mt-4 flex flex-col items-center gap-3">
                        <button
                          className="px-5 py-3 md:px-6 md:py-3 bg-blue-500 text-white text-lg md:text-xl font-medium rounded mt-4 hover:bg-blue-600 cursor-pointer font-extrabold"
                          onClick={checkAnswer}
                          disabled={userAnswer === null}
                        >
                          回答
                        </button>

                        {/* ✅ スキップボタン（回答の下） */}
                        <button
                          className={[
                            "mt-3 px-6 py-3 rounded-2xl font-extrabold text-lg md:text-xl",
                            "border-4 border-black",
                            "bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-100",
                            "shadow-[0_10px_0_0_rgba(0,0,0,0.18)]",
                            "hover:brightness-105 active:translate-y-[2px] active:shadow-[0_8px_0_0_rgba(0,0,0,0.18)]",
                            "transition",
                            "flex items-center justify-center gap-2",
                            skipLeft <= 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                          ].join(" ")}
                          onClick={() => setOpenSkipModal(true)}
                          disabled={skipLeft <= 0}
                        >
                          <span className="flex flex-col items-center leading-tight md:flex-row md:items-baseline md:gap-2">
                            <span className="text-lg md:text-xl">この問題をスキップ</span>
                            <span className="text-sm md:text-base font-black text-red-600">
                            （残り {skipLeft}）
                            </span>
                          </span>
                        </button>
                      </div>
                    </>
                  )}
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
        <>
          <QuizResult
            correctCount={correctCount}
            earnedPoints={earnedPoints}
            earnedExp={earnedExp}
            isLoggedIn={!!user}
            awardStatus={awardStatus}
            getTitle={getTitle}
            titles={titles}
            onGoLogin={() => router.push("/user/login")}
            onShareX={handleShareX}
            onRetry={resetGame}
            streakTop10={streakTop10}
            rankLoading={rankLoading}
            topPercent={topPercent}
            percentLoading={percentLoading}
          />

          {user?.id && top3Rank && (
            <Top3CommentModal
              open={showTop3Modal}
              rank={top3Rank}
              initialValue={myTopComment}
              userId={user.id}
              onClose={() => setShowTop3Modal(false)}
              onSaved={(c) => {
                setMyTopComment(c);
                // ついでにランキング表示も最新化したいなら
                window.dispatchEvent(new Event("ranking:updated"));
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
