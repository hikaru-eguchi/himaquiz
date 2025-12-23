"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { useQuestionPhase } from "../../../hooks/useQuestionPhase";

// 敵情報
const enemies = [
  { id: "slime", name: "スライム", image: "/images/slime.png", hp: 100, attack: 50, description: "ぷるぷるして弱そうに見えるが油断は禁物。" },
  { id: "goblin", name: "ゴブリン", image: "/images/goblin.png", hp: 220, attack: 100, description: "素早く群れで襲いかかる小型のモンスター。" },
  { id: "mimic", name: "ミミック", image: "/images/mimic.png", hp: 350, attack: 200, description: "宝箱に化けるトリッキーな敵。油断すると噛まれる！" },
  { id: "berserker", name: "バーサーカー", image: "/images/berserker.png", hp: 500, attack: 400, description: "理性を失った狂戦士。攻撃力が非常に高い。" },
  { id: "fenikkusu", name: "フェニックス", image: "/images/fenikkusu.png", hp: 1000, attack: 650, description: "不死鳥の炎を操る神秘的な生物。燃え盛る翼で攻撃。" },
  { id: "dragon", name: "ドラゴン", image: "/images/dragon.png", hp: 2000, attack: 800, description: "火を吹く巨大竜。圧倒的な力を誇る古代の王者。" },
  { id: "blackdragon", name: "ブラックドラゴン", image: "/images/blackdragon.png", hp: 3500, attack: 1000, description: "闇の力を宿す黒竜。魔法攻撃も強力。" },
  { id: "leviathan", name: "リヴァイアサン", image: "/images/leviathan.png", hp: 5000, attack: 1500, description: "海の深淵から現れる巨大モンスター。水流で圧倒する。" },
  { id: "poseidon", name: "ポセイドン", image: "/images/poseidon.png", hp: 7000, attack: 2000, description: "海の神。雷と津波で敵を蹴散らす力を持つ。" },
  { id: "gundarimyouou", name: "軍荼利明王（ぐんだりみょうおう）", image: "/images/gundarimyouou.png", hp: 8500, attack: 3000, description: "仏教の怒りの守護神。恐怖の炎で全てを焼き尽くす。" },
  { id: "hades", name: "ハデス", image: "/images/hades.png", hp: 10000, attack: 4000, description: "冥界の支配者。死者の力を操り、強大な攻撃を仕掛ける。" },
  { id: "zeus", name: "ゼウス", image: "/images/zeus.png", hp: 12000, attack: 5000, description: "天空の王。雷霆を操る全知全能の神。" },
  { id: "ordin", name: "オーディン", image: "/images/ordin.png", hp: 15000, attack: 8000, description: "知恵と戦の神。魔法と剣技を極めた伝説の戦士。" },
  { id: "yuusya_game", name: "初代クイズマスターの最強勇者", image: "/images/yuusya_game.png", hp: 20000, attack: 20000, description: "全てのクイズと戦闘を制した伝説の勇者。前人未到の強さを誇る。" },
  { id: "quizou", name: "クイズ王", image: "/images/quiz_man.png", hp: 35000, attack: 35000, description: "クイズの王様。クイズ界の支配者。" },
];

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
  if (stage < 16) return enemies[14];
  return enemies[14];
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

interface Player {
  socketId: string;
  playerName: string;
}

interface QuizResultProps {
  correctCount: number;
  stageCount: number;
  titles: { threshold: number; title: string }[];
  getTitle: () => string;
  onRetry: () => void;
  matchEnded: boolean;
  rematchAvailable: boolean;
  rematchRequested : boolean;
  handleNewMatch: () => void;
  handleRematch: () => void;
}

// 正解数に応じて出すコメント
const rankComments = [
  { threshold: 0, comment: "ここから冒険の始まりだ！ゆっくり進んでいこう！" },
  { threshold: 2, comment: "クイズ戦士に昇格！戦場に立つ準備は万端だ！" },
  { threshold: 5, comment: "謎解きファイター！試練に立ち向かう力がついてきた！" },
  { threshold: 7, comment: "頭脳の騎士！君の知識が冒険の武器になる！" },
  { threshold: 10, comment: "ひらめきハンター！まるで答えが見えているかのような閃きだ！" },
  { threshold: 15, comment: "真理の探究者！知識の深みを極め、迷宮を読み解く力がある！" },
  { threshold: 20, comment: "知恵の勇者！知識と勇気を兼ね備えた英雄だ！" },
  { threshold: 25, comment: "クイズ大賢者！君の選択はすべて正解へ導かれている…！" },
  { threshold: 30, comment: "答えの覇者！あらゆる難問をねじ伏せる圧倒的なパワー！" },
  { threshold: 35, comment: "クイズ超越者！もう次元が違う…これは人間離れしている！" },
  { threshold: 40, comment: "フロアマスター！あらゆるステージを制覇する者の風格だ！" },
  { threshold: 45, comment: "グランドマスター！歴戦の賢者のような威厳がある！" },
  { threshold: 50, comment: "クイズマスター！最強の中の最強…殿堂入りレベル！" },
  { threshold: 65, comment: "レジェンドクイズマスター！伝説に語り継がれる存在だ…！" },
  { threshold: 80, comment: "クイズ王…！ついにクイズマスターを倒した！🎉君はクイズ界の王者だ！！" },
  { threshold: 100, comment: "クイズ神…！ついにクイズ王を倒した！🎉🎉一番すごい称号に到達だ！✨" },
];

