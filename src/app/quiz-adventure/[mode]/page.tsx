"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { useQuestionPhase } from "../../../hooks/useQuestionPhase";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { submitGameResult, calcTitle } from "@/lib/gameResults";
import { buildResultModalPayload } from "@/lib/resultMessages";
import { useResultModal } from "../../components/ResultModalProvider";
import { getWeekStartJST } from "@/lib/week";
import { openXShare, buildTopUrl } from "@/lib/shareX";

type AwardStatus = "idle" | "awarding" | "awarded" | "need_login" | "error";

// 敵情報
const enemies = [
  { id: "slime", name: "スライム", image: "/images/スライム_2.png", hp: 100, attack: 50, description: "ぷるぷるして弱そうに見えるが油断は禁物。" },
  { id: "goblin", name: "ゴブリン", image: "/images/ゴブリン_2.png", hp: 220, attack: 100, description: "素早く群れで襲いかかる小型のモンスター。" },
  { id: "skeleton", name: "スケルトン", image: "/images/スケルトン_2.png", hp: 350, attack: 200, description: "朽ちた骨から生まれた剣と盾を操る不気味な戦士。" },
  { id: "mimic", name: "ミミック", image: "/images/ミミック_2.png", hp: 500, attack: 400, description: "宝箱に化けるトリッキーな敵。油断すると噛まれる！" },
  { id: "lizardman", name: "リザードマン", image: "/images/リザードマン_2.png", hp: 750, attack: 500, description: "鱗に覆われた戦士。高い身体能力と鋭い爪で攻撃してくる。" },
  { id: "golem", name: "ゴーレム", image: "/images/ゴーレム_2.png", hp: 1000, attack: 650, description: "岩と魔力で作られた巨人。圧倒的な防御力を誇る。" },
  { id: "cerberus", name: "ケルベロス", image: "/images/ケルベロス_2.png", hp: 1200, attack: 800, description: "冥界を守る三つ首の魔獣。素早い連続攻撃が脅威。" },
  { id: "berserker", name: "バーサーカー", image: "/images/バーサーカー_2.png", hp: 1500, attack: 1000, description: "理性を失った狂戦士。攻撃力が非常に高い。" },
  { id: "dragon", name: "ドラゴン", image: "/images/ドラゴン_2.png", hp: 1800, attack: 1200, description: "火を吹く巨大竜。圧倒的な力を誇る古代の王者。" },
  { id: "fenikkusu", name: "フェニックス", image: "/images/フェニックス_2.png", hp: 2000, attack: 1500, description: "不死鳥の炎を操る神秘的な生物。燃え盛る翼で攻撃。" },
  { id: "leviathan", name: "リヴァイアサン", image: "/images/リヴァイアサン_2.png", hp: 2500, attack: 1800, description: "海の深淵から現れる巨大モンスター。水流で圧倒する。" },
  { id: "blackdragon", name: "ブラックドラゴン", image: "/images/ブラックドラゴン_2.png", hp: 3000, attack: 2000, description: "闇の力を宿す黒竜。魔法攻撃も強力。" },
  { id: "kingdemon", name: "キングデーモン", image: "/images/キングデーモン_2.png", hp: 3500, attack: 2500, description: "魔界を統べる悪魔の王。圧倒的な魔力と威圧感を放つ。" },
  { id: "kinghydra", name: "キングヒドラ", image: "/images/キングヒドラ_2.png", hp: 4000, attack: 3000, description: "複数の首を持つ巨大魔獣。倒しても再生する恐怖の存在。" },
  { id: "ordin", name: "オーディン", image: "/images/オーディン_2.png", hp: 5000, attack: 4000, description: "知恵と戦の神。魔法と剣技を極めた伝説の戦士。" },
  { id: "poseidon", name: "ポセイドン", image: "/images/ポセイドン_2.png", hp: 6000, attack: 5000, description: "海の神。雷と津波で敵を蹴散らす力を持つ。" },
  { id: "hades", name: "ハデス", image: "/images/ハデス_2.png", hp: 7000, attack: 6000, description: "冥界の支配者。死者の力を操り、強大な攻撃を仕掛ける。" },
  { id: "zeus", name: "ゼウス", image: "/images/ゼウス_2.png", hp: 8000, attack: 7000, description: "天空の王。雷霆を操る全知全能の神。" },
  { id: "gundarimyouou", name: "軍荼利明王（ぐんだりみょうおう）", image: "/images/軍荼利明王_2.png", hp: 9000, attack: 8000, description: "仏教の怒りの守護神。恐怖の炎で全てを焼き尽くす。" },
  { id: "maou", name: "魔王", image: "/images/魔王_2.png", hp: 10000, attack: 10000, description: "世界を闇に包もうとする存在。圧倒的な魔力を秘める。" },
  { id: "yuusya_game", name: "クイズマスターの最強勇者", image: "/images/勇者_2_1.png", hp: 20000, attack: 20000, description: "全てのクイズと戦闘を制した伝説の勇者。前人未到の強さを誇る。" },
  { id: "quizou", name: "クイズ王", image: "/images/王様_2.png", hp: 30000, attack: 30000, description: "クイズの王様。クイズ界の支配者。" },
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
  if (stage < 17) return enemies[15];
  if (stage < 18) return enemies[16];
  if (stage < 19) return enemies[17];
  if (stage < 20) return enemies[18];
  if (stage < 21) return enemies[19];
  if (stage < 22) return enemies[20];
  if (stage < 23) return enemies[21];
  if (stage < 24) return enemies[22];
  return enemies[22];
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
  basePoints: number;
  stageBonusPoints: number;
  earnedPoints: number;
  earnedExp: number;
  isLoggedIn: boolean;
  awardStatus: AwardStatus;
  onGoLogin: () => void;
  isCodeMatch: boolean;
  onShareX: () => void;
}

