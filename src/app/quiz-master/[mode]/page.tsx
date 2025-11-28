"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";

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
  };
}

// 正解数に応じて出すコメント
const rankComments = [
  { threshold: 0, comment: "ここからが始まり！まずは肩慣らしだね！" },
  { threshold: 5, comment: "ルーキー入り！君、才能を感じるよ！" },
  { threshold: 10, comment: "ベテランの域に到達！良い調子、頭が冴えてきたね！" },
  { threshold: 15, comment: "エキスパート級！すごい、普通の人より確実に強いぞ！" },
  { threshold: 20, comment: "トップランカーにふさわしい実力！完全にセンスあるね、これは本物だ！" },
  { threshold: 25, comment: "クイズ名人の風格が出てきた！もう上級者と呼べるレベル！" },
  { threshold: 30, comment: "クイズ達人級の頭脳！天才の気配を感じる…君はどこまで行くんだ？" },
  { threshold: 35, comment: "仙人レベルの知識量！もはや悟りの境地だ…！" },
  { threshold: 40, comment: "クイズ星人クラス！地球人とは思えない閃きだ！" },
  { threshold: 45, comment: "ひらめきの妖精！そのひらめきは誰も追いつけない才能だ…！" },
  { threshold: 50, comment: "孤高の天才！クイズ界の怪物が誕生した瞬間だ！" },
  { threshold: 55, comment: "思考の魔術師！頭の中で何か魔法を使ってるだろ！？" },
  { threshold: 60, comment: "答えの支配者！問題の方が君を怖がってる…？" },
  { threshold: 65, comment: "知恵の勇者！挑戦を恐れずに立ち向かう姿勢がカッコいい！" },
  { threshold: 70, comment: "ビギナーマスター！バケモン級！これはもう人間技じゃない！" },
  { threshold: 80, comment: "フロアマスターの領域へ！知識量が桁違いすぎる！" },
  { threshold: 90, comment: "グランドマスター級！歴戦のクイズ戦士だ…恐れ入った！" },
  { threshold: 100, comment: "クイズマスター！最強クラス！歴史に名を刻むレベルだ！" },
  { threshold: 150, comment: "レジェンドクイズマスター！伝説級の存在…もう別次元！" },
  { threshold: 200, comment: "神（ゴッド）、、！ここまでくるとは！君はもう人間の姿をした神様だ…！" },
];

