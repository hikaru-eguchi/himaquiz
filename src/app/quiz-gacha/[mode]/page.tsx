"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";
import { motion, AnimatePresence } from "framer-motion";

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

const QuizGacha = ({
  setGachastart,
  points,
  rollGacha,
  gachaResult,
  setGachaResult,
  history,
  setHistory,
}: {
  setGachastart: (v: boolean) => void;
  points: number;
  rollGacha: () => void;
  gachaResult: null | {
    name: string;
    image: string;
    rarity: string;
  };
  setGachaResult: (v: null | { name: string; image: string; rarity: string }) => void;
  history: { name: string; image: string; rarity: string;}[];
  setHistory: React.Dispatch<
    React.SetStateAction<
      { name: string; image: string; rarity: string;}[]
    >
  >;
}) => {
  const [showOpen, setShowOpen] = useState(false);
  const [showEffect, setShowEffect] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<null | { name: string; image: string; rarity: string }>(null);
  const rarityToStarCount: Record<string, number> = {
    "ノーマル": 1,
    "レア": 2,
    "超レア": 3,
    "激レア": 4,
    "超激レア": 5,
    "神レア": 6,
    "シークレット": 7,
  };
  const rarityGradient = {
    "ノーマル": "from-gray-400 via-gray-300 to-gray-200",
    "レア": "from-blue-400 via-blue-300 to-blue-200",
    "超レア": "from-purple-500 via-purple-400 to-purple-300",
    "激レア": "from-pink-500 via-rose-400 to-red-300",
    "超激レア": "from-yellow-400 via-orange-400 to-red-400",
    "神レア": "from-green-400 via-emerald-400 to-teal-300",
    "シークレット": "from-black via-gray-700 to-purple-700",
  } as const;
  const rarityText: Record<string, string> = {
    "ノーマル": "text-gray-400",
    "レア": "text-blue-400",
    "超レア": "text-purple-400",
    "激レア": "text-pink-400",
    "超激レア": "text-yellow-400",
    "神レア": "text-green-400",
    "シークレット": "text-black",
  };

  useEffect(() => {
    if (gachaResult) {
      // 0.5秒後にカプセル開く
      const timer1 = setTimeout(() => setShowOpen(true), 500);
      // 1秒後に光のエフェクト
      const timer2 = setTimeout(() => setShowEffect(true), 1000);
      // 0.5秒後に当たりキャラクター表示
      const timer3 = setTimeout(() => setShowResult(true), 1100);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        setShowOpen(false);
        setShowEffect(false);
        setShowResult(false);
      };
    }
  }, [gachaResult]);

  const canRoll = points >= 100; // 100ポイント以上で回せるか

  return (
    <div className="text-center">
      <div>
        <p className="text-xl md:text-2xl font-extrabold text-black">
          ポイントでガチャをまわそう！
        </p>
        <p className="text-xl md:text-2xl font-extrabold mb-6 text-black">
          ポイントがなくなったらクイズ画面でためれるよ。
        </p>
      </div>
      <div className="flex flex-col items-center justify-between mb-6 w-full mx-auto">
        <button
          className="px-5 py-1 md:px-4 md:py-2 mb-2 md:mt-0 bg-green-500 text-white border border-black rounded 
                    font-bold text-lg md:text-xl hover:bg-green-600 cursor-pointer"
          onClick={() => setGachastart(false)}
        >
          クイズ画面へ
        </button>

        <div className="bg-white border border-black px-4 py-2 rounded shadow">
          <p className="text-xl md:text-2xl font-bold text-gray-800">
            所持ポイント💴：{points} P
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-6 mb-10">
        <img src="/images/gacha.png" className="w-50 h-60 md:w-80 md:h-100" />
        {/* ガチャボタン */}
        <button
          className={`
            px-6 py-3 rounded-lg font-bold text-xl border border-black
            transition-all duration-300 ease-in-out
            ${canRoll
              ? "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
              : "bg-blue-500 text-white opacity-50 cursor-not-allowed pointer-events-none"
            }
          `}
          onClick={rollGacha}
          disabled={!canRoll}
        >
          100Pでガチャを回す🎰
        </button>

        {/* ポイント不足メッセージ */}
        {!canRoll && (
          <p className="text-xl text-red-500 font-bold animate-pulse">
            ポイントが足りないよ！
          </p>
        )}
      </div>

      {/* --- 当たり履歴 --- */}
      <div className="mt-6 border-t pt-4">
        <h2 className="text-xl md:text-2xl font-bold mb-2">入手キャラ</h2>

        {history.length === 0 ? (
          <p className="text-xl md:text-2xl text-center text-gray-500">なし</p>
        ) : (
          <div className="overflow-x-auto">
            {/* 中央寄せ用コンテナ */}
            <div className="flex justify-center">
              {/* 横スクロール用の実データ */}
              <div className="flex flex-nowrap gap-4 py-2">
                {history.map((item, index) => (
                  <div key={index} className="text-center flex-shrink-0 cursor-pointer" onClick={() => setSelectedHistory(item)}>
                    <img src={item.image} className="w-16 h-16 md:w-32 md:h-32 mx-auto rounded" />
                    <p className="text-sm md:text-xl font-bold mt-1">{item.name}</p>
                    <p
                      className={`text-sm md:text-xl font-bold ${
                        rarityText[item.rarity] ?? "text-gray-400"
                      }`}
                    >
                      {item.rarity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- モーダル（拡大表示） --- */}
      <AnimatePresence>
        {selectedHistory && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedHistory(null)}
          >
            {/* 背景：カラフルもわもわ */}
            <div className="fixed inset-0 -z-10">
              <div
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #ff00ff, #00ffff, #ffff00, #ff0000)',
                  filter: 'blur(120px)',
                  opacity: 0.6,
                  width: '100%',
                  height: '100%',
                }}
              />
              {/* 小さいキラキラ粒子 */}
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 rounded-full bg-white"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: 0.6,
                    filter: 'blur(4px)',
                  }}
                  animate={{ y: [-10, 10] }}
                  transition={{ duration: 1 + Math.random(), repeat: Infinity, repeatType: "reverse" }}
                />
              ))}
            </div>

            {/* モーダル本体 */}
            <motion.div
              className="bg-white p-6 rounded-2xl flex flex-col items-center z-50"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedHistory.image} className="w-40 h-40 md:w-64 md:h-64 rounded mb-4" />
              <p className="text-3xl md:text-5xl font-bold">{selectedHistory.name}</p>
              <p className="text-xl md:text-3xl font-extrabold mt-3 md:mt-5 text-gray-500 drop-shadow">
                レアリティ：<span className={`text-xl md:text-3xl font-bold ${rarityText[selectedHistory.rarity]}`}>{selectedHistory.rarity}</span>
              </p>
              <p className="text-yellow-300 text-2xl md:text-4xl font-extrabold mt-1 md:mt-3 drop-shadow">
                {"★".repeat(rarityToStarCount[selectedHistory.rarity] || 1)}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gachaResult && (
          <motion.div
            className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* --- カプセル（閉じてるバージョン） --- */}
            {!showOpen && (
              <motion.img
                src="/images/gacha_close.png"
                initial={{ y: "-100vw" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                // onAnimationCompleteは不要（タイマーで制御）
              />
            )}

            {/* --- カプセル（開くアニメ）: カプセルが「開く」段階かつ結果未表示のときだけ --- */}
            {showOpen && !showResult && (
              <motion.img
                src="/images/gacha_open.png"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}

            {/* --- 当たりキャラクター（結果） --- */}
            {showResult && (
              <div className="relative w-full flex justify-center mt-6">
                {/* 画面全体のカラフルもわもわ */}
                <div
                  className="fixed inset-0 -z-10"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #ff00ff, #00ffff, #ffff00, #ff0000)',
                    filter: 'blur(120px)',
                    opacity: 0.6,
                  }}
                />

                {/* 小さいキラキラ粒子も画面全体 */}
                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-4 h-4 rounded-full bg-white"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: 0.6,
                      filter: 'blur(4px)',
                    }}
                    animate={{ y: [-10, 10] }}
                    transition={{ duration: 1 + Math.random(), repeat: Infinity, repeatType: "reverse", }}
                  />
                ))}

                {/* ガチャ結果枠 */}
                <motion.div
                  className={`
                    relative text-center z-50 p-6 rounded-2xl shadow-2xl
                    bg-gradient-to-r ${rarityGradient[gachaResult.rarity as keyof typeof rarityGradient]}
                    animate-gradient
                  `}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <img src={gachaResult.image} className="w-36 h-36 mx-auto drop-shadow-lg" />
                  <p className="text-3xl md:text-5xl font-bold mt-4 text-white drop-shadow">
                    {gachaResult.name} が当たった！
                  </p>
                  <p className="text-2xl md:text-4xl font-extrabold mt-2 text-white drop-shadow">
                    レアリティ：{gachaResult.rarity}
                  </p>
                  <p className="text-yellow-300 text-4xl md:text-6xl font-extrabold mt-1 drop-shadow">
                    {"★".repeat(rarityToStarCount[gachaResult.rarity] || 1)}
                  </p>
                </motion.div>
              </div>
            )}

            {/* --- 閉じるボタンは結果が出たときだけ表示。z-index高めにして確実に見えるように --- */}
            {showResult && (
              <button
                className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg font-bold z-50"
                onClick={() => {
                  // 全ての演出フラグをリセットして閉じる
                  setShowOpen(false);
                  setShowEffect(false);
                  setShowResult(false);
                  setGachaResult(null);
                }}
              >
                閉じる
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function QuizModePage() {
  const pathname = usePathname();
  const mode = pathname.split("/").pop() || "random";
  const searchParams = useSearchParams();
  const genre = searchParams?.get("genre") || "";
  const level = searchParams?.get("level") || "";

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [flashMilestone, setFlashMilestone] = useState<string | null>(null);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);
  const [gachastart, setGachastart] = useState(false);
  const [points, setPoints] = useState(0);
  const [gachaResult, setGachaResult] = useState<null | {
    name: string;
    image: string;
    rarity: string;
  }>(null);
  const [scoreChange, setScoreChange] = useState<number | null>(null);
  const [history, setHistory] = useState<
    { name: string; image: string; rarity: string;}[]
  >([]);

  const showCorrectRef = useRef(showCorrectMessage);

  useEffect(() => { showCorrectRef.current = showCorrectMessage; }, [showCorrectMessage]);

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
  }, [mode, genre, level]);

  const shuffleArray = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const checkAnswer = () => {
    const correctAnswer = questions[currentIndex].quiz?.answer;
    const displayAnswer = questions[currentIndex].quiz?.displayAnswer;

    if (userAnswer === correctAnswer) {
      // ★ レベルに応じてポイント加算
      const level = (questions[currentIndex].quiz as any)?.level ?? "かんたん";
      const addPoint = level === "かんたん" ? 100 : level === "ふつう" ? 200 : 300;

      setPoints(p => p + addPoint);
      setScoreChange(addPoint);
      setTimeout(() => setScoreChange(null), 800);

      setCorrectCount(c => {
        const newCount = c + 1;
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
      setCurrentIndex(0);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const gachaCharacters = [
    { name: "スライム", image: "/images/slime.png", rarity: "ノーマル", weight: 20 },
    { name: "ゴブリン", image: "/images/goblin.png", rarity: "ノーマル", weight: 17 },
    { name: "ミミック", image: "/images/mimic.png", rarity: "ノーマル", weight: 15 },
    { name: "バーサーカー", image: "/images/berserker.png", rarity: "ノーマル", weight: 12 },
    { name: "フェニックス", image: "/images/fenikkusu.png", rarity: "レア", weight: 10 },
    { name: "ドラゴン", image: "/images/dragon.png", rarity: "レア", weight: 7.5 },
    { name: "ブラックドラゴン", image: "/images/blackdragon.png", rarity: "超レア", weight: 6.8 },
    { name: "リヴァイアサン", image: "/images/leviathan.png", rarity: "超レア", weight: 5 },
    { name: "ポセイドン", image: "/images/poseidon.png", rarity: "超レア", weight: 3 },
    { name: "軍荼利明王（ぐんだりみょうおう）", image: "/images/gundarimyouou.png", rarity: "超レア", weight: 2 },
    { name: "ハデス", image: "/images/hades.png", rarity: "激レア", weight: 1 },
    { name: "ゼウス", image: "/images/zeus.png", rarity: "激レア", weight: 0.5 },
    { name: "オーディン", image: "/images/ordin.png", rarity: "激レア", weight: 0.1 },
    { name: "初代クイズマスターの最強勇者", image: "/images/yuusya_game.png", rarity: "超激レア", weight: 0.05 },
    { name: "クイズ王", image: "/images/quiz_man.png", rarity: "神レア", weight: 0.02 },
    { name: "クイズ女王", image: "/images/quiz_woman.png", rarity: "神レア", weight: 0.02 },
    { name: "シークレットクイズ王", image: "/images/quiz.png", rarity: "シークレット", weight: 0.01 },
  ];
  

  const rollGacha = () => {
    if (points < 100) return; // 100ポイント未満なら回せない

    setPoints(p => p - 100); // 1回100ポイント消費

    const totalWeight = gachaCharacters.reduce((sum, c) => sum + c.weight, 0);
    let random = Math.random() * totalWeight;

    for (const char of gachaCharacters) {
      if (random < char.weight) {
        setGachaResult(char);
        setTimeout(() => {
          setHistory((prev) => [...prev, char]);
        }, 2000);
        return;
      }
      random -= char.weight;
    }
  };


  if (questions.length === 0) return <p></p>;

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-red-100 via-blue-100 to-green-100">
      {!gachastart ? (
        <>
          <div>
            <p className="text-xl md:text-2xl font-extrabold text-black">
              クイズに正解するとポイントがもらえるよ。
            </p>
            <p className="text-xl md:text-2xl font-extrabold mb-6 text-black">
              ポイントが貯まったらガチャ画面へ進もう！
            </p>
          </div>
          <div className="flex flex-col items-center justify-between mb-6 w-full mx-auto">
            <button
              className="px-5 py-1 md:px-4 md:py-2 border border-black bg-red-500 text-white 
                        text-lg md:text-xl font-bold rounded mb-2 md:mt-0 hover:bg-red-600 cursor-pointer"
              onClick={() => setGachastart(true)}
            >
              ガチャ画面へ🎰
            </button>
            <div className="relative mx-auto">
              <div className="bg-white border border-black px-4 py-2 rounded shadow">
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  所持ポイント💴：{points} P
                </p>
              </div>
              <AnimatePresence>
                {scoreChange !== null && (
                  <motion.div
                    key={scoreChange}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -20 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className={`absolute left-1/2 -translate-x-1/2 -top-3 font-bold text-2xl md:text-4xl ${scoreChange > 0 ? 'text-green-500' : 'text-red-500'}`}
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
                    <>
                      <p className="text-4xl md:text-6xl font-extrabold mb-2 text-green-600 drop-shadow-lg animate-bounce animate-pulse">
                        ◎正解！🎉
                      </p>
                    </>
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
                      <>
                        <button
                          className="px-5 py-3 md:px-6 md:py-3 border border-black bg-blue-500 text-white 
                                    text-lg md:text-xl font-medium rounded hover:bg-blue-600 cursor-pointer"
                          onClick={() => {
                            setShowCorrectMessage(false);
                            setIncorrectMessage(null);
                            if (currentIndex + 1 < questions.length) {
                              setCurrentIndex(i => i + 1);
                            } else {
                              setCurrentIndex(0);
                            }
                          }}
                        >
                          次の問題へ
                        </button>
                      </>
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
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50
                            text-yellow-400 text-5xl md:text-7xl font-extrabold animate-pulse">
              {flashMilestone}
            </div>
          )}
        </>
      ) : (
        <QuizGacha setGachastart={setGachastart} points={points} rollGacha={rollGacha} gachaResult={gachaResult} setGachaResult={setGachaResult} history={history} setHistory={setHistory}/>
      )}
    </div>
  );
}
