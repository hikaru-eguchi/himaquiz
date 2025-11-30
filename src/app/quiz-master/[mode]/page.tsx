"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";

// キャラクター情報
const characters = [
  { id: "warrior", name: "剣士", image: "/images/kenshi.png", description: "HPが高く、攻撃力は標準クラス。", hp: 150, Attack: 100 },
  { id: "fighter", name: "武闘家", image: "/images/butouka.png", description: "攻撃力が高いがHPが低い。", hp: 50, Attack: 250 },
  { id: "wizard", name: "魔法使い", image: "/images/mahoutsukai.png", description: "HP回復やヒントを見る能力がある。", hp: 80, Attack: 80 },
];

// 敵情報
const enemies = [
  { id: "slime", name: "スライム", image: "/images/slime.png", hp: 100, attack: 30, description: "最弱の敵。攻撃力も低い。" },
  { id: "goblin", name: "ゴブリン", image: "/images/goblin.png", hp: 150, attack: 50, description: "素早い敵。HPはそこそこ。" },
  { id: "mimic", name: "ミミック", image: "/images/mimic.png", hp: 200, attack: 80, description: "まあまあ強い。" },
  { id: "dragon", name: "ドラゴン", image: "/images/dragon.png", hp: 1000, attack: 1000, description: "強力なボス。攻撃力も高い。" },
];

