"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

type ModalPart = {
  text: string;
  tone?: "normal" | "accent" | "muted";
};

type ModalItem =
  | { type: "record"; title: string; parts: ModalPart[] }
  | { type: "title"; title: string; parts: ModalPart[] }
  | { type: "both"; title: string; parts: ModalPart[] };

type Ctx = {
  pushModal: (item: ModalItem) => void;
};

const ResultModalContext = createContext<Ctx | null>(null);

export function useResultModal() {
  const ctx = useContext(ResultModalContext);
  if (!ctx) throw new Error("useResultModal must be used within ResultModalProvider");
  return ctx;
}

function getTheme(type: ModalItem["type"]) {
  // タイプ別：色・絵文字・ラベル
  switch (type) {
    case "record":
      return {
        badge: "🏆 NEW RECORD!",
        emoji: "🎉",
        ring: "from-yellow-300 via-orange-300 to-pink-300",
        border: "border-yellow-300",
        title: "text-yellow-600",
      };
    case "title":
      return {
        badge: "🏅 NEW TITLE!",
        emoji: "✨",
        ring: "from-purple-300 via-pink-300 to-yellow-200",
        border: "border-purple-300",
        title: "text-purple-600",
      };
    case "both":
      return {
        badge: "🌟 AMAZING!",
        emoji: "🎊",
        ring: "from-emerald-300 via-cyan-300 to-indigo-300",
        border: "border-emerald-300",
        title: "text-emerald-700",
      };
  }
}

export default function ResultModalProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ModalItem[]>([]);
  const [open, setOpen] = useState(false);

  const current = queue[0];

  const pushModal = useCallback((item: ModalItem) => {
    setQueue((q) => [...q, item]);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setQueue((q) => {
      const next = q.slice(1);
      if (next.length === 0) setOpen(false);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ pushModal }), [pushModal]);

  const theme = current ? getTheme(current.type) : null;

  return (
    <ResultModalContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {open && current && theme && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            {/* 背景（暗幕） */}
            <div className="absolute inset-0 bg-black/70" />

            {/* 光るオーラ（お祝い感） */}
            <motion.div
              className={`absolute w-[520px] h-[520px] rounded-full bg-gradient-to-r ${theme.ring} blur-2xl opacity-40`}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1.15, opacity: 0.55 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.35 }}
            />

            {/* メインカード（弾む） */}
            <motion.div
              className={`
                relative w-[92%] max-w-[560px]
                rounded-3xl bg-white
                border-4 ${theme.border}
                shadow-[0_0_50px_rgba(255,255,255,0.15)]
                p-7 md:p-9 text-center cursor-pointer
                overflow-hidden
              `}
              initial={{ scale: 0.7, rotate: -4, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.7, rotate: 4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              {/* 上部のリボン */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[120%] h-20 bg-gradient-to-r from-pink-200 via-yellow-200 to-emerald-200 rotate-2 opacity-70" />

              {/* バッジ */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black bg-white shadow-md"
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                <span className="font-extrabold">{theme.badge}</span>
              </motion.div>

              {/* タイトル */}
              <motion.p
                className={`mt-4 text-2xl md:text-4xl font-black ${theme.title}`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1.1 }}
              >
                {current.title}
              </motion.p>

              {/* 本文 */}
              <div className="mt-3 text-lg md:text-xl whitespace-pre-line font-bold leading-relaxed">
                {current.parts.map((p, i) => {
                  const cls =
                    p.tone === "accent"
                      ? "text-sky-600 font-extrabold" // ← 青で強調（好きな色に変えてOK）
                      : p.tone === "muted"
                      ? "text-gray-500 font-bold text-sm md:text-base"
                      : "text-gray-700 font-bold";

                  return (
                    <span key={i} className={cls}>
                      {p.text}
                    </span>
                  );
                })}
              </div>

              {/* タップ案内 */}
              <p className="mt-5 text-sm text-gray-500">
                ※ 画面をタップすると閉じます
              </p>

              {/* 下のきらっとライン */}
              <div className="mt-6 h-[2px] w-full bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-70" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ResultModalContext.Provider>
  );
}
