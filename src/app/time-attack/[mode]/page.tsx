"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles6";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import TimeAttackRankingTop10 from "../../components/TimeAttackRankingTop10";
import RecommendedSoloGames from "@/app/components/RecommendedSoloGames";
import { submitGameResult } from "@/lib/gameResults";
import { buildResultModalPayload } from "@/lib/resultMessages";
import { useResultModal } from "@/app/components/ResultModalProvider";

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

type AwardStatus = "idle" | "awarding" | "awarded" | "need_login" | "error";

type TimeAttackRankRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  best_time: number;
};

const QUESTION_LIMIT = 5;
const MISS_LIMIT = 10;

function calcQuizEarnedPoints(correctCount: number) {
  return correctCount * 30;
}

function calcEarnedExp(correctCount: number) {
  return correctCount * 20;
}

const timeTitles = [
  { maxTime: 4, title: "伝説級ひまQ覚醒者" },
  { maxTime: 5, title: "神速のひまQマスター" },
  { maxTime: 6, title: "超高速クイズ王" },
  { maxTime: 7, title: "ひまQスピードスター" },
  { maxTime: 8, title: "閃光のクイズランナー" },
  { maxTime: 9, title: "秒速クイズ王" },
  { maxTime: 10, title: "電光石火の挑戦者" },
  { maxTime: 12, title: "超速ひらめき人間" },
  { maxTime: 14, title: "閃光のクイズ職人" },
  { maxTime: 16, title: "超反応プレイヤー" },
  { maxTime: 18, title: "集中力の達人" },
  { maxTime: 20, title: "高速クリア勢" },
  { maxTime: 25, title: "クイズブースター" },
  { maxTime: 30, title: "ひまQタイムアタッカー" },
  { maxTime: 40, title: "タイムアタック挑戦者" },
  { maxTime: Infinity, title: "のんびりクイズ勢" },
];

const timeComments = [
  { maxTime: 4, comment: "速すぎる…！もはや人間を超えてるレベル！？ランキング上位常連クラスの神タイム！" },
  { maxTime: 5, comment: "これは完全に覚醒してる…！反射速度と判断力が異常に高い！" },
  { maxTime: 6, comment: "爆速すぎる！ほぼノータイムで答えているレベル！" },
  { maxTime: 7, comment: "かなり速い！ひらめき力がかなり高いタイプ！" },
  { maxTime: 8, comment: "秒速クラスの好タイム！ランキング上位も十分狙える！" },
  { maxTime: 9, comment: "判断がかなり速い！クイズ慣れしてる感がある！" },
  { maxTime: 10, comment: "いいスピード！かなり安定して答えられている！" },
  { maxTime: 12, comment: "反応速度が高め！次は10秒切りを狙いたい！" },
  { maxTime: 14, comment: "集中力の高いナイスタイム！あと少しで上位帯！" },
  { maxTime: 16, comment: "テンポよくクリア！慣れるとさらにタイムが伸びそう！" },
  { maxTime: 18, comment: "安定感のある好タイム！次は15秒切りを目指そう！" },
  { maxTime: 20, comment: "しっかりクリア！焦らず正確に答えられている！" },
  { maxTime: 25, comment: "ナイスチャレンジ！次はもっと速く答えられるかも！" },
  { maxTime: 30, comment: "完走成功！何回か挑戦すると一気にタイム短縮できそう！" },
  { maxTime: 40, comment: "クリアおめでとう！次は自己ベスト更新に挑戦だ！" },
  { maxTime: Infinity, comment: "まずは完走成功！タイムアタックは回数を重ねるほど速くなる！" },
];

function formatTime(seconds: number) {
  return seconds.toFixed(2);
}

function getTimeTitle(time: number) {
  return timeTitles.find((t) => time <= t.maxTime)?.title ?? "タイムアタッカー";
}

function getTimeComment(time: number) {
  return timeComments.find((t) => time <= t.maxTime)?.comment ?? "";
}

