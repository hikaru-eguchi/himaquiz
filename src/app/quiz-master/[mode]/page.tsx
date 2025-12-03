"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";

// キャラクター情報
const characters = [
  { id: "warrior", name: "剣士", image: "/images/kenshi.png", description: "HPが高く、攻撃力は標準クラス。", hp: 150, Attack: 100 },
  { id: "fighter", name: "武闘家", image: "/images/butouka.png", description: "攻撃力が圧倒的に高い。", hp: 50, Attack: 250 },
  { id: "wizard", name: "魔法使い", image: "/images/mahoutsukai.png", description: "HP回復やヒントを見る能力がある。", hp: 50000, Attack: 80000 },
];

// 敵情報
const enemies = [
  { id: "slime", name: "スライム", image: "/images/slime.png", hp: 100, attack: 30, description: "ぷるぷるして弱そうに見えるが油断は禁物。" },
  { id: "goblin", name: "ゴブリン", image: "/images/goblin.png", hp: 200, attack: 60, description: "素早く群れで襲いかかる小型のモンスター。" },
  { id: "mimic", name: "ミミック", image: "/images/mimic.png", hp: 350, attack: 120, description: "宝箱に化けるトリッキーな敵。油断すると噛まれる！" },
  { id: "berserker", name: "バーサーカー", image: "/images/berserker.png", hp: 500, attack: 200, description: "理性を失った狂戦士。攻撃力が非常に高い。" },
  { id: "fenikkusu", name: "フェニックス", image: "/images/fenikkusu.png", hp: 1000, attack: 330, description: "不死鳥の炎を操る神秘的な生物。燃え盛る翼で攻撃。" },
  { id: "dragon", name: "ドラゴン", image: "/images/dragon.png", hp: 2000, attack: 600, description: "火を吹く巨大竜。圧倒的な力を誇る古代の王者。" },
  { id: "blackdragon", name: "ブラックドラゴン", image: "/images/blackdragon.png", hp: 3500, attack: 850, description: "闇の力を宿す黒竜。魔法攻撃も強力。" },
  { id: "leviathan", name: "リヴァイアサン", image: "/images/leviathan.png", hp: 5000, attack: 1200, description: "海の深淵から現れる巨大モンスター。水流で圧倒する。" },
  { id: "poseidon", name: "ポセイドン", image: "/images/poseidon.png", hp: 7000, attack: 2000, description: "海の神。雷と津波で敵を蹴散らす力を持つ。" },
  { id: "gundarimyouou", name: "軍荼利明王（ぐんだりみょうおう）", image: "/images/gundarimyouou.png", hp: 8500, attack: 3000, description: "仏教の怒りの守護神。恐怖の炎で全てを焼き尽くす。" },
  { id: "hades", name: "ハデス", image: "/images/hades.png", hp: 10000, attack: 4000, description: "冥界の支配者。死者の力を操り、強大な攻撃を仕掛ける。" },
  { id: "zeus", name: "ゼウス", image: "/images/zeus.png", hp: 12000, attack: 5000, description: "天空の王。雷霆を操る全知全能の神。" },
  { id: "ordin", name: "オーディン", image: "/images/ordin.png", hp: 15000, attack: 8000, description: "知恵と戦の神。魔法と剣技を極めた伝説の戦士。" },
  { id: "yuusya_game", name: "初代クイズマスターの最強勇者", image: "/images/yuusya_game.png", hp: 20000, attack: 20000, description: "全てのクイズと戦闘を制した伝説の勇者。前人未到の強さを誇る。" },
];

