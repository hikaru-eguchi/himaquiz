"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion5 from "../../components/QuizQuestion5";
import { QuizData } from "@/lib/articles5";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedSoloGames from "@/app/components/RecommendedSoloGames";
import { motion } from "framer-motion";

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

const fortuneResults = [
  { stars: 1, comment: "慎重モード発動中！今日は守りが勝ち！", weight: 20 },
  { stars: 2, comment: "のんびりいこう！無理しないのが最強！", weight: 20 },
  { stars: 3, comment: "今日はマイペース運！自分のテンポでいこう！", weight: 20 },
  { stars: 4, comment: "かなりいい感じ！流れに乗れば強い日！", weight: 20 },
  { stars: 5, comment: "超ひらめき日和！今日は当たりを引くかも！", weight: 20 },
];

const luckyItems = [
  "スマホ",
  "イヤホン",
  "ノート",
  "ペン",
  "ハンカチ",
  "あたたかい飲みもの",
  "冷たい飲みもの",
  "お気に入りのお菓子",
  "青いもの",
  "白いもの",
  "黒いもの",
  "丸いもの",
  "四角いもの",
  "リュック",
  "スニーカー",
  "腕時計",
  "鏡",
  "帽子",
  "アクセサリー",
  "お守り",
  "本",
  "メモ帳",
  "財布",
  "キーホルダー",
  "充電器",
  "ポーチ",
  "ティッシュ",
  "ミント系のお菓子",
  "好きなキャラグッズ",
  "マグカップ",
  "クッション",
  "折りたたみ傘",
  "タオル",
  "ヘアゴム",
  "お気に入りの服",
  "文房具",
  "水",
  "飴",
  "小銭",
  "クリアファイル",
  "ラムネ",
  "グミ",
  "ブランケット",
  "サングラス",
  "赤いもの",
  "光るもの",
  "ふわふわしたもの",
  "キラキラしたもの",
  "ゲーム機",
  "推しグッズ",
];

const luckyFoods = [
  "おにぎり",
  "たまご焼き",
  "唐揚げ",
  "ポテト",
  "カレー",
  "うどん",
  "ラーメン",
  "焼きそば",
  "ハンバーグ",
  "オムライス",
  "サンドイッチ",
  "トースト",
  "ホットケーキ",
  "チョコ",
  "クッキー",
  "グミ",
  "ラムネ",
  "アイス",
  "プリン",
  "ヨーグルト",
  "みかん",
  "りんご",
  "バナナ",
  "いちご",
  "ぶどう",
  "おもち",
  "たい焼き",
  "どら焼き",
  "たこ焼き",
  "ピザ",
];

const luckyPastimes = [
  "クイズで遊ぶ",
  "ショート動画を見る",
  "好きな音楽を聴く",
  "ゲームをする",
  "散歩する",
  "漫画を読む",
  "アニメを見る",
  "ドラマを見る",
  "映画を見る",
  "昼寝する",
  "SNSを見る",
  "メモを書いてみる",
  "落書きする",
  "写真を見返す",
  "部屋を少し片づける",
  "ストレッチする",
  "深呼吸する",
  "お菓子を食べる",
  "飲みものをゆっくり飲む",
  "推し動画を見る",
  "面白い画像を見る",
  "空をぼーっと見る",
  "本を少し読む",
  "ガチャ系コンテンツを見る",
  "占いをもう1回見る",
  "豆知識を調べる",
  "ひとこと日記を書く",
  "好きな服を眺める",
  "友だちにメッセージする",
  "ひまQで遊ぶ",
];