function getNextTimeTitleInfo(time: number) {
  const currentIndex = timeTitles.findIndex((t) => time <= t.maxTime);

  if (currentIndex <= 0) return null;

  const next = timeTitles[currentIndex - 1];

  if (!next || next.maxTime === Infinity) return null;

  return {
    title: next.title,
    diff: time - next.maxTime,
  };
}

const QuizResult = ({
  clearTime,
  correctCount,
  noRecord,
  earnedPoints,
  earnedExp,
  isLoggedIn,
  awardStatus,
  onGoLogin,
  onShareX,
  onRetry,
  rankingRows,
  rankLoading,
}: {
  clearTime: number;
  correctCount: number;
  noRecord: boolean;
  earnedPoints: number;
  earnedExp: number;
  isLoggedIn: boolean;
  awardStatus: AwardStatus;
  onGoLogin: () => void;
  onShareX: () => void;
  onRetry: () => void;
  rankingRows: TimeAttackRankRow[];
  rankLoading: boolean;
}) => {
  const [showScore, setShowScore] = useState(false);
  const [showTitleText, setShowTitleText] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const title = noRecord ? "リベンジ挑戦者" : getTimeTitle(clearTime);
  const comment = noRecord
    ? "今回は記録なし。次こそ5問クリアを目指そう！"
    : getTimeComment(clearTime);
  const nextTitleInfo = noRecord ? null : getNextTimeTitleInfo(clearTime);
  const showLoginUI = !isLoggedIn && awardStatus === "need_login";

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowScore(true), 400));
    timers.push(setTimeout(() => setShowTitleText(true), 900));
    timers.push(setTimeout(() => setShowRank(true), 1300));
    timers.push(setTimeout(() => setShowButton(true), 1600));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="text-center mt-6">
      {showScore && (
        <div className="mx-auto mb-8 max-w-[680px] rounded-[30px] border-4 border-sky-300 bg-gradient-to-br from-cyan-50 via-white to-blue-100 px-6 py-8 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
          <p className="text-lg md:text-2xl font-extrabold text-gray-700">
            {noRecord ? "タイム記録なし" : "5問クリアタイム"}
          </p>

          <p className="mt-3 text-5xl md:text-7xl font-black text-sky-500 drop-shadow-sm">
            {noRecord ? (
              "記録なし"
            ) : (
              <>
                {formatTime(clearTime)}
                <span className="ml-2 text-2xl md:text-4xl text-gray-700">秒</span>
              </>
            )}
          </p>

          <p className="mt-4 text-base md:text-xl font-bold text-gray-700">
            正解数：{correctCount}問
          </p>
        </div>
      )}

      {showTitleText && (
        <p className="text-xl md:text-2xl text-gray-600 mb-2 mt-10">
          あなたの称号は…
        </p>
      )}

      {showRank && (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center mb-8 gap-4 md:gap-10">
            <img
              src="/images/quiz.png"
              alt="クイズ"
              className="w-0 h-0 md:w-36 md:h-55 ml-15"
            />

            <p className="text-4xl md:text-6xl font-bold text-sky-600 drop-shadow-lg text-center animate-pulse">
              {title}
            </p>

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

          {comment && (
            <p className="text-lg md:text-2xl text-gray-800 mb-8 font-bold whitespace-pre-line">
              {comment}
            </p>
          )}

          {nextTitleInfo && (
            <div className="mx-auto mb-8 max-w-[560px] rounded-3xl border-4 border-cyan-300 bg-gradient-to-br from-white via-cyan-50 to-sky-100 px-6 py-5 shadow-[0_12px_30px_rgba(14,165,233,0.18)]">
              <p className="text-base md:text-xl font-extrabold text-gray-700">
                あと
                <span className="mx-2 text-3xl md:text-5xl font-black text-sky-500">
                  {formatTime(nextTitleInfo.diff)}
                </span>
                秒で
              </p>

              <p className="mt-2 text-xl md:text-3xl font-black text-sky-700">
                「{nextTitleInfo.title}」
              </p>

              <p className="mt-3 text-sm md:text-base font-bold text-gray-600">
                ⚡ もう一回で称号アップできるかも！
              </p>
            </div>
          )}

          {/* <div className="mx-auto mb-8 max-w-[560px] rounded-3xl bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-6 py-6 shadow-[0_10px_30px_rgba(14,165,233,0.15)] border border-sky-200">
            <p className="text-center text-lg md:text-2xl font-bold text-gray-700">
              次は自己ベスト更新へ
            </p>

            <p className="mt-3 text-center text-sm md:text-base font-bold text-gray-600">
              ⚡ もう一回挑戦して、0.01秒でも速い記録を目指そう！
            </p>
          </div> */}
        </>
      )}

      {showRank && (
        <div className="mx-auto max-w-[520px] bg-white border-2 border-black rounded-xl p-4 shadow mt-2">
          <p className="text-xl md:text-2xl font-extrabold text-gray-800">
            今回の獲得ポイント：
            <span className="text-green-600"> {earnedPoints} P</span>
          </p>

          <p className="text-xl md:text-2xl font-extrabold text-gray-800 mt-2">
            今回の獲得経験値：
            <span className="text-purple-600"> {earnedExp} EXP</span>
          </p>

          {showLoginUI ? (
            <div className="mt-2">
              <p className="text-md md:text-xl text-gray-700 font-bold">
                ※未ログインのため受け取れません。ログインすると次からポイントとランキング記録を残せます！
              </p>

              <button
                onClick={onGoLogin}
                className="mt-2 px-4 py-2 bg-sky-500 text-white rounded-lg font-bold hover:bg-sky-600 cursor-pointer"
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
          )}
        </div>
      )}

      {showButton && (
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 my-10">
          <div className="flex flex-col md:flex-row gap-4">
            <button
              className="px-6 py-3 bg-black text-white border border-black rounded-lg font-bold text-xl hover:opacity-80 cursor-pointer"
              onClick={onShareX}
            >
              Xで結果をシェア
            </button>

            <button
              className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-400 text-white rounded-lg font-bold text-xl hover:from-cyan-500 hover:to-blue-500 cursor-pointer"
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
              ※ログインすると、あなたの最高タイムもランキングに反映されます！
            </p>
          )}

          {rankLoading ? (
            <p className="text-gray-600 font-bold">
              ランキング読み込み中...
            </p>
          ) : (
            <TimeAttackRankingTop10 rows={rankingRows} />
          )}

          <RecommendedSoloGames
            title="次はどれで遊ぶ？🎮"
            count={4}
            excludeHref="/time-attack"
          />
        </div>
      )}
    </div>
  );
};

