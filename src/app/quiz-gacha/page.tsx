"use client";

import { useState, useEffect, useRef } from "react";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Rarity } from "../../types/gacha";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSupabaseUser } from "../../hooks/useSupabaseUser";

const anton = Anton({ subsets: ["latin"], weight: "400" });

/* ====== 下部のガチャコンポーネント ====== */
const QuizGacha = ({
  points,
  rollGacha,
  gachaResult,
  setGachaResult,
  history,
  setHistory,
  rolling,
}: {
  points: number;
  rollGacha: () => void;
  gachaResult: null | {
    name: string;
    image: string;
    rarity: Rarity;
    no: string;
  };
  setGachaResult: (
    v: null | { name: string; image: string; rarity: Rarity; no: string }
  ) => void;
  history: { name: string; image: string; rarity: Rarity; no: string }[];
  setHistory: React.Dispatch<
    React.SetStateAction<
      { name: string; image: string; rarity: Rarity; no: string }[]
    >
  >;
  rolling: boolean;
}) => {
  const [showOpen, setShowOpen] = useState(false);
  const [showEffect, setShowEffect] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [capsuleSet, setCapsuleSet] = useState<1 | 2 | 3>(1);
  type Phase = "idle" | "drop" | "ready" | "openingHold" | "opening" | "result";
  const [phase, setPhase] = useState<Phase>("idle");
  const handleOpen = () => {
    if (!gachaResult) return;
    if (phase !== "ready") return;

    // 連打防止：すぐ待機から抜ける
    setPhase("openingHold");

    // ① 一瞬「閉じ」で止める（ゆらゆら停止）
    const HOLD_MS = 500;

    setTimeout(() => {
      // ② ぱかっ（開く画像へ）
      setPhase("opening");
      setShowOpen(true);

      if (isUltraRare) {
        setTimeout(() => setShowDark(true), 900);
        setTimeout(() => setShowFlash(true), 2000);
        setTimeout(() => {
          setShowResult(true);
          setPhase("result");
        }, 2600);
      } else {
        setTimeout(() => {
          setShowResult(true);
          setPhase("result");
        }, 900);
      }
    }, HOLD_MS);
  };

  const [selectedHistory, setSelectedHistory] =
    useState<null | { name: string; image: string; rarity: Rarity; no: string }>(
      null
    );

  const rarityToStarCount: Record<string, number> = {
    ノーマル: 1,
    レア: 2,
    超レア: 3,
    激レア: 4,
    超激レア: 5,
    神レア: 6,
    シークレット: 7,
  };

  const rarityGradient = {
    ノーマル: "from-gray-400 via-gray-300 to-gray-200",
    レア: "from-blue-400 via-blue-300 to-blue-200",
    超レア: "from-purple-500 via-purple-400 to-purple-300",
    激レア: "from-pink-500 via-rose-400 to-red-300",
    超激レア: "from-yellow-400 via-orange-400 to-red-400",
    神レア: "from-green-400 via-emerald-400 to-teal-300",
    シークレット: "from-black via-gray-700 to-purple-700",
  } as const;

  const rarityText: Record<string, string> = {
    ノーマル: "text-gray-400",
    レア: "text-blue-400",
    超レア: "text-purple-400",
    激レア: "text-pink-400",
    超激レア: "text-yellow-400",
    神レア: "text-green-400",
    シークレット: "text-black",
  };

  const ULTRA_RARES = {
    激レア: true,
    超激レア: true,
    神レア: true,
    シークレット: true,
  } as const;

  const isUltraRare = !!gachaResult && gachaResult.rarity in ULTRA_RARES;

  const [showDark, setShowDark] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // ガチャ演出
  useEffect(() => {
    if (!gachaResult) return;

    setCapsuleSet((Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3);

    // 状態リセット
    setShowOpen(false);
    setShowDark(false);
    setShowFlash(false);
    setShowResult(false);

    // まず落下
    setPhase("drop");

    // 落下アニメ(1.2s)が終わったら「待機」
    const t = setTimeout(() => {
      setPhase("ready");
    }, 1200);

    return () => clearTimeout(t);
  }, [gachaResult]);

  const canRoll = points >= 100 && !rolling;

  return (
    <div className="text-center">
      <div className="flex flex-col items-center justify-center gap-4 mb-10">
        <img src="/images/gacha.png" className="w-60 h-60 md:w-100 md:h-100" />
        <div className="flex flex-col items-center justify-between w-full mx-auto">
          <div className="bg-white border border-black px-4 py-2 rounded shadow">
            <p className="text-xl md:text-2xl font-bold text-gray-800">
              所持ポイント：{points} P
            </p>
          </div>
        </div>
        <button
          className={`
            px-6 py-3 rounded-lg font-bold text-xl border border-black
            transition-all duration-300 ease-in-out
            ${
              canRoll
                ? "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                : "bg-blue-500 text-white opacity-50 cursor-not-allowed pointer-events-none"
            }
            `}
          onClick={rollGacha}
          disabled={!canRoll}
        >
          {rolling ? "抽選中..." : "100Pでガチャを回す🎰"}
        </button>

        {points < 100 && (
          <p className="text-xl text-red-500 font-bold animate-pulse">
            ポイントが足りないよ！
          </p>
        )}
      </div>

      {/* 入手キャラ履歴 */}
      <div className="mt-6 border-t pt-4">
        <h2 className="text-xl md:text-2xl font-bold mb-2">入手キャラ</h2>

        {history.length === 0 ? (
          <p className="text-xl md:text-2xl text-center text-gray-500">なし</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex justify-center">
              <div className="flex flex-nowrap gap-4 py-2">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="text-center flex-shrink-0 cursor-pointer"
                    onClick={() => setSelectedHistory(item)}
                  >
                    <img
                      src={item.image}
                      className="w-16 h-16 md:w-32 md:h-32 mx-auto rounded"
                    />
                    <p className="text-sm md:text-xl font-bold mt-1">
                      {item.name}
                    </p>
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

      {/* 拡大モーダル */}
      <AnimatePresence>
        {selectedHistory && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedHistory(null)}
          >
            <div className="fixed inset-0 -z-10">
              <div
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #ff00ff, #00ffff, #ffff00, #ff0000)",
                  filter: "blur(120px)",
                  opacity: 0.6,
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>

            <motion.div
              className="bg-white p-6 rounded-2xl flex flex-col items-center z-50"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedHistory.image}
                className="w-40 h-40 md:w-64 md:h-64 rounded mb-4"
              />
              <p className="text-lg md:text-2xl text-gray-700">
                No：{selectedHistory.no}
              </p>
              <p className="text-3xl md:text-5xl font-bold mt-1 md:mt-2">
                {selectedHistory.name}
              </p>
              <p className="text-xl md:text-3xl font-extrabold mt-3 md:mt-5 text-gray-500 drop-shadow">
                レアリティ：
                <span
                  className={`text-xl md:text-3xl font-bold ${
                    rarityText[selectedHistory.rarity]
                  }`}
                >
                  {selectedHistory.rarity}
                </span>
              </p>
              <p className="text-yellow-300 text-2xl md:text-4xl font-extrabold mt-1 md:mt-3 drop-shadow">
                {"★".repeat(rarityToStarCount[selectedHistory.rarity] || 1)}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ガチャ結果演出 */}
      <AnimatePresence>
        {gachaResult && (
          <motion.div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-colors duration-300 ${
              phase === "result" ? "bg-white" : "bg-black"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              // 「待機中」だけ、どこを押しても開封
              if (phase === "ready") {
                handleOpen();
                return;
              }

              // 結果表示中：どこ押しても閉じる
              if (phase === "result") {
                setShowOpen(false);
                setShowEffect(false);
                setShowResult(false);
                setGachaResult(null);
                setPhase("idle");
                return;
              }
            }}
          >
            {(phase === "drop") && (
              <motion.img
                src={`/images/gacha_close${capsuleSet === 1 ? "" : capsuleSet}.png`}
                className="w-70 h-70 md:w-150 md:h-150 z-50 cursor-pointer select-none"
                initial={{ y: "-120vh", scale: 0.6 }}
                animate={{ y: 0, scale: 0.6 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            )}

            {(phase === "ready") && (
              <div className="relative z-50 flex flex-col items-center">
                <motion.p
                  className="mb-4 text-white font-extrabold text-4xl md:text-6xl drop-shadow"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.0, repeat: Infinity }}
                >
                  タップで開封！
                </motion.p>

                <motion.img
                  src={`/images/gacha_close${capsuleSet === 1 ? "" : capsuleSet}.png`}
                  className="w-70 h-70 md:w-150 md:h-150 z-50 cursor-pointer select-none"
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
                />
              </div>
            )}

            {phase === "openingHold" && (
              <motion.img
                src={`/images/gacha_close${capsuleSet === 1 ? "" : capsuleSet}.png`}
                className="w-70 h-70 md:w-150 md:h-150 z-50 cursor-pointer select-none"
                initial={{ scale: 0.6, y: 0 }}
                animate={{ scale: 0.6, y: 6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            )}

            {(phase === "opening") && (
              <motion.img
                src={`/images/gacha_open${capsuleSet === 1 ? "" : capsuleSet}.png`}
                className="z-50"
                initial={{ scale: 0.55 }}
                animate={{ scale: 0.7 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            )}

            {isUltraRare && showDark && (
              <motion.div
                className="fixed inset-0 bg-black z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ duration: 0.6 }}
              />
            )}

            {isUltraRare && showFlash && (
              <motion.div
                className="fixed inset-0 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1] }}
                transition={{ duration: 1.2 }}
                style={{
                  background:
                    "radial-gradient(circle at center, #ffffff, #ffff99, transparent 90%)",
                }}
              />
            )}

            {showResult && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, #ff00ff, #00ffff, #ffff00, #ff0000)",
                    filter: "blur(120px)",
                    opacity: isUltraRare ? 0.6 : 0.5,
                  }}
                />

                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="fixed z-40 w-4 h-4 rounded-full bg-white"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: isUltraRare ? 0.6 : 0.5,
                      filter: "blur(4px)",
                    }}
                    animate={{ y: [-10, 10] }}
                    transition={{
                      duration: 1 + Math.random(),
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                ))}

                <motion.div
                  initial={{ opacity: 0, scale: 0.3, y: 80 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  transition={{
                    duration: isUltraRare ? 1.5 : 0.5,
                    ease: "easeOut",
                  }}
                  className={`
                    relative z-50 text-center p-6 rounded-2xl shadow-2xl
                    bg-gradient-to-r ${rarityGradient[gachaResult.rarity]}
                  `}
                >
                  <img
                    src={gachaResult.image}
                    className="w-50 h-50 md:w-70 md:h-70 mx-auto drop-shadow-lg"
                  />
                  <p className="text-3xl md:text-5xl font-bold mt-4 text-white drop-shadow">
                    {gachaResult.name} が当たった！
                  </p>
                  <p className="text-2xl md:text-4xl font-extrabold mt-2 text-white drop-shadow">
                    レアリティ：{gachaResult.rarity}
                  </p>
                  <p className="text-yellow-300 text-4xl md:text-6xl font-extrabold mt-1 drop-shadow">
                    {"★".repeat(
                      rarityToStarCount[gachaResult.rarity] || 1
                    )}
                  </p>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ====== 上部の説明 + 下部ガチャをまとめたページ ====== */
export default function QuizMasterPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { user, loading: userLoading } = useSupabaseUser();

  const [showDescription, setShowDescription] = useState(false);
  const handleDescriptionClick = () =>
    setShowDescription((prev) => !prev);

  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const [rolling, setRolling] = useState(false);
  // DB から読むポイント
  const [points, setPoints] = useState(0);
  const [gachaResult, setGachaResult] = useState<null | {
    name: string;
    image: string;
    rarity: Rarity;
    no: string;
  }>(null);
  const [history, setHistory] = useState<
    { name: string; image: string; rarity: Rarity; no: string }[]
  >([]);

  // ★ 追加: プロフィールからポイント読み込み
  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      return;
    }

    const fetchPoints = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("fetchPoints error:", error);
        return;
      }
      setPoints(data?.points ?? 0);
    };

    fetchPoints();
  }, [user, userLoading, supabase, router]);

  const gachaCharacters: {
    name: string;
    image: string;
    rarity: Rarity;
    weight: number;
    no: string;
  }[] = [
    { name: "ダンジョンの剣士", image: "/images/ダンジョンの剣士_1.png", rarity: "ノーマル", weight: 4.2857, no: "1" },
    { name: "ダンジョンの武闘家", image: "/images/ダンジョンの武闘家_1.png", rarity: "ノーマル", weight: 4.2857, no: "2" },
    { name: "ダンジョンの魔法使い", image: "/images/ダンジョンの魔法使い_1.png", rarity: "ノーマル", weight: 4.2857, no: "3" },
    { name: "スライム", image: "/images/スライム_1.png", rarity: "ノーマル", weight: 4.2857, no: "4" },
    { name: "スライム【フェアリー】", image: "/images/スライム_2.png", rarity: "ノーマル", weight: 4.2857, no: "5" },
    { name: "ゴブリン", image: "/images/ゴブリン_1.png", rarity: "ノーマル", weight: 4.2857, no: "6" },
    { name: "ゴブリン【フェアリー】", image: "/images/ゴブリン_2.png", rarity: "ノーマル", weight: 4.2857, no: "7" },
    { name: "スケルトン", image: "/images/スケルトン_1.png", rarity: "レア", weight: 3.3333, no: "8" },
    { name: "スケルトン【フェアリー】", image: "/images/スケルトン_2.png", rarity: "レア", weight: 3.3333, no: "9" },
    { name: "ミミック", image: "/images/ミミック_1.png", rarity: "レア", weight: 3.3333, no: "10" },
    { name: "ミミック【フェアリー】", image: "/images/ミミック_2.png", rarity: "レア", weight: 3.3333, no: "11" },
    { name: "リザードマン", image: "/images/リザードマン_1.png", rarity: "レア", weight: 3.3333, no: "12" },
    { name: "リザードマン【フェアリー】", image: "/images/リザードマン_2.png", rarity: "レア", weight: 3.3333, no: "13" },
    { name: "ゴーレム", image: "/images/ゴーレム_1.png", rarity: "超レア", weight: 3.0, no: "14" },
    { name: "ゴーレム【フェアリー】", image: "/images/ゴーレム_2.png", rarity: "超レア", weight: 3.0, no: "15" },
    { name: "ケルベロス", image: "/images/ケルベロス_1.png", rarity: "超レア", weight: 3.0, no: "16" },
    { name: "ケルベロス【フェアリー】", image: "/images/ケルベロス_2.png", rarity: "超レア", weight: 3.0, no: "17" },
    { name: "バーサーカー", image: "/images/バーサーカー_1.png", rarity: "超レア", weight: 3.0, no: "18" },
    { name: "バーサーカー【フェアリー】", image: "/images/バーサーカー_2.png", rarity: "超レア", weight: 3.0, no: "19" },
    { name: "キングスライム", image: "/images/キングスライム_1.png", rarity: "激レア", weight: 2.2438, no: "20" },
    { name: "キングスライム【フェアリー】", image: "/images/キングスライム_2.png", rarity: "激レア", weight: 2.2438, no: "21" },
    { name: "ドラゴン", image: "/images/ドラゴン_1.png", rarity: "激レア", weight: 2.2438, no: "22" },
    { name: "ドラゴン【フェアリー】", image: "/images/ドラゴン_2.png", rarity: "激レア", weight: 2.2438, no: "23" },
    { name: "フェニックス", image: "/images/フェニックス_1.png", rarity: "激レア", weight: 2.2438, no: "24" },
    { name: "フェニックス【フェアリー】", image: "/images/フェニックス_2.png", rarity: "激レア", weight: 2.2438, no: "25" },
    { name: "リヴァイアサン", image: "/images/リヴァイアサン_1.png", rarity: "激レア", weight: 2.2438, no: "26" },
    { name: "リヴァイアサン【フェアリー】", image: "/images/リヴァイアサン_2.png", rarity: "激レア", weight: 2.2438, no: "27" },
    { name: "ブラックドラゴン", image: "/images/ブラックドラゴン_1.png", rarity: "超激レア", weight: 1.6667, no: "28" },
    { name: "ブラックドラゴン【フェアリー】", image: "/images/ブラックドラゴン_2.png", rarity: "超激レア", weight: 1.6667, no: "29" },
    { name: "キングデーモン", image: "/images/キングデーモン_1.png", rarity: "超激レア", weight: 1.6667, no: "30" },
    { name: "キングデーモン【フェアリー】", image: "/images/キングデーモン_2.png", rarity: "超激レア", weight: 1.6667, no: "31" },
    { name: "キングヒドラ", image: "/images/キングヒドラ_1.png", rarity: "超激レア", weight: 1.6667, no: "32" },
    { name: "キングヒドラ【フェアリー】", image: "/images/キングヒドラ_2.png", rarity: "超激レア", weight: 1.6667, no: "33" },
    { name: "オーディン", image: "/images/オーディン_1.png", rarity: "神レア", weight: 0.2, no: "34" },
    { name: "オーディン【フェアリー】", image: "/images/オーディン_2.png", rarity: "神レア", weight: 0.2, no: "35" },
    { name: "ポセイドン", image: "/images/ポセイドン_1.png", rarity: "神レア", weight: 0.2, no: "36" },
    { name: "ポセイドン【フェアリー】", image: "/images/ポセイドン_2.png", rarity: "神レア", weight: 0.2, no: "37" },
    { name: "ハデス", image: "/images/ハデス_1.png", rarity: "神レア", weight: 0.2, no: "38" },
    { name: "ハデス【フェアリー】", image: "/images/ハデス_2.png", rarity: "神レア", weight: 0.2, no: "39" },
    { name: "ゼウス", image: "/images/ゼウス_1.png", rarity: "神レア", weight: 0.2, no: "40" },
    { name: "ゼウス【フェアリー】", image: "/images/ゼウス_2.png", rarity: "神レア", weight: 0.2, no: "41" },
    { name: "軍荼利明王（ぐんだりみょうおう）", image: "/images/軍荼利明王_1.png", rarity: "神レア", weight: 0.2, no: "42" },
    { name: "軍荼利明王（ぐんだりみょうおう）【フェアリー】", image: "/images/軍荼利明王_2.png", rarity: "神レア", weight: 0.2, no: "43" },
    { name: "魔王", image: "/images/魔王_1.png", rarity: "神レア", weight: 0.2, no: "44" },
    { name: "魔王【フェアリー】", image: "/images/魔王_2.png", rarity: "神レア", weight: 0.2, no: "45" },
    { name: "クイズマスターの最強勇者", image: "/images/勇者1_1.png", rarity: "神レア", weight: 0.2, no: "46" },
    { name: "クイズマスターの最強勇者【フェアリー】", image: "/images/勇者1_2.png", rarity: "神レア", weight: 0.2, no: "47" },
    { name: "クイズマスターの最強勇者【プレミア】", image: "/images/勇者1_3.png", rarity: "神レア", weight: 0.2, no: "48" },
    { name: "クイズ王", image: "/images/王様_1.png", rarity: "神レア", weight: 0.2, no: "49" },
    { name: "クイズ王【フェアリー】", image: "/images/王様_2.png", rarity: "神レア", weight: 0.2, no: "50" },
    { name: "ダンジョンの最強の剣士", image: "/images/ダンジョンの剣士_2.png", rarity: "神レア", weight: 0.2, no: "51" },
    { name: "ダンジョンの最強の武闘家", image: "/images/ダンジョンの武闘家_2.png", rarity: "神レア", weight: 0.2, no: "52" },
    { name: "ダンジョンの最強の魔法使い", image: "/images/ダンジョンの魔法使い_2.png", rarity: "神レア", weight: 0.2, no: "53" },
    { name: "ゴールデンキングスライム", image: "/images/ゴールデンキングスライム_1.png", rarity: "シークレット", weight: 0.01, no: "54" },
    { name: "ゴールデンキングスライム【フェアリー】", image: "/images/ゴールデンキングスライム_2.png", rarity: "シークレット", weight: 0.01, no: "55" },
    { name: "伝説の勇者", image: "/images/勇者2_1.png", rarity: "シークレット", weight: 0.01, no: "56" },
    { name: "伝説の勇者【フェアリー】", image: "/images/勇者2_2.png", rarity: "シークレット", weight: 0.01, no: "57" },
    { name: "伝説の勇者【プレミア】", image: "/images/勇者2_3.png", rarity: "シークレット", weight: 0.01, no: "58" },
  ];

  // ★ 修正: プロフィールの points を減らしてログを書き込んでからガチャ抽選
  const rollGacha = async () => {
    if (rolling) return;
    setRolling(true);

    // 3秒は必ず押せないようにする
    const unlockTimer = setTimeout(() => {
      setRolling(false);
    }, 3000);

    try {
      if (!user) {
        alert("ログインしてからガチャを回してね！");
        return;
      }

      // 最新ポイントを DB から取得
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("get profile points error:", profileError);
        alert("ポイントの取得に失敗しました。時間をおいてもう一度試してください。");
        return;
      }

      const currentPoints = profile?.points ?? 0;
      if (currentPoints < 100) {
        alert("ポイントが足りません！（100P以上必要です）");
        return;
      }

      const newPoints = currentPoints - 100;

      // プロフィールのポイントを更新
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({ points: newPoints })
        .eq("id", user.id)
        .select("points")
        .single();

      if (updateError) {
        console.error("update points error:", updateError);
        alert("ポイントの更新に失敗しました。時間をおいてもう一度試してください。");
        return;
      }

      // state も更新
      setPoints(updatedProfile?.points ?? newPoints);

      window.dispatchEvent(new Event("points:updated"));

      // ポイントログを記録（-100）
      const { error: logError } = await supabase.from("user_point_logs").insert({
        user_id: user.id,
        change: -100,
        reason: "ガチャでポイント消費",
      });

      if (logError) {
        console.error("insert user_point_logs error:", logError);
        // ログ失敗は致命的ではないのでアラートまでは出さないでもOK
      }

      // ここからガチャ抽選処理
      const totalWeight = gachaCharacters.reduce(
        (sum, c) => sum + c.weight,
        0
      );
      let random = Math.random() * totalWeight;

      for (const char of gachaCharacters) {
        if (random < char.weight) {
          setGachaResult(char);
          setTimeout(() => {
            setHistory((prev) => [...prev, char]);
          }, 2000);

          // キャラ取得ログ
          try {
            const { data: characterRow, error: findError } = await supabase
              .from("characters")
              .select("id")
              .eq("no", char.no)
              .maybeSingle();

            if (findError) {
              console.error("character lookup error:", findError);
              return;
            }
            if (!characterRow) {
              console.error("character not found for no:", char.no);
              return;
            }

            const { error: rpcError } = await supabase.rpc("increment_user_character", {
              p_user_id: user.id,
              p_character_id: characterRow.id,
            });

            if (rpcError) {
              console.error("increment_user_character rpc error:", rpcError);
            }
          } catch (e) {
            console.error("save gacha result error:", e);
          }

          return;
        }
        random -= char.weight;
      }
    } finally {
      // 3秒固定ロックを優先するため、ここでは解除しない
      // （失敗時に早く解除したいなら、ここで clearTimeout & setRolling(false) に変える）
      // 今回は「必ず3秒押せない」が要件なのでこのまま。
      // ただしコンポーネントがアンマウントされる可能性があるなら cleanup を入れるのが理想。
    }
  };

  if (!userLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-300 via-blue-200 to-green-200">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="bg-white/90 backdrop-blur p-6 md:p-10 rounded-2xl border-2 border-black shadow-xl text-center max-w-xl w-full">

            <p className="mt-4 text-lg md:text-2xl font-bold text-gray-800">
              このページはログインすると遊べるよ！
            </p>

            <p className="mt-2 text-sm md:text-lg text-gray-700 leading-relaxed">
              ログインすると、ポイントや入手キャラが保存されて<br />
              「マイキャラ図鑑」でも確認できるようになります。
            </p>

            <div className="mt-6 flex flex-col md:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/user/login")}
                className="px-6 py-3 rounded-lg font-bold text-white bg-blue-500 hover:bg-blue-600 shadow"
              >
                ログインして遊ぶ
              </button>
              <button
                onClick={() => router.push("/user/signup")}
                className="px-6 py-3 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 shadow"
              >
                新規ユーザー登録
              </button>
            </div>

            <p className="mt-4 text-xs md:text-sm text-gray-600">
              ※ログイン後にこのページへ戻るとガチャを回せます
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user) {
    // useEffect で /user/login に飛ばしているので、ここでは何も出さない
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-400 via-blue-200 to-green-200">
      <div className="container mx-auto px-4 py-6 text-center">
        <>
          {/* タイトル */}
          <h1
            className="
              text-5xl md:text-7xl font-extrabold tracking-widest mb-4
              text-white
              drop-shadow-[0_0_10px_rgba(0,0,0,0.9)]
            "
          >
            <span className="block md:hidden leading-tight">
              クイズ<br />ガチャ
            </span>
            <span className="hidden md:block">クイズガチャ</span>
          </h1>
          <p
            className="
              text-2xl md:text-4xl font-extrabold mb-3
              text-white
            "
          >
            ポイントを使ってガチャを回そう！超レアキャラが飛び出すかも…！？
          </p>
          <p className="text-md md:text-xl text-white mb-2">
            ※当たったキャラは右上メニューの「マイキャラ図鑑」で確認できます
          </p>

          {/* 説明ボタン */}
          <button
            onClick={handleDescriptionClick}
            className="mt-4 px-6 py-1 md:px-8 md:text-xl bg-white text-gray-800 rounded-full border-2 border-black hover:bg-gray-300 shadow-md transition-colors"
          >
            説明・キャラの出現率
          </button>

          {/* 説明文 */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out mt-2 rounded-xl bg-white`}
            style={{
              maxHeight: showDescription
                ? descriptionRef.current?.scrollHeight
                : 0,
            }}
          >
            <p
              ref={descriptionRef}
              className="text-gray-700 text-md md:text-lg text-center px-4 py-2"
            >
              「クイズガチャ」は、ポイントを使ってガチャに挑戦し、さまざまなキャラクターを手に入れるゲームです。
              <br />
              ガチャは 1回100P で回せます。
              <br />
              ポイントは、各クイズゲーム（「連続正解チャレンジ」「制限時間クイズ」「クイズダンジョン」「クイズバトル」「協力ダンジョン」「サバイバルクイズ」）で集めることができます。
              <br />
              ガチャから登場するキャラは全部で58種類！クイズダンジョンや協力ダンジョンに出てくるキャラが登場します。
              <br />
              当たったキャラは右上のメニューにある「マイキャラ図鑑」で確認することができます。
              <br />
              超レアキャラを当てて、全キャラコンプリートを目指そう！
              <br />
              <br />
              ＜キャラ出現率＞
              <br />
              ノーマル　全7種類　出現率：約4.2857%　全体の30%
              <br />
              レア　全6種類　出現率：約3.3333%　全体の20%
              <br />
              超レア　全6種類　出現率：3.0%　全体の18%
              <br />
              激レア　全8種類　出現率：約2.2438%　全体の17.95%
              <br />
              超激レア　全6種類　出現率：約1.6667%　全体の10%
              <br />
              神レア　全20種類　出現率：0.2%　全体の4%
              <br />
              シークレット　全5種類　出現率：0.01%　全体の0.05%
              <br />
            </p>
          </div>
        </>
      </div>

      {/* 下にガチャ画面 */}
      <div className="container mx-auto px-4 pb-10">
        <QuizGacha
          points={points}
          rollGacha={rollGacha}
          gachaResult={gachaResult}
          setGachaResult={setGachaResult}
          history={history}
          setHistory={setHistory}
          rolling={rolling}
        />
      </div>
    </div>
  );
}