const QuizResult = ({
  correctCount,
  stageCount,
  titles,
  getTitle,
  onRetry,
  matchEnded,
  rematchAvailable,
  rematchRequested,
  handleNewMatch,
  handleRematch,
}: QuizResultProps) => {
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
    timers.push(setTimeout(() => setShowRank(true), 1300));
    timers.push(setTimeout(() => setShowButton(true), 1500));
    return () => timers.forEach(clearTimeout);
  }, []);


  return (
    <motion.div
      className={`text-center mt-6 p-8 rounded-lg`}
    >

      {/* ============================
          🔥 スコア表示
      ============================ */}
      {showScore && (
        <>
          <p className="text-3xl md:text-5xl mb-2 md:mb-6">
            正解数：{correctCount}問
          </p>

          <p className="text-3xl md:text-5xl font-bold mb-2 md:mb-6">
            {stageCount} ステージまで到達！
          </p>
        </>
      )}

      {showText && <p className="text-xl md:text-2xl text-gray-600 mb-2">あなたの称号は…</p>}

      {showRank && (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center mb-10 gap-4 md:gap-10">
            <img src="/images/yuusya_game.png" alt="勇者" className="w-0 h-0 md:w-50 md:h-60" />
            <p
              className={`text-4xl md:text-6xl font-bold drop-shadow-lg text-center animate-pulse text-blue-600
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

      {/* ============================
          🔥 リトライボタン
      ============================ */}
      {showButton && (  
        matchEnded ? (
          <div className="text-center mt-10">
            <p className="text-3xl md:text-5xl mb-6 text-red-500">マッチが終了しました</p>
            <button
              onClick={handleNewMatch}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg text-xl"
            >
              別の人とマッチする
            </button>
          </div>
        ) : rematchAvailable ? (
          <div className="text-center mt-10">
            <button
              onClick={handleRematch}
              className="px-6 py-3 bg-green-500 text-white rounded-lg text-xl"
            >
              冒険スタート！
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={handleRematch}
                  className="
                    w-full md:w-auto
                    px-6 py-3
                    bg-yellow-500 hover:bg-yellow-600
                    text-white text-xl md:text-xl
                    font-semibold
                    rounded-lg shadow-md
                    transition-all duration-300
                  "
                >
                  もう一回挑戦する
                </button>
  
                <button
                  onClick={handleNewMatch}
                  className="
                    w-full md:w-auto
                    px-6 py-3
                    bg-blue-500 hover:bg-blue-600
                    text-white text-xl md:text-xl
                    font-semibold
                    rounded-lg shadow-md
                    transition-all duration-300
                  "
                >
                  別の人とマッチする
                </button>
              </div>
              
            </div>
            {/* 仲間待ちメッセージを下に隔離 */}
            {rematchRequested && !rematchAvailable && (
              <p className="text-center text-2xl md:text-3xl text-gray-700 bg-white rounded-xl p-2 mt-4 md:mt-2">
                仲間の準備を待っています…
              </p>
            )}
          </div>
        )
      )}
    </motion.div>
  );
};

export default function QuizModePage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = pathname.split("/").pop() || "random";
  const code = searchParams?.get("code") || ""; 
  const count = searchParams?.get("count") || ""; 
  const genre = searchParams?.get("genre") || "";
  const level = searchParams?.get("level") || "";
  const timeParam = searchParams?.get("time") || "2";
  const totalTime = parseInt(timeParam) * 60;

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [wrongStreak, setWrongStreak] = useState(0);
  const wrongStreakRef = useRef(0);
  const [scoreChanges, setScoreChanges] = useState<Record<string, number | null>>({});
  const [readyToStart, setReadyToStart] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [messages, setMessages] = useState<{ fromId: string; message: string }[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<{ fromId: string; message: string }[]>([]);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchAvailable, setRematchAvailable] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [roomCode, setRoomCode] = useState<string>("");
  const [bothReadyState, setBothReadyState] = useState(false);
  const [handicap, setHandicap] = useState<number>(0);
  const [showDefeatEffect, setShowDefeatEffect] = useState(false);
  const [showDamage, setShowDamage] = useState(false);
  const [lastDamage, setLastDamage] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [roomFull, setRoomFull] = useState(false);
  const [showStageEntrance, setShowStageEntrance] = useState(false);
  const [showStageEvent, setShowStageEvent] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showAnswerText, setShowAnswerText] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showDamageResult, setShowDamageResult] = useState(false);
  const [showCorrectCount, setShowCorrectCount] = useState(false);
  const [dungeonStart, setDungeonStart] = useState(false);
  const [playerCount, setPlayerCount] = useState("0/4");
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [roomLocked, setRoomLocked] = useState(false);
  const [allPlayersDead, setAllPlayersDead] = useState(false);
  const [battleKey, setBattleKey] = useState(0);

  const roomLockedRef = useRef(false);
  useEffect(() => {
    roomLockedRef.current = roomLocked;
  }, [roomLocked]);

  const getStageBonusTime = (stage: number) => {
    if (stage < 4) return 0;
    if (stage < 5) return 30;
    if (stage < 6) return 45;
    if (stage < 7) return 60;
    if (stage < 8) return 75;
    if (stage < 9) return 90;
    if (stage < 10) return 105;
    if (stage < 11) return 120;
    if (stage < 12) return 135;
    if (stage < 13) return 150;
    if (stage < 14) return 165;
    if (stage < 15) return 180;
    if (stage < 16) return 195;
    if (stage < 17) return 210;
    return 225;
  };

  const titles = [
    { threshold: 2, title: "クイズ戦士" },
    { threshold: 5, title: "謎解きファイター" },
    { threshold: 7, title: "頭脳の騎士" },
    { threshold: 10, title: "ひらめきハンター" },
    { threshold: 15, title: "真理の探究者" },
    { threshold: 20, title: "知恵の勇者 🛡️" },
    { threshold: 25, title: "クイズ大賢者 ⭐" },
    { threshold: 30, title: "答えの覇者 🌀" },
    { threshold: 35, title: "クイズ超越者 🌌" },
    { threshold: 40, title: "フロアマスター 🏆" },
    { threshold: 45, title: "グランドマスター 🏆" },
    { threshold: 50, title: "クイズマスター 🏆" },
    { threshold: 65, title: "レジェンドクイズマスター 🌟" },
    { threshold: 80, title: "✨クイズ王👑" },
    { threshold: 100, title: "💫クイズ神💫" },
  ];

  const getTitle = () => {
    let title = "見習い冒険者";
    titles.forEach((t) => {
      if (correctCount >= t.threshold) title = t.title;
    });
    return title;
  };

  const {
    joinRandom,
    joinWithCode,
    updateScore,
    sendReady,
    sendMessage,
    resetMatch,
    updateStartAt,
    players: rawPlayers,
    questionIds,
    matched,
    bothReady,
    startAt,
    mySocketId,
    socket,
    enemyHP,
    maxHP,
    stageCount,
    playerLives,
    isGameOver,
  } = useBattle(playerName);

  const questionPhase = useQuestionPhase(
    socket,
    roomCode
  );

  const phase = questionPhase?.phase ?? "question";
  const results = questionPhase?.results ?? [];
  const damage = questionPhase?.damage ?? 0;
  const canAnswer = questionPhase?.canAnswer ?? false;
  const currentIndex = questionPhase?.currentIndex ?? 0;
  const questionTimeLeft = questionPhase?.questionTimeLeft ?? 15;
  const submitAnswer = questionPhase?.submitAnswer ?? (() => {});
  const [displayedEnemyHP, setDisplayedEnemyHP] = useState(enemyHP);
  const [displayLives, setDisplayLives] = useState<Record<string, number>>({});
  const enemyDefeatedAtRef = useRef<number | null>(null);
  const [showStartButton, setShowStartButton] = useState(false);
  
  const players: Player[] = rawPlayers.map((p) => ({
    socketId: p.socketId,
    playerName: p.name,
  }));
  
  const me = players.find(p => p.socketId === mySocketId);
  const opponent = players.find(p => p.socketId !== mySocketId);

  const allPlayersReady = roomPlayers.length >= maxPlayers;
  const myLife = playerLives[mySocketId] ?? 3;
  const isDead = myLife <= 0;

  // --- プレイヤー人数監視 ---
  useEffect(() => {
    if (!socket) return;

    socket.on("room_full", () => {
      setRoomPlayers(players);
      setRoomFull(true);
    });

    return () => {
      socket.off("room_full");
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("update_room_count", ({ players, current, max }) => {
      if (roomLockedRef.current) return;

      setRoomPlayers(players);
      setPlayerCount(`${current}/${max}`);
      setMaxPlayers(max);

      if (current >= max) {
        setRoomLocked(true); // 4人揃ったらロック
      }
    });

    return () => {
      socket.off("update_room_count");
    };
  }, [socket]);

  const handleJoin = () => {
    if (!playerName.trim()) {
      setNameError("名前を入力してください");
      return;
    }

    // 不適切ワードが含まれていないか確認
    const lower = playerName.toLowerCase();
    const found = bannedWords.some(word => lower.includes(word));
    if (found) {
      setNameError("不適切な言葉は使えません");
      return;
    }

    setNameError(null);
    setJoined(true);

    // ★ ここで roomLocked をリセット
    setRoomLocked(false);
    roomLockedRef.current = false;

    if (mode === "random") {
      joinRandom({ maxPlayers: 4, gameType:"dungeon" }, (code) => setRoomCode(code)); // コールバックで state にセット
    } else {
      joinWithCode(code,count,"dungeon");
      setRoomCode("dungeon_" + code); // 入力済みコードを state にセット
    }
  };

  const handleRetry = () => {
    setCorrectCount(0);
    setFinished(false);
    setWrongStreak(0);
    wrongStreakRef.current = 0;
    setScoreChanges({});
    setIncorrectMessage(null);
    setShowCorrectMessage(false);
  };

  const handleNewMatch = () => {
    // ★ ここで roomLocked をリセット
    setRoomLocked(false);
    roomLockedRef.current = false;

    setRematchRequested(false);
    setRematchAvailable(false);
    setMatchEnded(false);
    setTimeUp(false);
    setFinished(false);
    setCountdown(null);
    setTimeLeft(totalTime);
    setCorrectCount(0);
    setWrongStreak(0);
    wrongStreakRef.current = 0;
    setScoreChanges({});
    setIncorrectMessage(null);
    setShowCorrectMessage(false);

    setReadyToStart(false);

    resetMatch();

    if (mode === "random") {
      joinRandom({ maxPlayers: 4, gameType:"dungeon" }, (code) => setRoomCode(code));
    } else {
      joinWithCode(code, count,"dungeon");
      setRoomCode("dungeon_" + code);
    }
  };

  const handleRematch = () => {
    if (!roomCode) return;

    // ★ 再戦準備の前に false に戻す
    setBothReadyState(false);

    setRematchRequested(true); // 自分が再戦希望を出した状態
    console.log("sending send_ready"); 
    socket?.emit("send_ready", { roomCode });
  };

  /* ---------- クイズ取得 ---------- */
  const [allQuestions, setAllQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      const res = await fetch("/api/articles");
      const data: ArticleData[] = await res.json();
      let all = data;
      if (mode === "genre" && genre) all = all.filter(a => a.quiz?.genre === genre);
      if (mode === "level" && level) all = all.filter(a => a.quiz?.level === level);

      const quizQuestions = all
        .filter(a => a.quiz)
        .map((a, index) => ({
          id: `q${index + 1}`,
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
          } as QuizData,
        }));
      setAllQuestions(quizQuestions);
    };
    fetchArticles();
  }, [mode, genre, level]);

  // --- questionIds に従い並び替え ---
  useEffect(() => {
    if (!questionIds || questionIds.length === 0 || allQuestions.length === 0) return;
    const ordered = questionIds
      .map(id => allQuestions.find(q => q.id === id))
      .filter(Boolean) as { id: string; quiz: QuizData }[];
    setQuestions(ordered);
  }, [questionIds, allQuestions]);

  // --- タイマー ---
  useEffect(() => {
    if (!startAt) return;

    const tick = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startAt) / 1000);

      // 敵撃破時刻を一度だけ記録
      if (displayedEnemyHP === 0 && enemyDefeatedAtRef.current === null) {
        enemyDefeatedAtRef.current = now;
      }

      // 敵撃破後に経過した秒数
      const enemyDefeatedSeconds =
        enemyDefeatedAtRef.current !== null
          ? Math.floor((now - enemyDefeatedAtRef.current) / 1000)
          : 0;

      const baseRemain =
        totalTime - elapsed + 3 + getStageBonusTime(stageCount);

      const remain = Math.max(0, baseRemain + enemyDefeatedSeconds);

      setTimeLeft(remain);
    };

    tick(); // 即1回計算
    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, [startAt, totalTime, displayedEnemyHP]);

  useEffect(() => {
    if (displayedEnemyHP > 0) {
      enemyDefeatedAtRef.current = null;
    }
  }, [displayedEnemyHP]);

  // ステージが変わるたびにタイマーを2分にリセット
  useEffect(() => {
    if (!startAt) return;

    // ステージが変わるたびに startAt を更新して残り時間をリセット
    const newStartAt = Date.now();
    updateStartAt(newStartAt);

    setTimeLeft(2 * 60 + getStageBonusTime(stageCount)); // 2分+ステージに応じた時間にリセット

  }, [stageCount]);

  useEffect(() => {
    if (timeLeft > 0) return;

    setTimeUp(true);

    const timeout = setTimeout(() => {
      setFinished(true);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [timeLeft]);

  useEffect(() => {
    if (!isGameOver) return;

    const deadTimer  = setTimeout(() => {
      setAllPlayersDead(true);
    }, 4000);

    const finishTimer  = setTimeout(() => {
      setFinished(true);
    }, 8000); // ← 正解発表演出のあと

    return () => {
      clearTimeout(deadTimer);
      clearTimeout(finishTimer);
    };
  }, [phase, isGameOver]);

  useEffect(() => {
    if (!bothReady) return;

    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev === 1) {
          clearInterval(interval);

          setTimeout(() => {
            setCountdown(null);
            setDungeonStart(true);
            setShowStageEvent(true);
          }, 800);
          setShowStageEvent(false);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [bothReady]);

  useEffect(() => {
    if (!socket) return;
      socket.on("receive_message", ({ fromId, message }) => {
      const newMsg = { fromId, message };
      setVisibleMessages(prev => [...prev, newMsg]);

      // 1.5秒後に非表示
      setTimeout(() => {
        setVisibleMessages(prev => prev.filter(m => m !== newMsg));
      }, 1500);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket]);

  useEffect(() => {
    if (!bothReadyState) return;

    const resetLives: Record<string, number> = {};
    players.forEach(p => {
      resetLives[p.socketId] = 3;
    });

    setDisplayLives(resetLives);

    // まず3秒にリセット
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev === 1) {
          clearInterval(interval);

          setTimeout(() => {
            setCountdown(null);
          }, 800);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval); // ★ intervalは必ずクリーンアップ
  }, [bothReadyState]);

  useEffect(() => {
    if (enemyHP === 0 && maxHP > 0) {
      setShowDefeatEffect(true);

      setTimeout(() => {
        setShowDefeatEffect(false);
        // 次のステージ or リザルトへ
      }, 2500);
    }
  }, [enemyHP, maxHP]);

  // damage が変わったら表示
  useEffect(() => {
    if (damage > 0) {
      const timer = setTimeout(() => {
        setLastDamage(damage);
        setShowDamage(true);

        const timer = setTimeout(() => {
          setShowDamage(false);
        }, 2000); // 1秒で消える
      }, 3000);// 3秒遅延

      return () => clearTimeout(timer);
    }
  }, [damage]);

  useEffect(() => {
      // ステージが変わるたびに演出を出す
      setShowStageEntrance(true);

      const timer = setTimeout(() => {
        setShowStageEntrance(false);
      }, 3000); // 2秒表示

    return () => clearTimeout(timer);
  }, [stageCount,showStageEvent]); // stageCountが変わるたびに発火

  useEffect(() => {
    if (phase === "result") {
      setShowAnswerText(false);
      setShowAnswer(false);
      setShowExplanation(false);
      setShowCorrectCount(false);
      setShowDamageResult(false);
      
      // 正解は、、を表示
      const answerTextTimer = setTimeout(() => setShowAnswerText(true), 200);

      // 答えを表示
      const answerTimer = setTimeout(() => setShowAnswer(true), 1000);

      // 解説を表示
      const explanationTimer = setTimeout(() => setShowExplanation(true), 2000);

      // 正解人数表示
      const correctCountTimer = setTimeout(() => setShowCorrectCount(true), 3000);

      // ダメージ表示
      const damageTimer = setTimeout(() => setShowDamageResult(true), 3000);

      return () => {
        clearTimeout(answerTextTimer);
        clearTimeout(answerTimer);
        clearTimeout(explanationTimer);
        clearTimeout(correctCountTimer);
        clearTimeout(damageTimer);
      };
    }
  }, [phase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayedEnemyHP(enemyHP); // 3秒後に表示を更新
    }, 3000);

    return () => clearTimeout(timer);
  }, [enemyHP]);

  useEffect(() => {
    setDisplayLives(playerLives);
    setDisplayedEnemyHP(getEnemyForStage(stageCount).hp); // 新しい敵のHPにリセット
    setShowDefeatEffect(false); // 「倒した！」演出を非表示に
  }, [stageCount]);

  useEffect(() => {
    if (phase !== "result") return;

    const timer = setTimeout(() => {
      setDisplayLives(playerLives);
    }, 600); // ← 正解発表演出のあと

    return () => clearTimeout(timer);
  }, [phase, playerLives]);

  useEffect(() => {
    setShowDamageResult(false);
  }, [phase]);

  useEffect(() => {
    if (allPlayersReady && !bothReady) {
      setShowStartButton(false);

      const timer = setTimeout(() => {
        setShowStartButton(true);
      }, 1000); // ← 2秒後

      return () => clearTimeout(timer);
    }
  }, [allPlayersReady, bothReady]);

  useEffect(() => {
    if (!socket) return;

    socket.on("both_rematch_ready", () => {
      // 再戦開始
      handleRetry();      // 問題やスコアをリセット
      setRematchRequested(false);
      setRematchAvailable(false);
      setMatchEnded(false);
      setTimeUp(false);
      setCountdown(null);
      setTimeLeft(totalTime);

      sendReady(handicap);
    });

    // 再戦開始通知
    socket.on("rematch_start", ({ startAt }) => {
        console.log("[rematch_start]再戦開始通知", startAt);

        setBattleKey(prev => prev + 1);

        // 状態をリセット
        setCorrectCount(0)
        handleRetry();           // 問題やスコアをリセット
        setRematchRequested(false);
        setRematchAvailable(false);
        setMatchEnded(false);
        setTimeUp(false);
        setCountdown(null);
        setTimeLeft(totalTime);
        setDisplayLives({});
        setAllPlayersDead(false);

        // 新しいゲーム開始
        updateStartAt(startAt);

        // ★ ここで questions を再設定する
        if (questionIds && questionIds.length > 0 && allQuestions.length > 0) {
          const ordered = questionIds
            .map(id => allQuestions.find(q => q.id === id))
            .filter(Boolean) as { id: string; quiz: QuizData }[];
          setQuestions(ordered);
        }

        setBothReadyState(true);
    });

    // 両方が ready になったら startAt が送られてくる
    socket.on("both_ready_start", ({ startAt }) => {
      updateStartAt(startAt);  // タイマー開始
      // カウントダウン開始
      setBothReadyState(true);     
    });

    return () => {
      socket.off("both_rematch_ready");
      socket.off("rematch_start");
      socket.off("both_ready_start");
      socket.off("answer_result");
      socket.off("question_start");
    };
  }, [socket]);

  const checkAnswer = () => {
    if (userAnswer == null) return;

    const correctAnswer = questions[currentIndex].quiz?.answer;

    if (userAnswer === correctAnswer) {
      submitAnswer(true)
      setCorrectCount(prev => prev + 1);
    } else {
      submitAnswer(false)
    }
    setUserAnswer(null);
  };

  // --- 不適切ワードリスト ---
  const bannedWords = [
    "ばか","馬鹿","バカ","くそ","糞","クソ","死ね","しね","アホ","あほ","ごみ","ゴミ",
    "fuck", "shit", "bastard", "idiot", "asshole",
  ]

  if (!joined) {
    return (
      <div className="container p-8 text-center">
        <h2 className="text-3xl md:text-5xl mb-2 md:mb-4">あなたのニックネームを入力してください</h2>
        <p className="text-xl md:text-2xl text-gray-500 mb-4 md:mb-6">※最大10文字まで入力できます</p>
        <input
          type="text"
          value={playerName}
          onChange={(e) => {
            const value = e.target.value.slice(0, 10); // 最大10文字
            setPlayerName(value);

            // 不適切ワードチェック
            const lower = value.toLowerCase();
            const found = bannedWords.some(word => lower.includes(word));
            if (found) {
              setNameError("不適切な言葉は使えません");
            } else {
              setNameError(null);
            }
          }}
          maxLength={10}
          className="border px-2 py-1 text-xl md:text-3xl"
        />
        {/* ★ ここでエラー表示 */}
        {nameError && (
          <p className="mt-4 text-red-600 text-xl md:text-2xl font-bold">
            {nameError}
          </p>
        )}
        <br />
        <button
          onClick={handleJoin}
          className="
            mt-6 md:mt-10
            px-6 py-3
            bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500
            text-white font-bold text-xl md:text-2xl
            rounded-full
            shadow-lg
            hover:scale-105 hover:shadow-2xl
            transition-all duration-300
          "
        >
          仲間を探す
        </button>
      </div>
    );
  }

  if (!allPlayersReady) {
    return (
      <>
        <div className="text-center">
          {/* 自分のニックネーム */}
          {playerName && (
            <p className="text-xl md:text-3xl mb-6 font-bold text-gray-700">
              あなた：{playerName}
            </p>
          )}
        </div>
        <div className="text-center">
          <p className="text-3xl animate-pulse">
            仲間を探しています（{playerCount}）
          </p>
        </div>
      </>
    );
  }

  if (allPlayersReady && !bothReady) {
    return (
      <div className="container p-8 text-center">
        <div>
          <p className="text-3xl md:text-5xl font-extrabold text-yellow-400 mb-6 animate-pulse drop-shadow-[0_0_10px_yellow]">
            仲間が揃ったよ！
          </p>

          {/* ルームメンバー表示 */}
          <div className="flex flex-wrap justify-center gap-1 md:gap-4 mb-6">
            {roomPlayers.map((p, i) => (
              <div
                key={p.socketId}
                className="w-32 md:w-32 p-2 bg-white rounded-lg shadow-md border-2 border-gray-300"
              >
                <p className="font-bold text-lg md:text-xl truncate">{p.playerName}</p>
              </div>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {!readyToStart && showStartButton && (
            <>
              <p className="text-lg md:text-2xl text-gray-500 mb-4">準備できたら「冒険スタート！」を押そう！全員押すとダンジョンが始まるよ！</p>
              <motion.button
                key="start-button"
                onClick={() => {
                  sendReady(handicap);
                  setReadyToStart(true);
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                }}
                className="
                  px-8 py-4
                  text-2xl font-extrabold
                  text-white
                  bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500
                  rounded-full
                  shadow-xl
                  border-4 border-white
                  hover:scale-110
                  hover:shadow-2xl
                  transition-all duration-300
                  animate-pulse
                "
              >
                冒険スタート！
              </motion.button>
            </>
          )}
        </AnimatePresence>
        {readyToStart && (
          <p className="text-xl md:text-3xl mt-2">
            {opponent
              ? `全員の準備を待っています…`
              : "仲間の準備を待っています…"}
          </p>
        )}
      </div>
    );
  }

  // --- 自分を常に左に表示するための並び替え ---
  const orderedPlayers = [...players].sort((a, b) => {
    if (a.socketId === mySocketId) return -1;
    if (b.socketId === mySocketId) return 1;
    return 0;
  });

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-indigo-300 via-slate-300 to-sky-300" key={battleKey}>
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-white text-6xl md:text-8xl font-extrabold"
          >
            {countdown === 0 ? "START!" : countdown}
          </motion.div>
        </div>
      )}

      {timeUp && !finished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-white text-6xl md:text-8xl font-extrabold"
          >
            TIME UP！
          </motion.div>
        </div>
      )}

      {!finished ? (
        <>
          {dungeonStart && (
            <>
              <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-white drop-shadow-lg">
                STAGE {stageCount}
              </h2>

              <div className="flex flex-col items-center">
                <p className={`w-[280px] md:w-[400px] text-2xl md:text-4xl font-extrabold mb-1 md:mb-2 px-4 py-2 rounded-lg shadow-lg 
                              ${timeLeft <= 30 ? 'bg-red-700 text-white animate-pulse' : 'bg-white text-black border-2 border-black'}`}>
                  制限時間: {Math.floor(timeLeft / 60)}分 {timeLeft % 60}秒
                </p>
              </div>

              <div className="mb-1 md:mb-2 bg-white p-3 border-2 border-purple-200 rounded-xl mx-auto w-full max-w-md md:max-w-xl">
                <p className="text-xl md:text-2xl text-center font-bold">
                  {displayedEnemyHP == 0
                    ? `${getEnemyForStage(stageCount).name}を倒した！`
                    : `${getEnemyForStage(stageCount).name}が現れた！`}
                </p>

                {/* 敵表示 */}
                <div className="flex flex-col items-center relative">
                  <AnimatePresence>
                    {showStageEntrance && (
                      <motion.div
                        key="stage-entrance"
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.8 }}
                          className="text-center"
                        >
                          <p className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
                            STAGE {stageCount} 
                          </p>
                          <img
                            src={getEnemyForStage(stageCount).image}
                            alt={getEnemyForStage(stageCount).name}
                            className="w-40 h-40 md:w-60 md:h-60 mx-auto"
                          />
                          <p className="text-3xl md:text-5xl font-extrabold text-white mt-4 drop-shadow-lg">
                            {getEnemyForStage(stageCount).name} が現れた！
                          </p>
                        </motion.div>
                      </motion.div>
                    )}
                    {/* ダメージ数字ポップ */}
                    {showDamage && lastDamage > 0 && (
                      <motion.div
                        key={lastDamage} // damage ごとにアニメーション更新
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: -20, scale: 1.2 }}
                        exit={{ opacity: 0, y: -40, scale: 0.8 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute -top-2 text-3xl md:text-4xl font-extrabold text-red-600 drop-shadow-lg"
                      >
                        -{lastDamage}
                      </motion.div>
                    )}

                    {/* 敵画像（HP減少時に揺れる） */}
                    {displayedEnemyHP > 0 ? ( // HP 0でも showDefeatEffect を使ってフェードアウト
                      <motion.img
                        key={getEnemyForStage(stageCount).id} // 敵ごとにユニークに
                        src={getEnemyForStage(stageCount).image}
                        alt={getEnemyForStage(stageCount).name}
                        className="w-24 h-24 md:w-32 md:h-32"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }} // HP減少時の揺れも反映
                        exit={{ opacity: 0 }}
                        transition={{ opacity: { duration: 3 } }} // フェードアウト3秒
                      />
                    ) : null}
                  </AnimatePresence>

                  {/* HPテキスト（残り少ないと赤＆点滅） */}
                  <p
                    className={`text-lg md:text-xl font-bold transition-colors ${
                      displayedEnemyHP / maxHP < 0.3
                        ? "text-red-600 animate-pulse"
                        : "text-gray-800"
                    }`}
                  >
                    HP {displayedEnemyHP} / {maxHP}
                  </p>

                  {/* HPバー */}
                  <div className="w-64 md:w-80 h-4 bg-gray-300 rounded overflow-hidden">
                    <motion.div
                      className="h-4 bg-red-500 rounded"
                      initial={false}
                      animate={{ width: `${(displayedEnemyHP / maxHP) * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col items-center">
            <div className="grid grid-cols-4 md:grid-cols-4 gap-1 md:gap-2 mb-1 justify-items-center">
              {orderedPlayers.map((p) => {
                const isMe = p.socketId === mySocketId;
                const change = scoreChanges[p.socketId];
                const result = results.find(r => r.socketId === p.socketId); // ← 結果取得
                const life = displayLives[p.socketId] ?? 3;
                const lifeColor =
                  life <= 0
                    ? "text-red-700"
                    : life === 1
                    ? "text-red-500"
                    : life === 2
                    ? "text-orange-400"
                    : "text-green-500";
                    
                let borderColorClass = "border-gray-300"; // デフォルト（問題中）
                if (phase === "result" && showDamageResult) {
                  if (result === undefined) {
                    borderColorClass = "border-gray-300"; // 未回答
                  } else if (result.isCorrect) {
                    borderColorClass = "border-green-500";
                  } else {
                    borderColorClass = "border-red-500";
                  }
                }
                
                return (
                  <div
                  key={p.socketId}
                  className={`
                      relative
                      w-17 md:w-22
                      aspect-square
                      rounded-lg
                      bg-white
                      border-4
                      ${borderColorClass}
                      shadow-md
                      flex flex-col items-center justify-center
                    `}
                  >
                    <p className="font-bold text-gray-800 text-lg md:text-xl text-center">
                      {p.playerName.length > 5 ? p.playerName.slice(0, 5) + "..." : p.playerName}
                    </p>

                    {/* 結果表示 */}
                    <p
                      className={`text-lg md:text-xl font-bold mt-1 ${
                        phase === "result"
                        ? result?.isCorrect
                        ? "text-green-600"
                        : "text-red-600"
                        : result
                        ? "text-gray-800"  // 回答済みだけど結果発表前
                            : lifeColor  // 回答待ち
                      }`}
                    >
                      {phase === "result"
                        ? showDamageResult
                        ? result
                        ? result.isCorrect
                        ? "正解〇"
                        : "誤答×"
                        : "未回答"
                          : "　" // 表示させない場合は空文字
                        : result
                          ? "？"
                          : `LP: ${life}`
                      }
                    </p>

                    {/* 吹き出し表示 */}
                    <div className="absolute -bottom-1 w-20 md:w-28">
                      {visibleMessages
                        .filter(m => m.fromId === p.socketId)
                        .map((m, i) => (
                          <motion.div
                            key={i}
                            style={{ zIndex: i + 10 }}
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.8 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className={`absolute right-2 md:right-4 top-0 w-16 md:w-20 px-2 py-1 rounded shadow text-sm md:text-md font-bold border-2 ${
                              isMe ? "bg-blue-400 text-white border-blue-200" : "bg-red-400 text-white border-red-200"
                            }`}
                          >
                            {m.message}
                          </motion.div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isGameOver && allPlayersDead && (
            <p className="
              mt-10 mb-15
              text-3xl md:text-5xl
              font-extrabold
              tracking-wider
              text-red-600
              drop-shadow-lg
              animate-pulse
            ">
              パーティが全滅した…
            </p>
          )}
  
          {phase === "result" && !allPlayersDead &&(
            <>
              <div>
                {showAnswerText && (
                  <p className="mt-2 text-lg md:text-xl text-gray-700">
                    正解は、、
                  </p>
                )}

                {showAnswer && (
                  <p className="mt-2 text-xl md:text-3xl text-gray-900 font-extrabold">
                   「 {questions[currentIndex].quiz.displayAnswer}」
                  </p>
                )}

                {showExplanation && (
                  <p className="mt-2 mb-3 text-md md:text-xl text-gray-600">
                    {questions[currentIndex].quiz.answerExplanation}
                  </p>
                )}
              </div>
              {showCorrectCount && (
                <p className="mt-1 text-xl md:text-2xl font-bold text-black mt-4">
                  正解人数：{results.filter(r => r.isCorrect).length}人
                </p>
              )}
              {showDamageResult && (
                <p className="mb-2 text-xl md:text-2xl font-bold text-red-600 drop-shadow-lg">
                  与えたダメージ：{damage}
                </p>
              )}
            </>
          )}

          {questions[currentIndex]?.quiz && (
            <>
              {(showCorrectMessage || incorrectMessage) ? (
                <>
                  {showCorrectMessage && <p className="text-4xl md:text-6xl font-extrabold mb-2 text-green-600 drop-shadow-lg animate-bounce animate-pulse">◎正解！🎉</p>}
                  {incorrectMessage && <p className="text-3xl md:text-4xl font-extrabold mb-2 text-red-500 drop-shadow-lg animate-shake whitespace-pre-line">{incorrectMessage}</p>}

                  {questions[currentIndex].quiz.answerExplanation && (
                    <div className="mt-5 md:mt-15 text-center">
                      <p className="text-xl md:text-2xl font-bold text-blue-600">解説📖</p>
                      <p className="mt-1 md:mt-2 text-lg md:text-xl text-gray-700">{questions[currentIndex].quiz.answerExplanation}</p>
                    </div>
                  )}

                  {questions[currentIndex].quiz.trivia && (
                    <div className="mt-5 md:mt-10 text-center">
                      <p className="text-xl md:text-2xl font-bold text-yellow-600">知って得する豆知識💡</p>
                      <p className="mt-1 md:mt-2 text-lg md:text-xl text-gray-700">{questions[currentIndex].quiz.trivia}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {phase !== "result" && (
                    <p className="text-gray-600 mb-2">不正解の場合、ライフポイント（LP）が1減少します。</p>
                  )}

                  {phase !== "result" && (
                    <p
                      className={`text-xl md:text-3xl text-center mb-2 font-bold ${
                        questionTimeLeft <= 5 ? "text-red-500 animate-pulse" : "text-gray-700"
                      }`}
                      >
                      回答タイマー：{questionTimeLeft}秒
                    </p>
                  )}
                
                  {phase !== "result" && (
                    <QuizQuestion
                      quiz={questions[currentIndex].quiz}
                      userAnswer={userAnswer}
                      setUserAnswer={setUserAnswer}
                    />
                  )}
                  {/* 回答フェーズ */}
                  {phase === "question" && (
                    <>
                      {isDead ? (
                        <p className="mt-2 text-xl md:text-2xl font-bold text-gray-800">
                          HPが0のため、回答できません
                        </p>
                      ) : canAnswer ? (
                        <button
                          onClick={checkAnswer}
                          className="px-6 py-3 bg-blue-500 text-white rounded-lg"
                        >
                          回答
                        </button>
                      ) : (
                        <p className="mt-4 text-xl md:text-2xl font-bold text-gray-600 animate-pulse">
                          他の人の回答を待っています…
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          <div className="flex flex-col items-center mt-2 md:mt-3">
            {/* メッセージボタン */}
            <div className="text-center border border-black p-1 rounded-xl bg-white">
              {["よろしく！", "やったね✌", "まだいける！", "ありがとう！"].map((msg) => (
                <button
                  key={msg}
                  onClick={() => sendMessage(msg)}
                  className="mx-1 my-1 px-2 py-1 text-md md:text-lg md:text-xl rounded-full border-2 border-gray-500 bg-white hover:bg-gray-200"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <QuizResult
          correctCount={correctCount}
          stageCount={stageCount}
          getTitle={getTitle}
          titles={titles}
          onRetry={handleRetry}
          matchEnded={matchEnded}
          rematchAvailable={rematchAvailable}
          rematchRequested={rematchRequested}
          handleNewMatch={handleNewMatch}
          handleRematch={handleRematch}
        />
      )}
    </div>
  );
}
