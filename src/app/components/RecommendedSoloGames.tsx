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

const SOLO_GAMES: GameCard[] = [
  {
    key: "streak",
    href: "/streak-challenge",
    label: "✅連続正解チャレンジ",
    desc1: "何問連続で正解できるか挑戦！",
    desc2: "集中力と実力を試せるゲームです。",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-red-500 to-orange-400 text-white hover:scale-110 transition-all",
  },
  {
    key: "timeattack",
    href: "/time-attack",
    // label: "⚡タイムアタック",
    // label: "⚡3問だけ！タイムアタック",
    label: "⚡3問タイムアタック",
    desc1: "最速王を目指せ！",
    desc2: "3問だけの超高速タイムアタック！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400 text-white hover:scale-110 transition-all",
  },
  // {
  //   key: "time",
  //   href: "/time-quiz",
  //   label: "⏱制限時間クイズ",
  //   desc1: "時間内に何問正解できるかな？",
  //   desc2: "友達や家族と対決してみよう！",
  //   buttonClassName:
  //     "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-[#ec0101] via-[#FF6B6B] to-[#fb9797] text-white hover:scale-110 transition-all",
  // },
  {
    key: "dungeon",
    href: "/quiz-master",
    label: "⚔クイズダンジョン",
    desc1: "ダンジョン形式で進む本格派クイズ！",
    desc2: "君は深層まで進めるか！？",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-purple-500 to-indigo-400 text-white hover:scale-110 transition-all",
  },
  {
    key: "kimagure",
    href: "/quiz-kimagure",
    label: "☁きまぐれクイズ",
    desc1: "きまぐれにひまもんが出現！",
    desc2: "何種類みつけられる？",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-yellow-400 to-yellow-300 text-white hover:scale-110 transition-all",
  },
  // {
  //   key: "luck",
  //   href: "/quiz-luck",
  //   label: "🎲運命のクイズ",
  //   desc1: "チャレンジ成功で報酬アップ！",
  //   desc2: "運命のクイズでどこまで挑む！？",
  //   buttonClassName:
  //     "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:scale-110 transition-all",
  // },
  {
    key: "maze",
    href: "/quiz-maze",
    label: "🧱クイズ迷路",
    desc1: "クイズを解いて迷路を突破せよ！",
    desc2: "君はゴールまでたどり着ける？",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-amber-700 to-orange-500 text-white hover:scale-110 transition-all",
  },
  {
    key: "fortune",
    href: "/quiz-fortune",
    label: "🔮ひまQ占い",
    desc1: "直感で答えるひまQ占い！",
    desc2: "今日の運勢は★いくつ？",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white hover:scale-110 transition-all",
  },
  {
    key: "personality",
    href: "/quiz-personality",
    label: "🔍ひまQ診断",
    desc1: "直感で答えるタイプ診断！",
    desc2: "あなたはどのタイプ？",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:scale-110 transition-all",
  },
  {
    key: "psychologicaltest",
    href: "/quiz-psychologicaltest",
    label: "❤心理テスト",
    desc1: "直感でわかる性格診断！",
    desc2: "あなたの本当のタイプは？",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white hover:scale-110 transition-all",
  },
];

// Fisher–Yates shuffle（重複なしでランダム抽出）
function pickRandom<T>(arr: T[], count: number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(count, a.length));
}

export default function RecommendedSoloGames({
  title = "次はどれで遊ぶ？🎮",
  count = 4,
  excludeHref,
}: {
  title?: string;
  count?: number;
  /** そのページ自身を出したくない時用（例: "/streak-challenge"） */
  excludeHref?: string;
}) {
  const items = useMemo(() => {
    const base = excludeHref ? SOLO_GAMES.filter(g => g.href !== excludeHref) : SOLO_GAMES;
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