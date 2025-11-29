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
    answerExplanation?: string;
    trivia?: string;
  };
}

// 正解数に応じて出すコメント
const rankComments = [
  { threshold: 0, comment: "ここから冒険の始まりだ！ゆっくり進んでいこう！" },
  { threshold: 5, comment: "クイズ戦士に昇格！戦場に立つ準備は万端だ！" },
  { threshold: 10, comment: "駆け出しの旅人！君の旅はまだ始まったばかりだが、光るものがある！" },
  { threshold: 15, comment: "森の探求者！知識の森をどんどん進んでいるぞ！" },
  { threshold: 20, comment: "知識の斧使い！切れ味鋭いひらめきで問題を斬り伏せている！" },
  { threshold: 25, comment: "真理の魔術師！その回答、まるで呪文のように正確だ！" },
  { threshold: 30, comment: "叡智の騎士！堂々とした実力、もはや上級者の風格！" },
  { threshold: 35, comment: "謎解きの導師！ひらめきが熟練の域に達しているぞ…！" },
  { threshold: 40, comment: "迷宮の守護者！難問の迷宮も恐れない胆力を感じる！" },
  { threshold: 45, comment: "啓示の賢者！まるで答えが見えているかのような閃きだ！" },
  { threshold: 50, comment: "閃光の剣士 ⚔️ ！回答の速さと正確さが光のようだ！" },
  { threshold: 55, comment: "深淵の呪術師 🔮！常人には見えない答えを引き寄せている…！" },
  { threshold: 60, comment: "千里眼の召喚士 👁️！問題の先まで見抜いているのか！？" },
  { threshold: 65, comment: "叡智の勇者 🛡️！知識と勇気を兼ね備えた英雄だ！" },
  { threshold: 70, comment: "迷宮の支配者 👑！問題の方が君を避けているレベル！" },
  { threshold: 75, comment: "混沌の覇者 🌀！あらゆる難問をねじ伏せる圧倒的なパワー！" },
  { threshold: 80, comment: "運命の大賢者 ⭐！君の選択はすべて正解へ導かれている…！" },
  { threshold: 85, comment: "世界樹の賢王 🌳！知識の生命力が桁違いだ！" },
  { threshold: 90, comment: "次元超越者 🌌！もう次元が違う…これは人間離れしている！" },
  { threshold: 95, comment: "世界トップランカー！ここまで来ると本物の化け物級！" },
  { threshold: 100, comment: "ビギナーマスター 🏆！強すぎる！完全に覚醒してる！" },
  { threshold: 110, comment: "フロアマスター 🏆！あらゆるステージを制覇する者の風格だ！" },
  { threshold: 120, comment: "グランドマスター 🏆！歴戦の賢者のような威厳がある！" },
  { threshold: 130, comment: "クイズマスター 🏆！最強の中の最強…殿堂入りレベル！" },
  { threshold: 140, comment: "レジェンドクイズマスター 🌟！伝説に語り継がれる存在だ…！" },
  { threshold: 150, comment: "クイズ王✨！ついに王の領域へ…君こそ頂点！！" },
];

const QuizResult = ({ correctCount, getTitle, titles }: { correctCount: number, getTitle: () => string, titles: { threshold: number, title: string }[] }) => {

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
      {showScore && <p className="text-3xl md:text-5xl mb-4 md:mb-6">ステージ {correctCount} までクリア！</p>}
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
          className="px-6 py-3 bg-green-500 text-white border border-black rounded-lg font-bold text-xl hover:bg-green-600 cursor-pointer"
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
    { threshold: 5, title: "クイズ戦士" },
    { threshold: 10, title: "駆け出しの旅人" },
    { threshold: 15, title: "森の探求者" },
    { threshold: 20, title: "知識の斧使い" },
    { threshold: 25, title: "真理の魔術師" },
    { threshold: 30, title: "叡智の騎士" },
    { threshold: 35, title: "謎解きの導師" },
    { threshold: 40, title: "迷宮の守護者" },
    { threshold: 45, title: "啓示の賢者" },
    { threshold: 50, title: "閃光の剣士 ⚔️" },
    { threshold: 55, title: "深淵の呪術師 🔮" },
    { threshold: 60, title: "千里眼の召喚士 👁️" },
    { threshold: 65, title: "叡智の勇者 🛡️" },
    { threshold: 70, title: "迷宮の支配者 👑" },
    { threshold: 75, title: "混沌の覇者 🌀" },
    { threshold: 80, title: "運命の大賢者 ⭐" },
    { threshold: 85, title: "世界樹の賢王 🌳" },
    { threshold: 90, title: "次元超越者 🌌" },
    { threshold: 95, title: "世界トップランカー" },
    { threshold: 100, title: "ビギナーマスター 🏆" },
    { threshold: 110, title: "フロアマスター 🏆" },
    { threshold: 120, title: "グランドマスター 🏆" },
    { threshold: 130, title: "クイズマスター 🏆" },
    { threshold: 140, title: "レジェンドクイズマスター 🌟" },
    { threshold: 150, title: "クイズ王✨" },
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
              answerExplanation: a.quiz!.answerExplanation,
              trivia: a.quiz!.trivia,
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
      setCurrentIndex(i => i + 1);
    }
  };

  const getTitle = () => {
    let title = "見習い冒険者";
    titles.forEach((t) => {
      if (correctCount >= t.threshold) title = t.title;
    });
    return title;
  };

  const finishQuiz = () => {
    setFinished(true);
  };

  if (questions.length === 0) return <p></p>;

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-purple-50 via-purple-100 to-purple-200">
      {!finished ? (
        <>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-purple-500 drop-shadow-lg">
            STAGE {currentIndex + 1}
          </h2>

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
                        className="px-5 py-3 md:px-6 md:py-3 border border-black bg-blue-500 text-white text-lg md:text-xl font-medium rounded hover:bg-blue-600 cursor-pointer"
                        onClick={nextQuestion}
                      >
                        次のステージへ
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
                  className="px-5 py-3 md:px-6 md:py-3 border border-black bg-blue-500 text-white text-lg md:text-xl font-medium rounded mt-4 hover:bg-blue-600 cursor-pointer"
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