const recommendedActions = [
  "気になっていたことを始めてみよう",
  "今日はゆっくり休むのが正解",
  "ひらめいたことをすぐメモしよう",
  "誰かに話しかけると良い流れが来るかも",
  "いつもと違う道を選んでみよう",
  "小さな挑戦が大きな運につながるかも",
  "整理整頓すると運気アップ",
  "好きなことに時間を使おう",
  "今日は直感を信じて動いてみよう",
  "ひとつだけでも行動すると流れが変わるかも",
  "部屋を少し片づけてみよう",
  "深呼吸してから動こう",
  "新しい音楽を聴いてみよう",
  "早めに行動してみよう",
  "いつもより丁寧に過ごしてみよう",
  "短い散歩をしてみよう",
  "やりたかったことを1つだけ進めよう",
  "今日は無理せずマイペースでいこう",
  "連絡したかった人にメッセージしてみよう",
  "スマホを見る時間を少し減らしてみよう",
  "お気に入りのものを使って過ごそう",
  "机の上を整えてみよう",
  "ちょっとだけ遠回りしてみよう",
  "明日の準備を先にしておこう",
  "笑えるものを見てリラックスしよう",
  "休憩をこまめに入れよう",
  "今日はひとつ褒められそうな行動をしてみよう",
  "新しい組み合わせを試してみよう",
  "思いついたことをすぐ試してみよう",
  "今日は『やることを減らす』のも正解",
  "楽しい方を選んでみよう",
  "ひとり時間を少し大切にしよう",
  "周りより自分のペースを優先しよう",
  "まずは目の前のひとつを終わらせよう",
  "軽く体を動かしてみよう",
  "好きな飲みものを用意してから始めよう",
  "今日は勢いより丁寧さを大事にしよう",
  "ちょっとした親切をしてみよう",
  "迷ったら明るい方を選んでみよう",
  "今日は早めに寝るのもおすすめ",
  "気になっていたことを1つだけ始めてみよう",
  "今日は深呼吸してから動くとうまくいくかも",
  "思いついたことはすぐメモしよう",
  "迷ったら楽しそうな方を選んでみよう",
  "今日は無理せずマイペースが正解",
  "ちょっとだけ遠回りしてみよう",
  "部屋を少し片づけると流れが変わるかも",
  "新しい音楽を聴いて気分を変えよう",
  "好きな飲みものを用意してから始めよう",
  "誰かにひとこと話しかけてみよう",
  "今日はひとつだけ挑戦してみよう",
  "まずは目の前のひとつを終わらせよう",
  "スマホを見る時間を少し減らしてみよう",
  "いつもより早めに動いてみよう",
  "今日は勢いより丁寧さ重視でいこう",
  "楽しい方に乗っかってみよう",
  "ちょっとした親切をしてみよう",
  "今日は『やることを減らす』のも大正解",
  "短い散歩をしてリセットしよう",
  "連絡したかった人にメッセージしてみよう",
  "今日は直感を信じて動いてみよう",
  "いつもと違う道を選んでみよう",
  "気分が上がる服を選んでみよう",
  "机の上を整えてみよう",
  "ひとり時間を少し大切にしよう",
  "笑えるものを見てリラックスしよう",
  "今日は少しだけ自分を甘やかそう",
  "思い切って後回しを1つやめてみよう",
  "好きなことに10分だけ使ってみよう",
  "今日は『完璧』より『前進』でOK",
  "ひらめいた瞬間に動いてみよう",
  "休憩をちゃんと取るのも運気アップ",
  "今日は明るい色をひとつ取り入れてみよう",
  "小さな挑戦が大きな流れにつながるかも",
  "朝より少しだけ姿勢をよくしてみよう",
  "今日は周りより自分のテンポ優先でいこう",
  "やりたかったことを5分だけ進めよう",
  "新しい組み合わせを試してみよう",
  "『あとでやる』を1つだけ今やろう",
  "今日は早めに寝るのもおすすめ",
];

// const dailyWords = [
//   "迷ったら、ちょっと楽しそうな方へ。",
//   "今日は小さな一歩が大きな意味を持つ日。",
//   "直感は、意外と当たる。",
//   "焦らなくても大丈夫。ちゃんと進んでる。",
//   "運は、楽しんでいる人のところに来る。",
//   "いつもより少しだけ前向きでOK。",
//   "今日のあなたにはいい流れが来ています。",
//   "気楽なくらいがちょうどいい日です。",
//   "ひと休みも大事な行動のひとつ。",
//   "いいことは、案外すぐ近くにあります。",
// ];

const renderStars = (count: number) => {
  return "★".repeat(count) + "☆".repeat(5 - count);
};

