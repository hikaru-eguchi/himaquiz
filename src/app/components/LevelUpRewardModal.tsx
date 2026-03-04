"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Payload = {
  fromLevel: number;
  toLevel: number;
  awardedPoints: number;
  awardedTitle: string | null;
};

export function LevelUpRewardModal() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<Payload>({
    fromLevel: 0,
    toLevel: 0,
    awardedPoints: 0,
    awardedTitle: null,
  });

  const pendingRef = useRef<Payload | null>(null);

  useEffect(() => {
    // ① 報酬が来たら “保存だけ”
    const onRewarded = (e: Event) => {
      const ce = e as CustomEvent<Payload>;
      if (!ce.detail) return;
      pendingRef.current = ce.detail;
    };

    // ② Toastが閉じたら、pending があれば開く
    const onToastClosed = () => {
      if (!pendingRef.current) return;
      setPayload(pendingRef.current);
      pendingRef.current = null;
      setOpen(true);
    };

    window.addEventListener("levelup:rewarded", onRewarded);
    window.addEventListener("levelup:toastClosed", onToastClosed);

    return () => {
      window.removeEventListener("levelup:rewarded", onRewarded);
      window.removeEventListener("levelup:toastClosed", onToastClosed);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          {/* 金色の光エフェクト */}
          <motion.div
            className="
              absolute w-[540px] h-[540px] rounded-full
              bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500
              blur-2xl opacity-40
            "
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.7 }}
            exit={{ scale: 0.7, opacity: 0 }}
          />

          {/* キラキラ */}
          <div className="absolute top-10 left-10 text-2xl animate-pulse">✨</div>
          <div className="absolute top-16 right-12 text-2xl animate-pulse">🌟</div>
          <div className="absolute bottom-16 left-12 text-xl animate-pulse">✨</div>

          {/* カード */}
          <motion.div
            className="
              relative w-[92%] max-w-[420px]
              rounded-3xl p-7 text-center
              bg-gradient-to-br from-yellow-50 via-white to-yellow-100
              border-4 border-yellow-300
              shadow-[0_0_55px_rgba(250,204,21,0.55)]
              cursor-pointer
            "
            initial={{ scale: 0.5, rotate: -6, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: 6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
          >
            <motion.p
              className="text-3xl md:text-4xl font-black text-yellow-600 drop-shadow"
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              🎉 レベルアップ特典！ 🎉
            </motion.p>

            <p className="mt-3 text-xl md:text-2xl font-extrabold text-gray-900">
              Lv.{payload.fromLevel} →{" "}
              <span className="text-yellow-600">Lv.{payload.toLevel}</span>
            </p>

            <div className="mt-5 rounded-2xl bg-white/90 border-2 border-yellow-300 p-4">
              <p className="text-xl md:text-2xl font-extrabold text-gray-900">
                🎁{" "}
                <span className="text-green-600 text-2xl md:text-3xl">
                  {payload.awardedPoints}P
                </span>{" "}
                獲得！
              </p>

              {payload.awardedTitle ? (
                <p className="mt-2 text-2xl md:text-3xl font-extrabold text-violet-600">
                  称号：{payload.awardedTitle}
                </p>
              ) : (
                <p className="mt-2 text-sm md:text-base font-bold text-gray-500">
                  ※今回は称号の獲得はありません
                </p>
              )}
            </div>

            <p className="mt-4 text-sm text-gray-500">
              ※ 画面をタップすると閉じます
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}