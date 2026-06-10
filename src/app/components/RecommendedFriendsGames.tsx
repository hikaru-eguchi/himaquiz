"use client";

import Link from "next/link";
import { useMemo } from "react";

type GameCard = {
  key: string;
  href: string;
  label: string;
  desc1: string;
  desc2: string;
  buttonClassName: string;
};

const MULTI_GAMES: GameCard[] = [
  {
    key: "hirameki",
    href: "/quiz-hirameki",
    label: "💡ひらめきクイズ",
    desc1: "でてくるヒントで答えを当てろ！",
    desc2: "みんなでできる早押しクイズゲーム！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-300 text-white hover:scale-110 transition-all",
  },
  {
    key: "mind",
    href: "/quiz-mind",
    label: "🧠心理当てバトル",
    desc1: "相手の心理を見抜け！",
    desc2: "いちばん心を読めるのは誰だ！？",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-200 text-white hover:scale-110 transition-all",
  },
  {
    key: "friend",
    href: "/quiz-friend",
    label: "💞なかよし診断",
    desc1: "相手のこと、どれくらい知ってる？",
    desc2: "友達・恋人と盛り上がる理解度テスト！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-yellow-200 text-white hover:scale-110 transition-all",
  },
  {
    key: "koredochi",
    href: "/quiz-koredochi",
    label: "🤔これどっち？",
    desc1: "みんなと意見は合う？",
    desc2: "友達とできるシンクロゲーム！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-cyan-400 via-violet-300 to-pink-400 text-white hover:scale-110 transition-all",
  },
  {
    key: "synchro",
    href: "/quiz-synchro",
    label: "👑シンクロランキング",
    desc1: "みんなのベスト3は同じ？",
    desc2: "順位を選んでシンクロさせよう！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 text-white hover:scale-110 transition-all",
  },
  {
    key: "usohonto",
    href: "/quiz-usohonto",
    label: "🎭ウソ？ホント？ゲーム",
    desc1: "その話、信じていい？",
    desc2: "話がウソかホントかを見抜け！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_45%,#e11d48_55%,#fb7185_100%)] text-white hover:scale-110 transition-all",
  },
  {
    key: "timetalk",
    href: "/quiz-timetalk",
    label: "🎙️タイムトーク",
    desc1: "目標タイムを狙え！",
    desc2: "お題に沿って話す簡単トークゲーム！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 text-white hover:scale-110 transition-all",
  },
];

// 重複なしランダム抽出
function pickRandom<T>(arr: T[], count: number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(count, a.length));
}

export default function RecommendedFriendsGames({
  title = "みんなで遊ぶならこれ！🔥",
  count = 4,
  excludeHref,
}: {
  title?: string;
  count?: number;
  excludeHref?: string;
}) {
  const items = useMemo(() => {
    const base = excludeHref ? MULTI_GAMES.filter(g => g.href !== excludeHref) : MULTI_GAMES;
    return pickRandom(base, count);
  }, [count, excludeHref]);

  return (
    <section className="mt-6 md:mt-12 bg-white p-3 md:p-5 rounded-xl border-2 border-black">
      <h3 className="text-xl md:text-3xl font-extrabold text-gray-800 mb-2 md:mb-6">
        {title}
      </h3>

      <div className="flex flex-wrap justify-center gap-2 md:gap-6">
        {items.map((g) => (
          <div key={g.key} className="text-center max-w-[260px]">
            <Link href={g.href} className="w-full md:w-auto flex justify-center">
              <button className={g.buttonClassName}>{g.label}</button>
            </Link>
            <div className="mt-1 rounded-2xl bg-white/65 px-2 py-2 shadow-sm border border-white/70">
              <p className="text-sm md:text-base text-gray-700 leading-tight">
                {g.desc1}
              </p>
              <p className="text-sm md:text-base text-gray-700 leading-tight">
                {g.desc2}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}