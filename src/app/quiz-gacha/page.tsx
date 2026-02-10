"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Rarity } from "../../types/gacha";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../hooks/useSupabaseUser";

const anton = Anton({ subsets: ["latin"], weight: "400" });

type GachaCharacter = {
  name: string;
  image: string;
  rarity: Rarity;
  weight: number;
  no: string;
};

type GachaItem = {
  name: string;
  image: string;
  rarity: Rarity;
  no: string;
  characterId: string;
  isNew: boolean;
};

/* ====== 下部のガチャコンポーネント ====== */
const QuizGacha = ({
  points,
  rolling,
  isPremiumRoll,
  gachaResult,
  setGachaResult,
  history,
  setHistory,

  gachaQueue,
  setGachaQueue,
  gachaIndex,
  setGachaIndex,

  gachaMode,
  setGachaMode,
  rollCount,
  setRollCount,

  onRoll,
  cost,
}: {
  points: number;
  rolling: boolean;
  isPremiumRoll: boolean;

  gachaResult: null | GachaItem;
  setGachaResult: (v: null | GachaItem) => void;

  history: GachaItem[];
  setHistory: React.Dispatch<React.SetStateAction<GachaItem[]>>;

  gachaQueue: GachaItem[];
  setGachaQueue: React.Dispatch<React.SetStateAction<GachaItem[]>>;
  gachaIndex: number;
  setGachaIndex: React.Dispatch<React.SetStateAction<number>>;

  gachaMode: "normal" | "premium";
  setGachaMode: React.Dispatch<React.SetStateAction<"normal" | "premium">>;
  rollCount: 1 | 10;
  setRollCount: React.Dispatch<React.SetStateAction<1 | 10>>;

  onRoll: () => void;
  cost: number;
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
    const HOLD_MS = 100;

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

  const [selectedHistory, setSelectedHistory] = useState<null | GachaItem>(null);

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

  const isTenPull = gachaQueue.length > 0;
  const progressText = isTenPull ? `(${gachaIndex + 1}/${gachaQueue.length})` : "";

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

  // === UIロック判定（演出中は触れない）===
  const uiLocked = !!gachaResult && phase !== "idle"; // drop/ready/opening/result中はtrue

  // UI操作ロック（10連中はより強く）
  const inputLocked = rolling || uiLocked || isTenPull;

  // メインボタンが押せる条件
  const canRollNow = points >= cost && !inputLocked;

  const canRoll = points >= 100 && !rolling;

  const showRainbowBg = !!gachaResult && phase !== "result";
  const showPremiumBg = isPremiumRoll && !!gachaResult && phase !== "result";

  const PREMIUM_COST = 600;
  const canRollPremium = points >= PREMIUM_COST && !rolling;

  return (
    <div className="text-center">
      <div className="flex flex-col items-center justify-center gap-3 mb-10">
        <img src="/images/gacha.png" className="w-60 h-60 md:w-100 md:h-100" />
        <div className="flex flex-col items-center justify-between w-full mx-auto">
          <div className="bg-white border border-black px-4 py-2 rounded shadow">
            <p className="text-xl md:text-2xl font-bold text-gray-800">
              所持ポイント：{points} P
            </p>
          </div>
        </div>
        
        {/* サブ説明 */}
        <p className="mt-2 text-md md:text-lg text-white font-bold drop-shadow">
          {gachaMode === "premium" ? "★4（激レア）以上が確定！" : "いろんなキャラが当たる！"}
        </p>
        
        {/* タブ：通常 / ★4以上確定 */}
        <div className="flex items-center justify-center gap-2 bg-white/70 p-2 rounded-xl border-2 border-black">
          <button
            className={`px-4 py-2 rounded-lg font-extrabold text-lg md:text-xl border-2 border-black transition
              ${gachaMode === "normal" ? "bg-blue-500 text-white" : "bg-white text-gray-800 hover:bg-gray-100"}
            `}
            onClick={() => setGachaMode("normal")}
            disabled={inputLocked}
          >
            通常
          </button>

          <button
            className={`px-4 py-2 rounded-lg font-extrabold text-lg md:text-xl border-2 border-black transition
              ${gachaMode === "premium" ? "bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 text-white" : "bg-white text-gray-800 hover:bg-gray-100"}
            `}
            onClick={() => setGachaMode("premium")}
            disabled={inputLocked}
          >
            ★4以上確定
          </button>
        </div>

        {/* トグル：1回 / 10連 */}
        <div className="mt-2 flex items-center justify-center">
          <div className="flex rounded-xl border-2 border-black overflow-hidden">
            <button
              className={`px-6 py-2 font-extrabold text-lg md:text-xl transition
                ${rollCount === 1 ? "bg-black text-white" : "bg-white text-gray-800 hover:bg-gray-100"}
              `}
              onClick={() => setRollCount(1)}
              disabled={inputLocked}
            >
              1回
            </button>
            <button
              className={`px-6 py-2 font-extrabold text-lg md:text-xl transition
                ${rollCount === 10 ? "bg-black text-white" : "bg-white text-gray-800 hover:bg-gray-100"}
              `}
              onClick={() => setRollCount(10)}
              disabled={inputLocked}
            >
              10連
            </button>
          </div>
        </div>

        {/* メインボタン：1つ */}
        <button
          className={`
            mt-3 px-6 py-3 rounded-lg font-extrabold text-xl md:text-2xl
            transition-all duration-300 ease-in-out
            ${canRollNow ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-600 text-white opacity-50 cursor-not-allowed pointer-events-none"}
          `}
          onClick={onRoll}
          disabled={!canRollNow}
        >
          {rolling
            ? "抽選中..."
            : rollCount === 10
            ? `10連を回す（${cost}P）`
            : `回す（${cost}P）`}
        </button>

        {points < cost && (
          <p className="text-xl text-red-500 font-bold animate-pulse mt-2">
            ポイントが足りないよ！（あと {cost - points}P）
          </p>
        )}

        {gachaMode === "premium" && points < 600 && (
          <p className="text-sm md:text-lg text-yellow-100 font-bold drop-shadow mt-1">
            ★4以上確定は600P必要！
          </p>
        )}
      </div>

      {/* 入手キャラ履歴 */}
      <div className="mt-6 border-t pt-4">
        <h2 className="text-xl md:text-2xl font-bold mb-1">今回の入手キャラ</h2>
        <p className="text-sm md:text-md text-gray-600 mb-5">
          （前回までの入手キャラは、メニューの「マイキャラ図鑑」で確認できます）
        </p>

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
                    <div className="relative inline-block">
                      {item.isNew && (
                        <div
                          className="
                            absolute -top-3 -left-15 md:-left-20
                            px-3 py-1
                            rounded-full
                            text-sm md:text-lg
                            font-extrabold
                            text-white
                            bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400
                            shadow-lg
                            border-2 border-white
                            leading-none
                          "
                        >
                          NEW
                        </div>
                      )}
                    </div>
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
                  // filter: "blur(120px)",
                  filter: "blur(40px)",
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
              phase === "result" ? "bg-white" : "bg-white"
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

              if (phase === "result") {
                // 10連なら次へ
                if (gachaQueue.length > 0) {
                  const next = gachaIndex + 1;

                  // まだ残りがある → 次のキャラ演出へ
                  if (next < gachaQueue.length) {
                    setShowOpen(false);
                    setShowEffect(false);
                    setShowResult(false);
                    setPhase("idle");

                    setGachaIndex(next);

                    // gachaResult を次に差し替える（これで useEffect が走って drop→ready になる）
                    setTimeout(() => {
                      setGachaResult(gachaQueue[next]);
                    }, 50);

                    return;
                  }

                  // 最後まで終わった → キューも消して閉じる
                  setShowOpen(false);
                  setShowEffect(false);
                  setShowResult(false);
                  setGachaResult(null);
                  setPhase("idle");
                  setGachaQueue([]);
                  setGachaIndex(0);
                  return;
                }

                // 1回ガチャなら従来通り閉じる
                setShowOpen(false);
                setShowEffect(false);
                setShowResult(false);
                setGachaResult(null);
                setPhase("idle");
                return;
              }
            }}
          >
            {/* 落下〜待機〜開封中の背景を虹にする */}
            {showRainbowBg && (
              <div
                className="fixed inset-0 z-0"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #ff00ff, #00ffff, #ffff00, #ff0000)",
                  // filter: "blur(120px)",
                  filter: "blur(40px)",
                  opacity: 0.55,
                }}
              />
            )}
            {showPremiumBg && (
              <>
                {/* 金のフラッシュ */}
                <motion.div
                  className="fixed inset-0 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.9, 0.2, 0.9, 0.2] }}
                  transition={{ duration: 1.2 }}
                  style={{
                    background:
                      "radial-gradient(circle at center, #fff7b0, #ffd700, transparent 70%)",
                  }}
                />
                {/* きら粒 */}
                {/* {Array.from({ length: 60 }).map((_, i) => (
                  <motion.div
                    key={`p-${i}`}
                    className="fixed z-20 w-2 h-2 rounded-full bg-white"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: 0.8,
                      filter: "blur(1px)",
                    }}
                    animate={{ y: [-30, 30], opacity: [0, 1, 0] }}
                    transition={{
                      duration: 0.8 + Math.random(),
                      repeat: Infinity,
                      repeatType: "mirror",
                    }}
                  />
                ))} */}
              </>
            )}
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
                  className="mb-4 font-extrabold text-4xl md:text-6xl text-white"
                  style={{
                    textShadow: `
                      0 0 12px rgba(255,215,0,0.8)
                    `,
                  }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  タップで開封！{progressText}
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
                    // filter: "blur(120px)",
                    filter: "blur(40px)",
                    opacity: isUltraRare ? 0.6 : 0.5,
                  }}
                />

                {/* {Array.from({ length: 30 }).map((_, i) => (
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
                ))} */}

                <motion.div
                  initial={{ opacity: 0, scale: 0.3, y: 80 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    duration: isUltraRare ? 1.5 : 0.5,
                    ease: "easeOut",
                  }}
                  className={`
                    relative z-50 text-center p-6 rounded-2xl shadow-2xl
                    bg-gradient-to-r ${rarityGradient[gachaResult.rarity]}
                  `}
                >
                  {gachaResult.isNew && (
                    <div
                      className="
                        absolute -top-6 md:-top-7 left-1 md:left-2
                        px-4 py-2
                        rounded-full
                        text-xl md:text-3xl
                        font-extrabold
                        text-white
                        bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400
                        shadow-lg
                        border-4 border-white
                        leading-none
                      "
                    >
                      NEW
                    </div>
                  )}
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
                {isTenPull && (
                  <p className="mt-2 text-lg md:text-2xl font-extrabold text-white drop-shadow">
                    タップで次へ！ ({gachaIndex + 1}/{gachaQueue.length})
                  </p>
                )}
                {!isTenPull && (
                  <p className="mt-2 text-lg md:text-2xl font-extrabold text-white drop-shadow">
                    タップで閉じる
                  </p>
                )}
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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [showDescription, setShowDescription] = useState(false);
  const handleDescriptionClick = () =>
    setShowDescription((prev) => !prev);

  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const [ownedCharacterIds, setOwnedCharacterIds] = useState<Set<string>>(new Set());

  const [rolling, setRolling] = useState(false);
  const [isPremiumRoll, setIsPremiumRoll] = useState(false);
  // DB から読むポイント
  const [points, setPoints] = useState(0);
  const [gachaResult, setGachaResult] = useState<GachaItem | null>(null);
  const [history, setHistory] = useState<GachaItem[]>([]);

  type GachaMode = "normal" | "premium";
  type RollCount = 1 | 10;

  const [gachaMode, setGachaMode] = useState<GachaMode>("normal"); // タブ
  const [rollCount, setRollCount] = useState<RollCount>(1);        // トグル

  // 10連用キュー
  const [gachaQueue, setGachaQueue] = useState<GachaItem[]>([]);
  const [gachaIndex, setGachaIndex] = useState(0);

  // characters.no -> characters.id の辞書
  const [noToId, setNoToId] = useState<Map<string, string>>(new Map());

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

    const fetchOwned = async () => {
      const { data, error } = await supabase
        .from("user_characters")
        .select("character_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("fetchOwned error:", error);
        return;
      }
      setOwnedCharacterIds(new Set((data ?? []).map((r) => r.character_id)));
    };

    const fetchNoToId = async () => {
      // no と id を全部取る（数が少ないので一括でOK）
      const { data, error } = await supabase
        .from("characters")
        .select("id,no");

      if (error) {
        console.error("fetchNoToId error:", error);
        return;
      }

      const map = new Map<string, string>();
      for (const row of data ?? []) {
        // no は string のはず
        map.set(String(row.no), row.id);
      }
      setNoToId(map);
    };

    fetchPoints();
    fetchOwned();
    fetchNoToId();
  }, [user, userLoading, supabase, router]);

  const gachaCharacters: GachaCharacter[] = [
    { name: "ダンジョンの剣士", image: "/images/ダンジョンの剣士_1.png", rarity: "ノーマル", weight: 2.8206, no: "1" },
    { name: "ダンジョンの武闘家", image: "/images/ダンジョンの武闘家_1.png", rarity: "ノーマル", weight: 2.8206, no: "2" },
    { name: "ダンジョンの魔法使い", image: "/images/ダンジョンの魔法使い_1.png", rarity: "ノーマル", weight: 2.8206, no: "3" },
    { name: "スライム", image: "/images/スライム_1.png", rarity: "ノーマル", weight: 2.8206, no: "4" },
    { name: "スライム【フェアリー】", image: "/images/スライム_2.png", rarity: "ノーマル", weight: 2.8206, no: "5" },
    { name: "ゴブリン", image: "/images/ゴブリン_1.png", rarity: "ノーマル", weight: 2.8206, no: "6" },
    { name: "ゴブリン【フェアリー】", image: "/images/ゴブリン_2.png", rarity: "ノーマル", weight: 2.8206, no: "7" },
    { name: "スケルトン", image: "/images/スケルトン_1.png", rarity: "レア", weight: 2.7969, no: "8" },
    { name: "スケルトン【フェアリー】", image: "/images/スケルトン_2.png", rarity: "レア", weight: 2.7969, no: "9" },
    { name: "ミミック", image: "/images/ミミック_1.png", rarity: "レア", weight: 2.7969, no: "10" },
    { name: "ミミック【フェアリー】", image: "/images/ミミック_2.png", rarity: "レア", weight: 2.7969, no: "11" },
    { name: "リザードマン", image: "/images/リザードマン_1.png", rarity: "レア", weight: 2.7969, no: "12" },
    { name: "リザードマン【フェアリー】", image: "/images/リザードマン_2.png", rarity: "レア", weight: 2.7969, no: "13" },
    { name: "ゴーレム", image: "/images/ゴーレム_1.png", rarity: "超レア", weight: 2.4983, no: "14" },
    { name: "ゴーレム【フェアリー】", image: "/images/ゴーレム_2.png", rarity: "超レア", weight: 2.4983, no: "15" },
    { name: "ケルベロス", image: "/images/ケルベロス_1.png", rarity: "超レア", weight: 2.4983, no: "16" },
    { name: "ケルベロス【フェアリー】", image: "/images/ケルベロス_2.png", rarity: "超レア", weight: 2.4983, no: "17" },
    { name: "バーサーカー", image: "/images/バーサーカー_1.png", rarity: "超レア", weight: 2.4983, no: "18" },
    { name: "バーサーカー【フェアリー】", image: "/images/バーサーカー_2.png", rarity: "超レア", weight: 2.4983, no: "19" },
    { name: "キングスライム", image: "/images/キングスライム_1.png", rarity: "激レア", weight: 0.9961, no: "20" },
    { name: "キングスライム【フェアリー】", image: "/images/キングスライム_2.png", rarity: "激レア", weight: 0.9961, no: "21" },
    { name: "ドラゴン", image: "/images/ドラゴン_1.png", rarity: "激レア", weight: 0.9961, no: "22" },
    { name: "ドラゴン【フェアリー】", image: "/images/ドラゴン_2.png", rarity: "激レア", weight: 0.9961, no: "23" },
    { name: "フェニックス", image: "/images/フェニックス_1.png", rarity: "激レア", weight: 0.9961, no: "24" },
    { name: "フェニックス【フェアリー】", image: "/images/フェニックス_2.png", rarity: "激レア", weight: 0.9961, no: "25" },
    { name: "リヴァイアサン", image: "/images/リヴァイアサン_1.png", rarity: "激レア", weight: 0.9961, no: "26" },
    { name: "リヴァイアサン【フェアリー】", image: "/images/リヴァイアサン_2.png", rarity: "激レア", weight: 0.9961, no: "27" },
    { name: "ブラックドラゴン", image: "/images/ブラックドラゴン_1.png", rarity: "超激レア", weight: 0.6943, no: "28" },
    { name: "ブラックドラゴン【フェアリー】", image: "/images/ブラックドラゴン_2.png", rarity: "超激レア", weight: 0.6943, no: "29" },
    { name: "キングデーモン", image: "/images/キングデーモン_1.png", rarity: "超激レア", weight: 0.6943, no: "30" },
    { name: "キングデーモン【フェアリー】", image: "/images/キングデーモン_2.png", rarity: "超激レア", weight: 0.6943, no: "31" },
    { name: "キングヒドラ", image: "/images/キングヒドラ_1.png", rarity: "超激レア", weight: 0.6943, no: "32" },
    { name: "キングヒドラ【フェアリー】", image: "/images/キングヒドラ_2.png", rarity: "超激レア", weight: 0.6943, no: "33" },
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
    { name: "きまぐれモンスター【赤】", image: "/images/きまぐれモンスター【赤】.png", rarity: "ノーマル", weight: 2.8206, no: "59" },
    { name: "きまぐれモンスター【青】", image: "/images/きまぐれモンスター【青】.png", rarity: "ノーマル", weight: 2.8206, no: "60" },
    { name: "きまぐれモンスター【黄】", image: "/images/きまぐれモンスター【黄】.png", rarity: "ノーマル", weight: 2.8206, no: "61" },
    { name: "きまぐれモンスター【緑】", image: "/images/きまぐれモンスター【緑】.png", rarity: "ノーマル", weight: 2.8206, no: "62" },
    { name: "きまぐれモンスター【紫】", image: "/images/きまぐれモンスター【紫】.png", rarity: "ノーマル", weight: 2.8206, no: "63" },
    { name: "きまぐれモンスター【白】", image: "/images/きまぐれモンスター【白】.png", rarity: "ノーマル", weight: 2.8206, no: "64" },
    { name: "きまぐれモンスター【黒】", image: "/images/きまぐれモンスター【黒】.png", rarity: "ノーマル", weight: 2.8206, no: "65" },
    { name: "きまぐれモンスター【銀】", image: "/images/きまぐれモンスター【銀】.png", rarity: "激レア", weight: 0.9961, no: "66" },
    { name: "きまぐれモンスター【金】", image: "/images/きまぐれモンスター【金】.png", rarity: "超激レア", weight: 0.6943, no: "67" },
    { name: "きまぐれモンスター【虹】", image: "/images/きまぐれモンスター【虹】.png", rarity: "神レア", weight: 0.2, no: "68" },
    { name: "きまぐれモンスター【水玉】", image: "/images/きまぐれモンスター【水玉】.png", rarity: "激レア", weight: 0.9961, no: "69" },
    { name: "きまぐれモンスター【ハート】", image: "/images/きまぐれモンスター【ハート】.png", rarity: "激レア", weight: 0.9961, no: "70" },
    { name: "きまぐれモンスター【ギンガムチェック】", image: "/images/きまぐれモンスター【ギンガムチェック】.png", rarity: "激レア", weight: 0.9961, no: "71" },
    { name: "きまぐれモンスター【花】", image: "/images/きまぐれモンスター【花】.png", rarity: "激レア", weight: 0.9961, no: "72" },
    { name: "きまぐれモンスター【スター】", image: "/images/きまぐれモンスター【スター】.png", rarity: "激レア", weight: 0.9961, no: "73" },
    { name: "きまぐれモンスター【ハチ】", image: "/images/きまぐれモンスター【ハチ】.png", rarity: "激レア", weight: 0.9961, no: "74" },
    { name: "きまぐれモンスター【リボン】", image: "/images/きまぐれモンスター【リボン】.png", rarity: "超激レア", weight: 0.6943, no: "75" },
    { name: "きまぐれモンスター【花畑】", image: "/images/きまぐれモンスター【花畑】.png", rarity: "超激レア", weight: 0.6943, no: "76" },
    { name: "きまぐれモンスター【お菓子】", image: "/images/きまぐれモンスター【お菓子】.png", rarity: "超激レア", weight: 0.6943, no: "77" },
    { name: "きまぐれモンスター【いちご】", image: "/images/きまぐれモンスター【いちご】.png", rarity: "超激レア", weight: 0.6943, no: "78" },
    { name: "きまぐれモンスター【宝石】", image: "/images/きまぐれモンスター【宝石】.png", rarity: "超激レア", weight: 0.6943, no: "79" },
    { name: "きまぐれモンスター【勇者】", image: "/images/きまぐれモンスター【勇者】.png", rarity: "神レア", weight: 0.2, no: "80" },
    { name: "きまぐれモンスター【魔王】", image: "/images/きまぐれモンスター【魔王】.png", rarity: "神レア", weight: 0.2, no: "81" },
    { name: "きまぐれモンスター【スーツ】", image: "/images/きまぐれモンスター【スーツ】.png", rarity: "神レア", weight: 0.2, no: "82" },
    { name: "きまぐれモンスター【ゲーマー】", image: "/images/きまぐれモンスター【ゲーマー】.png", rarity: "神レア", weight: 0.2, no: "83" },
    { name: "きまぐれモンスター【ヤンキー】", image: "/images/きまぐれモンスター【ヤンキー】.png", rarity: "神レア", weight: 0.2, no: "84" },
    { name: "きまぐれモンスター【ガンマン】", image: "/images/きまぐれモンスター【ガンマン】.png", rarity: "神レア", weight: 0.2, no: "85" },
    { name: "きまぐれモンスター【すし職人】", image: "/images/きまぐれモンスター【すし職人】.png", rarity: "シークレット", weight: 0.01, no: "86" },
    { name: "きまぐれモンスター【ラーメン屋】", image: "/images/きまぐれモンスター【ラーメン屋】.png", rarity: "シークレット", weight: 0.01, no: "87" },
    { name: "きまぐれモンスター【アイドル】", image: "/images/きまぐれモンスター【アイドル】.png", rarity: "シークレット", weight: 0.01, no: "88" },
  ];

  const pickByWeight = (pool: GachaCharacter[]) => {
    const total = pool.reduce((sum, c) => sum + c.weight, 0);
    let r = Math.random() * total;
    for (const c of pool) {
      if (r < c.weight) return c;
      r -= c.weight;
    }
    return pool[pool.length - 1];
  };

  const NORMAL_COST = 100;
  const PREMIUM_COST = 600;

  const getCost = (mode: GachaMode, count: RollCount) => {
    const base = mode === "normal" ? NORMAL_COST : PREMIUM_COST;
    return base * count; // 1 or 10
  };

  const getPool = (mode: GachaMode) => {
    if (mode === "normal") return gachaCharacters;
    return gachaCharacters.filter((c) =>
      ["激レア", "超激レア", "神レア", "シークレット"].includes(c.rarity)
    );
  };

  const rollGachaUnified = async () => {
    if (rolling) return;

    // Mapができてないときは回せない（初回ロード対策）
    if (noToId.size === 0) {
      alert("準備中です。少し待ってからもう一度お試しください。");
      return;
    }

    setRolling(true);
    setIsPremiumRoll(gachaMode === "premium");

    // ロック時間：10連は少し長めでもOK
    const lockMs = rollCount === 10 ? 3500 : 3000;
    setTimeout(() => setRolling(false), lockMs);

    // 10連状態リセット
    setGachaQueue([]);
    setGachaIndex(0);

    try {
      if (!user) {
        alert("ログインしてからガチャを回してね！");
        return;
      }

      const cost = getCost(gachaMode, rollCount);

      // 最新ポイント
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
      if (currentPoints < cost) {
        alert(`ポイントが足りません！（${cost}P以上必要です）`);
        return;
      }

      const newPoints = currentPoints - cost;

      // ポイント減算
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

      setPoints(updatedProfile?.points ?? newPoints);
      window.dispatchEvent(new Event("points:updated"));

      // ログ
      await supabase.from("user_point_logs").insert({
        user_id: user.id,
        change: -cost,
        reason:
          gachaMode === "normal"
            ? rollCount === 10
              ? "通常10連ガチャでポイント消費"
              : "通常ガチャでポイント消費"
            : rollCount === 10
            ? "★4以上確定10連ガチャでポイント消費"
            : "★4以上確定ガチャでポイント消費",
      });

      // 抽選（1回 or 10回）
      const pool = getPool(gachaMode);

      // NEW判定用：10連中に当たった分も反映させる
      const tempOwned = new Set(ownedCharacterIds);

      const results: GachaItem[] = [];

      for (let i = 0; i < rollCount; i++) {
        const char = pickByWeight(pool);

        const characterId = noToId.get(char.no);
        if (!characterId) {
          console.error("noToId missing:", char.no);
          return;
        }

        const isNew = !tempOwned.has(characterId);
        if (isNew) tempOwned.add(characterId);

        results.push({
          name: char.name,
          image: char.image,
          rarity: char.rarity,
          no: char.no,
          characterId,
          isNew,
        });
      }

      // 取得保存（10回でも順にRPC）
      for (const r of results) {
        const { error: rpcError } = await supabase.rpc("increment_user_character", {
          p_user_id: user.id,
          p_character_id: r.characterId,
        });
        if (rpcError) console.error("increment_user_character rpc error:", rpcError);
      }

      // owned 更新（まとめて）
      setOwnedCharacterIds(tempOwned);

      // 履歴（今回は「今回の入手キャラ」なので、引いた瞬間にまとめて追加でOK）
      // 演出に合わせたいなら後で「1体ずつpush」もできます
      setHistory((prev) => [...prev, ...results]);

      // 演出開始
      if (rollCount === 1) {
        setGachaResult(results[0]);
        return;
      }

      // 10連：キューに入れて1体目を表示
      setGachaQueue(results);
      setGachaIndex(0);
      setGachaResult(results[0]);
    } finally {
      // 固定ロック優先なので解除はしない（あなたの方針踏襲）
    }
  };

  if (!userLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-300 via-blue-200 to-green-200">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="bg-white/90 backdrop-blur p-6 md:p-10 rounded-2xl border-2 border-black shadow-xl text-center max-w-xl w-full">

            <p className="mt-4 text-lg md:text-2xl font-bold text-gray-800">
              このページはログイン（無料）すると遊べるよ！
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
                新規ユーザー登録（無料）
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
              ひまQ<br />ガチャ
            </span>
            <span className="hidden md:block">ひまQガチャ</span>
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
              「ひまQガチャ」は、ポイントを使ってガチャに挑戦し、さまざまなキャラクターを手に入れるガチャゲームです。
              <br />
              ガチャは 1回100P で回せます。
              <br />
              ポイントは、各クイズゲーム（「連続正解チャレンジ」「制限時間クイズ」「クイズダンジョン」「クイズバトル」「協力ダンジョン」「サバイバルクイズ」）で集めることができます。
              <br />
              ガチャから登場するキャラは全部で68種類！クイズダンジョンや協力ダンジョンに出てくるキャラが登場します。
              <br />
              当たったキャラは右上のメニューにある「マイキャラ図鑑」で確認することができます。
              <br />
              超レアキャラを当てて、全キャラコンプリートを目指そう！
              <br />
              <br />
              ＜キャラ出現率＞
              <br />
              ノーマル　全14種類　出現率：2.8206%　全体の39.49%
              <br />
              レア　全6種類　出現率：2.7969%　全体の16.78%
              <br />
              超レア　全6種類　出現率：2.4983%　全体の14.99%
              <br />
              激レア　全15種類　出現率：約0.9961%　全体の14.94%
              <br />
              超激レア　全12種類　出現率：約0.6943%　全体の8.33%
              <br />
              神レア　全27種類　出現率：0.2%　全体の5.4%
              <br />
              シークレット　全8種類　出現率：0.01%　全体の0.08%
              <br />
            </p>
          </div>
        </>
      </div>

      {/* 下にガチャ画面 */}
      <div className="container mx-auto px-4 pb-10">
        <QuizGacha
          points={points}
          rolling={rolling}
          isPremiumRoll={isPremiumRoll}
          gachaResult={gachaResult}
          setGachaResult={setGachaResult}
          history={history}
          setHistory={setHistory}

          // 10連用
          gachaQueue={gachaQueue}
          setGachaQueue={setGachaQueue}
          gachaIndex={gachaIndex}
          setGachaIndex={setGachaIndex}

          // UI選択
          gachaMode={gachaMode}
          setGachaMode={setGachaMode}
          rollCount={rollCount}
          setRollCount={setRollCount}

          // 実行
          onRoll={rollGachaUnified}

          // 表示用
          cost={getCost(gachaMode, rollCount)}
        />
      </div>
    </div>
  );
}