// 正解数に応じて出すコメント
const rankComments = [
  { threshold: 0, comment: "ここから冒険の始まりだ！ゆっくり進んでいこう！" },
  { threshold: 3, comment: "クイズ戦士に昇格！戦場に立つ準備は万端だ！" },
  { threshold: 5, comment: "謎解きファイター！試練に立ち向かう力がついてきた！" },
  { threshold: 10, comment: "頭脳の騎士！君の知識が冒険の武器になる！" },
  { threshold: 15, comment: "ひらめきハンター！まるで答えが見えているかのような閃きだ！" },
  { threshold: 20, comment: "真理の探究者！知識の深みを極め、迷宮を読み解く力がある！" },
  { threshold: 25, comment: "知恵の勇者！知識と勇気を兼ね備えた英雄だ！" },
  { threshold: 30, comment: "クイズ大賢者！君の選択はすべて正解へ導かれている…！" },
  { threshold: 35, comment: "答えの覇者！あらゆる難問をねじ伏せる圧倒的なパワー！" },
  { threshold: 40, comment: "クイズ超越者！もう次元が違う…これは人間離れしている！" },
  { threshold: 50, comment: "フロアマスター！あらゆるステージを制覇する者の風格だ！" },
  { threshold: 60, comment: "グランドマスター！歴戦の賢者のような威厳がある！" },
  { threshold: 70, comment: "クイズマスター！最強の中の最強…殿堂入りレベル！" },
  { threshold: 80, comment: "レジェンドクイズマスター！伝説に語り継がれる存在だ…！" },
  { threshold: 90, comment: "クイズ王…！君はクイズ界の王者だ！！" },
  { threshold: 100, comment: "クイズ神…！一番すごい称号に到達だ！✨" },
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
  basePoints,
  stageBonusPoints,
  earnedPoints,
  earnedExp,
  isLoggedIn,
  awardStatus,
  onGoLogin,
  isCodeMatch,
  onShareX,
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
            ステージ {stageCount} までクリア！
          </p>
        </>
      )}

      {showText && <p className="text-xl md:text-2xl text-gray-600 mb-2">あなたの称号は…</p>}

      {showRank && (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center mb-10 gap-4 md:gap-10">
            <img src="/images/yuusya_game.png" alt="勇者" className="w-0 h-0 md:w-50 md:h-50" />
            <p
              className={`text-4xl md:text-6xl font-bold drop-shadow-lg text-center animate-pulse text-blue-600
              }`}
            >
              {getTitle()}
            </p>
            <div className="flex flex-row md:flex-row items-center justify-center gap-4 md:gap-8">
              <img src="/images/yuusya_game.png" alt="勇者" className="w-30 h-30 md:w-0 md:h-0" />
              <img src="/images/dragon.png" alt="ドラゴン" className="w-30 h-30 md:w-50 md:h-50" />
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
        <div className="mx-auto max-w-[520px] bg-white border-2 border-black rounded-xl p-4 shadow mt-6">
            <>
              <div className="mb-2 text-lg md:text-xl text-gray-700 font-bold">
                <p className="text-blue-500">正解数ポイント：{basePoints}P（{correctCount}問 × 20P）</p>
                <p className="text-yellow-500">ステージクリアボーナス：{stageBonusPoints}P（STAGE {stageCount}）</p>
              </div>

              <p className="text-xl md:text-2xl font-extrabold text-gray-800">
                今回の獲得ポイント： <span className="text-green-600">{earnedPoints} P</span>
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
            </>
        </div>
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
                  className="px-6 py-3 bg-black text-white border border-black rounded-lg font-bold text-xl hover:opacity-80 cursor-pointer"
                  onClick={onShareX}
                >
                  Xで結果をシェア
                </button>

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
  const router = useRouter();

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [earnedPoints, setEarnedPoints] = useState(0);
  const [basePoints, setBasePoints] = useState(0);
  const [stageBonusPoints, setStageBonusPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");
  const awardedOnceRef = useRef(false);
  const sentRef = useRef(false); // ★ 成績保存 二重送信防止
  const { pushModal } = useResultModal();

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
  const [allGameClear, setAllGameClear] = useState(false);
  const [battleKey, setBattleKey] = useState(0);

  const roomLockedRef = useRef(false);
  useEffect(() => {
    roomLockedRef.current = roomLocked;
  }, [roomLocked]);

  const getStageBonusTime = (stage: number) => {
    if (stage < 4) return 0;
    if (stage < 5) return 30;
    if (stage < 6) return 60;
    if (stage < 7) return 90;
    if (stage < 8) return 120;
    if (stage < 9) return 150;
    if (stage < 10) return 180;
    if (stage < 11) return 240;
    if (stage < 12) return 360;
    if (stage < 13) return 420;
    if (stage < 14) return 480;
    if (stage < 15) return 600;
    if (stage < 16) return 720;
    if (stage < 17) return 840;
    if (stage < 18) return 960;
    if (stage < 19) return 1140;
    if (stage < 20) return 1320;
    if (stage < 21) return 1500;
    if (stage < 22) return 1860;
    if (stage < 23) return 2220;
    return 2580;
  };

  const calcStageBonus = (stage: number) => {
    const table: Record<number, number> = {
      1: 10,
      2: 50,
      3: 100,
      4: 200,
      5: 300,
      6: 400,
      7: 500,
      8: 600,
      9: 700,
      10: 850,
      11: 1000,
      12: 1200,
      13: 1500,
      14: 2000,
      15: 3000,
      16: 4000,
      17: 5000,
      18: 6000,
      19: 8000,
      20: 10000,
      21: 12000,
      22: 15000,
      23: 15000,
    };
    return table[Math.min(stage, 23)] ?? 0;
  };

  const titles = [
    { threshold: 5, title: "クイズ戦士" },
    { threshold: 10, title: "謎解きファイター" },
    { threshold: 15, title: "頭脳の騎士" },
    { threshold: 20, title: "ひらめきハンター" },
    { threshold: 25, title: "真理の探究者" },
    { threshold: 30, title: "知恵の勇者 🛡️" },
    { threshold: 40, title: "クイズ大賢者 ⭐" },
    { threshold: 50, title: "答えの覇者 🌀" },
    { threshold: 60, title: "クイズ超越者 🌌" },
    { threshold: 70, title: "フロアマスター 🏆" },
    { threshold: 80, title: "グランドマスター 🏆" },
    { threshold: 100, title: "クイズマスター 🏆" },
    { threshold: 120, title: "レジェンドクイズマスター 🌟" },
    { threshold: 150, title: "✨クイズ王👑" },
    { threshold: 200, title: "💫クイズ神💫" },
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
    isCritical,
    stageCount,
    playerLives,
    isGameOver,
    isGameClear,
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
  const questionTimeLeft = questionPhase?.questionTimeLeft ?? 20;
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
    awardedOnceRef.current = false;
    setAwardStatus("idle");
    setEarnedPoints(0);
    setBasePoints(0);
    setStageBonusPoints(0);
    setEarnedExp(0);
    sentRef.current = false;
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
    awardedOnceRef.current = false;
    setAwardStatus("idle");
    setEarnedPoints(0);
    setBasePoints(0);
    setStageBonusPoints(0);
    setEarnedExp(0);
    sentRef.current = false;

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
    if (!isGameClear) return;

    const deadTimer  = setTimeout(() => {
      setAllGameClear(true);
    }, 6000);

    const finishTimer  = setTimeout(() => {
      setFinished(true);
    }, 12000); // ← 正解発表演出のあと

    return () => {
      clearTimeout(finishTimer);
    };
  }, [phase, isGameClear]);

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
    if (!finished) return;

    const base = correctCount * 20;               // ✅ 1問20P
    const bonus = calcStageBonus(stageCount);   // ✅ ステージボーナス
    const earned = base + bonus;

    setBasePoints(base);
    setStageBonusPoints(bonus);
    setEarnedPoints(earned);

    const expEarned = correctCount * 20;
    setEarnedExp(expEarned);

    // pointsもexpも0ならDB処理なし
    if (earned <= 0 && expEarned <= 0) {
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

          // ★ points と exp を同時加算（level再計算もここで）
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

          // ヘッダー更新
          window.dispatchEvent(new Event("points:updated"));

          // レベルアップ演出（必要なら）
          window.dispatchEvent(
            new CustomEvent("profile:updated", {
              detail: { oldLevel, newLevel },
            })
          );

          // ログ（失敗しても致命的ではない）
          if (earned > 0) {
            const { error: logError } = await supabase.from("user_point_logs").insert({
              user_id: user.id,
              change: earned,
              reason: `協力ダンジョンでポイント獲得（正解:${correctCount}問=${base}P / ステージ:${stageCount}=${bonus}P）`,
            });
            if (logError) console.log("insert user_point_logs error raw:", logError);
          }

          if (expEarned > 0) {
            const { error: logError2 } = await supabase.from("user_exp_logs").insert({
              user_id: user.id,
              change: expEarned,
              reason: `協力ダンジョンでEXP獲得（正解:${correctCount}問 → ${expEarned}EXP）`,
            });
            if (logError2) console.log("insert user_exp_logs error raw:", logError2);
          }

          setAwardStatus("awarded");
        } catch (e) {
          console.error("award points/exp error:", e);
          setAwardStatus("error");
        }
      };

      award();
    }
  }, [finished, mode, correctCount, stageCount, user, userLoading]);

  useEffect(() => {
    if (!finished) return;

    // 未ログインなら保存しない（仕様に合わせる）
    if (!userLoading && !user) return;

    if (sentRef.current) return;
    sentRef.current = true;

    (async () => {
      try {
        const weekStart = getWeekStartJST();

        // ✅ 週間ランキングに反映したい値を決める
        // score: 今回獲得ポイントを加算、correct: 正解数、play: 1回、best_streak: max更新
        const { error: weeklyErr } = await supabase.rpc("upsert_weekly_stats", {
          p_user_id: user!.id,
          p_week_start: weekStart,
          p_score_add: 0,
          p_correct_add: correctCount,
          p_play_add: 1,
          p_best_streak: 0,
        });

        if (weeklyErr) {
          console.log("upsert_weekly_stats error:", weeklyErr);
          // ランキング保存失敗してもゲームは止めない
        }

        // 例：スコアは「正解数」or「獲得ポイント」どっちでもOK
        // 個人的には "正解数" をスコアにするのがブレにくい
        const score = correctCount;

        // 最高到達ステージ
        const stage = stageCount;

        // 称号：正解数ベースで計算（今の getTitle と合わせる）
        const title = calcTitle(titles, correctCount);

        const res = await submitGameResult(supabase, {
          game: "coop_dungeon",
          score,
          stage,
          title,
          writeLog: true,
          // extra は今は不要なら入れない（入れるときだけでOK）
          // extra: { stageCount, correctCount, isGameClear }
        });

        // モーダル出したいなら（battleと同じ仕組み）
        const modal = buildResultModalPayload("coop_dungeon", res);
        if (modal) pushModal(modal);
      } catch (e) {
        console.error("[coop_dungeon] submitGameResult error:", e);
      }
    })();
  }, [
    finished,
    user,
    userLoading,
    supabase,
    correctCount,
    stageCount,
    isGameClear,
    titles,
    pushModal,
  ]);

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
        setAllGameClear(false);

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

  // Xシェア機能
  const handleShareX = () => {
    const text = [
      "【ひまQ｜協力ダンジョン⚔】",
      `クリアステージ：ステージ${correctCount}`,
      `称号：${getTitle()}`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() }); // ✅トップへ
  };

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
                    ? `${getEnemyForStage(stageCount).name}を倒した！🎉`
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
                      <div className="absolute -top-8 flex flex-col items-center">
                        {isCritical && (
                          <p
                            className="text-3xl md:text-4xl font-extrabold text-yellow-400 mb-5"
                            style={{
                              textShadow: `
                                0 0 2px #000,
                                1px 0 0 #000,
                                -1px 0 0 #000,
                                0 1px 0 #000,
                                0 -1px 0 #000,
                                1px 1px 0 #000,
                                -1px 1px 0 #000,
                                1px -1px 0 #000,
                                -1px -1px 0 #000
                              `,
                            }}
                          >
                            会心の一撃！！
                          </p>
                        )}
                        <motion.div
                          key={lastDamage}
                          initial={{ opacity: 0, y: 20, scale: 0.8 }}
                          animate={{ opacity: 1, y: -20, scale: 1.2 }}
                          exit={{ opacity: 0, y: -40, scale: 0.8 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="text-3xl md:text-4xl font-extrabold text-red-600 drop-shadow-lg"
                        >
                          -{lastDamage}
                        </motion.div>
                      </div>
                    )}

                    {/* 敵画像（HP減少時に揺れる） */}
                    {displayedEnemyHP > 0 ? ( // HP 0でも showDefeatEffect を使ってフェードアウト
                      <motion.img
                        key={getEnemyForStage(stageCount).id} // 敵ごとにユニークに
                        src={getEnemyForStage(stageCount).image}
                        alt={getEnemyForStage(stageCount).name}
                        className="w-40 h-40 md:w-60 md:h-60"
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
                const result = results.find(r => r.socketId === p.socketId);
                const life = displayLives[p.socketId] ?? 3;

                const isOut = life <= 0;

                // ① 枠色：通常は結果に応じて、脱落は赤系に固定
                let borderColorClass = "border-gray-300";
                if (phase === "result" && showDamageResult) {
                  if (result === undefined) borderColorClass = "border-gray-300";
                  else if (result.isCorrect) borderColorClass = "border-green-500";
                  else borderColorClass = "border-red-500";
                }

                // ② 脱落時の見た目（背景＋枠）
                const outBoxClass = "bg-red-50 border-4 border-red-600";

                // ③ LPの文字色（脱落時は赤文字で「戦闘×」）
                const lifeColor =
                  life === 1 ? "text-red-500" :
                  life === 2 ? "text-orange-400" :
                  "text-green-500";

                return (
                  <div
                    key={p.socketId}
                    className={`
                      relative
                      w-17 md:w-22
                      aspect-square
                      rounded-lg
                      shadow-md
                      flex flex-col items-center justify-center
                      ${
                        isOut
                          ? "bg-gray-500 border-4 border-gray-700" // ★ 脱落したらグレー背景
                          : `bg-white border-4 ${borderColorClass}` // 通常
                      }
                    `}
                  >
                    {/* 名前 */}
                    <p className={`font-bold text-lg md:text-xl text-center ${isOut ? "text-white" : "text-gray-800"}`}>
                      {p.playerName.length > 5 ? p.playerName.slice(0, 5) + "..." : p.playerName}
                    </p>

                    {/* 表示（LP or 結果 or 戦闘×） */}
                    <p
                      className={`
                        text-lg md:text-xl font-bold mt-1
                        ${
                          isOut
                            ? "text-red-400" // ← 脱落時は赤文字
                            : phase === "result"
                            ? result?.isCorrect
                              ? "text-green-600"
                              : "text-red-600"
                            : result
                            ? "text-gray-800" // 回答済み（結果前）
                            : lifeColor // 回答待ち（LP色）
                        }
                      `}
                    >
                      {isOut
                        ? "戦闘×"
                        : phase === "result"
                        ? showDamageResult
                          ? result
                            ? result.isCorrect
                              ? "正解〇"
                              : "誤答×"
                            : "未回答"
                          : "　"
                        : result
                        ? "？"
                        : `LP: ${life}`}
                    </p>

                    {/* 吹き出し表示（そのまま） */}
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

          {isGameClear && allGameClear &&  (
            <p className="
              mt-10 mb-15
              text-3xl md:text-5xl
              font-extrabold
              tracking-wider
              text-yellow-500
              drop-shadow-lg
              animate-pulse
            ">
              全ステージクリア✨
            </p>
          )}
  
          {phase === "result" && !allPlayersDead && !allGameClear &&(
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
              {["よろしく👋", "やったね✌", "まだいける✊", "ありがとう❤"].map((msg) => (
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
          basePoints={basePoints}
          stageBonusPoints={stageBonusPoints}
          earnedPoints={earnedPoints}
          earnedExp={earnedExp}
          isLoggedIn={!!user}
          awardStatus={awardStatus}
          onGoLogin={() => router.push("/user/login")}
          isCodeMatch={mode === "code"}
          onShareX={handleShareX}
        />
      )}
    </div>
  );
}
