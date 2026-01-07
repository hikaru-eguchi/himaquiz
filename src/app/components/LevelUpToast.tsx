"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LevelUpToast() {
  const [open, setOpen] = useState(false);
  const [fromLv, setFromLv] = useState(0);
  const [toLv, setToLv] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      const oldLevel = ce.detail?.oldLevel ?? 0;
      const newLevel = ce.detail?.newLevel ?? 0;

      if (newLevel > oldLevel) {
        setFromLv(oldLevel);
        setToLv(newLevel);
        setOpen(true);
        setTimeout(() => setOpen(false), 4000);
      }
    };

    window.addEventListener("profile:updated", handler);
    return () => window.removeEventListener("profile:updated", handler);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 光る背景 */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 blur-3xl opacity-40"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 0.6 }}
            exit={{ scale: 0.6, opacity: 0 }}
          />

          {/* メインカード */}
          <motion.div
            className="relative bg-gradient-to-br from-white to-yellow-50 rounded-3xl p-8 w-96 text-center shadow-[0_0_40px_rgba(255,215,0,0.6)]"
            initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
          >
            {/* タイトル */}
            <motion.p
              className="text-4xl md:text-5xl font-black text-yellow-500 drop-shadow"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              LEVEL UP!!
            </motion.p>

            {/* レベル表記 */}
            <motion.p
              className="mt-4 text-2xl md:text-3xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Lv.{fromLv} →{" "}
              <motion.span
                className="text-yellow-500 inline-block"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Lv.{toLv}
              </motion.span>
            </motion.p>

            {/* メッセージ */}
            <p className="mt-4 text-gray-700 text-lg md:text-xl">
              ユーザーレベルが上がったよ！
              <br />
              おめでとう！！🎉✨
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
