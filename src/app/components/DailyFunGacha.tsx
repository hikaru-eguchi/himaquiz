"use client";

import { useMemo, useState } from "react";

type GachaType = "trivia" | "word" | "aruaru" | "luck";

const ITEMS: Record<GachaType, { label: string; icon: string; items: string[] }> = {
  trivia: {
    label: "1日1雑学",
    icon: "💡",
    items: [
      "キリンの睡眠時間は、1日20分ほどの日もあるらしい。",
      "じゃんけんで最初にグーを出す人は意外と多い。",
      "人は“あと少し”と思うと、集中力が少し戻りやすい。",
      "猫は人間にだけ、よく鳴いて話しかけると言われています。",
    ],
  },
  word: {
    label: "今日のひとこと",
    icon: "✨",
    items: [
      "今日は1問だけでも遊べたら勝ち。",
      "間違えてもOK。ひまQは気楽に遊ぶ場所です。",
      "ひらめいた瞬間が、一番気持ちいい。",
      "今日のあなた、意外と直感が冴えてるかも。",
    ],
  },
  aruaru: {
    label: "今日のあるある",
    icon: "😂",
    items: [
      "クイズ、最初の選択肢が正解に見えがち。",
      "簡単そうな問題ほど急に不安になる。",
      "答えを見た瞬間『それだと思った』って言いがち。",
      "ランキングを見ると、ちょっと本気になる。",
    ],
  },
  luck: {
    label: "運試し",
    icon: "🎲",
    items: [
      "大吉！今日はクイズ運かなり強め。ボーナス気分で1問いこう！",
      "中吉！迷ったら最初に思った答えを信じてみて。",
      "小吉！ゆるく遊ぶほど当たりやすい日。",
      "レア大吉！今日はランキング入りを狙えるかも！？",
    ],
  },
};

const TYPES: GachaType[] = ["trivia", "word", "aruaru", "luck"];

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export default function DailyFunGacha() {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<{
    type: GachaType;
    text: string;
    isRare: boolean;
  } | null>(null);

  const todayText = useMemo(() => {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }, []);

  const roll = () => {
    if (isRolling) return;

    setIsRolling(true);
    setResult(null);

    setTimeout(() => {
      const type = pickRandom(TYPES);
      const text = pickRandom(ITEMS[type].items);
      const isRare = type === "luck" && (text.includes("レア") || text.includes("大吉"));

      setResult({ type, text, isRare });
      setIsRolling(false);
    }, 900);
  };

  const current = result ? ITEMS[result.type] : null;

  return (
    <section className="mx-auto my-10 max-w-3xl">
      <div className="relative overflow-hidden rounded-[2rem] border-4 border-black bg-gradient-to-br from-yellow-100 via-white to-pink-100 p-5 shadow-[0_12px_0_#111]">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-yellow-300/60 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-pink-300/60 blur-2xl" />

        <div className="relative text-center">
          <p className="mb-2 inline-block rounded-full bg-black px-4 py-1 text-sm font-black text-white">
            {todayText} のお楽しみ
          </p>

          <h2 className="text-2xl font-black text-gray-900 md:text-4xl">
            🎁 今日のお楽しみガチャ
          </h2>

          <p className="mt-2 text-sm font-bold text-gray-700 md:text-base">
            雑学・ひとこと・あるある・運試しのどれかが出るよ！
          </p>

          <div className="mt-5 grid grid-cols-4 gap-2 text-xs font-black md:text-sm">
            <div className="rounded-2xl border-2 border-black bg-white px-2 py-3 shadow-[0_4px_0_#111]">
              💡<br />雑学
            </div>
            <div className="rounded-2xl border-2 border-black bg-white px-2 py-3 shadow-[0_4px_0_#111]">
              ✨<br />ひとこと
            </div>
            <div className="rounded-2xl border-2 border-black bg-white px-2 py-3 shadow-[0_4px_0_#111]">
              😂<br />あるある
            </div>
            <div className="rounded-2xl border-2 border-black bg-white px-2 py-3 shadow-[0_4px_0_#111]">
              🎲<br />運試し
            </div>
          </div>

          <button
            onClick={roll}
            disabled={isRolling}
            className="mt-6 rounded-full border-4 border-black bg-gradient-to-r from-pink-400 via-yellow-300 to-sky-300 px-8 py-4 text-xl font-black text-black shadow-[0_8px_0_#111] transition hover:-translate-y-1 hover:shadow-[0_12px_0_#111] active:translate-y-1 active:shadow-[0_4px_0_#111] disabled:cursor-wait disabled:opacity-80"
          >
            {isRolling ? "ガチャ中...🌈" : "今日のガチャを引く！"}
          </button>

          <div className="mt-6 min-h-[150px]">
            {isRolling && (
              <div className="mx-auto flex h-[150px] max-w-xl animate-pulse items-center justify-center rounded-3xl border-4 border-dashed border-black bg-white/80 text-5xl">
                🎁✨🎲
              </div>
            )}

            {!isRolling && result && current && (
              <div
                className={[
                  "mx-auto max-w-xl rounded-3xl border-4 border-black p-5 shadow-[0_8px_0_#111]",
                  result.isRare
                    ? "bg-gradient-to-br from-yellow-200 via-white to-orange-200 animate-bounce"
                    : "bg-white",
                ].join(" ")}
              >
                {result.isRare && (
                  <div className="mb-3 inline-block rounded-full bg-red-500 px-4 py-1 text-sm font-black text-white">
                    🔥 レア演出！
                  </div>
                )}

                <div className="text-5xl">{current.icon}</div>

                <p className="mt-2 text-lg font-black text-pink-600">
                  {current.label}
                </p>

                <p className="mt-3 text-lg font-black leading-relaxed text-gray-900 md:text-xl">
                  {result.text}
                </p>

                {result.isRare && (
                  <p className="mt-4 rounded-2xl bg-yellow-300 px-4 py-2 text-sm font-black text-black">
                    今日のボーナス気分で、もう1問いってみよう！
                  </p>
                )}
              </div>
            )}

            {!isRolling && !result && (
              <div className="mx-auto flex h-[150px] max-w-xl items-center justify-center rounded-3xl border-4 border-dashed border-gray-300 bg-white/70 px-4 text-sm font-bold text-gray-500">
                ボタンを押すと、今日のお楽しみが出ます
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}