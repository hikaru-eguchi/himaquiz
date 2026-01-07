"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";

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

const QuizResult = ({
  correctCount,
  earnedPoints,
  earnedExp,
  isLoggedIn,
  awardStatus,
  getTitle,
  titles,
  onGoLogin,
}: {
  correctCount: number;
  earnedPoints: number;
  earnedExp: number;
  isLoggedIn: boolean;
  awardStatus: AwardStatus;
  getTitle: () => string;
  titles: { threshold: number; title: string }[];
  onGoLogin: () => void;
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
        <p className="text-3xl md:text-5xl mb-4 md:mb-6">
          連続正解数： {correctCount}問
        </p>
      )}

      {showText && (
        <p className="text-xl md:text-2xl text-gray-600 mb-2 mt-6">
          あなたの称号は…
        </p>
      )}

      {showRank && (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center mb-10 gap-4 md:gap-10">
            <img
              src="/images/quiz.png"
              alt="クイズ"
              className="w-0 h-0 md:w-36 md:h-55 ml-15"
            />
            <p className="text-4xl md:text-6xl font-bold text-blue-600 drop-shadow-lg text-center animate-pulse">
              {getTitle()}
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
                className="w-22 h-25 md:w-38 md:h-40"
              />
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
  const pathname = usePathname();
  const router = useRouter();
  const mode = pathname.split("/").pop() || "random";
  const searchParams = useSearchParams();
  const genre = searchParams?.get("genre") || "";
  const level = searchParams?.get("level") || "";

  const supabase = createSupabaseBrowserClient();
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
  const [timeLeft, setTimeLeft] = useState(60);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);

  // ★ リザルト用：獲得ポイントと付与状態
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");
  const awardedOnceRef = useRef(false); // 二重加算防止

  const finishedRef = useRef(finished);
  const showCorrectRef = useRef(showCorrectMessage);

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

  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);
  useEffect(() => {
    showCorrectRef.current = showCorrectMessage;
  }, [showCorrectMessage]);

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
  }, []);

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
      setTimeLeft(60);
    }
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

  // ★ finished になったタイミングで「獲得ポイント計算」→「ログインなら加算」
  useEffect(() => {
    if (!finished) return;

    // リザルト表示用の獲得Pは必ず計算して表示
    const pointsEarned = calcQuizEarnedPoints(correctCount);
    const expEarned = calcEarnedExp(correctCount);

    setEarnedPoints(pointsEarned);
    setEarnedExp(expEarned);

    // どっちも0ならDB更新しない
    if (pointsEarned <= 0 && expEarned <= 0) {
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

          const { data, error } = await supabase.rpc("add_points_and_exp", {
            p_user_id: user.id,
            p_points: pointsEarned,
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

          // ヘッダー等更新
          window.dispatchEvent(new Event("points:updated"));

          // レベルアップ演出
          window.dispatchEvent(
            new CustomEvent("profile:updated", {
              detail: { oldLevel, newLevel },
            })
          );

          // ログ（ポイント）
          const { error: logError } = await supabase.from("user_point_logs").insert({
            user_id: user.id,
            change: pointsEarned,
            reason: `連続正解チャレンジでポイント獲得（連続正解数 ${correctCount}問）`,
          });
          if (logError) console.log("insert user_point_logs error:", logError);

          // ログ（EXP）※テーブルあるなら。無いならこのブロックは削除でOK
          const { error: expLogError } = await supabase.from("user_exp_logs").insert({
            user_id: user.id,
            change: expEarned,
            reason: `連続正解チャレンジでEXP獲得（連続正解数 ${correctCount}問）`,
          });
          if (expLogError) console.log("insert user_exp_logs error:", expLogError);

          setAwardStatus("awarded");
        } catch (e) {
          console.error("award points/exp error:", e);
          setAwardStatus("error");
        }
      };

      award();
    }
  }, [finished, correctCount, user, userLoading, supabase]);

  if (questions.length === 0) return <p></p>;

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-yellow-50 via-yellow-100 to-yellow-200">
      {!finished ? (
        <>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-yellow-500 drop-shadow-lg">
            第 {currentIndex + 1} 問
          </h2>

          {!incorrectMessage && (
            <p className="text-xl font-bold mb-4 text-red-500">
              残り時間: {timeLeft} 秒
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
                        className="px-5 py-3 md:px-6 md:py-3 border border-black bg-blue-500 text-white text-lg md:text-xl font-medium rounded hover:bg-blue-600 cursor-pointer"
                        onClick={nextQuestion}
                      >
                        次の問題へ
                      </button>
                    )}
                    {incorrectMessage && (
                      <button
                        className="px-5 py-3 md:px-6 md:py-3 bg-blue-500 border border-black text-white text-lg md:text-xl font-medium rounded hover:bg-blue-600 cursor-pointer"
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
          earnedPoints={earnedPoints}
          earnedExp={earnedExp}
          isLoggedIn={!!user}
          awardStatus={awardStatus}
          getTitle={getTitle}
          titles={titles}
          onGoLogin={() => router.push("/user/login")}
        />
      )}
    </div>
  );
}
