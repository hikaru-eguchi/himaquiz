"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../hooks/useSupabaseUser";

type TitleItem = {
  name: string;
  no: string;
  emoji: string;
  flavor: string;
};

type GachaTitleResult = TitleItem & {
  titleId: string;
  isNew: boolean;
};

type RollCount = 1 | 10;

const GACHA_COST = 500;

const titleItems = [
  { no: "1", name: "のんびり屋", emoji: "🐢", flavor: "ゆっくりでもいい。" },
  { no: "2", name: "いつでもマイペース", emoji: "🌿", flavor: "自分のリズムを大切にする。" },
  { no: "3", name: "ながらプレイヤー", emoji: "📱", flavor: "片手間でも意外と当たる。" },
  { no: "4", name: "今日だけがんばる", emoji: "💪", flavor: "今日の自分はちょっと違う。" },
  { no: "5", name: "コツコツ努力家", emoji: "📘", flavor: "地道に積み上げるタイプ。" },
  { no: "6", name: "切り替え上手", emoji: "🔄", flavor: "気持ちの切り替えが早い。" },
  { no: "7", name: "バランスタイプ", emoji: "⚖️", flavor: "すべてが平均的に強い。" },
  { no: "8", name: "ひらめき待機中", emoji: "💭", flavor: "今まさに降りてきそう。" },
  { no: "9", name: "ひらめき一点突破", emoji: "💡", flavor: "いつもなんか当たってる。" },
  { no: "10", name: "なんとなくで当てちゃう人", emoji: "🎯", flavor: "理由はないけど当たる。" },
  { no: "11", name: "起きる気ゼロ", emoji: "💤", flavor: "今日は無理。" },
  { no: "12", name: "現実ログイン待ち", emoji: "🛌", flavor: "まだベッドから出られない。" },
  { no: "13", name: "やる気ロード中", emoji: "🛌", flavor: "接続が不安定です。" },
  { no: "14", name: "明日から本気出す", emoji: "😴", flavor: "今日はいいや。" },
  { no: "15", name: "今日は勝てる気がする", emoji: "🔥", flavor: "根拠はない。" },
  { no: "16", name: "今日も迷走中", emoji: "🌀", flavor: "とりあえず進もう。" },
  { no: "17", name: "優柔不断マスター", emoji: "🤔", flavor: "どっちも選べない。" },
  { no: "18", name: "思考、置いてきた。", emoji: "😇", flavor: "考えるのをやめた。" },
  { no: "19", name: "勘だけ名人", emoji: "🎯", flavor: "理由はあとから考える。" },
  { no: "20", name: "連続ミス職人", emoji: "💀", flavor: "逆にすごい。" },
  { no: "21", name: "夜しか勝たん", emoji: "🌙", flavor: "昼はおやすみ。" },
  { no: "22", name: "今日もチートデイ", emoji: "🍕", flavor: "昨日もチートデイでした。" },
  { no: "23", name: "カロリーは正義", emoji: "🍔", flavor: "細かいことは気にしない。" },
  { no: "24", name: "時間溶かし職人", emoji: "⏳", flavor: "気づいたら時間消えてる。" },
  { no: "25", name: "ゲームの住人", emoji: "🎮", flavor: "起きてから寝るまでゲーム。" },
  { no: "26", name: "ひまつぶしのプロ", emoji: "🧃", flavor: "時間の使い方が上手い。" },
  { no: "27", name: "ひま人代表取締役", emoji: "🧑‍💼", flavor: "代表やってます。" },
  { no: "28", name: "ひまQガチ勢", emoji: "📅", flavor: "毎日ログイン勢。" },
  { no: "29", name: "全力ひまつぶし中", emoji: "🔥", flavor: "ひまつぶしに全力投球。" },
  { no: "30", name: "爆裂エンジョイ勢", emoji: "🎉", flavor: "楽しんだもん勝ち。" },
  { no: "31", name: "ワンチャン狙い", emoji: "🎲", flavor: "当たればOK。" },
  { no: "32", name: "脳内会議中", emoji: "🧠", flavor: "議題は未定です。" },
  { no: "33", name: "ラッキー体質", emoji: "✨", flavor: "なんかうまくいく。" },
  { no: "34", name: "強運の持ち主", emoji: "🎰", flavor: "運だけで勝つ。" },
  { no: "35", name: "逆転ねらい", emoji: "⚡", flavor: "最後まであきらめない。" },
  { no: "36", name: "気合いでなんとかするマン", emoji: "💪", flavor: "とりあえず押すスタイル。" },
  { no: "37", name: "努力・根性・気合", emoji: "🔥", flavor: "全部で押し切る。" },
  { no: "38", name: "あとはまかせろ", emoji: "😏", flavor: "根拠はないけど頼もしい。" },
  { no: "39", name: "なんか強そうな人", emoji: "😎", flavor: "雰囲気だけ強い。" },
  { no: "40", name: "ゾーン発動中", emoji: "⚡", flavor: "数秒先の未来まで見える。" },
  { no: "41", name: "スマホ使いのプロ", emoji: "📱", flavor: "指さばきが神。" },
  { no: "42", name: "期待の新人", emoji: "🌱", flavor: "これから伸びそう。" },
  { no: "43", name: "注目株", emoji: "📈", flavor: "じわじわ評価が上がっている。" },
  { no: "44", name: "話題の人", emoji: "💥", flavor: "最近ちょっとキテる。" },
  { no: "45", name: "人気アイドル", emoji: "✨", flavor: "みんなに人気。" },
  { no: "46", name: "スター気質", emoji: "🌟", flavor: "自然と目立つ存在。" },
  { no: "47", name: "チームのエース", emoji: "⭐", flavor: "ここぞで決める。" },
  { no: "48", name: "最強一発屋", emoji: "🎆", flavor: "一瞬だけ輝く。" },
  { no: "49", name: "きまぐれ天才", emoji: "🧠", flavor: "たまに神る。" },
  { no: "50", name: "不正解でもいいじゃない", emoji: "😊", flavor: "楽しければ勝ち。" },
];

