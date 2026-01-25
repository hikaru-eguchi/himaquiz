"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Rarity } from "@/types/gacha";

export type CharacterItem = {
  name: string;
  image: string;
  rarity: Rarity;
  no: string;
  characterId: string;
  isNew: boolean;
};

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

const ULTRA_RARES = { 激レア: true, 超激レア: true, 神レア: true, シークレット: true } as const;

export function CharacterAcquireModal({
  open,
  item,
  verb = "手に入れた！", // ←ここを切り替える
  onClose,
  showPremiumBg = false,
}: {
  open: boolean;
  item: CharacterItem | null;
  verb?: string;
  onClose: () => void;
  showPremiumBg?: boolean;
}) {
  const isUltraRare = !!item && item.rarity in ULTRA_RARES;

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* 背景（虹） */}
          <div
            className="fixed inset-0 z-0"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, #ff00ff, #00ffff, #ffff00, #ff0000)",
              filter: "blur(120px)",
              opacity: isUltraRare ? 0.6 : 0.5,
            }}
          />

          {/* プレミア演出（必要なら） */}
          {showPremiumBg && (
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
          )}

          {/* ふわ粒 */}
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="fixed z-20 w-4 h-4 rounded-full bg-white"
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

          {/* 本体カード */}
          <motion.div
            className={`
              relative z-30 text-center p-6 rounded-2xl shadow-2xl
              bg-gradient-to-r ${rarityGradient[item.rarity]}
            `}
            initial={{ opacity: 0, scale: 0.3, y: 80 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: isUltraRare ? 1.2 : 0.5, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {item.isNew && (
              <div
                className="
                  absolute -top-6 left-2
                  px-4 py-2 rounded-full
                  text-xl md:text-3xl font-extrabold text-white
                  bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400
                  shadow-lg border-4 border-white leading-none
                "
              >
                NEW
              </div>
            )}

            <img
              src={item.image}
              className="w-50 h-50 md:w-70 md:h-70 mx-auto drop-shadow-lg"
              alt={item.name}
            />

            <p className="text-3xl md:text-5xl font-bold mt-4 text-white drop-shadow">
              {item.name} を{verb}
            </p>

            <p className="text-2xl md:text-4xl font-extrabold mt-2 text-white drop-shadow">
              レアリティ：
              <span className="ml-2 text-white">
                {item.rarity}
              </span>
            </p>

            <p className="text-yellow-300 text-4xl md:text-6xl font-extrabold mt-1 drop-shadow">
              {"★".repeat(rarityToStarCount[item.rarity] || 1)}
            </p>

            <button
              className="mt-5 px-6 py-2 rounded-lg bg-white/90 hover:bg-white font-bold"
              onClick={onClose}
            >
              閉じる
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
