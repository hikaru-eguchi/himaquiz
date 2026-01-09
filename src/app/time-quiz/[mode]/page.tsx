"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { submitGameResult, calcTitle } from "@/lib/gameResults";
import { buildResultModalPayload } from "@/lib/resultMessages";
import { useResultModal } from "../../components/ResultModalProvider";

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
 * ★ 付与ポイント仕様（変更）
 * score の 5分の1 を獲得ポイントとして付与する
 */
function calcEarnedPointsFromScore(score: number) {
  return Math.floor(score / 5);
}

// 正解数に応じて出すコメント
const rankComments = [
  { threshold: 0, comment: "これからが始まり！まずは肩慣らしだね！" },
  { threshold: 300, comment: "優等生デビュー！いいスタートだ、頭のキレが光ってる！" },
  { threshold: 500, comment: "異端児級の発想力！普通じゃない才能が見えてきたぞ…！" },
  { threshold: 800, comment: "賢者レベル到達！知識の風が君の味方をしている！" },
  { threshold: 1000, comment: "博識者の風格！どんな問題も冷静に捌いていく姿が見える！" },
  { threshold: 1300, comment: "クイズ研究家並みの洞察力！その分析力はガチで本物！" },
  { threshold: 1500, comment: "クイズ学者級の知識量！もう一般人のそれじゃない…！" },
  { threshold: 1800, comment: "クイズ教授の域に到達！説明したら講義が開けるレベルだ！" },
  { threshold: 2000, comment: "クイズ名人の実力！どんなクイズも楽しんで倒していく強さ！" },
  { threshold: 2300, comment: "クイズ達人の風格！読みも早い、ひらめきも鋭い！完璧か！" },
  { threshold: 2500, comment: "クイズ仙人級！悟りを開き、問題の未来すら見えている…？" },
  { threshold: 2800, comment: "クイズ星人！地球の常識を超えた動きだ…異次元！" },
  { threshold: 3000, comment: "知識マスター認定！君の脳内には百科事典が入ってるだろ！？" },
  { threshold: 3300, comment: "天才クイズプレイヤー！天才と言うより天災級の強さ！" },
  { threshold: 3500, comment: "脳内図書館レベル！その頭の中、何階建てなんだ！？" },
  { threshold: 3800, comment: "クイズマシーン化！もはや動きが機械的に正確すぎる！" },
  { threshold: 4000, comment: "問題バスター！問題が君に立ち向かっては消えていく…！" },
  { threshold: 4300, comment: "答えの支配者！答えの方から君に寄ってきてる感じすらある！" },
  { threshold: 4500, comment: "クイズモンスター降臨！解答速度も正確さも怪物級！" },
  { threshold: 4800, comment: "答えの錬金術師！知識を組み合わせて正解を生み出す様は芸術！" },
  { threshold: 5000, comment: "ひらめきの妖精！君の頭の中、ずっと光ってるだろ！" },
  { threshold: 5300, comment: "クイズ帝王の貫禄！問題たちがひれ伏すレベルの威圧感！" },
  { threshold: 5500, comment: "問題ハンター！問題を次々狩っていく爽快な強さだ！" },
  { threshold: 5800, comment: "記憶の魔術師！どんな知識も自由自在に操る魔法級の頭脳！" },
  { threshold: 6000, comment: "IQ200超えの賢者！ついに常識を突破した…！" },
  { threshold: 6500, comment: "クイズ鬼人！もう人間の枠を外れた強さだ…！" },
  { threshold: 7000, comment: "クイズ竜王！燃えるような知識の炎がほとばしっている！" },
  { threshold: 7500, comment: "クイズ魔人！正解を食らい尽くす圧倒的存在感！" },
  { threshold: 8000, comment: "クイズ覇王！すべてを見通したかのような絶対的支配力だ！" },
  { threshold: 8500, comment: "オリンポスの支配者級！知識の神々が君を迎え入れたぞ…！" },
  { threshold: 9000, comment: "レジェンドクイズマスター！伝説の名の通り、語り継がれる強さ！" },
  { threshold: 9500, comment: "究極クイズマスター！到達者ほぼゼロの究極領域！" },
  { threshold: 10000, comment: "神（ゴッド）…！凄すぎて何も言えないよ！最高ランクだ！" },
];

type AwardStatus = "idle" | "awarding" | "awarded" | "need_login" | "error";