const pickRandomTitle = () => {
  return titleItems[Math.floor(Math.random() * titleItems.length)];
};

function TitlePlate({
  item,
  large = false,
}: {
  item: Pick<GachaTitleResult, "name" | "emoji" | "flavor">;
  large?: boolean;
}) {
  return (
    <div
      className={`
        relative mx-auto rounded-2xl border-4 border-white shadow-2xl
        bg-gradient-to-br from-yellow-200 via-white to-purple-200
        ${large ? "w-[280px] md:w-[420px] p-5 md:p-8" : "w-[150px] md:w-[220px] p-3 md:p-4"}
      `}
    >
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-black px-3 py-1 text-xs md:text-sm font-black text-yellow-200 border-2 border-white">
        称号
      </div>

      <div className={`${large ? "text-6xl md:text-8xl" : "text-4xl md:text-6xl"} drop-shadow`}>
        {item.emoji}
      </div>

      <div
        className={`
          mt-2 rounded-xl bg-white/90 border-2 border-black px-3 py-2
          ${large ? "text-2xl md:text-5xl" : "text-base md:text-2xl"}
          font-black text-gray-900 leading-tight
        `}
      >
        {item.name}
      </div>

      <p
        className={`
          mt-2 text-gray-800 font-bold leading-tight
          ${large ? "text-sm md:text-xl" : "text-xs md:text-sm"}
        `}
      >
        {item.flavor}
      </p>
    </div>
  );
}

