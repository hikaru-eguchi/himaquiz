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

const QuizResult = ({ correctCount, getTitle }: { correctCount: number, getTitle: () => string }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowTitle(true), 50));
    timers.push(setTimeout(() => setShowScore(true), 1000));
    timers.push(setTimeout(() => setShowText(true), 2000));
    timers.push(setTimeout(() => setShowRank(true), 3000));
    timers.push(setTimeout(() => setShowButton(true), 4000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="text-center mt-6">
      {showTitle && <h2 className="text-4xl md:text-6xl font-extrabold mb-8">クイズ終了！</h2>}
      {showScore && <p className="text-3xl md:text-4xl mb-12">正解数: {correctCount}</p>}
      {showText && <p className="text-2xl md:text-2xl text-gray-600 mb-8">君は…</p>}
      {showRank && (
        <div className="flex flex-col md:flex-row items-center justify-center mb-10 gap-4 md:gap-10">
          <img src="/images/yuusya.png" alt="勇者" className="w-0 h-0 md:w-50 md:h-60" />
          <p className="text-xl md:text-5xl font-bold text-blue-600 drop-shadow-lg animate-bounce text-center">
            称号：{getTitle()}
          </p>
          <div className="flex flex-row md:flex-row items-center justify-center gap-8">
            <img src="/images/yuusya.png" alt="勇者" className="w-20 h-25 md:w-0 md:h-0" />
            <img src="/images/dragon.png" alt="ドラゴン" className="w-20 h-18 md:w-50 md:h-45" />
          </div>
        </div>
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
  const [timeLeft, setTimeLeft] = useState(30);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);

  const finishedRef = useRef(finished);
  const showCorrectRef = useRef(showCorrectMessage);

  const titles = [
    { threshold: 5, title: "ルーキー" },
    { threshold: 10, title: "ベテラン" },
    { threshold: 15, title: "エキスパート" },
    { threshold: 20, title: "トップランカー" },
    { threshold: 25, title: "名人" },
    { threshold: 30, title: "達人" },
    { threshold: 35, title: "仙人" },
    { threshold: 40, title: "星人" },
    { threshold: 45, title: "ひらめきの妖精" },
    { threshold: 50, title: "孤高の天才" },
    { threshold: 55, title: "思考の魔術師" },
    { threshold: 60, title: "答えの支配者" },
    { threshold: 65, title: "知恵の勇者" },
    { threshold: 70, title: "ビギナーマスター 🏆" },
    { threshold: 80, title: "フロアマスター 🏆" },
    { threshold: 90, title: "グランドマスター 🏆" },
    { threshold: 100, title: "🏆 クイズマスター 🏆" },
    { threshold: 150, title: "レジェンドクイズマスター 🌟" },
    { threshold: 200, title: "🌟 神（ゴッド） 🌟" },
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

  // useRef 安全版タイマー
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
      setCorrectCount(c => c + 1);
      setShowCorrectMessage(true);

      setTimeout(() => {
        setShowCorrectMessage(false);
        nextQuestion();
      }, 2000);

    } else {
      setIncorrectMessage(`残念！不正解…\n答えは" ${displayAnswer} "でした！`);
      setTimeout(() => {
        setFinished(true);
      }, 3000);
    }
    setUserAnswer(null);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(30);
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
    <div className="container mx-auto p-8 text-center">
      {!finished ? (
        <>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-yellow-400 drop-shadow-lg">
            STAGE {currentIndex + 1} 
          </h2>

          <p className="text-lg font-bold mb-4 text-red-500">
            残り時間: {timeLeft} 秒
          </p>

          {questions[currentIndex].quiz && (
            <>
              {showCorrectMessage && (
                <p className="text-4xl md:text-6xl font-extrabold mb-4 text-green-500 drop-shadow-lg animate-bounce animate-pulse">
                  正解！
                </p>
              )}

              {incorrectMessage && (
                <p className="text-3xl md:text-4xl font-extrabold mb-4 text-red-500 drop-shadow-lg animate-shake whitespace-pre-line">
                  {incorrectMessage}
                </p>
              )}

              <QuizQuestion
                quiz={questions[currentIndex].quiz}
                userAnswer={userAnswer}
                setUserAnswer={setUserAnswer}
              />
            </>
          )}

          <button
            className="px-4 py-2 bg-blue-500 text-white rounded mt-4 hover:bg-blue-600 cursor-pointer"
            onClick={checkAnswer}
            disabled={userAnswer === null}
          >
            回答
          </button>
        </>
      ) : (
        <QuizResult correctCount={correctCount} getTitle={getTitle} />
      )}
    </div>
  );
}