const QuizResult = ({
  correctCount,
  getTitle,
  titles,
  score,
  earnedPoints,
  isLoggedIn,
  awardStatus,
  onGoLogin,
  earnedExp,
}: {
  correctCount: number;
  getTitle: () => string;
  titles: { threshold: number; title: string }[];
  score: number;

  earnedPoints: number;
  isLoggedIn: boolean;
  awardStatus: AwardStatus;
  onGoLogin: () => void;
  earnedExp: number;
}) => {
  const [showScore, setShowScore] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const getRankComment = () => {
    let comment = "";
    rankComments.forEach((r) => {
      if (score >= r.threshold) comment = r.comment;
    });
    return comment;
  };

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowScore(true), 500));
    timers.push(setTimeout(() => setShowText(true), 1000));
    timers.push(setTimeout(() => setShowRank(true), 1500));
    timers.push(setTimeout(() => setShowButton(true), 1500));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="text-center mt-6">
      {showScore && (
        <>
          <p className="text-3xl md:text-5xl mb-4 md:mb-6">正解数： {correctCount}問</p>
          <p className="text-3xl md:text-5xl mb-4 md:mb-6 text-blue-500 font-bold">得点：{score} P</p>
        </>
      )}

      {showText && <p className="text-xl md:text-2xl text-gray-600 mb-2">あなたの称号は…</p>}

      {showRank && (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center mb-10 gap-4 md:gap-10">
            <img src="/images/quiz.png" alt="クイズ" className="w-0 h-0 md:w-36 md:h-55 ml-15" />
            <p className="text-4xl md:text-6xl font-bold text-blue-600 drop-shadow-lg text-center animate-pulse">
              {getTitle()}
            </p>
            <div className="flex flex-row md:flex-row items-center justify-center gap-8">
              <img src="/images/quiz.png" alt="クイズ" className="w-20 h-30 md:w-0 md:h-0" />
              <img src="/images/quiz_woman.png" alt="クイズ" className="w-22 h-25 md:w-38 md:h-40" />
            </div>
          </div>

          {getRankComment() && (
            <p className="text-lg md:text-2xl text-gray-800 mb-8 font-bold whitespace-pre-line">{getRankComment()}</p>
          )}

          {/* ★ 獲得ポイント表示（ログイン有無で文言変更） */}
          <div className="mx-auto max-w-[520px] bg-white border-2 border-black rounded-xl p-4 shadow mt-2">
            <p className="text-xl md:text-2xl font-extrabold text-gray-800">
              今回の獲得ポイント： <span className="text-green-600">{earnedPoints} P</span>
            </p>
            <p className="text-xl md:text-2xl font-extrabold text-gray-800 mt-2">
              今回の獲得経験値： <span className="text-purple-600">{earnedExp} EXP</span>
            </p>

            {isLoggedIn ? (
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
            ) : (
              <div className="mt-2">
                <p className="text-md md:text-xl text-gray-700 font-bold">
                  ※未ログインのため受け取れません。ログインすると次からポイントを受け取れます！
                </p>
                <button
                  onClick={onGoLogin}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white border border-black rounded-lg font-bold hover:bg-blue-600 cursor-pointer"
                >
                  ログインする
                </button>
                <p className="text-md md:text-xl text-gray-700 font-bold mt-2">
                  ログインなしでも、引き続き遊べます👇
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {showButton && (
        <button
          className="px-6 py-3 bg-green-500 text-white border border-black rounded-lg font-bold text-xl hover:bg-green-600 cursor-pointer mt-3 md:mt-5"
          onClick={() => window.location.reload()}
        >
          もう一回挑戦する
        </button>
      )}
    </div>
  );
};

export default function QuizModePage() {
  const router = useRouter();
  const pathname = usePathname();
  const mode = pathname.split("/").pop() || "random";
  const searchParams = useSearchParams();
  const genre = searchParams?.get("genre") || "";
  const level = searchParams?.get("level") || "";

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [flashMilestone, setFlashMilestone] = useState<string | null>(null);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);

  const timeParam = searchParams?.get("time") || "1";
  const totalTime = parseInt(timeParam) * 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);

  const [score, setScore] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const wrongStreakRef = useRef(0);
  const [scoreChange, setScoreChange] = useState<number | null>(null);

  // ★ リザルト用（付与ポイントは score から算出）
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");
  const awardedOnceRef = useRef(false);

  const sentRef = useRef(false);
  const { pushModal } = useResultModal();

  const titles = [
    { threshold: 300, title: "優等生" },
    { threshold: 500, title: "異端児" },
    { threshold: 800, title: "賢者" },
    { threshold: 1000, title: "博識者" },
    { threshold: 1300, title: "クイズ研究家" },
    { threshold: 1500, title: "クイズ学者" },
    { threshold: 1800, title: "クイズ教授" },
    { threshold: 2000, title: "クイズ名人" },
    { threshold: 2300, title: "クイズ達人" },
    { threshold: 2500, title: "クイズ仙人" },
    { threshold: 2800, title: "クイズ星人" },
    { threshold: 3000, title: "知識マスター" },
    { threshold: 3300, title: "天才クイズプレイヤー" },
    { threshold: 3500, title: "脳内図書館 " },
    { threshold: 3800, title: "クイズマシーン " },
    { threshold: 4000, title: "問題バスター " },
    { threshold: 4300, title: "答えの支配者 " },
    { threshold: 4500, title: "クイズモンスター " },
    { threshold: 4800, title: "答えの錬金術師" },
    { threshold: 5000, title: "ひらめきの妖精" },
    { threshold: 5300, title: "クイズ帝王" },
    { threshold: 5500, title: "問題ハンター" },
    { threshold: 5800, title: "記憶の魔術師" },
    { threshold: 6000, title: "IQ200超えの賢者" },
    { threshold: 6500, title: "クイズ鬼人" },
    { threshold: 7000, title: "クイズ竜王" },
    { threshold: 7500, title: "クイズ魔人" },
    { threshold: 8000, title: "クイズ覇王" },
    { threshold: 8500, title: "クイズオリンポスの支配者" },
    { threshold: 9000, title: "レジェンドクイズマスター" },
    { threshold: 9500, title: "究極クイズマスター" },
    { threshold: 10000, title: "神（ゴッド）🌟" },
  ];

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/articles");
        const data: ArticleData[] = await res.json();
        let all: ArticleData[] = data;

        if (mode === "genre" && genre) all = all.filter((a) => a.quiz?.genre === genre);
        if (mode === "level" && level) all = all.filter((a) => a.quiz?.level === level);

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

  // タイマー（0になったら強制終了）
  useEffect(() => {
    const timer = setInterval(() => {
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
  }, []);

  const checkAnswer = () => {
    const correctAnswer = questions[currentIndex].quiz?.answer;
    const displayAnswer = questions[currentIndex].quiz?.displayAnswer;
    const quizLevel = questions[currentIndex].quiz?.level;

    if (userAnswer === correctAnswer) {
      setCorrectCount((c) => c + 1);

      wrongStreakRef.current = 0;
      setWrongStreak(0);

      setScore((prev) => {
        let add = 0;
        if (quizLevel === "かんたん") add = 50;
        if (quizLevel === "ふつう") add = 100;
        if (quizLevel === "難しい") add = 150;

        setScoreChange(add);
        setTimeout(() => setScoreChange(null), 800);
        return prev + add;
      });

      setShowCorrectMessage(true);
    } else {
      wrongStreakRef.current = wrongStreakRef.current + 1;
      const newStreak = wrongStreakRef.current;
      setWrongStreak(newStreak);

      if (newStreak >= 3) {
        setScore((prev) => {
          const newScore = Math.max(0, prev - 100);
          setScoreChange(-100);
          setTimeout(() => setScoreChange(null), 800);
          return newScore;
        });

        wrongStreakRef.current = 0;
        setWrongStreak(0);
      }

      setIncorrectMessage(`ざんねん！\n答えは" ${displayAnswer} "でした！`);
    }

    setUserAnswer(null);
  };

  const getTitle = () => {
    let title = "クイズ初心者";
    titles.forEach((t) => {
      if (score >= t.threshold) title = t.title;
    });
    return title;
  };

  // ★ finished になったタイミングで「獲得ポイント計算(score/5)」→「ログインなら加算」
  useEffect(() => {
    if (!finished) return;

    // 表示用ポイントは必ず計算
    const earned = calcEarnedPointsFromScore(score);
    setEarnedPoints(earned);

    const expEarned = correctCount * 20; // ★ ポイント分EXPも加算
    setEarnedExp(expEarned);

    // 0PならDB処理はしない（表示だけ）
    if (earned <= 0) {
      setAwardStatus("idle");
      return;
    }

    // 未ログインなら案内だけ
    if (!userLoading && !user) {
      setAwardStatus("need_login");
      return;
    }

    // ログイン中なら付与（1回だけ）
    if (!userLoading && user && !awardedOnceRef.current) {
      awardedOnceRef.current = true;

      const award = async () => {
        try {
          setAwardStatus("awarding");

          // RPCで points と exp を同時加算＆level再計算
          const { data, error } = await supabase.rpc("add_points_and_exp", {
            p_user_id: user.id,
            p_points: earned,
            p_exp: expEarned,
          });

          if (error) {
            console.error("add_points_and_exp error:", error);
            setAwardStatus("error");
            return;
          }

          const row = Array.isArray(data) ? data[0] : data;
          const oldLevel = row?.old_level ?? 1;
          const newLevel = row?.new_level ?? 1;

          // ヘッダー等を即時更新（ポイント表示）
          window.dispatchEvent(new Event("points:updated"));

          // レベルアップ演出（LevelUpToastがこれを監視してる）
          window.dispatchEvent(
            new CustomEvent("profile:updated", {
              detail: { oldLevel, newLevel },
            })
          );

          // ログ（＋） ※失敗しても致命的にはしない
          const { error: logError } = await supabase.from("user_point_logs").insert({
            user_id: user.id,
            change: earned,
            reason: `制限時間クイズでポイント獲得（score ${score} → ${earned}P）`,
          });
          if (logError) console.log("insert user_point_logs error:", logError);

          const { error: logError2 } = await supabase.from("user_exp_logs").insert({
            user_id: user.id,
            change: expEarned,
            reason: `制限時間クイズでEXP獲得（score ${score} → ${expEarned}EXP）`,
          });
          if (logError2) console.log("insert user_exp_logs error:", logError2);

          setAwardStatus("awarded");
        } catch (e) {
          console.error("award points/exp error:", e);
          setAwardStatus("error");
        }
      };

      award();
    }
  }, [finished, score, user, userLoading, supabase]);

  // ★ 成績/称号（timed）を保存して、新記録 or 新称号ならモーダル表示
  useEffect(() => {
    if (!finished) return;
    if (sentRef.current) return;
    sentRef.current = true;

    // ログインしてないなら送らない（任意）
    if (!userLoading && !user) return;

    (async () => {
      try {
        // scoreが確定してから称号判定
        const title = calcTitle(titles, score); // titles = timedTitles

        const res = await submitGameResult(supabase, {
          game: "timed",
          score: score,       // totalScore ではなく score
          title: title,       // nullでもOK
          writeLog: true,
        });

        const modal = buildResultModalPayload("timed", res);
        if (modal) pushModal(modal);
      } catch (e) {
        console.error("[timed] submitGameResult error:", e);
        // 成績保存が失敗してもゲーム進行は止めない
      }
    })();
  }, [finished, userLoading, user, score, supabase, pushModal]);


  if (questions.length === 0) return <p></p>;

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-red-50 via-red-100 to-red-200">
      {!finished ? (
        <>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-black drop-shadow-lg">
            第 {currentIndex + 1} 問
          </h2>

          <div className="flex flex-col">
            <p
              className={`
                w-[280px] md:w-[400px] mx-auto text-2xl md:text-4xl font-extrabold mb-2 px-4 py-2 rounded-lg inline-block shadow-lg
                ${timeLeft <= 30 ? "bg-red-700 text-white animate-pulse" : " text-black bg-white border-2 border-black"}
                transition-colors duration-300
              `}
            >
              残り時間: {Math.floor(timeLeft / 60)}分 {timeLeft % 60}秒
            </p>

            <div className="relative w-[180px] md:w-[250px] mx-auto">
              <p
                className="
                  w-[180px] md:w-[250px] mx-auto text-2xl md:text-4xl font-bold mb-2 px-4 py-2 rounded-lg inline-block shadow-lg
                  bg-white text-blue-600 border-2 border-blue-600
                "
              >
                得点：{score} P
              </p>

              <AnimatePresence>
                {scoreChange !== null && (
                  <motion.div
                    key={scoreChange}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -20 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className={`absolute left-1/2 -translate-x-1/2 -top-3 font-bold text-2xl md:text-4xl ${
                      scoreChange > 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {scoreChange > 0 ? `+${scoreChange}` : `${scoreChange}`}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                    {(showCorrectMessage || incorrectMessage) && (
                      <button
                        className="px-5 py-3 md:px-6 md:py-3 border border-black bg-blue-500 text-white text-lg md:text-xl font-medium rounded mt-4 hover:bg-blue-600 cursor-pointer"
                        onClick={() => {
                          setShowCorrectMessage(false);
                          setIncorrectMessage(null);
                          if (currentIndex + 1 < questions.length) {
                            setCurrentIndex((i) => i + 1);
                          } else {
                            setCurrentIndex(0);
                          }
                        }}
                      >
                        次の問題へ
                      </button>
                    )}
                  </div>
                </>
              )}

              {!showCorrectMessage && !incorrectMessage && (
                <>
                  <QuizQuestion quiz={questions[currentIndex].quiz} userAnswer={userAnswer} setUserAnswer={setUserAnswer} />
                  <button
                    className="px-5 py-3 md:px-6 md:py-3 border border-black bg-blue-500 text-white text-lg md:text-xl font-medium rounded mt-4 hover:bg-blue-600 cursor-pointer"
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
          getTitle={getTitle}
          titles={titles}
          score={score}
          earnedPoints={earnedPoints}
          earnedExp={earnedExp}
          isLoggedIn={!!user}
          awardStatus={awardStatus}
          onGoLogin={() => router.push("/user/login")}
        />
      )}
    </div>
  );
}
