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
    key: "battle",
    href: "/quiz-battle",
    label: "🔥クイズバトル",
    desc1: "2分間でどれだけ正解できるか勝負だ！",
    desc2: "相手よりハイスコアを狙おう！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-pink-500 via-yellow-400 to-green-500 text-white hover:scale-110 transition-all",
  },
  {
    key: "royal",
    href: "/quiz-royal",
    label: "👑クイズロワイヤル",
    desc1: "みんなで2分間のクイズバトル！",
    desc2: "正解を積み上げて王冠をつかみ取れ！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-yellow-500 via-amber-300 to-blue-500 text-white hover:scale-110 transition-all",
  },
  {
    key: "adventure",
    href: "/quiz-adventure",
    label: "⚔協力ダンジョン",
    desc1: "仲間と力を合わせてクイズに挑め！",
    desc2: "クイズに正解して、強敵を打ち倒そう！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-500 text-white hover:scale-110 transition-all",
  },
  {
    key: "dobon",
    href: "/quiz-dobon",
    label: "💀サバイバルクイズ",
    desc1: "３問間違えたら即脱落！",
    desc2: "君は最後まで生き残れるか！？",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-emerald-700 via-amber-800 to-stone-800 text-white hover:scale-110 transition-all",
  },
  // {
  //   key: "majority",
  //   href: "/quiz-majority",
  //   label: "🗳️多数決クイズ",
  //   desc1: "多数決で運命が決まる！",
  //   desc2: "最後のステージまでたどり着けるか！？",
  //   buttonClassName:
  //     "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-red-500 to-blue-500 text-white hover:scale-110 transition-all",
  // },
  // {
  //   key: "quick",
  //   href: "/quiz-quick",
  //   label: "⚡瞬発力クイズ",
  //   desc1: "迷ってるヒマはない！",
  //   desc2: "君は2秒で正解できるか！？",
  //   buttonClassName:
  //     "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-cyan-400 via-sky-300 to-sky-200 text-white hover:scale-110 transition-all",
  // },
  {
    key: "dice",
    href: "/quiz-dice",
    label: "🎲サイコロクイズ",
    desc1: "サイコロ次第でポイント爆増！？",
    desc2: "運も実力も試されるドキドキクイズ！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-green-700 via-emerald-500 to-amber-300 text-white hover:scale-110 transition-all",
  },
  {
    key: "onigokko",
    href: "/quiz-onigokko",
    label: "👹クイズおにごっこ",
    desc1: "捕まれば鬼に交代！",
    desc2: "ハラハラ追いかけっこクイズアクション！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-red-600 via-red-500 to-orange-300 text-white hover:scale-110 transition-all",
  },
  {
    key: "space",
    href: "/quiz-space",
    label: "🛸スペースクイズ",
    desc1: "正解エリアへ急げ！",
    desc2: "最後まで生き残る宇宙クイズバトル！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-cyan-500 via-purple-600 to-fuchsia-500 text-white hover:scale-110 transition-all",
  },
  {
    key: "word",
    href: "/quiz-word",
    label: "🔍ワードチェイス",
    desc1: "迷路の中で文字を集めろ！",
    desc2: "誰よりも早く単語を当てる探索クイズ！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-[#6b1d1d] via-[#a16207] to-[#f59e0b] text-white hover:scale-110 transition-all",
  },
  {
    key: "arena",
    href: "/quiz-arena",
    label: "⚔クイズアリーナ",
    desc1: "相手より先に倒せ！",
    desc2: "ひまQのキャラで戦う白熱クイズバトル！",
    buttonClassName:
      "w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-[radial-gradient(circle_at_top,#fde68a_0%,#fb7185_28%,#7c3aed_62%,#111827_100%)] text-white hover:scale-110 transition-all",
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

export default function RecommendedMultiplayerGames({
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