// キャラクター選択画面
const CharacterSelect = ({ onSelect }: { onSelect: (characterId: string) => void }) => {
  return (
    <div className="text-center mt-5">
      <h2 className="text-2xl md:text-4xl font-bold mb-8">キャラクターを選択してください</h2>
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-5">
        {characters.map((char) => (
          <div
            key={char.id}
            className={`cursor-pointer hover:scale-105 transform transition-all duration-200 border-2 border-gray-500 rounded-xl flex flex-col items-center justify-start p-4 w-64 h-72 md:w-60 md:h-94 ${
              char.id === "warrior"
                ? "bg-gradient-to-r from-blue-400 via-blue-200 to-cyan-300"
                : char.id === "fighter"
                ? "bg-gradient-to-r from-red-400 via-orange-200 to-yellow-300"
                : char.id === "wizard"
                ? "bg-gradient-to-r from-purple-400 via-pink-200 to-pink-300"
                : "bg-gray-50"
            }`}
            onClick={() => onSelect(char.id)}
          >
            <img src={char.image} alt={char.name} className="w-25 h-30 md:w-40 md:h-50 mb-4 mx-auto" />
            <p className="text-xl font-bold">{char.name}</p>
            <p className="text-sm text-gray-900 mt-1">{char.description}</p>
            <div className="border border-gray-400 p-2 mt-2 bg-white">
              <p className="text-sm text-gray-800">HP（ライフ）： {char.hp}</p>
              <p className="text-sm text-gray-800">攻撃力： {char.Attack}</p>
            </div>
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
  if (stage < 5) return enemies[3];
  if (stage < 6) return enemies[4];
  if (stage < 7) return enemies[5];
  if (stage < 8) return enemies[6];
  if (stage < 9) return enemies[7];
  if (stage < 10) return enemies[8];
  if (stage < 11) return enemies[9];
  if (stage < 12) return enemies[10];
  if (stage < 13) return enemies[11];
  if (stage < 14) return enemies[12];
  if (stage < 15) return enemies[13];
  return enemies[13];
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
    hint?: string;
  };
}

// 正解数に応じて出すコメント
const rankComments = [
  { threshold: 0, comment: "ここから冒険の始まりだ！ゆっくり進んでいこう！" },
  { threshold: 1, comment: "クイズ戦士に昇格！戦場に立つ準備は万端だ！" },
  { threshold: 2, comment: "謎解きファイター！試練に立ち向かう力がついてきた！" },
  { threshold: 3, comment: "頭脳の騎士！君の知識が冒険の武器になる！" },
  { threshold: 4, comment: "ひらめきハンター！まるで答えが見えているかのような閃きだ！" },
  { threshold: 5, comment: "真理の探究者！知識の深みを極め、迷宮を読み解く力がある！" },
  { threshold: 6, comment: "知恵の勇者！知識と勇気を兼ね備えた英雄だ！" },
  { threshold: 7, comment: "クイズ大賢者！君の選択はすべて正解へ導かれている…！" },
  { threshold: 8, comment: "答えの覇者！あらゆる難問をねじ伏せる圧倒的なパワー！" },
  { threshold: 9, comment: "クイズ超越者！もう次元が違う…これは人間離れしている！" },
  { threshold: 10, comment: "フロアマスター！あらゆるステージを制覇する者の風格だ！" },
  { threshold: 11, comment: "グランドマスター！歴戦の賢者のような威厳がある！" },
  { threshold: 12, comment: "クイズマスター！最強の中の最強…殿堂入りレベル！" },
  { threshold: 13, comment: "レジェンドクイズマスター！伝説に語り継がれる存在だ…！" },
  { threshold: 14, comment: "クイズ王…！ついにクイズマスターを倒した！🎉一番すごい称号に到達だ！✨" },
];

const QuizResult = ({ correctCount, getTitle, titles }: { correctCount: number, getTitle: () => string, titles: { threshold: number, title: string }[] }) => {

  const [showScore, setShowScore] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const isFinalStage = correctCount === 14;

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
      {showText && <p className="text-xl md:text-2xl text-gray-600 mb-2">あなたの称号は…</p>}

      {showRank && (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center mb-10 gap-4 md:gap-10">
            <img src="/images/yuusya_game.png" alt="勇者" className="w-0 h-0 md:w-50 md:h-60" />
            <p
              className={`text-4xl md:text-6xl font-bold drop-shadow-lg text-center animate-pulse ${
                isFinalStage ? "final-title text-yellow-300" : "text-blue-600"
              }`}
            >
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
  const [showAttackEffect, setShowAttackEffect] = useState(false);
  const [showEnemyAttackEffect, setShowEnemyAttackEffect] = useState(false);
  const [enemyDefeatedMessage, setEnemyDefeatedMessage] = useState<string | null>(null);
  const [deathMessage, setDeathMessage] = useState<string | null>(null);
  const [characterLevel, setCharacterLevel] = useState(1);
  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);
  const [showNextStageButton, setShowNextStageButton] = useState(false);
  const [showMagicButtons, setShowMagicButtons] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [healing, setHealing] = useState<number | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isBlinkingEnemy, setIsBlinkingEnemy] = useState(false);
  const [enemyVisible, setEnemyVisible] = useState(true);
  const [miracleSeedCount, setMiracleSeedCount] = useState(0); // 所持数
  const [miracleSeedMessage, setMiracleSeedMessage] = useState<string | null>(null); // ドロップメッセージ

  const finishedRef = useRef(finished);
  const showCorrectRef = useRef(showCorrectMessage);

  const titles = [
    { threshold: 1, title: "クイズ戦士" },
    { threshold: 2, title: "謎解きファイター" },
    { threshold: 3, title: "頭脳の騎士" },
    { threshold: 4, title: "ひらめきハンター" },
    { threshold: 5, title: "真理の探究者" },
    { threshold: 6, title: "知恵の勇者 🛡️" },
    { threshold: 7, title: "クイズ大賢者 ⭐" },
    { threshold: 8, title: "答えの覇者 🌀" },
    { threshold: 9, title: "クイズ超越者 🌌" },
    { threshold: 10, title: "フロアマスター 🏆" },
    { threshold: 11, title: "グランドマスター 🏆" },
    { threshold: 12, title: "クイズマスター 🏆" },
    { threshold: 13, title: "レジェンドクイズマスター 🌟" },
    { threshold: 14, title: "✨クイズ王👑" },
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
              hint: a.quiz!.hint,
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
    setTimeout(() => setShowStageIntro(false), 4000);
  }, [currentStage]);
  
  useEffect(() => {
    if (character === "wizard") {
      setShowMagicButtons(true);
    } else {
      setShowMagicButtons(false);
    }
    setHintText(null); // 次の問題でヒント非表示
  }, [currentIndex, character]);

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
    setLevelUp(null);
    setHealing(null);

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
    callback: () => void,
    speed: number
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
    }, speed); // 1減少ごとに10ms→ステージによって変化する
  };

  const attackEnemy = () => {
    const player = characters.find(c => c.id === character);
    if (!player || enemyHP === null) return;

    // ⭐ 攻撃エフェクト表示！
    setShowAttackEffect(true);

    setShowCorrectMessage(false);
    setIncorrectMessage(null);

    setIsAttacking(true);
    const attackPower = getCharacterAttack();

    // アニメーション開始前に startHP をキャプチャ
    const startHP = enemyHP ?? 0;
    setAttackMessage(`${player.name}の攻撃！${getEnemyForStage(currentStage + 1).name}に${attackPower}のダメージ！`);

    const speed = getSpeedByStage(currentStage);

    // ⭐ AttackEffect が終わってから HP を減らす
    setTimeout(() => {
      // エフェクト消す
      setShowAttackEffect(false);

      setIsBlinkingEnemy(true);
      animateHP(startHP, attackPower, setEnemyHP, () => {
        const remainingHP = startHP - attackPower;

        if (remainingHP <= 0) {
          setIsBlinkingEnemy(false);

          // フェードアウト開始
          setEnemyVisible(false);

          // 敵を倒したメッセージをセット
          const enemyName = getEnemyForStage(currentStage + 1).name;
          setEnemyDefeatedMessage(`🎉 ${enemyName} を倒した！`);
          setAttackMessage(null);

          // ドロップ判定（10分の1）
          const dropChance = Math.random();
          if (dropChance < 0.05) {
            setMiracleSeedCount(prev => prev + 1);
            setMiracleSeedMessage("伝説の果実🍏を手に入れた！✨");
          }

          // 現在のレベルを変数に保持（レベルアップ表示用）
          const newLevel = characterLevel + currentStage + 1;

          // 🎉 ステージごとにレベル +ステージの数
          setCharacterLevel(newLevel);
          setCharacterHP(prevHP => {
            const baseHP = characters.find(c => c.id === character)?.hp ?? 0;
            return (prevHP ?? 0) + baseHP * (currentStage + 1);
          });

          // ⭐ レベルアップメッセージをセット！
          setLevelUpMessage(`✨レベル ${newLevel} に上がった！`);

          // ★★★ 最終ステージ14なら強制終了 ★★★
          if (currentStage + 1 === 14) {
            setTimeout(() => {
              setCurrentStage(currentStage + 1)
              setFinished(true);
            }, 3000); // メッセージをちょっと見せるために2秒待ち（好みで変更可）
            return; // ここで終了して次の処理をしない
          }

          // 次のステージに進むボタンを表示
          setShowNextStageButton(true);
        }else{
          setIsBlinkingEnemy(false);
          // 攻撃アニメ終了後にメッセージを消して次の問題へ
          setTimeout(() => {
            setIsAttacking(false);
            setAttackMessage(null);
            nextQuestion();
          }, 1000); // 1秒表示
        }
      }, speed);
    }, 1500); // ← この間 AttackEffect を見せたい時間（1.2秒など好みで）
  };

  const attackCharacter = () => {
    const enemy = getEnemyForStage(currentStage + 1);
    if (characterHP === null || enemyHP === null) return;

    // ⭐ 敵攻撃エフェクト表示！
    setShowEnemyAttackEffect(true);

    setShowCorrectMessage(false);
    setIncorrectMessage(null);

    setIsAttacking(true);
    setAttackMessage(`${enemy.name}の攻撃！${characters.find(c => c.id === character)?.name}に${enemy.attack}のダメージ！`);

    const speed = getSpeedByStage(currentStage);

    // ⭐ EnemyAttackEffect が終わってから HP を減らす
    setTimeout(() => {
      // エフェクト消す
      setShowEnemyAttackEffect(false);

      setIsBlinking(true);
      animateHP(characterHP, enemy.attack, setCharacterHP, () => {
        const remainingHP = (characterHP ?? 0) - enemy.attack;

        if (remainingHP <= 0) {
          setIsBlinking(false);
          // メッセージをセット
          setDeathMessage(`力尽きてしまった…`);
          setAttackMessage(null);

          setTimeout(() => {
            setFinished(true);
          }, 3500); // 1.5秒表示
        } else {
          setIsBlinking(false);
          setCharacterHP(remainingHP);
          setTimeout(() => {
            setIsAttacking(false);
            setAttackMessage(null);
            nextQuestion();
          }, 1000);
        }
      }, speed);
    }, 1500); // ← この間 EnemyAttackEffect を見せたい時間（1.2秒など好みで）
  };

  const StageIntro = ({ enemy }: { enemy: typeof enemies[0] }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
        <img src={enemy.image} alt={enemy.name} className="w-40 h-40 md:w-60 md:h-60 mb-4 animate-bounce" />
        <p className="max-w-[340px] md:max-w-full text-4xl md:text-6xl font-extrabold text-yellow-300 drop-shadow-lg animate-pulse">
          {enemy.name}が現れた！
        </p>
      </div>
    );
  };

  const AttackEffect = ({ chara }: { chara?: (typeof characters)[number] }) => {
    if (!chara) return null;

    const isWarrior = chara.id === "warrior";
    const isFighter = chara.id === "fighter";
    const isWizard = chara.id === "wizard";

    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden">

        {/* === 背景エフェクト === */}
        {isWarrior && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-blue-500 to-cyan-400 animate-bg-fade"></div>
        )}
        {isFighter && (
          <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-orange-600 to-yellow-400 animate-bg-fade"></div>
        )}
        {isWizard && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-indigo-700 to-pink-500 animate-bg-fade"></div>
        )}

        {/* === 技エフェクト === */}

        {/* 剣士：斬撃エフェクト */}
        {isWarrior && (
          <>
            <div className="absolute w-[150%] h-[4px] bg-blue-400 rotate-45 animate-slash-1"></div>
            <div className="absolute w-[150%] h-[4px] bg-blue-400 rotate-135 animate-slash-2"></div>
            <div className="absolute w-[150%] h-[4px] bg-blue-400 rotate-90 animate-slash-3"></div>
            <div className="absolute w-[150%] h-[4px] bg-blue-400 rotate-0 animate-slash-4"></div>
          </>
        )}

        {/* 武闘家：拳圧（衝撃波） */}
        {isFighter && (
          <>
            {/* 上の円 */}
            <div className="absolute w-48 h-48 bg-orange-300 rounded-full opacity-40 animate-fist-1"
                style={{ top: "20%", left: "30%", transform: "translateX(-50%)" }}></div>

            {/* 左下の円 */}
            <div className="absolute w-48 h-48 bg-orange-300 rounded-full opacity-40 animate-fist-2"
                style={{ top: "50%", left: "10%", transform: "translate(-50%, -50%)" }}></div>

            {/* 右下の円 */}
            <div className="absolute w-48 h-48 bg-orange-300 rounded-full opacity-40 animate-fist-3"
                style={{ top: "50%", left: "65%", transform: "translate(-50%, -50%)" }}></div>
          </>
        )}

        {/* 魔法使い：魔方陣 */}
        {isWizard && (
          <div className="absolute w-56 h-56 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* 外円 */}
            <div className="absolute w-full h-full border-4 border-purple-400 rounded-full animate-rotate-clockwise"></div>
            
            {/* 内側の模様を大きめに */}
            <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 rotate-0 animate-rotate-counterclockwise"></div>
            <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 rotate-60 animate-rotate-counterclockwise"></div>
            <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 rotate-120 animate-rotate-counterclockwise"></div>
            <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 rotate-180 animate-rotate-counterclockwise"></div>
            <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 rotate-240 animate-rotate-counterclockwise"></div>
            <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 rotate-300 animate-rotate-counterclockwise"></div>
          
            {/* 外側に広がる円 */}
            <div className="absolute w-56 h-56 border-2 border-purple-200 rounded-full opacity-50 animate-expand-circle top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        )}


        {/* === キャラ画像（右からスライドイン） === */}
        <img
          src={chara.image}
          alt={chara.name}
          className="w-40 h-40 md:w-60 md:h-60 animate-slide-in"
        />

        {/* === 攻撃文字 === */}
        <p
          className={`mt-4 text-5xl md:text-7xl font-extrabold drop-shadow-2xl animate-swing
            ${isWarrior ? "text-blue-100" : ""}
            ${isFighter ? "text-orange-100" : ""}
            ${isWizard ? "text-purple-100" : ""}
          `}
        >
          {chara.name}の攻撃！
        </p>
      </div>
    );
  };

  const EnemyAttackEffect = ({ enemy }: { enemy: typeof enemies[0] }) => {
    if (!enemy) return null;

    // === ここで敵の種類によって演出を決定 ===
    const id = enemy.id;

    const bgColor =
      id === "slime" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "goblin" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "mimic" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "berserker" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "fenikkusu" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "dragon" ? "bg-gradient-to-r from-red-800 via-orange-600 to-yellow-400" :
      id === "blackdragon" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "leviathan" ? "bg-gradient-to-r from-blue-900 via-blue-600 to-cyan-400" :
      id === "poseidon" ? "bg-gradient-to-r from-blue-900 via-blue-500 to-yellow-400" :
      id === "gundarimyouou" ? "bg-gradient-to-r from-red-800 via-orange-600 to-purple-900" :
      id === "hades" ? "bg-gradient-to-r from-indigo-900 via-purple-800 to-black" :
      id === "zeus" ? "bg-gradient-to-r from-blue-800 via-cyan-400 to-white" :
      id === "ordin" ? "bg-gradient-to-r from-gray-900 via-purple-700 to-yellow-400" :
      id === "yuusya_game" ? "bg-gradient-to-r from-purple-700 via-red-700 to-yellow-400 bg-opacity-80" :
      "bg-gray-900 bg-opacity-60";

    // 攻撃用カラー
    const textColor =
      id === "slime" ? "text-blue-100" :
      id === "goblin" ? "text-purple-100" :
      id === "mimic" ? "text-purple-100" :
      id === "berserker" ? "text-purple-100" :
      id === "fenikkusu" ? "text-red-100" :
      id === "dragon" ? "text-red-100" :
      id === "blackdragon" ? "text-purple-100" :
      id === "leviathan" ? "text-blue-100" :
      id === "poseidon" ? "text-blue-100" :
      id === "gundarimyouou" ? "text-blue-100" :
      id === "hades" ? "text-indigo-100" :
      id === "zeus" ? "text-yellow-100" :
      id === "ordin" ? "text-gray-100" :
      id === "yuusya_game" ? "text-yellow-100" :
      "text-white";

    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden`}>
        
        {/* === 背景（敵ごとに色変更） === */}
        <div className={`absolute inset-0 animate-bg-fade ${bgColor}`}></div>

        {/* === 敵ごとの攻撃エフェクト === */}

        {/* スライム：かわいい水しぶき */}
        {id === "slime" && (
          <div className="absolute w-50 h-50 bg-blue-300 rounded-full opacity-40 animate-enemy-slime-wave"></div>
        )}

        {/* ゴブリン：切りつけ */}
        {id === "goblin" && (
          <div className="absolute animate-enemy-slash"></div>
        )}

        {/* ミミック：かみつき */}
        {id === "mimic" && (
          <div className="absolute w-48 h-48 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-start gap-7 z-50">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-2 h-30 bg-white animate-enemy-bite"
                style={{ animationDelay: '0.5s' }}
              ></div>
            ))}
          </div>
        )}

        {/* バーサーカー：切りつけ */}
        {id === "berserker" && (
          <>
            <div className="absolute w-[150%] h-[4px] bg-white rotate-45 animate-slashb-1"></div>
            <div className="absolute w-[150%] h-[4px] bg-white rotate-135 animate-slashb-2"></div>
            <div className="absolute w-[150%] h-[4px] bg-white rotate-90 animate-slashb-3"></div>
          </>
        )}

        {/* フェニックス：炎の波動 */}
        {id === "fenikkusu" && (
          <div className="absolute w-56 h-56 bg-red-300 opacity-40 rounded-full animate-enemy-fire"></div>
        )}

        {/* ドラゴン：火炎ブレス */}
        {id === "dragon" && (
          <div className="absolute w-56 h-56 bg-red-200 opacity-40 rounded-full animate-enemy-firebreath"></div>
        )}

        {/* ブラックドラゴン：闇の爆発 */}
        {id === "blackdragon" && (
          <div className="absolute w-72 h-72 bg-black opacity-60 rounded-full animate-enemy-darkburst"></div>
        )}

        {/* リヴァイアサン：水流 */}
        {id === "leviathan" && (
          <>
            {/* 最初の水流 */}
            <div className="absolute w-64 h-64 bg-blue-200 opacity-40 rounded-full animate-enemy-water"></div>

            {/* 遅延させたもう一つの水流 */}
            <div className="absolute w-64 h-64 bg-blue-200 opacity-30 rounded-full animate-enemy-water" style={{ animationDelay: '0.3s' }}></div>

            {/* 遅延させたもう一つの水流 */}
            <div className="absolute w-64 h-64 bg-blue-200 opacity-20 rounded-full animate-enemy-water" style={{ animationDelay: '0.6s' }}></div>
          </>
        )}

        {/* ポセイドン：雷＋津波 */}
        {id === "poseidon" && (
          <>
            <div className="absolute w-56 h-56 bg-blue-400 opacity-0 rounded-full animate-enemy-tsunami"></div>
            <div className="absolute w-48 h-48 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* 三角形の角の位置に落とす稲妻 */}
              <div
                className="absolute w-5 h-100 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '50%', transform: 'translateX(-50%)', animationDelay: '0s' }}
              ></div>
              <div
                className="absolute w-5 h-100 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '25%', top: '-40%', animationDelay: '0.2s' }}
              ></div>
              <div
                className="absolute w-5 h-100 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '75%', top: '-40%', animationDelay: '0.4s' }}
              ></div>
            </div>
            <div className="absolute w-156 h-156 bg-yellow-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '0.4s' }}></div>
            <div className="absolute w-156 h-156 bg-yellow-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '0.8s' }}></div>
            <div className="absolute w-156 h-156 bg-blue-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '1.2s' }}></div>
          </>
        )}

        {/* 軍荼利明王：炎の爆発 */}
        {id === "gundarimyouou" && (
          <>
            <div className="absolute w-80 h-80 bg-blue-500 opacity-30 rounded-full animate-enemy-divine-fire"></div>
            <div className="absolute w-80 h-80 bg-blue-500 opacity-30 rounded-full animate-enemy-divine-fire" style={{ animationDelay: '0.6s' }}></div>
            <div className="absolute w-80 h-80 bg-blue-500 opacity-30 rounded-full animate-enemy-divine-fire" style={{ animationDelay: '1.2s' }}></div>
          </>
        )}

        {/* ハデス：冥界の黒炎 */}
        {id === "hades" && (
          <div className="absolute w-72 h-72 bg-black opacity-50 rounded-full animate-enemy-hellfire"></div>
        )}

        {/* ゼウス：雷 */}
        {id === "zeus" && (
          <>
            <div className="absolute w-48 h-48 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* 三角形の角の位置に落とす稲妻 */}
              <div
                className="absolute w-5 h-100 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '50%', transform: 'translateX(-50%)', animationDelay: '0s' }}
              ></div>
              <div
                className="absolute w-5 h-100 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '25%', top: '-40%', animationDelay: '0.2s' }}
              ></div>
              <div
                className="absolute w-5 h-100 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '75%', top: '-40%', animationDelay: '0.4s' }}
              ></div>
              <div
                className="absolute w-5 h-100 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '0%', top: '0%', animationDelay: '0.6s' }}
              ></div>
              <div
                className="absolute w-5 h-100 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '100%', top: '0%', animationDelay: '0.8s' }}
              ></div>
              <div
                className="absolute w-5 h-100 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '-25%', top: '-40%', animationDelay: '1.0s' }}
              ></div>
              <div
                className="absolute w-5 h-100 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '125%', top: '-40%', animationDelay: '1.2s' }}
              ></div>
            </div>
            <div className="absolute w-156 h-156 bg-yellow-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '0.4s' }}></div>
            <div className="absolute w-156 h-156 bg-yellow-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '0.8s' }}></div>
            <div className="absolute w-156 h-156 bg-yellow-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '1.2s' }}></div>
          </>
        )}

        {/* オーディン：魔法陣＋剣気 */}
        {id === "ordin" && (
          <>
            <div className="absolute w-56 h-56 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {/* 外円 */}
              <div className="absolute w-full h-full border-4 border-yellow-400 rounded-full animate-rotate-clockwise"></div>
              
              {/* 内側の模様を大きめに */}
              <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-yellow-300 rotate-0 animate-rotate-counterclockwise"></div>
              <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-yellow-300 rotate-60 animate-rotate-counterclockwise"></div>
              <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-yellow-300 rotate-120 animate-rotate-counterclockwise"></div>
              <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-yellow-300 rotate-180 animate-rotate-counterclockwise"></div>
              <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-yellow-300 rotate-240 animate-rotate-counterclockwise"></div>
              <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-yellow-300 rotate-300 animate-rotate-counterclockwise"></div>
            </div>
            <div className="absolute w-[150%] h-[4px] bg-yellow-300 rotate-45 animate-slashb-1" style={{ animationDelay: '0.6s' }}></div>
            <div className="absolute w-156 h-156 bg-yellow-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '0.8s' }}></div>
          </>
        )}

        {/* 初代クイズマスター最強勇者：光の爆発 */}
        {id === "yuusya_game" && (
          <>
            <div className="absolute w-[150%] h-[4px] bg-yellow-300 rotate-45 animate-slash-1"></div>
            <div className="absolute w-[150%] h-[4px] bg-yellow-300 rotate-135 animate-slash-2"></div>
            <div className="absolute w-[150%] h-[4px] bg-yellow-300 rotate-90 animate-slash-3"></div>
            <div className="absolute w-[150%] h-[4px] bg-yellow-300 rotate-0 animate-slash-4"></div>
            <div className="absolute w-72 h-72 bg-yellow-300 opacity-40 rounded-full animate-enemy-ultimate" style={{ animationDelay: '1.0s' }}></div>
          </>
        )}

        {/* === 敵画像（左からスライドイン） === */}
        <img
          src={enemy.image}
          alt={enemy.name}
          className="w-40 h-40 md:w-60 md:h-60 animate-enemy-slide-in"
        />

        {/* === 敵攻撃文字 === */}
        <p className={`mt-4 text-5xl md:text-7xl font-extrabold drop-shadow-2xl animate-enemy-swing ${textColor}`}>
          {enemy.name}の攻撃！
        </p>
      </div>
    );
  };

  // ステージごとに減少スピードを返す関数
  const getSpeedByStage = (stage: number) => {
    if (stage <= 2) return 20;
    if (stage <= 4) return 10;
    if (stage <= 6) return 5;
    return 0; // 7以上
  };

  const getCharacterAttack = () => {
    const base = characters.find(c => c.id === character)?.Attack ?? 0;
    return Math.floor(base * (1 + (characterLevel-1) * 0.2));
  };

  // キャラクター選択前は CharacterSelect を表示
  if (!character) {
    return <CharacterSelect onSelect={setCharacter} />;
  }

  if (questions.length === 0) return <p></p>;

  return (
    <>
    {showStageIntro && <StageIntro enemy={getEnemyForStage(currentStage + 1)} />}
    {showAttackEffect && (
      <AttackEffect chara={characters.find(c => c.id === character)} />
    )}
    {showEnemyAttackEffect && (
      <EnemyAttackEffect enemy={getEnemyForStage(currentStage + 1)} />
    )}
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-purple-50 via-purple-100 to-purple-200">
      {!finished ? (
        <>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-purple-500 drop-shadow-lg">
            STAGE {currentStage + 1}
          </h2>

          <div className="mb-3 bg-white p-3 border-2 border-purple-300 rounded-xl mx-auto w-full max-w-md md:max-w-xl">
            <p className="text-xl md:text-2xl text-center mb-2">{getEnemyForStage(currentStage + 1).name}が現れた！クイズに正解して倒そう！</p>
            {/* 横並び */}
            <div className="flex flex-col items-center md:flex-row justify-center md:gap-12">
              {/* 自分のキャラクター */}
              {character && (
                <div
                  className={`flex items-center gap-4 mb-2 md:mb-0 p-3 rounded-xl ${
                    isBlinking ? "red-blink" : "border-purple-300"
                  } ${
                    character === "warrior"
                      ? "bg-gradient-to-r from-blue-400 via-blue-200 to-cyan-300"
                      : character === "fighter"
                      ? "bg-gradient-to-r from-red-400 via-orange-200 to-yellow-300"
                      : character === "wizard"
                      ? "bg-gradient-to-r from-purple-400 via-pink-200 to-pink-300"
                      : "bg-gray-200"
                  }`}
                >
                  <img
                    src={characters.find(c => c.id === character)?.image}
                    alt={characters.find(c => c.id === character)?.name}
                    className="w-20 h-20 md:w-24 md:h-24"
                  />
                  <div className="flex flex-col items-start">
                    <p className="text-xl md:text-2xl font-bold">
                      {characters.find(c => c.id === character)?.name}
                    </p>
                    <p className="text-sm md:text-xl font-semibold">
                      レベル：{characterLevel}
                    </p>
                    <p className="text-sm md:text-xl font-semibold">
                      HP：{characterHP}
                    </p>
                    <p className="text-sm md:text-xl font-semibold">
                      攻撃力：{getCharacterAttack()}
                    </p>
                  </div>
                </div>
              )}

              {/* 敵キャラクター */}
              <div className="flex flex-col gap-1 md:gap-2">
                <div className={`flex items-center gap-4 bg-gradient-to-r from-red-700 via-purple-800 to-black p-3 rounded-xl ${isBlinkingEnemy ? "red-blink" : "border-purple-300"} transition-opacity duration-1000 ${enemyVisible ? "opacity-100" : "opacity-0"}`}>
                  <img
                    src={getEnemyForStage(currentStage + 1).image}
                    alt={getEnemyForStage(currentStage + 1).name}
                    className="w-20 h-20 md:w-24 md:h-24"
                  />
                  <div className="flex flex-col items-start">
                    <p className="text-xl md:text-2xl font-bold text-purple-200 max-w-[100px]">
                      {getEnemyForStage(currentStage + 1).name}
                    </p>
                    <p className="text-sm md:text-xl font-semibold text-purple-200">
                      HP： {enemyHP}
                    </p>
                    <p className="text-sm md:text-xl font-semibold text-purple-200">
                      攻撃力：{getEnemyForStage(currentStage + 1).attack}
                    </p>
                  </div>
                </div>
                <p className="text-lg md:text-xl font-semibold text-gray-600 w-50 md:w-55">
                  {getEnemyForStage(currentStage + 1).description}
                </p>
              </div>
            </div>
          </div>

          {attackMessage && (
            <p className="text-2xl md:text-4xl font-bold mb-4">
              {attackMessage}
            </p>
          )}

          {enemyDefeatedMessage && (
            <p className="text-2xl md:text-4xl font-bold text-blue-500 mb-1 md:mb-4 animate-bounce">
              {enemyDefeatedMessage}
            </p>
          )}

          {levelUpMessage && (
            <div className="flex flex-col items-center gap-2 mb-4">
              <p className="text-2xl md:text-4xl font-bold md:mb-4 animate-bounce 
                            bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 
                            text-transparent bg-clip-text drop-shadow-lg">
                {levelUpMessage}
              </p>
              <p className="text-2xl md:text-4xl font-bold md:mb-4 animate-bounce 
                            bg-red-500
                            text-transparent bg-clip-text drop-shadow-md">
                攻撃力が上がった！
              </p>
              <p className="text-2xl md:text-4xl font-bold md:mb-4 animate-bounce 
                            bg-green-500
                            text-transparent bg-clip-text drop-shadow-md">
                HPが上がった！
              </p>
            </div>
          )}

          {miracleSeedMessage && (
            <p className="
              text-center 
              text-2xl md:text-4xl 
              font-extrabold 
              mb-3 
              bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500 
              text-transparent 
              bg-clip-text 
              drop-shadow-[0_0_10px_yellow] 
              animate-bounce
            ">
              {miracleSeedMessage}
            </p>
          )}

          {/* 次のステージへ進むボタン */}
          {showNextStageButton && (
            <button
              className="px-5 py-3 md:px-6 md:py-4 mb-3 border-2 border-black text-white text-xl md:text-2xl font-bold rounded-xl 
                         bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600
                         hover:from-purple-500 hover:via-purple-600 hover:to-purple-700
                         shadow-lg shadow-pink-300 cursor-pointer animate-pulse"
              onClick={() => {
                const nextStage = currentStage + 1;
                setCorrectCount(c => c + 1);
                setCurrentStage(nextStage);

                const nextEnemy = getEnemyForStage(nextStage + 1);
                setEnemyHP(nextEnemy.hp);

                // メッセージを消す
                setEnemyDefeatedMessage(null);
                setLevelUpMessage(null);
                setIsAttacking(false);
                setShowNextStageButton(false);
                setEnemyVisible(true);
                setMiracleSeedMessage(null);

                nextQuestion();
              }}
            >
              次のステージへ進む
            </button>
          )}

          {deathMessage && (
            <p className="text-2xl md:text-4xl font-bold text-red-500 mb-4 animate-bounce">
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
                        className="px-5 py-3 md:px-6 md:py-3 border border-black text-white text-lg md:text-xl font-medium rounded bg-gradient-to-r from-red-500 via-yellow-500 to-pink-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 cursor-pointer"
                        onClick={attackEnemy}
                      >
                        自分の攻撃！🔥
                      </button>
                    )}
                    {incorrectMessage && (
                      <button
                        className="px-5 py-3 md:px-6 md:py-3 text-white text-lg md:text-xl font-medium rounded border border-black
                                  bg-gradient-to-r from-red-700 via-purple-800 to-black
                                  hover:from-purple-700 hover:via-red-800 hover:to-black
                                  shadow-lg shadow-red-800 cursor-pointer"
                        onClick={attackCharacter}
                      >
                        相手からの攻撃！💀
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

              {!showCorrectMessage && !incorrectMessage && !isAttacking && (
                <>
                  {/* 魔法使い専用ボタン */}
                  {showMagicButtons && (
                    <div>
                      <p className="text-lg md:text-xl">このターンで選べる能力は1つだけです</p>
                      <div className="flex justify-center gap-2 md:gap-4 mt-2 mb-2">
                        <button
                          className="flex-1 md:max-w-[220px] px-4 py-2 text-lg md:text-xl bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 text-black font-bold rounded-lg shadow-md hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-600 border border-yellow-600 transition-all"
                          onClick={() => {
                            setHintText(questions[currentIndex].quiz?.hint || "ヒントはありません");
                            setShowMagicButtons(false);
                          }}
                        >
                          ヒントを見る🔮
                        </button>

                        <button
                          className="flex-1 md:max-w-[220px] px-4 py-2 text-lg md:text-xl bg-gradient-to-r from-green-400 via-green-300 to-green-500 text-black font-bold rounded-lg shadow-md hover:from-green-500 hover:via-green-400 hover:to-green-600 border border-green-600 transition-all"
                          onClick={() => {
                            setCharacterHP(prev => (prev ?? 0) + characterLevel * 25);
                            setShowMagicButtons(false);
                            setHealing(characterLevel * 25);
                          }}
                        >
                          HP回復✨
                        </button>
                      </div>
                    </div>
                  )}
                  {/* ヒント表示 */}
                  {hintText && (
                    <div className="bg-white border-2 border-gray-400 p-2 rounded-xl max-w-md mx-auto">
                      <p className="text-center text-xl md:text-2xl font-semibold text-black mb-2">
                        ヒント💡
                      </p>
                      <p className="text-center text-xl md:text-2xl font-semibold text-blue-600 mb-2">
                        {hintText}
                      </p>
                    </div>
                  )}
                  {/* レベルアップ表示 */}
                  {levelUp && (
                    <p className="text-center text-xl md:text-2xl 
                                  font-semibold mb-1 
                                  bg-gradient-to-r from-blue-500 via-red-400 to-yellow-500 
                                  text-transparent bg-clip-text animate-pulse">
                      レベルが {levelUp} 上がった！
                    </p>
                  )}
                  {/* 攻撃力アップ表示 */}
                  {levelUp && (
                    <p className="text-center text-xl md:text-2xl text-red-500 font-semibold text-black mb-1 animate-pulse">
                      攻撃力が上がった！
                    </p>
                  )}
                  {/* 回復表示 */}
                  {healing && (
                    <p className="text-center text-xl md:text-2xl text-green-500 font-semibold text-black mb-1 animate-pulse">
                      HPが {healing} 上がった！✨
                    </p>
                  )}
                </>
              )}

              {miracleSeedCount > 0 && !isAttacking && !showCorrectMessage && !incorrectMessage && (
                <>
                  <div className="flex justify-center gap-2 md:gap-4 mt-4 mb-2">
                    <button
                      className="px-5 py-3 md:px-6 border-2 border-pink-200 bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500 text-white text-lg md:text-xl font-bold  rounded-lg shadow-md hover:from-yellow-500 hover:via-red-500 hover:to-pink-600 transition-all cursor-pointer"
                      onClick={() => {
                        setCharacterHP(prev => (prev ?? 0) + 5000);
                        setCharacterLevel(prev => prev + 50); // 攻撃力にもレベル依存して加算されます
                        setMiracleSeedCount(prev => prev - 1);
                        setLevelUp(50); // レベルアップ表示
                        setHealing(5000); // 回復表示
                      }}
                    >
                      伝説の果実🍏を使う
                    </button>
                  </div>
                </>
              )}

              {/* 回答ボタン */}
              {!showCorrectMessage && !incorrectMessage && !isAttacking && (
                <button
                  className="px-5 py-3 md:px-6 border border-black bg-blue-500 text-white text-lg md:text-xl font-medium rounded mt-2 hover:bg-blue-600 cursor-pointer"
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
