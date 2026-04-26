"use client";

import { useMemo, useState } from "react";

type PrizeKind = "trivia" | "word" | "aruaru" | "luck";

type Prize = {
  kind: PrizeKind;
  icon: string;
  label: string;
  title: string;
  texts: string[];
  bg: string;
  badge: string;
};

const PRIZES: Prize[] = [
  {
    kind: "trivia",
    icon: "💡",
    label: "1日1雑学",
    title: "今日のひま雑学",
    badge: "へぇ〜が出たら勝ち",
    bg: "from-yellow-200 via-white to-orange-200",
    texts: [
      "クイズは、答えを思い出そうとする時間がいちばん脳トレになるらしい。",
      "人は『あと少しで分かりそう』な問題ほど、記憶に残りやすいと言われています。",
      "雑学は、誰かに話した瞬間にちょっとだけ覚えやすくなります。",
      "ひらめいた時に気持ちいいのは、脳が小さなごほうびを感じているからかも。",
      "選択肢を見る前に答えを考えると、記憶に残りやすいと言われています。",
      "クイズで間違えた問題ほど、次に見たときに覚えていることがあります。",
      "短い時間でも頭を使うと、気分転換になりやすいです。",
      "『知ってるつもり』のことほど、クイズになると意外と迷います。",
      "雑学は、どうでもよさそうに見えて会話のきっかけになることがあります。",
      "答え合わせの瞬間に『なるほど』と思うと、記憶に残りやすいです。",
      "難しい問題を考えている時、脳はかなり集中モードになっています。",
      "クイズは、正解するより『考える時間』そのものがけっこう大事です。",
      "人は少し意外な情報ほど、誰かに話したくなりやすいです。",
      "同じ問題でも、時間を置いて解くと別の答えに見えることがあります。",
      "雑学を1つ覚えるだけで、今日ちょっと賢くなった気分になれます。",
    ],
  },
  {
    kind: "word",
    icon: "✨",
    label: "今日のひとこと",
    title: "今日のひとこと",
    badge: "ゆるく前向き",
    bg: "from-pink-200 via-white to-rose-200",
    texts: [
      "今日は1問だけでも遊べたら勝ち。気楽にいこう。",
      "間違えても大丈夫。ひまQは、ゆるく楽しむ場所です。",
      "迷ったら直感。意外と最初に思った答えが当たる日かも。",
      "ちょっと笑えたら、それだけで今日のひまつぶし成功です。",
      "完璧じゃなくてOK。ちょっと遊べたら十分です。",
      "今日は深く考えすぎず、ノリで答えてみてもいい日。",
      "正解できたらラッキー、間違えてもネタになる。それでOK。",
      "頭を使った自分、もうちょっとえらい。",
      "暇な時間を少し楽しくできたなら、それだけで勝ちです。",
      "今日はゆるく、でもちょっとだけ本気でいこう。",
      "1問解いたら、もう昨日より少しクイズ強い。",
      "焦らなくて大丈夫。楽しんだ人がいちばん強いです。",
      "当たっても外れても、気軽にもう1問いってみよう。",
      "今日は考えすぎない方が、いい答えにたどり着くかも。",
      "ちょっとした正解が、意外と気分を上げてくれます。",
    ],
  },
  {
    kind: "aruaru",
    icon: "😂",
    label: "今日のあるある",
    title: "クイズあるある",
    badge: "わかる人にはわかる",
    bg: "from-sky-200 via-white to-cyan-200",
    texts: [
      "正解を見た瞬間、『それだと思ってた』って言いがち。",
      "簡単そうな問題ほど、急に不安になる。",
      "2択まで絞ったのに、だいたい逆を選びがち。",
      "ランキングを見ると、急に本気になる。",
      "最初に選んだ答えを変えたら、最初の方が正解だったりする。",
      "『これは簡単』と思った問題で普通に間違える。",
      "知らない問題なのに、なぜか自信満々で答えることがある。",
      "正解した瞬間だけ、急に自分が天才に思える。",
      "連続正解中の1問だけ、やたら緊張する。",
      "ヒントを見た瞬間に『あー！』ってなる。",
      "難問より、よく知ってるジャンルの方が外した時くやしい。",
      "一度間違えた問題は、なぜか妙に忘れない。",
      "『たぶんこれ』で押した答えが当たると気持ちいい。",
      "最後の1問だけ、急に運ゲーになる。",
      "気づいたら、もう1問だけのつもりで何問もやってる。",
    ],
  },
  {
    kind: "luck",
    icon: "🎲",
    label: "運試し",
    title: "今日のクイズ運",
    badge: "大吉ボーナス",
    bg: "from-lime-200 via-white to-emerald-200",
    texts: [
      "小吉！今日はゆるく遊ぶほど当たりやすい日。",
      "中吉！迷ったら最初にピンときた答えを信じてみて。",
      "吉！雑学系の問題と相性がよさそう。",
      "大吉！今日はクイズ運かなり強め。ランキング入りを狙えるかも！？",
      "末吉！今日は焦らずいけば、じわじわ正解できそう。",
      "小吉！短めのクイズから始めると流れがよさそう。",
      "中吉！今日は2択で迷った時の勘が冴えるかも。",
      "吉！漢字・言葉系のクイズと相性がいい日。",
      "吉！ひらめき問題でいい感じに当たりそう。",
      "中吉！連続正解を狙うなら、落ち着いていこう。",
      "大吉！今日は最初の直感がかなり強そう。",
      "超吉！今なら難しめの問題にも勝てるかも！？",
      "ミラクル吉！なんとなく選んだ答えが当たる予感。",
      "チャレンジ吉！少し難しいクイズに挑むと楽しめそう。",
      "ひまQ吉！今日は遊んだ分だけクイズ運が上がりそう。",
    ],
  },
];

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export default function HimaQRoulette() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{
    prize: Prize;
    text: string;
    isDaikichi: boolean;
  } | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }, []);

  const spin = () => {
    if (spinning) return;

    setSpinning(true);
    setResult(null);

    const index = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[index];
    const text = pickRandom(prize.texts);

    const anglePerItem = 360 / PRIZES.length;

    const currentBase = ((rotation % 360) + 360) % 360;
    const targetBase = (180 - index * anglePerItem + 360) % 360;
    const diff = (targetBase - currentBase + 360) % 360;

    const extraSpins = 360 * 7;
    const nextRotation = rotation + extraSpins + diff;

    setRotation(nextRotation);

    window.setTimeout(() => {
      setResult({
        prize,
        text,
        isDaikichi: prize.kind === "luck" && text.includes("大吉"),
      });
      setSpinning(false);
    }, 3000);
  };

  return (
    <section className="mx-auto my-10 max-w-[700px]">
      <div className="relative overflow-hidden rounded-[2.2rem] border-4 border-black bg-gradient-to-br from-yellow-100 via-pink-100 to-sky-100 p-4 md:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,191,36,0.55),transparent_24%),radial-gradient(circle_at_85%_15%,rgba(244,114,182,0.45),transparent_24%),radial-gradient(circle_at_80%_85%,rgba(56,189,248,0.45),transparent_26%)]" />

        <div className="pointer-events-none absolute left-4 top-4 text-3xl">
          ⭐
        </div>
        <div className="pointer-events-none absolute right-5 top-7 text-3xl">
          🎉
        </div>
        <div className="pointer-events-none absolute bottom-5 left-6 text-3xl">
          🧠
        </div>
        <div className="pointer-events-none absolute bottom-5 right-7 text-3xl">
          ⚡
        </div>

        <div className="relative rounded-[1.8rem] border-4 border-black bg-white/80 p-2 md:p-4 md:p-6">
          <div className="text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border-3 border-black bg-black px-4 py-1.5 text-xs font-black text-white md:text-sm">
              <span>🎁</span>
              <span>{today} のひまつぶしガチャ</span>
            </p>

            <h2 className="text-3xl font-black tracking-tight text-gray-950 md:text-5xl">
              <span className="inline-block -rotate-3 rounded-2xl bg-yellow-300 px-2 text-black">
                ひまQ
              </span>
              <span className="mx-2 inline-block text-pink-500">ルーレット</span>
              {/* <span className="inline-block rotate-3">🎡</span> */}
            </h2>

            <p className="mx-auto mt-3 max-w-xl rounded-2xl border-2 border-dashed border-pink-300 bg-white/80 px-4 py-2 text-sm font-black leading-relaxed text-gray-700 md:text-base">
              回すだけで、雑学・ひとこと・あるある・運試しのどれかが当たる！
            </p>

            <div className="relative mx-auto mt-7 h-64 w-64 md:h-84 md:w-84">
              <div className="absolute left-1/2 top-[-16px] z-30 -translate-x-1/2">
                <div className="relative">
                  {/* <div className="absolute left-1/2 top-[-18px] -translate-x-1/2 rounded-full border-3 border-black bg-red-500 px-3 py-1 text-xs font-black text-white">
                    ここ！
                  </div> */}
                  <div className="text-5xl md:text-6xl leading-none text-red-500 drop-shadow-[0_3px_3px_#111]">
                    ▼
                  </div>
                </div>
              </div>

              <div className="absolute inset-[-10px] rounded-full border-4 border-black bg-gradient-to-br from-yellow-300 via-pink-300 to-sky-300" />

              <div
                className="relative h-full w-full rounded-full border-8 border-black bg-white transition-transform duration-[3000ms] ease-out"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_-45deg,#fde047_0deg,#fde047_90deg,#fb7185_90deg,#fb7185_180deg,#38bdf8_180deg,#38bdf8_270deg,#4ade80_270deg,#4ade80_360deg)]" />

                <div className="absolute left-1/2 top-0 h-full w-1.5 -translate-x-1/2 bg-black" />
                <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 bg-black" />

                {PRIZES.map((item, i) => {
                  const angle = i * 90;

                  return (
                    <div
                      key={item.kind}
                      className="absolute left-1/2 top-1/2 flex h-1/2 w-28 origin-top -translate-x-1/2 items-start justify-center pt-6"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <div
                        className="flex h-20 md:h-24 w-20 md:w-24 flex-col items-center justify-center rounded-[1.4rem] border-3 border-black bg-white text-[11px] font-black text-gray-950"
                        style={{ transform: `rotate(${-rotation - angle}deg)` }}
                      >
                        <span className="text-3xl leading-none">{item.icon}</span>
                        <span className="mt-1 leading-tight">{item.label}</span>
                      </div>
                    </div>
                  );
                })}

                <div
                  className="absolute left-1/2 top-1/2 z-10 flex h-18 md:h-20 w-18 md:w-20 items-center justify-center rounded-full border-3 md:border-4 border-black bg-white text-4xl font-black text-pink-500"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                  }}
                >
                  Q
                </div>
              </div>
            </div>

            <button
              onClick={spin}
              disabled={spinning}
              className="mt-7 rounded-full border-4 border-black bg-gradient-to-r from-pink-400 via-yellow-300 to-sky-300 px-8 py-4 text-xl font-black text-black transition hover:-translate-y-1 active:translate-y-1 disabled:cursor-wait disabled:opacity-80 md:text-2xl"
            >
              {spinning ? "ぐるぐる中...🎡" : "ルーレットを回す！"}
            </button>

            <div className="mt-6 min-h-[185px]">
              {spinning && (
                <div className="mx-auto flex h-[185px] max-w-xl animate-pulse items-center justify-center rounded-[1.7rem] border-4 border-dashed border-black bg-white/85 px-4 text-lg font-black">
                  🎲 何が出るかな...？
                </div>
              )}

              {!spinning && result && (
                <div
                  className={[
                    "mx-auto max-w-xl rounded-[1.7rem] border-4 border-black bg-gradient-to-br p-5",
                    result.prize.bg,
                    // result.isDaikichi ? "animate-bounce" : "",
                  ].join(" ")}
                >
                  {result.isDaikichi && (
                    <div className="mb-3 inline-block rounded-full border-2 border-black bg-red-500 px-4 py-1 text-sm font-black text-white">
                      🔥 大吉ボーナス！
                    </div>
                  )}

                  <div className="text-6xl">{result.prize.icon}</div>

                  <p className="mt-2 text-sm font-black text-pink-600">
                    {result.prize.badge}
                  </p>

                  <p className="mt-1 text-2xl font-black text-gray-950">
                    {result.prize.title}
                  </p>

                  <p className="mt-3 rounded-2xl border-2 border-black bg-white/80 px-4 py-3 text-lg font-black leading-relaxed text-gray-950 md:text-xl">
                    {result.text}
                  </p>

                  {result.isDaikichi && (
                    <p className="mt-4 rounded-2xl border-2 border-black bg-white/90 px-4 py-2 text-sm font-black text-black">
                      🎁 ボーナス気分で、もう1問だけ挑戦してみよう！
                    </p>
                  )}
                </div>
              )}

              {!spinning && !result && (
                <div className="mx-auto flex h-[185px] max-w-xl items-center justify-center rounded-[1.7rem] border-4 border-dashed border-gray-300 bg-white/75 px-4 text-sm font-black text-gray-500">
                  👆 ボタンを押すと、今日のお楽しみが出ます
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}