export default function TimeAttackQuizPage() {
  const router = useRouter();
  const { user, loading: userLoading, supabase } = useSupabaseUser();
  const { pushModal } = useResultModal();

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [noRecord, setNoRecord] = useState(false);

  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [clearTime, setClearTime] = useState(0);

  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");

  const [rankingRows, setRankingRows] = useState<TimeAttackRankRow[]>([]);
  const [rankLoading, setRankLoading] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const awardedOnceRef = useRef(false);
  const sentRef = useRef(false);

  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);

  const shuffleArray = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const pickEasyFiveQuestions = (list: { id: string; quiz: QuizData }[]) => {
    const easyQuestions = shuffleArray(
      list.filter((q) => q.quiz.level === "かんたん")
    );

    return easyQuestions;
  };

  const finishGame = (finalTime?: number, options?: { noRecord?: boolean }) => {
    if (finishedRef.current) return;

    const now = performance.now();
    const base = startTimeRef.current ?? now;
    const time = finalTime ?? (now - base) / 1000;

    setNoRecord(options?.noRecord ?? false);
    setClearTime(options?.noRecord ? 0 : time);
    setElapsedTime(time);
    setFinished(true);
    finishedRef.current = true;
  };

  const resetGame = () => {
    setCurrentIndex(0);
    setUserAnswer(null);
    setCorrectCount(0);
    setIncorrectCount(0);
    setFinished(false);
    setNoRecord(false);
    finishedRef.current = false;

    setShowCorrectMessage(false);
    setIncorrectMessage(null);
    setFlashMessage(null);

    setElapsedTime(0);
    setClearTime(0);
    startTimeRef.current = performance.now();

    setEarnedPoints(0);
    setEarnedExp(0);
    setAwardStatus("idle");
    awardedOnceRef.current = false;
    sentRef.current = false;

    setQuestions((prev) => shuffleArray(prev));
  };

  const ensureAuthedUserId = async (): Promise<string | null> => {
    const { data: u1, error: e1 } = await supabase.auth.getUser();
    if (!e1 && u1.user) return u1.user.id;

    await supabase.auth.refreshSession();

    const { data: u2, error: e2 } = await supabase.auth.getUser();
    if (!e2 && u2.user) return u2.user.id;

    return null;
  };

  const awardPointsAndExp = async (payload: {
    correctCount: number;
    points: number;
    exp: number;
  }) => {
    if (awardedOnceRef.current) return;

    if (payload.points <= 0 && payload.exp <= 0) {
      setAwardStatus("idle");
      return;
    }

    setAwardStatus("awarding");

    const uid = await ensureAuthedUserId();

    if (!uid) {
      setAwardStatus("need_login");
      return;
    }

    awardedOnceRef.current = true;

    try {
      const { data, error } = await supabase.rpc("add_points_and_exp", {
        p_user_id: uid,
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
        new CustomEvent("profile:updated", {
          detail: { oldLevel, newLevel },
        })
      );

      if (newLevel > oldLevel) {
        try {
          const { data: r, error: rErr } = await supabase.rpc(
            "claim_levelup_rewards",
            {
              p_user_id: uid,
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

      await supabase.from("user_point_logs").insert({
        user_id: uid,
        change: payload.points,
        reason: `5問タイムアタックでポイント獲得（クリアタイム ${formatTime(clearTime)}秒）`,
      });

      await supabase.from("user_exp_logs").insert({
        user_id: uid,
        change: payload.exp,
        reason: `5問タイムアタックでEXP獲得（クリアタイム ${formatTime(clearTime)}秒）`,
      });

      setAwardStatus("awarded");
    } catch (e) {
      console.error("award points/exp error:", e);
      awardedOnceRef.current = false;
      setAwardStatus("error");
    }
  };

  const fetchTimeAttackRanking = async () => {
    setRankLoading(true);

    try {
      const res = await fetch("/api/rankings/timeattack", {
        cache: "no-store",
      });

      const data = (await res.json()) as TimeAttackRankRow[];
      setRankingRows(Array.isArray(data) ? data : []);
    } catch {
      setRankingRows([]);
    } finally {
      setRankLoading(false);
    }
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/articles6");
        const data: ArticleData[] = await res.json();

        const quizQuestions: { id: string; quiz: QuizData }[] = data
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

        setQuestions(pickEasyFiveQuestions(quizQuestions));
        startTimeRef.current = performance.now();
        setElapsedTime(0);
      } catch (error) {
        console.error("クイズ問題の取得に失敗しました:", error);
      }
    };

    fetchArticles();
  }, []);

  useEffect(() => {
    if (finished) return;
    if (questions.length === 0) return;

    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
    }

    const timer = window.setInterval(() => {
      if (finishedRef.current) return;

      const start = startTimeRef.current ?? performance.now();
      const next = (performance.now() - start) / 1000;
      setElapsedTime(next);
    }, 50);

    return () => window.clearInterval(timer);
  }, [finished, questions.length]);

  const checkAnswer = () => {
    if (!questions[currentIndex]?.quiz) return;

    const correctAnswer = questions[currentIndex].quiz.answer;
    const displayAnswer = questions[currentIndex].quiz.displayAnswer;

    if (userAnswer === correctAnswer) {
      const nextCorrectCount = correctCount + 1;

      setCorrectCount(nextCorrectCount);
      setShowCorrectMessage(true);

      if (nextCorrectCount >= QUESTION_LIMIT) {
        const now = performance.now();
        const start = startTimeRef.current ?? now;
        const finalTime = (now - start) / 1000;

        setFlashMessage("5問クリア！");
        setTimeout(() => setFlashMessage(null), 900);

        setTimeout(() => {
          finishGame(finalTime);
        }, 650);
      }
    } else {
      const nextIncorrectCount = incorrectCount + 1;
      setIncorrectCount(nextIncorrectCount);

      if (nextIncorrectCount >= MISS_LIMIT) {
        setIncorrectMessage(
          `ざんねん！\n答えは「${displayAnswer}」でした！\n不正解が${MISS_LIMIT}回になったため終了です。`
        );

        setTimeout(() => {
          finishGame(undefined, { noRecord: true });
        }, 900);
      } else {
        setIncorrectMessage(
          `ざんねん！\n答えは「${displayAnswer}」でした！\n不正解 ${nextIncorrectCount} / ${MISS_LIMIT}`
        );
      }
    }

    setUserAnswer(null);
  };

  const nextQuestion = () => {
    setShowCorrectMessage(false);
    setIncorrectMessage(null);

    if (correctCount >= QUESTION_LIMIT) {
      finishGame();
      return;
    }

    if (currentIndex + 1 >= questions.length) {
      setQuestions((prev) => shuffleArray(prev));
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex((i) => i + 1);
  };

  const finishQuiz = () => {
    finishGame();
  };

  useEffect(() => {
    if (!finished) return;
    if (userLoading) return;

    const points = calcQuizEarnedPoints(correctCount);
    const exp = calcEarnedExp(correctCount);

    setEarnedPoints(points);
    setEarnedExp(exp);

    awardPointsAndExp({ correctCount, points, exp });
    fetchTimeAttackRanking();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, correctCount, userLoading]);

  useEffect(() => {
    if (!finished) return;
    if (!user?.id) return;
    if (sentRef.current) return;
    if (noRecord) return;

    sentRef.current = true;

    (async () => {
      const { data: u, error } = await supabase.auth.getUser();
      if (error || !u.user) return;

      const uid = u.user.id;

      try {
        const title = getTimeTitle(clearTime);

        const { error: bestTimeErr } = await supabase.rpc("update_best_time", {
          p_user_id: uid,
          p_best_time: clearTime,
        });

        if (bestTimeErr) {
          console.log("update_best_time error:", bestTimeErr);
        }

        const res = await submitGameResult(supabase, {
          game: "time_attack",
          streak: correctCount,
          score: 0,
          stage: 0,
          title,
          writeLog: true,
        });

        const modal = buildResultModalPayload("time_attack", res);

        if (modal) {
          pushModal(modal);
        }

        window.dispatchEvent(new Event("ranking:updated"));
      } catch (e) {
        console.error("[time_attack] submit result error:", e);
      }
    })();
  }, [finished, user?.id, clearTime, correctCount, supabase]);

  useEffect(() => {
    const onUpdated = () => {
      if (finished) fetchTimeAttackRanking();
    };

    window.addEventListener("ranking:updated", onUpdated);
    return () => window.removeEventListener("ranking:updated", onUpdated);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (questions.length === 0) return <p></p>;

  const handleShareX = () => {
    const text = [
      "【ひまQ｜5問タイムアタック⚡】",
      noRecord
        ? "クリアタイム：記録なし"
        : `クリアタイム：${formatTime(clearTime)}秒`,
      `称号：${noRecord ? "リベンジ挑戦者" : getTimeTitle(clearTime)}`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #タイムアタック",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() });
  };

  return (
    <div className="container mx-auto p-2 md:p-8 text-center bg-gradient-to-b from-cyan-50 via-sky-100 to-blue-200">
      {!finished ? (
        <>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-sky-500 drop-shadow-lg">
            第 {currentIndex + 1} 問
          </h2>

          <div className="mx-auto mb-5 max-w-[420px] rounded-3xl border-4 border-sky-300 bg-white px-5 py-4 shadow-lg">
            <p className="text-sm md:text-base font-extrabold text-gray-500">
              クリアまでのタイム
            </p>

            <p className="mt-1 text-4xl md:text-5xl font-black text-sky-500">
              {formatTime(elapsedTime)}
              <span className="ml-1 text-xl md:text-2xl text-gray-700">秒</span>
            </p>

            <p className="mt-2 text-sm md:text-base font-bold text-gray-700">
              {correctCount} / {QUESTION_LIMIT} 問正解
            </p>
          </div>

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
                            <p className="text-xl md:text-2xl font-bold text-blue-600">
                              解説📖
                            </p>
                            <p className="mt-1 md:mt-2 text-lg md:text-xl text-gray-700">
                              {answerExplanation}
                            </p>
                          </div>
                        )}

                        {trivia && (
                          <div className="mt-5 md:mt-10 text-center">
                            <p className="text-xl md:text-2xl font-bold text-yellow-600">
                              知って得する豆知識💡
                            </p>
                            <p className="mt-1 md:mt-2 text-lg md:text-xl text-gray-700">
                              {trivia}
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div className="mt-10">
                    {showCorrectMessage && correctCount < QUESTION_LIMIT && (
                      <button
                        className="px-5 py-3 md:px-6 md:py-3 bg-sky-500 text-white text-lg md:text-xl font-bold rounded hover:bg-sky-600 cursor-pointer"
                        onClick={nextQuestion}
                      >
                        次の問題へ
                      </button>
                    )}

                    {showCorrectMessage && correctCount >= QUESTION_LIMIT && (
                      <p className="text-xl md:text-2xl font-extrabold text-sky-600 animate-pulse">
                        リザルトへ移動中...
                      </p>
                    )}

                    {incorrectMessage && incorrectCount < MISS_LIMIT && (
                      <button
                        className="px-5 py-3 md:px-6 md:py-3 bg-sky-500 text-white text-lg md:text-xl font-bold rounded hover:bg-sky-600 cursor-pointer"
                        onClick={nextQuestion}
                      >
                        次の問題へ
                      </button>
                    )}

                    {incorrectMessage && incorrectCount >= MISS_LIMIT && (
                      <p className="text-xl md:text-2xl font-extrabold text-red-600 animate-pulse">
                        リザルトへ移動中...
                      </p>
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

                  <div className="mt-4 flex flex-col items-center gap-3">
                    <button
                      className="px-5 py-3 md:px-6 md:py-3 bg-gradient-to-r from-cyan-400 to-blue-400 text-white text-lg md:text-xl rounded mt-4 hover:from-cyan-500 hover:to-blue-500 cursor-pointer font-extrabold border-2 border-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={checkAnswer}
                      disabled={userAnswer === null}
                    >
                      回答
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {flashMessage && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 text-cyan-300 text-5xl md:text-7xl font-extrabold animate-pulse">
              {flashMessage}
            </div>
          )}
        </>
      ) : (
        <QuizResult
          clearTime={clearTime}
          correctCount={correctCount}
          noRecord={noRecord}
          earnedPoints={earnedPoints}
          earnedExp={earnedExp}
          isLoggedIn={!!user}
          awardStatus={awardStatus}
          onGoLogin={() => router.push("/user/login")}
          onShareX={handleShareX}
          onRetry={resetGame}
          rankingRows={rankingRows}
          rankLoading={rankLoading}
        />
      )}
    </div>
  );
}