// キャラクター選択画面
const CharacterSelect = ({ onSelect }: { onSelect: (characterId: string) => void }) => {
  return (
    <div className="text-center mt-5">
      <h2 className="text-4xl md:text-5xl font-bold mb-8">キャラクターを選択してください</h2>
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-5">
        {characters.map((char) => (
          <div
            key={char.id}
            className="cursor-pointer hover:scale-105 transform transition-all duration-200 border-2 border-gray-500 rounded-xl flex flex-col items-center justify-start p-4 w-64 h-85 md:w-60 md:h-94"
            onClick={() => onSelect(char.id)}
          >
            <img src={char.image} alt={char.name} className="w-32 h-40 md:w-40 md:h-50 mb-4 mx-auto" />
            <p className="text-xl font-bold">{char.name}</p>
            <div className="border border-gray-400 p-1 mt-2 bg-yellow-50">
              <p className="text-sm text-gray-800">HP（ライフ）： {char.hp}</p>
              <p className="text-sm text-gray-800">攻撃力： {char.Attack}</p>
            </div>
            <p className="text-sm text-gray-600 mt-3">{char.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ステージに応じて敵を取得する
const getEnemyForStage = (stage: number) => {
  // ステージに応じて敵を変える
  if (stage < 2) return enemies[0];
  if (stage < 3) return enemies[1];
  if (stage < 4) return enemies[2];
  return enemies[3];
};

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
  { threshold: 1, comment: "クイズ戦士に昇格！戦場に立つ準備は万端だ！" },
  { threshold: 2, comment: "駆け出しの旅人！君の旅はまだ始まったばかりだが、光るものがある！" },
  { threshold: 3, comment: "森の探求者！知識の森をどんどん進んでいるぞ！" },
  { threshold: 4, comment: "知識の斧使い！切れ味鋭いひらめきで問題を斬り伏せている！" },
  { threshold: 5, comment: "真理の魔術師！その回答、まるで呪文のように正確だ！" },
  { threshold: 6, comment: "叡智の騎士！堂々とした実力、もはや上級者の風格！" },
  { threshold: 7, comment: "謎解きの導師！ひらめきが熟練の域に達しているぞ…！" },
  { threshold: 8, comment: "迷宮の守護者！難問の迷宮も恐れない胆力を感じる！" },
  { threshold: 9, comment: "啓示の賢者！まるで答えが見えているかのような閃きだ！" },
  { threshold: 10, comment: "閃光の剣士 ⚔️ ！回答の速さと正確さが光のようだ！" },
  { threshold: 11, comment: "深淵の呪術師 🔮！常人には見えない答えを引き寄せている…！" },
  { threshold: 12, comment: "千里眼の召喚士 👁️！問題の先まで見抜いているのか！？" },
  { threshold: 13, comment: "叡智の勇者 🛡️！知識と勇気を兼ね備えた英雄だ！" },
  { threshold: 14, comment: "迷宮の支配者 👑！問題の方が君を避けているレベル！" },
  { threshold: 15, comment: "混沌の覇者 🌀！あらゆる難問をねじ伏せる圧倒的なパワー！" },
  { threshold: 16, comment: "運命の大賢者 ⭐！君の選択はすべて正解へ導かれている…！" },
  { threshold: 17, comment: "世界樹の賢王 🌳！知識の生命力が桁違いだ！" },
  { threshold: 18, comment: "次元超越者 🌌！もう次元が違う…これは人間離れしている！" },
  { threshold: 19, comment: "世界トップランカー！ここまで来ると本物の化け物級！" },
  { threshold: 20, comment: "ビギナーマスター 🏆！強すぎる！完全に覚醒してる！" },
  { threshold: 21, comment: "フロアマスター 🏆！あらゆるステージを制覇する者の風格だ！" },
  { threshold: 22, comment: "グランドマスター 🏆！歴戦の賢者のような威厳がある！" },
  { threshold: 23, comment: "クイズマスター 🏆！最強の中の最強…殿堂入りレベル！" },
  { threshold: 24, comment: "レジェンドクイズマスター 🌟！伝説に語り継がれる存在だ…！" },
  { threshold: 25, comment: "クイズ王✨！一番すごい称号に到達だ…！おめでとう！！" },
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

  const [character, setCharacter] = useState<string | null>(null); // 選択したキャラクター
  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);
  const [characterHP, setCharacterHP] = useState<number | null>(null);
  const [enemyHP, setEnemyHP] = useState<number | null>(null);
  const [attackMessage, setAttackMessage] = useState<string | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [showStageIntro, setShowStageIntro] = useState(false);
  const [enemyDefeatedMessage, setEnemyDefeatedMessage] = useState<string | null>(null);
  const [deathMessage, setDeathMessage] = useState<string | null>(null);

  const finishedRef = useRef(finished);
  const showCorrectRef = useRef(showCorrectMessage);

  const titles = [
    { threshold: 1, title: "クイズ戦士" },
    { threshold: 2, title: "駆け出しの旅人" },
    { threshold: 3, title: "森の探求者" },
    { threshold: 4, title: "知識の斧使い" },
    { threshold: 5, title: "真理の魔術師" },
    { threshold: 6, title: "叡智の騎士" },
    { threshold: 7, title: "謎解きの導師" },
    { threshold: 8, title: "迷宮の守護者" },
    { threshold: 9, title: "啓示の賢者" },
    { threshold: 10, title: "閃光の剣士 ⚔️" },
    { threshold: 11, title: "深淵の呪術師 🔮" },
    { threshold: 12, title: "千里眼の召喚士 👁️" },
    { threshold: 13, title: "叡智の勇者 🛡️" },
    { threshold: 14, title: "迷宮の支配者 👑" },
    { threshold: 15, title: "混沌の覇者 🌀" },
    { threshold: 16, title: "運命の大賢者 ⭐" },
    { threshold: 17, title: "世界樹の賢王 🌳" },
    { threshold: 18, title: "次元超越者 🌌" },
    { threshold: 19, title: "世界トップランカー" },
    { threshold: 20, title: "ビギナーマスター 🏆" },
    { threshold: 21, title: "フロアマスター 🏆" },
    { threshold: 22, title: "グランドマスター 🏆" },
    { threshold: 23, title: "クイズマスター 🏆" },
    { threshold: 24, title: "レジェンドクイズマスター 🌟" },
    { threshold: 25, title: "クイズ王✨" },
  ];

  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);

  useEffect(() => {
    showCorrectRef.current = showCorrectMessage;
  }, [showCorrectMessage]);

  useEffect(() => {
    if (!character) return; // キャラ選択前は取得しない
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
  }, [mode, genre, character]);

  useEffect(() => {
    if (character) {
      const char = characters.find(c => c.id === character);
      if (char) setCharacterHP(char.hp);
      setEnemyHP(getEnemyForStage(1).hp);
    }
  }, [character]);

  useEffect(() => {
    setShowStageIntro(true);
    setTimeout(() => setShowStageIntro(false), 3500);
}, [currentStage]);

  const shuffleArray = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const checkAnswer = () => {
    const correctAnswer = questions[currentIndex].quiz?.answer;
    const displayAnswer = questions[currentIndex].quiz?.displayAnswer;

    if (userAnswer === correctAnswer) {
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

  const animateHP = (
    startHP: number, 
    damage: number, 
    setHP: React.Dispatch<React.SetStateAction<number | null>>, 
    callback: () => void
  ) => {
    let currentHP = startHP;
    const targetHP = Math.max(startHP - damage, 0); // ここで0未満にならないように

    const interval = setInterval(() => {
      currentHP = Math.max(currentHP - 1, targetHP);
      setHP(currentHP);

      if (currentHP <= targetHP) {
        clearInterval(interval);
        callback();
      }
    }, 15); // 1減少ごとに10ms
  };

  const attackEnemy = () => {
    const player = characters.find(c => c.id === character);
    if (!player || enemyHP === null) return;

    setShowCorrectMessage(false);
    setIncorrectMessage(null);

    setIsAttacking(true);
    setAttackMessage(`${player.name}の攻撃！${getEnemyForStage(currentStage + 1).name}に${player.Attack}のダメージ！`);

    animateHP(enemyHP, player.Attack, setEnemyHP, () => {
      const remainingHP = (enemyHP ?? 0) - player.Attack;

      if (remainingHP <= 0) {
        // 敵を倒したメッセージをセット
        const enemyName = getEnemyForStage(currentStage + 1).name;
        setEnemyDefeatedMessage(`🎉 ${enemyName} を倒した！`);
        setAttackMessage(null);

        // 少し待ってから次のステージへ
        setTimeout(() => {
          const nextStage = currentStage + 1;
          setCorrectCount(c => c + 1);
          setCurrentStage(nextStage);

          const nextEnemy = getEnemyForStage(nextStage + 1);
          setEnemyHP(nextEnemy.hp);

          // メッセージを消す
          setEnemyDefeatedMessage(null);
          setIsAttacking(false);

          // 次の問題へ
          nextQuestion();
        }, 3500); // 1.5秒表示
      }else{
        // 攻撃アニメ終了後にメッセージを消して次の問題へ
        setTimeout(() => {
          setIsAttacking(false);
          setAttackMessage(null);
          nextQuestion();
        }, 1000); // 1秒表示
      }
    });
  };

  const attackCharacter = () => {
    const enemy = getEnemyForStage(currentStage + 1);
    if (characterHP === null || enemyHP === null) return;

    setShowCorrectMessage(false);
    setIncorrectMessage(null);

    setIsAttacking(true);
    setAttackMessage(`${enemy.name}の攻撃！${characters.find(c => c.id === character)?.name}に${enemy.attack}のダメージ！`);

    animateHP(characterHP, enemy.attack, setCharacterHP, () => {
      const remainingHP = (characterHP ?? 0) - enemy.attack;

      if (remainingHP <= 0) {
        // メッセージをセット
        setDeathMessage(`力尽きてしまった…`);
        setAttackMessage(null);

        setTimeout(() => {
          setFinished(true);
        }, 3500); // 1.5秒表示
      } else {
        setCharacterHP(remainingHP);
        setTimeout(() => {
          setIsAttacking(false);
          setAttackMessage(null);
          nextQuestion();
        }, 1000);
      }
    });
  };

  const StageIntro = ({ enemy }: { enemy: typeof enemies[0] }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
        <img src={enemy.image} alt={enemy.name} className="w-40 h-40 md:w-60 md:h-60 mb-4 animate-bounce" />
        <p className="text-4xl md:text-6xl font-extrabold text-yellow-400 drop-shadow-lg animate-pulse">
          {enemy.name} が現れた！
        </p>
      </div>
    );
  };

  // キャラクター選択前は CharacterSelect を表示
  if (!character) {
    return <CharacterSelect onSelect={setCharacter} />;
  }

  if (questions.length === 0) return <p></p>;

  return (
    <>
    {showStageIntro && <StageIntro enemy={getEnemyForStage(currentStage + 1)} />}
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-purple-50 via-purple-100 to-purple-200">
      {!finished ? (
        <>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-purple-500 drop-shadow-lg">
            STAGE {currentStage + 1}
          </h2>

          <div className="mb-6 bg-white p-3 border border-yellow-400 rounded-xl mx-auto w-full max-w-md md:max-w-xl">
            <p className="text-2xl text-center mb-4">{getEnemyForStage(currentStage + 1).name}が現れた！</p>
            {/* 横並び */}
            <div className="flex flex-col items-center md:flex-row justify-center md:gap-12">
              {/* 自分のキャラクター */}
              {character && (
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <img
                    src={characters.find(c => c.id === character)?.image}
                    alt={characters.find(c => c.id === character)?.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-gray-500"
                  />
                  <div className="flex flex-col items-start">
                    <p className="text-xl md:text-2xl font-bold">
                      {characters.find(c => c.id === character)?.name}
                    </p>
                    <p className="text-lg md:text-xl font-semibold">
                      HP: {characterHP}
                    </p>
                  </div>
                </div>
              )}

              {/* 敵キャラクター */}
              <div className="flex items-center gap-4">
                <img
                  src={getEnemyForStage(currentStage + 1).image}
                  alt={getEnemyForStage(currentStage + 1).name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-red-500"
                />
                <div className="flex flex-col items-start">
                  <p className="text-xl md:text-2xl font-bold text-red-500">
                    {getEnemyForStage(currentStage + 1).name}
                  </p>
                  <p className="text-lg md:text-xl font-semibold text-red-500">
                    HP: {enemyHP}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {attackMessage && (
            <p className="text-2xl md:text-4xl font-bold text-red-500 mb-4">
              {attackMessage}
            </p>
          )}

          {enemyDefeatedMessage && (
            <p className="text-3xl md:text-5xl font-bold text-blue-500 mb-4 animate-bounce">
              {enemyDefeatedMessage}
            </p>
          )}

          {deathMessage && (
            <p className="text-3xl md:text-5xl font-bold text-red-500 mb-4 animate-bounce">
              {deathMessage}
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
                        onClick={attackEnemy}
                      >
                        相手に攻撃だ！🔥
                      </button>
                    )}
                    {incorrectMessage && (
                      <button
                        className="px-5 py-3 md:px-6 md:py-3 bg-red-500 border border-black text-white text-lg md:text-xl font-medium rounded hover:bg-red-600 cursor-pointer"
                        onClick={attackCharacter}
                      >
                        やばい！相手からの攻撃だ！
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* 選択肢表示 */}
              {!showCorrectMessage && !incorrectMessage && !isAttacking && (
                <QuizQuestion
                  quiz={questions[currentIndex].quiz}
                  userAnswer={userAnswer}
                  setUserAnswer={setUserAnswer}
                />
              )}

              {/* 回答ボタン */}
              {!showCorrectMessage && !incorrectMessage && !isAttacking && (
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
    </>
  );
}