const QuizResult = ({ correctCount, getTitle, titles }: { correctCount: number, getTitle: () => string, titles: { threshold: number, title: string }[] }) => {
  
  // ★ クイズ終了時にでかく出すフラッシュ表示
  const [flashEnd, setFlashEnd] = useState(true);

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

  // ★1秒で "クイズ終了！" を消す
  useEffect(() => {
    const timer = setTimeout(() => setFlashEnd(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowScore(true), 2000));
    timers.push(setTimeout(() => setShowText(true), 3000));
    timers.push(setTimeout(() => setShowRank(true), 4000));
    timers.push(setTimeout(() => setShowButton(true), 4000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="text-center mt-6">

      {/* ★ 中央に1秒だけ出る「ダンジョン終了！」 */}
      {flashEnd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 
                        text-white text-5xl md:text-7xl font-extrabold">
          ダンジョン終了！
        </div>
      )}

      {showScore && <p className="text-3xl md:text-5xl mb-4 md:mb-6">正解数: {correctCount}問</p>}
      {showText && <p className="text-xl md:text-2xl text-gray-600 mb-2">君の称号は…</p>}

      {showRank && (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center mb-10 gap-4 md:gap-10">
            <img src="/images/yuusya_game.png" alt="勇者" className="w-0 h-0 md:w-50 md:h-60" />
            <p className="text-4xl md:text-6xl font-bold text-blue-600 drop-shadow-lg text-center animate-pulse">
              {getTitle()}
            </p>
            <div className="flex flex-row md:flex-row items-center justify-center gap-8">
              <img src="/images/yuusya_game.png" alt="勇者" className="w-20 h-25 md:w-0 md:h-0" />
              <img src="/images/dragon.png" alt="ドラゴン" className="w-20 h-18 md:w-50 md:h-45" />
            </div>
          </div>

          {/* ★ 正解数に応じたコメント */}
          {getRankComment() && (
            <p className="text-lg md:text-2xl text-gray-800 mb-8 font-bold whitespace-pre-line">
              {getRankComment()}
            </p>
          )}
        </>
      )}

      {showButton && (
        <button
          className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold text-xl hover:bg-green-600 cursor-pointer"
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
  const mode = pathname.split("/").pop() || "random";
  const searchParams = useSearchParams();
  const genre = searchParams?.get("genre") || "";

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);

  const finishedRef = useRef(finished);
  const showCorrectRef = useRef(showCorrectMessage);

  const titles = [
    { threshold: 5, title: "ルーキー" },
    { threshold: 10, title: "ベテラン" },
    { threshold: 15, title: "エキスパート" },
    { threshold: 20, title: "トップランカー" },
    { threshold: 25, title: "クイズ名人" },
    { threshold: 30, title: "クイズ達人" },
    { threshold: 35, title: "クイズ仙人" },
    { threshold: 40, title: "クイズ星人" },
    { threshold: 45, title: "ひらめきの妖精" },
    { threshold: 50, title: "孤高の天才" },
    { threshold: 55, title: "思考の魔術師" },
    { threshold: 60, title: "答えの支配者" },
    { threshold: 65, title: "知恵の勇者" },
    { threshold: 70, title: "ビギナーマスター 🏆" },
    { threshold: 80, title: "フロアマスター 🏆" },
    { threshold: 90, title: "グランドマスター 🏆" },
    { threshold: 100, title: "クイズマスター 🏆" },
    { threshold: 150, title: "レジェンドクイズマスター 🌟" },
    { threshold: 200, title: "神（ゴッド） 🌟" },
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

        const quizQuestions: { id: string; quiz: QuizData }[] = all
          .filter(a => a.quiz)
          .map(a => ({
            id: a.id,
            quiz: {
              title: a.title,
              question: a.quiz!.question,
              answer: Number(a.quiz!.answer),
              displayAnswer: a.quiz!.displayAnswer,
              choices: a.quiz!.choices ? a.quiz!.choices.map(String) : [],
              genre: a.quiz!.genre,
              level: a.quiz!.level,
            }
          }));

        setQuestions(shuffleArray(quizQuestions));
      } catch (error) {
        console.error("クイズ問題の取得に失敗しました:", error);
      }
    };

    fetchArticles();
  }, [mode, genre]);

  const shuffleArray = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const checkAnswer = () => {
    const correctAnswer = questions[currentIndex].quiz?.answer;
    const displayAnswer = questions[currentIndex].quiz?.displayAnswer;

    if (userAnswer === correctAnswer) {
      setCorrectCount(c => c + 1);
      setShowCorrectMessage(true);

      setTimeout(() => {
        setShowCorrectMessage(false);
        nextQuestion();
      }, 1500);

    } else {
      setIncorrectMessage(`ざんねん！\n答えは" ${displayAnswer} "でした！`);
      setTimeout(() => {
        setFinished(true);
      }, 2500);
    }

    setUserAnswer(null);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const getTitle = () => {
    let title = "クイズ初心者";
    titles.forEach((t) => {
      if (correctCount >= t.threshold) title = t.title;
    });
    return title;
  };

  if (questions.length === 0) return <p></p>;

  return (
    <div className="container mx-auto p-8 text-center min-h-screen bg-gradient-to-b from-purple-100 via-purple-200 to-purple-300">
      {!finished ? (
        <>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-purple-500 drop-shadow-lg">
            STAGE {currentIndex + 1}
          </h2>

          {questions[currentIndex].quiz && (
            <>
              {/* 正解メッセージ */}
              {showCorrectMessage && (
                <>
                  <p className="text-4xl md:text-6xl font-extrabold mb-2 text-green-600 drop-shadow-lg animate-bounce animate-pulse">
                    　◎正解！🎉
                  </p>
                  <p className="text-2xl md:text-3xl text-black font-bold mt-10">
                    　次は STAGE {currentIndex + 2}！
                  </p>
                  <p className="text-sm md:text-lg text-black mt-5">
                    　（数秒後、自動で次のステージへ移動します）
                  </p>
                </>
              )}

              {/* 不正解メッセージ */}
              {incorrectMessage && (
                <p className="text-3xl md:text-4xl font-extrabold mb-4 text-red-500 drop-shadow-lg animate-shake whitespace-pre-line">
                  {incorrectMessage}
                </p>
              )}

              {/* 選択肢表示 */}
              {!showCorrectMessage && !incorrectMessage && (
                <QuizQuestion
                  quiz={questions[currentIndex].quiz}
                  userAnswer={userAnswer}
                  setUserAnswer={setUserAnswer}
                />
              )}

              {/* 回答ボタン */}
              {!showCorrectMessage && !incorrectMessage && (
                <button
                  className="px-5 py-3 md:px-6 md:py-3 bg-blue-500 text-white text-lg md:text-xl font-medium rounded mt-4 hover:bg-blue-600 cursor-pointer"
                  onClick={checkAnswer}
                  disabled={userAnswer === null}
                >
                  回答
                </button>
              )}
            </>
          )}
        </>
      ) : (
        <QuizResult correctCount={correctCount} getTitle={getTitle} titles={titles} />
      )}
    </div>
  );
}