const QuizResult = ({
  onShareX,
  onRetry,
  selectedChoice,
  fortuneStars,
  fortuneComment,
  luckyItem,
  luckyFood,
  luckyPastime,
  recommendedAction,
  // dailyWord,
}: {
  onShareX: () => void;
  onRetry: () => void;
  selectedChoice: string;
  fortuneStars: number;
  fortuneComment: string;
  luckyItem: string;
  luckyFood: string;
  luckyPastime: string;
  recommendedAction: string;
  // dailyWord: string;
}) => {
  const [showScore, setShowScore] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowScore(true), 500));
    timers.push(setTimeout(() => setShowChoice(true), 1000));
    timers.push(setTimeout(() => setShowText(true), 1500));
    timers.push(setTimeout(() => setShowRank(true), 2200));
    timers.push(setTimeout(() => setShowButton(true), 2200));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="text-center mt-6">
      {showScore && (
        <p className="text-3xl md:text-5xl mb-6 md:mb-8 text-white tracking-wide">🔮ひまQ占い結果🔮</p>
      )}

      {showChoice && (
        <div className="max-w-lg mx-auto text-center border-4 border-black rounded-[22px] px-5 py-4 bg-white/95 shadow-[0_6px_16px_rgba(0,0,0,0.18)]">
          <p className="text-lg md:text-xl font-extrabold text-fuchsia-600">
            あなたが選んだもの✨
          </p>
          <p className="mt-2 text-2xl md:text-3xl text-purple-700 font-black leading-snug">
            「{selectedChoice}」
          </p>
        </div>
      )}

      {showText && (
        <p className="text-xl md:text-2xl text-white font-bold mb-2 mt-6 drop-shadow-md">
          あなたの運勢は…
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-3xl mx-auto space-y-4 mt-6"
      >
        {showRank && (
          <>
            <div className="max-w-2xl mx-auto space-y-4 mt-6">
              {/* {selectedChoice && (
                <div className="text-center border-3 border-black rounded-2xl p-3 bg-white">
                  <p className="text-xl md:text-2xl font-bold text-fuchsia-600">あなたが選んだもの✨</p>
                  <p className="mt-2 text-lg md:text-2xl text-gray-700 font-bold">{selectedChoice}</p>
                </div>
              )} */}

              <div className="text-center border-4 border-black rounded-[28px] px-6 py-6 md:px-8 md:py-8 bg-gradient-to-b from-white to-fuchsia-50 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <p className="text-xl md:text-3xl font-extrabold text-fuchsia-600">今日のひまQ運勢🔮</p>
                <p className="mt-3 text-3xl md:text-5xl text-yellow-500 font-extrabold tracking-wider drop-shadow-sm">
                  {renderStars(fortuneStars)}
                </p>
                <p className="mt-4 text-2xl md:text-4xl text-gray-800 font-black leading-snug">
                  {fortuneComment}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center border-3 border-black rounded-2xl p-4 bg-white shadow-lg">
                  <p className="text-xl md:text-2xl font-bold text-yellow-500">ラッキーアイテム🍀</p>
                  <p className="mt-2 text-lg md:text-2xl text-gray-700 font-bold">{luckyItem}</p>
                </div>

                <div className="text-center border-3 border-black rounded-2xl p-4 bg-white shadow-lg">
                  <p className="text-xl md:text-2xl font-bold text-orange-500">ラッキー食べ物🍙</p>
                  <p className="mt-2 text-lg md:text-2xl text-gray-700 font-bold">{luckyFood}</p>
                </div>

                <div className="text-center border-3 border-black rounded-2xl p-4 bg-white shadow-lg">
                  <p className="text-xl md:text-2xl font-bold text-sky-500">ラッキーひまつぶし🎮</p>
                  <p className="mt-2 text-lg md:text-2xl text-gray-700 font-bold">{luckyPastime}</p>
                </div>

                <div className="text-center border-3 border-black rounded-2xl p-4 bg-white shadow-lg">
                  <p className="text-xl md:text-2xl font-bold text-pink-500">おすすめ行動🚶</p>
                  <p className="mt-2 text-lg md:text-2xl text-gray-700 font-bold">{recommendedAction}</p>
                </div>
              </div>
  {/* 
              <div className="text-center border-3 border-black rounded-2xl p-3 bg-white">
                <p className="text-xl md:text-2xl font-bold text-sky-500">ひとこと💬</p>
                <p className="mt-2 text-lg md:text-2xl text-gray-700">{dailyWord}</p>
              </div> */}
            </div>
          </>
        )}
      </motion.div>


      {showButton && (
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <button
              className="px-6 py-3 bg-gradient-to-r from-slate-900 to-black text-white border-2 border-white rounded-xl font-bold text-xl shadow-lg hover:scale-105 transition-transform cursor-pointer"
              onClick={onShareX}
            >
              Xで結果をシェア
            </button>

            <button
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 via-pink-400 to-purple-400 text-white border-2 border-white rounded-lg font-bold text-xl hover:bg-green-600 cursor-pointer"
              onClick={onRetry}
            >
              もう一回占う🔮
            </button>
          </div>
        </div>
      )}

      {showButton && (
        <div className="mt-6">
          <RecommendedSoloGames
            title="次はどれで遊ぶ？🎮"
            count={4}
            excludeHref="/streak-challenge" // 今のページを出したくないなら
          />
        </div>
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

  const { user, loading: userLoading, supabase } = useSupabaseUser();

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [showCorrectMessage, setShowCorrectMessage] = useState(false);

  const finishedRef = useRef(finished);
  const showCorrectRef = useRef(showCorrectMessage);
  const userIdRef = useRef<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string>("");

  const [fortuneStars, setFortuneStars] = useState(0);
  const [fortuneComment, setFortuneComment] = useState("");
  const [luckyItem, setLuckyItem] = useState("");
  const [luckyFood, setLuckyFood] = useState("");
  const [luckyPastime, setLuckyPastime] = useState("");
  const [recommendedAction, setRecommendedAction] = useState("");
  // const [dailyWord, setDailyWord] = useState("");

  const [showConfirmScreen, setShowConfirmScreen] = useState(false);
  const [isFortuneLoading, setIsFortuneLoading] = useState(false);

  const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const pickWeightedFortune = () => {
    const totalWeight = fortuneResults.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of fortuneResults) {
      random -= item.weight;
      if (random <= 0) return item;
    }

    return fortuneResults[0];
  };

  const shuffleArray = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const resetGame = () => {
    // 進行リセット
    setCurrentIndex(0);
    setUserAnswer(null);
    setFinished(false);

    // 表示/演出リセット
    setShowCorrectMessage(false);

    // ref も同期（あなたのタイマー制御が ref を見てるので重要）
    finishedRef.current = false;
    showCorrectRef.current = false;

    // 問題順もシャッフルし直す（任意だけどおすすめ）
    setQuestions((prev) => shuffleArray(prev));

    setSelectedChoice("");
    setFortuneStars(0);
    setFortuneComment("");
    setLuckyItem("");
    setLuckyFood("");
    setLuckyPastime("");
    setRecommendedAction("");
    // setDailyWord("");
    setShowConfirmScreen(false);
    setIsFortuneLoading(false);
  };

  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);

  useEffect(() => {
    showCorrectRef.current = showCorrectMessage;
  }, [showCorrectMessage]);

  useEffect(() => {
    if (user?.id) userIdRef.current = user.id;
  }, [user]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/articles5");
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

  useEffect(() => {
    if (finished) return;
    if (showCorrectMessage) return;

    const timer = setInterval(() => {
      if (finishedRef.current || showCorrectRef.current) return;
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, finished, showCorrectMessage]);

  const handleChangeChoice = () => {
    setShowConfirmScreen(false);
    setIsFortuneLoading(false);
    setSelectedChoice("");
    setUserAnswer(null);
  };

  const handleStartFortune = () => {
  setIsFortuneLoading(true);

  const pickedFortune = pickWeightedFortune();

    setFortuneStars(pickedFortune.stars);
    setFortuneComment(pickedFortune.comment);
    setLuckyItem(pickRandom(luckyItems));
    setLuckyFood(pickRandom(luckyFoods));
    setLuckyPastime(pickRandom(luckyPastimes));
    setRecommendedAction(pickRandom(recommendedActions));
    // setDailyWord(pickRandom(dailyWords));

    setTimeout(() => {
      setFinished(true);
    }, 5000);
  };

  const checkAnswer = () => {
    if (userAnswer === null) return;

    const selected = questions[currentIndex].quiz?.choices?.[userAnswer];
    setSelectedChoice(String(selected ?? ""));

    setShowConfirmScreen(true);
    setIsFortuneLoading(false);
  };

  if (questions.length === 0) return <p></p>;

  // Xシェア機能
  const handleShareX = () => {
    const text = [
      "【ひまQ占い結果🔮】",
      `選んだもの：「${selectedChoice}」`,
      `今日の運勢は… ${renderStars(fortuneStars)}`,
      `「${fortuneComment}」`,
      `ラッキーアイテム🍀：${luckyItem}`,
      `ラッキー食べ物🍙：${luckyFood}`,
      `ラッキーひまつぶし🎲：${luckyPastime}`,
      `おすすめ行動🎮：${recommendedAction}`,
      "",
      "ひまQで占ってみた！",
      "#ひまQ #占い #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() });
  };

  return (
    <div className="container mx-auto p-8 text-center bg-gradient-to-b from-purple-950 via-fuchsia-900 to-pink-800">
      {!finished ? (
        !showConfirmScreen ? (
          <>
            <p className="text-xl md:text-2xl font-extrabold mb-6 text-white drop-shadow-lg">
              あなたの直感で1つ選んでください🔮
            </p>

            {questions[currentIndex].quiz && (
              <>
                <QuizQuestion5
                  quiz={questions[currentIndex].quiz}
                  userAnswer={userAnswer}
                  setUserAnswer={setUserAnswer}
                />

                <div className="mt-4 flex flex-col items-center gap-3">
                  <button
                    className="px-5 py-3 md:px-6 md:py-3 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 text-white text-lg md:text-xl rounded-full mt-4 hover:scale-105 transition-transform cursor-pointer font-extrabold border-2 border-black shadow-lg disabled:opacity-50"
                    onClick={checkAnswer}
                    disabled={userAnswer === null}
                  >
                    これにする
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center mt-10">
            <div className="max-w-2xl bg-white/95 rounded-3xl border-3 border-black shadow-2xl px-6 py-8">
              {!isFortuneLoading ? (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: {
                      transition: {
                        staggerChildren: 0.5, // ← 0.3秒ずつ出る
                      },
                    },
                  }}
                >
                  <motion.p
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.5 }}
                    className="text-xl md:text-2xl font-extrabold text-fuchsia-700 mb-4"
                  >
                    あなたが選んだのは
                  </motion.p>

                  <motion.p
                    variants={{
                      hidden: { opacity: 0, scale: 0.9 },
                      show: { opacity: 1, scale: 1 },
                    }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl md:text-4xl font-black text-purple-700 mb-6"
                  >
                    「{selectedChoice}」
                  </motion.p>

                  <motion.p
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.5 }}
                    className="text-lg md:text-2xl text-gray-700 font-bold whitespace-pre-line leading-relaxed"
                  >
                    その選択に秘められた運命を、
                    <br />
                    いま読み解きます…🔮
                  </motion.p>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, scale: 0.8, y: 20 },
                      show: { opacity: 1, scale: 1, y: 0 },
                    }}
                    transition={{ duration: 0.6 }}
                    className="mt-8 flex flex-col items-center gap-4"
                  >
                    <button
                      className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 text-white text-xl md:text-2xl rounded-full hover:scale-105 transition-transform cursor-pointer font-extrabold border-2 border-black shadow-lg"
                      onClick={handleStartFortune}
                    >
                      占ってもらう🔮
                    </button>

                    <button
                      className="w-full md:w-auto px-8 py-4 bg-white text-gray-800 text-lg md:text-xl rounded-full hover:scale-105 transition-transform cursor-pointer font-bold border-2 border-black shadow-lg"
                      onClick={handleChangeChoice}
                    >
                      やっぱり他のにする
                    </button>
                  </motion.div>
                </motion.div>
              ) : (
                <>
                  <p className="text-2xl md:text-4xl font-extrabold text-fuchsia-700 mb-6 animate-pulse">
                    それでは占います…🔮
                  </p>

                  <p className="text-lg md:text-2xl text-gray-700 font-bold leading-relaxed">
                    星の流れと、あなたの直感をもとに
                    <br />
                    今日の運勢を読み解いています…
                  </p>

                  <div className="mt-8">
                    <div className="w-16 h-16 border-4 border-fuchsia-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                </>
              )}
            </div>
          </div>
        )
      ) : (
        <QuizResult
          onShareX={handleShareX}
          onRetry={resetGame}
          selectedChoice={selectedChoice}
          fortuneStars={fortuneStars}
          fortuneComment={fortuneComment}
          luckyItem={luckyItem}
          luckyFood={luckyFood}
          luckyPastime={luckyPastime}
          recommendedAction={recommendedAction}
          // dailyWord={dailyWord}
        />
      )}
    </div>
  );
}
