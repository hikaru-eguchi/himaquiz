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
    label: "雑学",
    title: "今日のひま雑学",
    badge: "へぇ〜が出たら勝ち",
    bg: "from-yellow-200 via-white to-orange-200",
    texts: [
      "アイスの『ガリガリ君』の棒は、湿度でも折れやすさが変わるらしい。",
      "鉛筆1本で約5万文字書けると言われています。",
      "人はくすぐられても、自分で自分はくすぐったくできません。",
      "タコには心臓が3つあります。",
      "キリンはほとんど眠らなくても生きられる動物です。",
      "くしゃみは時速100km以上出ることがあるらしいです。",
      "信号機の青は、本当は法律上『緑』扱いです。",
      "ペンギンは膝があります。見えないだけです。",
      "バナナはベリー（果実）で、いちごはベリーではありません。",
      "マクドナルドのポテトは、冷めると塩味を強く感じやすくなります。",
      "人は寝ている間にクモを食べる…は有名だけど、ほぼ都市伝説らしいです。",
      "コアラの指紋は、人間とかなり似ています。",
      "ハチミツはほぼ腐らない食べ物です。",
      "ナマケモノは水の中だと意外と泳げます。",
      "カンガルーは後ろ歩きがかなり苦手です。",
      "実はパンダは肉も食べられます。",
      "人は『あくび』がうつるのは共感力と関係ある説があります。",
      "レゴブロックは世界で最もタイヤを作っているメーカーの一つです。",
      "鼻をつまんでリンゴを食べると、じゃがいもに感じることがあるらしい。",
      "宇宙では涙を流しても下に落ちません。",
      "ダチョウの目は脳より大きいです。",
      "猫は人間にだけ鳴き声を変えて甘えることがあるそうです。",
      "ゾウはジャンプできません。",
      "ポップコーンが弾けるのは、中の水分が爆発するからです。",
      "『へぇ〜』と言うだけで、ちょっと記憶に残りやすくなるらしいです。",
      "人は『あとでやる』と思うと脳は半分終わった気になりやすいそうです。",
      "ラッコは寝る時、流されないよう手をつなぐことがあります。",
      "サメは眠っていても泳ぎ続ける種類がいます。",
      "蚊は好き嫌いがあり、刺されやすい人がいるらしいです。",
      "人は『無料』という文字に反応しやすいようできているそうです。",
      "パンダの白黒は雪や影に紛れる説があります。",
      "『ムダ知識』ほど意外と会話で使われがちです。",
      "フクロウは首が約270度回ります。",
      "じゃんけんで最初にグーを出しやすい人は多いらしいです。",
      "人は階段を上るとき、だいたい同じ足から出しがちです。",
      "パンダは一日かなり長時間、ほぼ食べています。",
      "笑うフリをするだけでも気分が少し上がることがあるそうです。",
    ],
  },
  {
    kind: "word",
    icon: "✨",
    label: "ひとこと",
    title: "今日のひとこと",
    badge: "ゆるく前向き",
    bg: "from-pink-200 via-white to-rose-200",
    texts: [
      "今日はちゃんと起きただけでも、けっこうえらい。",
      "うまくいかない日があっても、進んでないわけじゃない。",
      "休むのも、前に進むためのひとつです。",
      "焦る日があっても、自分のペースで大丈夫。",
      "頑張れない日は、頑張らなくていい日かもしれない。",
      "小さな達成って、意外と人生を動かします。",
      "ゆっくりでも進んでいれば、それでちゃんと進行中。",
      "できなかったことより、できたことを数えてみてもいい。",
      "疲れてる時は、立ち止まるのも正解です。",
      "昨日の自分より少し優しくなれたらそれで十分。",
      "今日うまくいかなくても、明日はわりと別日です。",
      "思ってるより、ちゃんとやれてること多いです。",
      "小さく機嫌を取るのも、大事なスキルです。",
      "今できる範囲でやるだけでも立派です。",
      "全部整ってからじゃなくても、始めていい。",
      "少し笑えたなら、今日は悪くない日かも。",
      "失敗って、意外とただの途中だったりする。",
      "昨日より気楽に考えられたら、それも成長。",
      "自分を急かしすぎない人のほうが、案外強い。",
      "比べるより、自分の歩幅で行くほうがラクです。",
      "何回でも仕切り直していい。",
      "今日は静かに過ごせたなら、それもいい一日。",
      "今日遊んでるあなた、ちゃんと人生楽しむ才能あります。",
      "今クイズしてるの、立派な脳トレです。えらい。",
      "何もしない時間を楽しめる人、実は強いです。",
      "暇つぶしできる余裕があるの、けっこう才能。",
      "楽しむことに罪悪感いらないです。それ大事な栄養。",
      "あなたが思うより、普段かなり頑張ってるはず。",
      "遊んでる時間にも価値あるって、もっと広まっていい。",
      "好きなことで時間使えるの、ちょっと豊かです。",
      "何回でも休んでいいし、何回でもやり直していい。",
      "頑張るだけじゃなく遊べる人、魅力あります。",
      "暇つぶしを楽しめる人、人生もうまく暇を味方にできる。",
      "今日は楽しんだ者勝ち、たぶん本当にそう。",
      "自分を甘やかす日がある人のほうが、折れにくいです。",
      "クイズで遊んでる今、実はちょっと脳にも優しい。",
      "あなたはもっと自分を褒めていいし、休んでいい。",
      "遊ぶことを肯定できる人、人生うまい人です。",
    ],
  },
  {
    kind: "aruaru",
    icon: "😂",
    label: "あるある",
    title: "クイズあるある",
    badge: "わかる人にはわかる",
    bg: "from-sky-200 via-white to-cyan-200",
    texts: [
      "『あと5分だけ…』で結局いつも普通に寝過ごしがち。",
      "冷蔵庫って開けた瞬間だけ全部うまそうに見えがち。",
      "ポテトに1本だけやたら長いやつあると当たり感ある。",
      "電子レンジ、残り1秒までなぜか見届けがち。",
      "深夜のカップ麺、昼より異常にうまく感じがち。",
      "『これ自分だけ？』と思ってる癖、だいたいみんなやってる。",
      "レジで後ろ並ばれると財布しまうの妙に焦りがち。",
      "横断歩道の白いとこだけ踏みたくなりがち。",
      "目覚ましより1分早く起きると勝った気になりがち。",
      "スマホ探してるのにスマホのライト使おうとしがち。",
      "エレベーターの閉ボタン、意味なく連打しがち。",
      "寝る前『動画1本だけ』で30分溶けがち。",
      "マスクしてると独り言ちょっと増えがち。",
      "コンビニ入ると買う予定なかったもの買いがち。",
      "急いでる日に限って靴ひもほどけがち。",
      "ポテチ最後の粉、ちょっと惜しく感じがち。",
      "『今日は早く寝る』って言った日ほど夜更かししがち。",
      "レシートいらないのに一回受け取りがち。",
      "リモコンなくした時、だいたい近くにありがち。",
      "検索しようとして何調べるか忘れがち。",
      "『無料』『限定』って言葉につい弱くなりがち。",
      "階段の最後、もう一段あると思ってビクッとなりがち。",
      "誰もいないのに自動ドア開くと選ばれた感ありガチ。",
      "歯医者前日だけ歯みがき丁寧になりがち。",
      "買ったお菓子、手元にあると減る速度バグりがち。",
      "会話後に1人反省会しがち。",
      "お風呂で名案浮かぶのに上がると忘れがち。",
      "プリンのカラメル最後まで取っときがち。",
      "眠い時の5分、異様に短く感じがち。",
      "冷たい布団入る瞬間ちょっと覚悟しがち。",
      "『明日から本気出す』更新しがち。",
      "動画広告の残り5秒、めちゃ長く感じがち。",
      "買い物で本命忘れて余計な物だけ買いがち。",
      "降りる駅近づくと急にソワソワしがち。",
      "寝落ちするとスマホ顔に落としがち。",
      "コンビニおにぎり、たまに開け方ミスりがち。",
      "『あと一口だけ』で全然終わらなかったりしがち。",
      "カップ焼きそばのお湯捨て毎回ちょっと緊張しがち。",
      "コメント欄ちょっとだけ見るつもりが長居しがち。",
      "急に昔の黒歴史思い出して1人で悶えがち。",
      "何しに来たか忘れて立ち尽くしがち。",
      "『押してください』って書いてあると押したくなりがち。",
      "結局くだらない話ほど盛り上がりがち。",
    ],
  },
  {
    kind: "luck",
    icon: "🎲",
    label: "運勢",
    title: "今日のクイズ運勢",
    badge: "ちょこっと運勢占い",
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
      "ミニ大吉！小さな連勝が大きな波になるかも。",
      "コツコツ吉！丁寧に読むとかなり当たりそう。",
      "レア吉！今日は珍しく勘が全部噛み合うかも。",
      "のんびり吉！急がないほど結果が良くなりそう。",
      "ひらめき大吉！一瞬で答えが降ってくるかも。",
      "ラッキー吉！たまたま押した選択肢が刺さる予感。",
      "ボーナス吉！いつもより正解が続きやすいかも。",
      "謎解き吉！発想系にツキあり。今日は冴えてる。",
      "ミラクル吉！なんとなく選んだ答えが当たる予感。",
      "ミラクル大吉！今日は『まさか当たる！？』が起きる日。",
      "チャレンジ吉！少し難しいクイズに挑むと楽しめそう。",
      "伝説吉！自己ベスト出したら今日の運勢のせいかも。",
      "ひまQ吉！今日は遊んだ分だけクイズ運が上がりそう。",
      "超ひまQ大吉！今日は遊んだ人だけ運が伸びる日かも！？",
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
              回すだけで、雑学・ひとこと・あるある・運勢のどれかが当たる！
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