const TitleGacha = ({
  points,
  rolling,
  gachaResult,
  setGachaResult,
  history,
  gachaQueue,
  setGachaQueue,
  gachaIndex,
  setGachaIndex,
  rollCount,
  setRollCount,
  onRoll,
  cost,
  ownedCount,
}: {
  points: number;
  rolling: boolean;
  gachaResult: null | GachaTitleResult;
  setGachaResult: (v: null | GachaTitleResult) => void;
  history: GachaTitleResult[];
  gachaQueue: GachaTitleResult[];
  setGachaQueue: React.Dispatch<React.SetStateAction<GachaTitleResult[]>>;
  gachaIndex: number;
  setGachaIndex: React.Dispatch<React.SetStateAction<number>>;
  rollCount: RollCount;
  setRollCount: React.Dispatch<React.SetStateAction<RollCount>>;
  onRoll: () => void;
  cost: number;
  ownedCount: number;
}) => {
  const [showResult, setShowResult] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<null | GachaTitleResult>(null);

  type Phase = "idle" | "drop" | "ready" | "openingHold" | "opening" | "result";
  const [phase, setPhase] = useState<Phase>("idle");

  const isTenPull = gachaQueue.length > 0;
  const progressText = isTenPull ? `(${gachaIndex + 1}/${gachaQueue.length})` : "";

  // useEffect(() => {
  //   if (!gachaResult) return;

  //   setShowResult(false);
  //   setPhase("drop");

  //   const t = setTimeout(() => {
  //     setPhase("ready");
  //   }, 1200);

  //   return () => clearTimeout(t);
  // }, [gachaResult]);

  useEffect(() => {
    if (!gachaResult) return;

    setShowResult(false);

    // 10連の2個目以降
    if (gachaQueue.length > 0 && gachaIndex > 0) {
      setShowResult(true);
      setPhase("result");
      return;
    }

    // 単発 または 10連1個目
    setPhase("drop");

    const t = setTimeout(() => {
      setPhase("ready");
    }, 1200);

    return () => clearTimeout(t);
  }, [gachaResult]);

  const handleOpen = () => {
    if (!gachaResult) return;
    if (phase !== "ready") return;

    setPhase("openingHold");

    setTimeout(() => {
      setPhase("opening");

      setTimeout(() => {
        setShowResult(true);
        setPhase("result");
      }, 900);
    }, 100);
  };

  const uiLocked = !!gachaResult && phase !== "idle";
  const inputLocked = rolling || uiLocked || isTenPull;
  const canRollNow = points >= cost && !inputLocked;

  return (
    <div className="text-center">
      <div className="mb-10 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-yellow-300 blur-3xl opacity-40" />
          <img
            src="/images/gacha2.png"
            className="relative w-56 h-56 md:w-96 md:h-96 drop-shadow-2xl"
            alt="称号ガチャ"
          />
        </div>

        <div className="mx-auto max-w-[360px] rounded-2xl border-2 border-yellow-400 bg-white px-4 py-3 shadow">
          <p className="text-sm md:text-base font-bold text-gray-600">
            👑 あつめた称号
          </p>

          <p className="text-3xl md:text-4xl font-black text-yellow-600">
            {ownedCount} / 50
            <span className="ml-1 text-base md:text-lg font-bold text-gray-500">
              種類
            </span>
          </p>
        </div>

        <div className="rounded-2xl border-2 border-yellow-500 bg-black/70 px-5 py-3 shadow-xl">
          <p className="text-xl md:text-2xl font-black text-yellow-200">
            所持ポイント：{points} P
          </p>
        </div>

        <p className="text-md md:text-xl text-yellow-100 font-black drop-shadow">
          50種類の称号から完全ランダム！どれが出るかはお楽しみ✨
        </p>

        <div className="flex rounded-2xl border-2 border-yellow-500 overflow-hidden shadow-xl">
          <button
            className={`px-6 py-2 font-black text-lg md:text-xl transition ${
              rollCount === 1
                ? "bg-black text-yellow-200"
                : "bg-white text-gray-800 hover:bg-yellow-100"
            }`}
            onClick={() => setRollCount(1)}
            disabled={inputLocked}
          >
            1回
          </button>

          <button
            className={`px-6 py-2 font-black text-lg md:text-xl transition ${
              rollCount === 10
                ? "bg-black text-yellow-200"
                : "bg-white text-gray-800 hover:bg-yellow-100"
            }`}
            onClick={() => setRollCount(10)}
            disabled={inputLocked}
          >
            10連
          </button>
        </div>

        <button
          className={`
            mt-2 rounded-full border-4 border-white px-8 py-4 font-black text-xl md:text-3xl
            shadow-2xl transition-all duration-300
            ${
              canRollNow
                ? "bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500 text-white hover:scale-105"
                : "bg-gray-500 text-white opacity-50 cursor-not-allowed pointer-events-none"
            }
          `}
          onClick={onRoll}
          disabled={!canRollNow}
        >
          {rolling
            ? "抽選中..."
            : rollCount === 10
            ? `10連で称号を引く（${cost}P）`
            : `称号を引く（${cost}P）`}
        </button>

        {/* <p className="text-sm md:text-base text-yellow-100 font-bold">
          1回500P・全称号同じ確率
        </p> */}

        {points < cost && (
          <p className="text-lg md:text-xl text-red-500 font-black animate-pulse">
            ポイントが足りないよ！（あと {cost - points}P）
          </p>
        )}
      </div>

      <div className="mt-8 rounded-3xl border-4 border-yellow-300 bg-white/90 p-4 md:p-6 shadow-2xl">
        <h2 className="text-2xl md:text-4xl font-black text-gray-900">
          今回ゲットした称号
        </h2>

        {/* <p className="mt-1 text-sm md:text-base text-gray-600 font-bold">
          手に入れた称号は、右上メニュー「マイプロフィール」の「称号コレクション」で確認できるよ！
        </p> */}

        {history.length === 0 ? (
          <p className="mt-6 text-xl md:text-2xl text-gray-500 font-bold">
            まだ称号を引いていません
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <div className="flex gap-4 py-4">
              {history.map((item, index) => (
                <div
                  key={`${item.no}-${index}`}
                  className="relative shrink-0 cursor-pointer"
                  onClick={() => setSelectedHistory(item)}
                >
                  {item.isNew && (
                    <div className="absolute -top-3 -left-2 z-10 rounded-full border-2 border-white bg-red-500 px-3 py-1 text-sm md:text-base font-black text-white shadow">
                      NEW
                    </div>
                  )}

                  <TitlePlate item={item} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedHistory && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedHistory(null)}
          >
            <div className="fixed inset-0 -z-10 bg-black/70" />

            <motion.div
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 40 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <TitlePlate item={selectedHistory} large />

              <p className="mt-4 text-center text-white text-lg md:text-2xl font-black drop-shadow">
                No：{selectedHistory.no}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gachaResult && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (phase === "ready") {
                handleOpen();
                return;
              }

              if (phase === "result") {
                if (gachaQueue.length > 0) {
                  const next = gachaIndex + 1;

                  if (next < gachaQueue.length) {
                    setShowResult(false);
                    setPhase("idle");
                    setGachaIndex(next);

                    setTimeout(() => {
                      setGachaResult(gachaQueue[next]);
                    }, 50);

                    return;
                  }

                  setShowResult(false);
                  setGachaResult(null);
                  setPhase("idle");
                  setGachaQueue([]);
                  setGachaIndex(0);
                  return;
                }

                setShowResult(false);
                setGachaResult(null);
                setPhase("idle");
              }
            }}
          >
            {phase !== "result" && (
              <div
                className="fixed inset-0 z-0"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #facc15, #a855f7, #ec4899, #111827)",
                  filter: "blur(35px)",
                  opacity: 0.75,
                }}
              />
            )}

            {phase === "drop" && (
              <motion.img
                src={`/images/gacha_close4.png`}
                className="z-50 w-72 h-72 md:w-[560px] md:h-[560px] select-none"
                initial={{ y: "-120vh", scale: 0.6 }}
                animate={{ y: 0, scale: 0.6 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                alt="カプセル"
              />
            )}

            {phase === "ready" && (
              <div className="relative z-50 flex flex-col items-center">
                <motion.p
                  className="mb-4 text-4xl md:text-6xl font-black text-white drop-shadow"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  タップで開封！{progressText}
                </motion.p>

                <motion.img
                  src={`/images/gacha_close4.png`}
                  className="w-72 h-72 md:w-[560px] md:h-[560px] z-50 cursor-pointer select-none"
                  initial={{ scale: 0.6 }}
                  animate={{
                    rotate: [-3, 3, -3],
                    y: [0, -6, 0],
                    scale: 0.6,
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  alt="カプセル"
                />
              </div>
            )}

            {phase === "openingHold" && (
              <motion.img
                src={`/images/gacha_close4.png`}
                className="w-72 h-72 md:w-[560px] md:h-[560px] z-50 select-none"
                initial={{ scale: 0.6, y: 0 }}
                animate={{ scale: 0.6, y: 6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                alt="カプセル"
              />
            )}

            {phase === "opening" && (
              <motion.img
                src={`/images/gacha_open4.png`}
                className="z-50"
                initial={{ scale: 0.55 }}
                animate={{ scale: 0.7 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                alt="開封"
              />
            )}

            {showResult && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, #facc15, #a855f7, #ec4899, #111827)",
                    filter: "blur(35px)",
                    opacity: 0.6,
                  }}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.35, y: 80 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="relative z-50 text-center"
                >
                  {gachaResult.isNew && (
                    <div className="absolute -top-8 left-2 z-20 rounded-full border-4 border-white bg-gradient-to-r from-red-500 via-pink-500 to-yellow-400 px-5 py-2 text-2xl md:text-4xl font-black text-white shadow-xl">
                      NEW
                    </div>
                  )}

                  <TitlePlate item={gachaResult} large />

                  <p className="mt-5 text-xl md:text-3xl font-black text-yellow-200">
                    No：{gachaResult.no}
                  </p>

                  <p className="mt-2 text-3xl md:text-6xl font-black text-white drop-shadow">
                    {gachaResult.name} をゲット！
                  </p>
                </motion.div>

                <p className="relative z-50 mt-4 text-lg md:text-2xl font-black text-white drop-shadow">
                  {isTenPull
                    ? `タップで次へ！ (${gachaIndex + 1}/${gachaQueue.length})`
                    : "タップで閉じる"}
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function TitleGachaPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [showDescription, setShowDescription] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const [ownedTitleNames, setOwnedTitleNames] = useState<Set<string>>(new Set());
  const [rolling, setRolling] = useState(false);
  const [points, setPoints] = useState(0);
  const [gachaResult, setGachaResult] = useState<GachaTitleResult | null>(null);
  const [history, setHistory] = useState<GachaTitleResult[]>([]);
  const [rollCount, setRollCount] = useState<RollCount>(1);
  const [gachaQueue, setGachaQueue] = useState<GachaTitleResult[]>([]);
  const [gachaIndex, setGachaIndex] = useState(0);

  useEffect(() => {
    if (userLoading) return;
    if (!user) return;

    const fetchData = async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("fetch profile error:", profileError);
      } else {
        setPoints(profile?.points ?? 0);
      }

      const { data: owned, error: ownedError } = await supabase
        .from("user_titles")
        .select("title")
        .eq("user_id", user.id)
        .eq("game", "title_gacha");

      if (ownedError) {
        console.error("fetch owned titles error:", ownedError);
      } else {
        setOwnedTitleNames(new Set((owned ?? []).map((r) => r.title)));
      }
    };

    fetchData();
  }, [user, userLoading, supabase]);

  const getCost = (count: RollCount) => {
    return GACHA_COST * count;
  };

  const rollTitleGacha = async () => {
    if (rolling) return;

    if (!user) {
      alert("ログインしてから称号ガチャを回してね！");
      return;
    }

    setRolling(true);
    setGachaQueue([]);
    setGachaIndex(0);

    const lockMs = rollCount === 10 ? 3500 : 3000;
    setTimeout(() => setRolling(false), lockMs);

    try {
      const cost = getCost(rollCount);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("get profile error:", profileError);
        alert("ポイントの取得に失敗しました。");
        return;
      }

      const currentPoints = profile?.points ?? 0;

      if (currentPoints < cost) {
        alert(`ポイントが足りません！（${cost}P以上必要です）`);
        return;
      }

      const newPoints = currentPoints - cost;

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({ points: newPoints })
        .eq("id", user.id)
        .select("points")
        .single();

      if (updateError) {
        console.error("update points error:", updateError);
        alert("ポイントの更新に失敗しました。");
        return;
      }

      setPoints(updatedProfile?.points ?? newPoints);
      window.dispatchEvent(new Event("points:updated"));

      await supabase.from("user_point_logs").insert({
        user_id: user.id,
        change: -cost,
        reason:
          rollCount === 10
            ? "称号10連ガチャでポイント消費"
            : "称号ガチャでポイント消費",
      });

      const tempOwned = new Set(ownedTitleNames);
      const results: GachaTitleResult[] = [];

      for (let i = 0; i < rollCount; i++) {
        const title = pickRandomTitle();

        const isNew = !tempOwned.has(title.name);
        if (isNew) tempOwned.add(title.name);

        results.push({
          ...title,
          titleId: title.no,
          isNew,
        });
      }

      for (const result of results) {
        const { data, error } = await supabase.rpc("claim_gacha_title", {
          p_title: result.name,
        });

        if (error) {
          console.error("claim_gacha_title error:", error);
          continue;
        }

        const row = Array.isArray(data) ? data[0] : data;
        result.isNew = !!row?.is_new;
      }

      setOwnedTitleNames(tempOwned);
      setHistory((prev) => [...prev, ...results]);

      if (rollCount === 1) {
        setGachaResult(results[0]);
        return;
      }

      setGachaQueue(results);
      setGachaIndex(0);
      setGachaResult(results[0]);
    } finally {
      // 演出ロックは setTimeout 側で解除
    }
  };

  if (!userLoading && !user) {
    return (
      <div className="bg-gradient-to-b from-purple-900 via-slate-900 to-black px-4">
        <div className="flex items-center justify-center">
          <div className="max-w-xl w-full rounded-3xl border-4 border-yellow-300 bg-white/95 p-6 md:p-10 text-center shadow-2xl">
            <p className="text-4xl md:text-6xl">👑</p>

            <p className="mt-4 text-xl md:text-3xl font-black text-gray-900">
              称号ガチャはログインすると遊べるよ！
            </p>

            <p className="mt-3 text-sm md:text-lg text-gray-700 font-bold leading-relaxed">
              ログインすると、ゲットした称号が保存されて、
              プロフィールに飾れるようになります。
            </p>

            <div className="mt-6 flex flex-col md:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/user/login")}
                className="rounded-xl bg-purple-600 px-6 py-3 font-black text-white shadow hover:bg-purple-700"
              >
                ログインして遊ぶ
              </button>

              <button
                onClick={() => router.push("/user/signup")}
                className="rounded-xl bg-yellow-400 px-6 py-3 font-black text-black shadow hover:bg-yellow-300"
              >
                新規登録（無料）
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-[radial-gradient(circle_at_top,#facc15_0%,#7e22ce_35%,#111827_75%)]">
      <div className="container mx-auto px-4 py-6 text-center">
        <div className="mx-auto max-w-5xl rounded-3xl border-4 border-yellow-300 bg-black/40 p-4 md:p-8 shadow-2xl backdrop-blur">
          <p className="text-5xl md:text-7xl">👑</p>

          <h1
            className="
              mt-2 text-5xl md:text-8xl font-black tracking-widest
              text-yellow-200 drop-shadow-[0_4px_0_rgba(0,0,0,0.9)]
            "
          >
            称号ガチャ
          </h1>

          <p className="mt-4 text-xl md:text-3xl font-black text-white drop-shadow">
            ガチャを回して称号ゲット！
            <br className="md:hidden" />
            プロフィールに飾って自慢しよう✨
          </p>

          <p className="mt-3 text-sm md:text-xl text-yellow-100 font-bold leading-relaxed">
            いろいろな称号が当たるガチャです。
            <br />
            集めるほどプロフィールがにぎやかになります。
          </p>

          <button
            onClick={() => setShowDescription((prev) => !prev)}
            className="mt-5 rounded-full border-2 border-yellow-300 bg-white px-6 py-2 font-black text-gray-900 shadow hover:bg-yellow-100"
          >
            説明を見る
          </button>

          <div
            className="mt-3 overflow-hidden rounded-2xl bg-white/95 transition-all duration-500"
            style={{
              maxHeight: showDescription
                ? descriptionRef.current?.scrollHeight
                : 0,
            }}
          >
            <div
              ref={descriptionRef}
              className="px-4 py-4 text-sm md:text-lg text-gray-800 font-bold leading-relaxed"
            >
              <p>
                「称号ガチャ」は、クイズでためたポイントを使って、
                プロフィールに飾れる称号をゲットするガチャです。
              </p>

              <br />

              <p>
                称号は全部で50種類。
                「クイズマスター」「ひらめきの天才」「ひまQの王」など、
                プロフィールに置きたくなる称号を集めよう！
              </p>

              <br />

              <p>
                手に入れた称号は、右上メニュー「マイプロフィール」の「称号コレクション」で確認できます。
              </p>

              <p>
                また、「マイプロフィール」の「プロフィールを編集」から「マイ称号」に設定できます。
              </p>

              <br />

              <p>
                ＜消費ポイント＞
                <br />
                1回：500P
                <br />
                10連：5000P
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <TitleGacha
          points={points}
          rolling={rolling}
          gachaResult={gachaResult}
          setGachaResult={setGachaResult}
          history={history}
          gachaQueue={gachaQueue}
          setGachaQueue={setGachaQueue}
          gachaIndex={gachaIndex}
          setGachaIndex={setGachaIndex}
          rollCount={rollCount}
          setRollCount={setRollCount}
          onRoll={rollTitleGacha}
          cost={getCost(rollCount)}
          ownedCount={ownedTitleNames.size}
        />
      </div>
    </div>
  );
}