"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

type StyleRarity =
  | "ノーマル"
  | "レア"
  | "超レア"
  | "激レア"
  | "神レア"
  | "シークレット";

type StyleSkin = {
  no: string;
  name: string;
  image: string;
  rarity: StyleRarity;
  weight: number;
};

type StyleGachaItem = StyleSkin & {
  skinId: string;
  isNew: boolean;
};

const GACHA_COST = 1500;

const styleSkins: StyleSkin[] = [
  { no: "1", name: "ボードスタイル", image: "/images/skin_chara1_ボード.png", rarity: "ノーマル", weight: 11 },
  { no: "2", name: "レッドジェット", image: "/images/skin_chara2_ジェット（レッド）.png", rarity: "ノーマル", weight: 11 },
  { no: "3", name: "ブルージェット", image: "/images/skin_chara3_ジェット（ブルー）.png", rarity: "ノーマル", weight: 11 },
  { no: "4", name: "グリーンジェット", image: "/images/skin_chara4_ジェット（グリーン）.png", rarity: "ノーマル", weight: 11 },
  { no: "5", name: "UFOスタイル", image: "/images/skin_chara5_UFO.png", rarity: "レア", weight: 5 },
  { no: "6", name: "くもスタイル", image: "/images/skin_chara6_くも.png", rarity: "レア", weight: 5 },
  { no: "7", name: "ドーナツスタイル", image: "/images/skin_chara7_ドーナツ.png", rarity: "レア", weight: 5 },
  { no: "8", name: "波乗りスタイル", image: "/images/skin_chara8_波.png", rarity: "レア", weight: 5 },
  { no: "9", name: "葉っぱスタイル", image: "/images/skin_chara9_葉っぱ.png", rarity: "レア", weight: 5 },
  { no: "10", name: "じゅうたんスタイル", image: "/images/skin_chara10_じゅうたん.png", rarity: "レア", weight: 5 },
  { no: "11", name: "ふうせんスタイル", image: "/images/skin_chara11_ふうせん.png", rarity: "超レア", weight: 3.75 },
  { no: "12", name: "ききゅうスタイル", image: "/images/skin_chara12_ききゅう.png", rarity: "超レア", weight: 3.75 },
  { no: "13", name: "ドローンスタイル", image: "/images/skin_chara13_ドローン.png", rarity: "超レア", weight: 3.75 },
  { no: "14", name: "つえスタイル", image: "/images/skin_chara14_つえ.png", rarity: "超レア", weight: 3.75 },
  { no: "15", name: "スタースタイル", image: "/images/skin_chara15_スター.png", rarity: "激レア", weight: 2.333 },
  { no: "16", name: "ムーンスタイル", image: "/images/skin_chara16_ムーン.png", rarity: "激レア", weight: 2.333 },
  { no: "17", name: "ようせいスタイル", image: "/images/skin_chara17_ようせい.png", rarity: "激レア", weight: 2.334 },
  { no: "18", name: "ドラゴンスタイル", image: "/images/skin_chara18_ドラゴン.png", rarity: "神レア", weight: 1.5 },
  { no: "19", name: "ダークドラゴン", image: "/images/skin_chara19_ダークドラゴン.png", rarity: "神レア", weight: 1.5 },
  { no: "20", name: "ヒーロースタイル", image: "/images/skin_chara20_ヒーロー.png", rarity: "シークレット", weight: 1 },
];

const rarityText: Record<StyleRarity, string> = {
  ノーマル: "text-slate-500",
  レア: "text-sky-500",
  超レア: "text-violet-500",
  激レア: "text-pink-500",
  神レア: "text-emerald-500",
  シークレット: "text-zinc-950",
};

const rarityBg: Record<StyleRarity, string> = {
  ノーマル: "from-slate-200 via-white to-cyan-100",
  レア: "from-sky-300 via-cyan-200 to-white",
  超レア: "from-violet-400 via-fuchsia-300 to-cyan-200",
  激レア: "from-pink-500 via-fuchsia-400 to-violet-500",
  神レア: "from-emerald-300 via-cyan-300 to-violet-400",
  シークレット: "from-zinc-950 via-violet-950 to-pink-700",
};

const rarityStars: Record<StyleRarity, number> = {
  ノーマル: 1,
  レア: 2,
  超レア: 3,
  激レア: 4,
  神レア: 5,
  シークレット: 6,
};

const SPECIAL_RARES: Record<StyleRarity, boolean> = {
  ノーマル: false,
  レア: false,
  超レア: false,
  激レア: true,
  神レア: true,
  シークレット: true,
};

function pickByWeight(pool: StyleSkin[]) {
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;

  for (const item of pool) {
    if (random < item.weight) return item;
    random -= item.weight;
  }

  return pool[pool.length - 1];
}

export default function HimaStyleGachaPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [points, setPoints] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<StyleGachaItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showDark, setShowDark] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  type GachaPhase =
    | "idle"
    | "drop"
    | "ready"
    | "openingHold"
    | "opening"
    | "result";

  const [phase, setPhase] = useState<GachaPhase>("idle");
  const [history, setHistory] = useState<StyleGachaItem[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<StyleGachaItem | null>(null);
  const [ownedSkinIds, setOwnedSkinIds] = useState<Set<string>>(new Set());
  const [noToId, setNoToId] = useState<Map<string, string>>(new Map());
  const [showDescription, setShowDescription] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userLoading || !user) return;

    const fetchInitialData = async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("fetch profile error:", profileError);
        return;
      }

      setPoints(profile?.points ?? 0);

      const { data: skins, error: skinsError } = await supabase
        .from("skins")
        .select("id,no");

      if (skinsError) {
        console.error("fetch skins error:", skinsError);
        return;
      }

      const map = new Map<string, string>();
      for (const row of skins ?? []) {
        map.set(String(row.no), row.id);
      }
      setNoToId(map);

      const { data: owned, error: ownedError } = await supabase
        .from("user_skins")
        .select("skin_id")
        .eq("user_id", user.id);

      if (ownedError) {
        console.error("fetch owned skins error:", ownedError);
        return;
      }

      setOwnedSkinIds(new Set((owned ?? []).map((row) => row.skin_id)));
    };

    fetchInitialData();
  }, [supabase, user, userLoading]);

  useEffect(() => {
    if (!result) return;

    setShowDark(false);
    setShowFlash(false);
    setShowResult(false);
    setPhase("drop");

    const t = setTimeout(() => {
      setPhase("ready");
    }, 1200);

    return () => clearTimeout(t);
  }, [result]);

  const handleOpenGacha = () => {
    if (!result) return;
    if (phase !== "ready") return;

    const isSpecialRare = SPECIAL_RARES[result.rarity];

    setPhase("openingHold");

    setTimeout(() => {
      setPhase("opening");

      if (isSpecialRare) {
        setTimeout(() => setShowDark(true), 650);
        setTimeout(() => setShowFlash(true), 1700);
        setTimeout(() => {
          setShowResult(true);
          setPhase("result");
        }, 2400);
        return;
      }

      setTimeout(() => {
        setShowResult(true);
        setPhase("result");
      }, 900);
    }, 100);
  };

  const rollStyleGacha = async () => {
    if (rolling) return;

    if (!user) {
      alert("ログインしてからガチャを回してね！");
      return;
    }

    if (noToId.size === 0) {
      alert("ガチャ準備中です。少し待ってからもう一度お試しください。");
      return;
    }

    setRolling(true);

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("get profile error:", profileError);
        alert("ポイントの取得に失敗しました。");
        return;
      }

      const currentPoints = profile?.points ?? 0;

      if (currentPoints < GACHA_COST) {
        alert(`ポイントが足りません！（${GACHA_COST}P必要です）`);
        return;
      }

      const picked = pickByWeight(styleSkins);
      const skinId = noToId.get(picked.no);

      if (!skinId) {
        console.error("skin id not found:", picked.no);
        alert("スキン情報が見つかりませんでした。");
        return;
      }

      const newPoints = currentPoints - GACHA_COST;

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({ points: newPoints })
        .eq("id", user.id)
        .select("points")
        .single();

      if (updateError) {
        console.error("update points error:", updateError);
        alert("ポイントの更新に失敗しました。");
        return;
      }

      setPoints(updatedProfile?.points ?? newPoints);
      window.dispatchEvent(new Event("points:updated"));

      await supabase.from("user_point_logs").insert({
        user_id: user.id,
        change: -GACHA_COST,
        reason: "ひまスタイルガチャでポイント消費",
      });

      const isNew = !ownedSkinIds.has(skinId);

      if (isNew) {
        const { error: rpcError } = await supabase.rpc("add_user_skin", {
          p_user_id: user.id,
          p_skin_id: skinId,
        });

        if (rpcError) {
          console.error("add_user_skin rpc error:", rpcError);
          alert("スキンの保存に失敗しました。時間をおいてもう一度試してください。");
          return;
        }

        setOwnedSkinIds((prev) => new Set(prev).add(skinId));
      }

      const item: StyleGachaItem = {
        ...picked,
        skinId,
        isNew,
      };

      setHistory((prev) => [item, ...prev]);
      setResult(item);
    } finally {
      setTimeout(() => setRolling(false), 2800);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-cyan-300 via-violet-400 to-pink-400">
        <p className="font-black text-white text-2xl drop-shadow">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-violet-400 to-pink-400 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-[2rem] border-4 border-black bg-white/90 p-6 text-center shadow-[0_8px_0_rgba(0,0,0,1)]">
          <p className="text-2xl font-black text-zinc-900">
            ひまスタイルガチャはログインすると遊べるよ！
          </p>
          <p className="mt-3 font-bold text-zinc-600">
            ゲットしたスタイルは保存されて、ゲーム中の見た目に使えるようになります。
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push("/user/login")}
              className="rounded-full border-3 border-black bg-cyan-400 px-6 py-3 font-black text-white shadow-[0_5px_0_rgba(0,0,0,1)]"
            >
              ログイン
            </button>
            <button
              onClick={() => router.push("/user/signup")}
              className="rounded-full border-3 border-black bg-pink-400 px-6 py-3 font-black text-white shadow-[0_5px_0_rgba(0,0,0,1)]"
            >
              新規登録
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canRoll = points >= GACHA_COST && !rolling;

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-cyan-300 via-violet-500 to-pink-400">
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-10 right-[-80px] h-80 w-80 rounded-full bg-cyan-200 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 rounded-full bg-pink-300 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 py-6 md:py-10">
        <section className="rounded-[2rem] border-4 border-black bg-white/85 p-5 shadow-[0_10px_0_rgba(0,0,0,1)] backdrop-blur md:p-8">
          <div className="grid items-center gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="text-center md:text-left">
              <div className="inline-flex rounded-full border-3 border-black bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-[0_4px_0_rgba(0,0,0,1)]">
                🎨 1回 {GACHA_COST.toLocaleString()}P
              </div>

              <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight text-zinc-950 md:text-7xl">
                ひまスタイル
                <br />
                <span className="bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
                  ガチャ
                </span>
              </h1>

              <p className="mt-4 text-lg font-black text-zinc-800 md:text-2xl">
                かわいいスタイルから個性的なスタイルまで！
                <br />
                集めた見た目で、ゲーム中の自分を着せ替えよう。
              </p>

              <p className="mt-3 text-sm font-bold text-zinc-600 md:text-base">
                スタイルは全20種類。ノーマルからシークレットまで登場します。
              </p>

              <p className="mt-3 text-sm font-bold text-zinc-700 md:text-base">
                ポイントは「連続正解チャレンジ」などのクイズゲームでためることができます。
              </p>

              <div className="mt-4 inline-block rounded-2xl bg-white/80 border-2 border-black px-4 py-3 text-left shadow">
                <p className="text-sm md:text-base font-bold text-zinc-700">
                  🎨 手に入れたスタイルは「ひまスタイル図鑑」で確認できます
                </p>
                <p className="text-sm md:text-base font-bold text-zinc-700 mt-1">
                  👤 プロフィールから使用するスタイルを変更できます
                </p>
              </div>
            </div>

            <div className="relative min-h-[230px]">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-200 via-violet-200 to-pink-200 blur-xl" />

              <div className="relative hidden h-[300px] items-end justify-center gap-3 rounded-[2rem] border-3 border-black bg-white/70 p-4 shadow-inner md:flex">
                {[styleSkins[3], styleSkins[1], styleSkins[2]].map((skin, index) => (
                  <motion.img
                    key={skin.no}
                    src={skin.image}
                    alt={skin.name}
                    className={`object-contain drop-shadow-2xl ${
                      index === 1 ? "h-58" : "h-58"
                    }`}
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 2 + index * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>

              <div className="relative flex h-[260px] items-end justify-center rounded-[2rem] border-3 border-black bg-white/70 p-3 shadow-inner md:hidden">
                {[styleSkins[3], styleSkins[1], styleSkins[2]].map((skin, index) => (
                  <motion.img
                    key={skin.no}
                    src={skin.image}
                    alt={skin.name}
                    className={`object-contain drop-shadow-2xl ${
                      index === 1 ? "h-28 -translate-y-24" : "h-28 translate-y-0"
                    }`}
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 2 + index * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border-4 border-black bg-white/90 p-5 text-center shadow-[0_8px_0_rgba(0,0,0,1)]">
            <p className="text-sm font-black text-zinc-500">所持ポイント</p>
            <p className="mt-1 text-4xl font-black text-zinc-950">
              {points.toLocaleString()}P
            </p>

            <div className="mt-5 inline-flex items-center justify-center rounded-full border-3 border-black bg-white px-5 py-2 shadow-[0_4px_0_rgba(0,0,0,1)]">
              <span className="text-sm md:text-base font-black text-zinc-600">
                1回
              </span>
              <span className="ml-2 text-xl md:text-2xl font-black text-violet-600">
                {GACHA_COST.toLocaleString()}P
              </span>
            </div>

            <button
              onClick={rollStyleGacha}
              disabled={!canRoll}
              className={`mt-3 w-full rounded-full border-4 border-black px-6 py-4 text-xl font-black text-white shadow-[0_7px_0_rgba(0,0,0,1)] transition active:translate-y-1 active:shadow-[0_3px_0_rgba(0,0,0,1)] md:text-2xl ${
                canRoll
                  ? "bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 hover:scale-[1.02]"
                  : "cursor-not-allowed bg-zinc-400 opacity-60"
              }`}
            >
              {rolling ? "抽選中..." : `✨ スタイルをゲット！`}
            </button>

            {points < GACHA_COST && (
              <p className="mt-3 font-black text-red-500">
                あと {(GACHA_COST - points).toLocaleString()}P 足りないよ！
              </p>
            )}

            <button
              onClick={() => setShowDescription((prev) => !prev)}
              className="mt-5 rounded-full border-3 border-black bg-white px-5 py-2 font-black text-zinc-800 shadow-[0_4px_0_rgba(0,0,0,1)]"
            >
              説明・出現率
            </button>

            <div
              className="overflow-hidden transition-all duration-500"
              style={{
                maxHeight: showDescription
                  ? descriptionRef.current?.scrollHeight
                  : 0,
              }}
            >
              <div
                ref={descriptionRef}
                className="mt-4 rounded-2xl bg-cyan-50 p-4 text-left text-sm font-bold leading-7 text-zinc-700"
              >
                <p>ノーマル：44%</p>
                <p>レア：30%</p>
                <p>超レア：15%</p>
                <p>激レア：7%</p>
                <p>神レア：3%</p>
                <p>シークレット：1%</p>

                <div className="mt-4 border-t pt-4">
                  <p>🎨 手に入れたスタイルは「ひまスタイル図鑑」で確認できます</p>
                  <p>👤 プロフィールから使用するスタイルを変更できます</p>
                </div>

                <p className="mt-3 text-xs text-zinc-500">
                  ※同じスタイルが出た場合、NEW表示は出ません。
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border-4 border-black bg-white/90 p-5 shadow-[0_8px_0_rgba(0,0,0,1)]">
            <h2 className="text-center text-2xl font-black text-zinc-950">
              今回の入手スタイル
            </h2>

            {history.length === 0 ? (
              <p className="mt-8 text-center font-bold text-zinc-500">
                まだなし。ガチャを回してみよう！
              </p>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {history.map((item, index) => (
                  <button
                    key={`${item.no}-${index}`}
                    type="button"
                    onClick={() => setSelectedHistory(item)}
                    className="relative rounded-2xl border-3 border-black bg-white p-3 text-center shadow-[0_5px_0_rgba(0,0,0,1)] transition hover:scale-105"
                  >
                    {item.isNew && (
                      <div className="absolute -left-2 -top-3 rounded-full border-2 border-white bg-gradient-to-r from-pink-500 to-yellow-400 px-3 py-1 text-xs font-black text-white shadow">
                        NEW
                      </div>
                    )}

                    <img
                      src={item.image}
                      alt={item.name}
                      className="mx-auto h-28 w-full object-contain"
                    />
                    <p className="mt-2 text-sm font-black text-zinc-900">
                      {item.name}
                    </p>
                    <p className={`text-xs font-black ${rarityText[item.rarity]}`}>
                      {item.rarity}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {result && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (phase === "ready") {
                handleOpenGacha();
                return;
              }

              if (phase === "result") {
                setShowResult(false);
                setResult(null);
                setPhase("idle");
              }
            }}
          >
            {phase !== "result" && (
              <div
                className="fixed inset-0 z-0"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #22d3ee, #8b5cf6, #ec4899, #0f172a)",
                  filter: "blur(35px)",
                  opacity: 0.8,
                }}
              />
            )}

            {phase === "drop" && (
              <motion.img
                src="/images/gacha_close5.png"
                className="z-50 h-72 w-72 select-none md:h-[560px] md:w-[560px]"
                initial={{ y: "-120vh", scale: 0.6 }}
                animate={{ y: 0, scale: 0.6 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                alt="カプセル"
              />
            )}

            {phase === "ready" && (
              <div className="relative z-50 flex flex-col items-center">
                <motion.p
                  className="mb-4 text-4xl font-black text-white drop-shadow md:text-6xl"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  タップで開封！
                </motion.p>

                <motion.img
                  src="/images/gacha_close5.png"
                  className="z-50 h-72 w-72 cursor-pointer select-none md:h-[560px] md:w-[560px]"
                  initial={{ scale: 0.6 }}
                  animate={{
                    rotate: [-3, 3, -3],
                    y: [0, -6, 0],
                    scale: 0.6,
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  alt="カプセル"
                />
              </div>
            )}

            {phase === "openingHold" && (
              <motion.img
                src="/images/gacha_close5.png"
                className="z-50 h-72 w-72 select-none md:h-[560px] md:w-[560px]"
                initial={{ scale: 0.6, y: 0 }}
                animate={{ scale: 0.6, y: 6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                alt="カプセル"
              />
            )}

            {phase === "opening" && (
              <motion.img
                src="/images/gacha_open5.png"
                className="z-50"
                initial={{ scale: 0.55 }}
                animate={{ scale: 0.7 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                alt="開封"
              />
            )}

            {result && SPECIAL_RARES[result.rarity] && showDark && (
              <motion.div
                className="fixed inset-0 z-40 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.92 }}
                transition={{ duration: 0.65 }}
              />
            )}

            {result && SPECIAL_RARES[result.rarity] && showFlash && (
              <motion.div
                className="fixed inset-0 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.75, 0] }}
                transition={{ duration: 1.1 }}
                style={{
                  background:
                    "radial-gradient(circle at center, #ffffff 0%, #fff7b0 28%, #67e8f9 52%, transparent 82%)",
                }}
              />
            )}

            {showResult && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, #22d3ee, #8b5cf6, #ec4899, #111827)",
                    filter: "blur(35px)",
                    opacity: 0.7,
                  }}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.35, y: 80 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="relative z-50 w-[92%] max-w-md text-center"
                >
                  {result.isNew && (
                    <div className="absolute -top-7 left-2 z-20 rounded-full border-4 border-white bg-gradient-to-r from-red-500 via-pink-500 to-yellow-400 px-5 py-2 text-2xl font-black text-white shadow-xl md:text-4xl">
                      NEW
                    </div>
                  )}

                  <div
                    className={`rounded-[2rem] border-4 border-black bg-gradient-to-br ${
                      rarityBg[result.rarity]
                    } p-5 shadow-[0_10px_0_rgba(0,0,0,1)]`}
                  >
                    <p className="text-lg font-black text-white drop-shadow">
                      🌈 NEW STYLE!
                    </p>

                    <img
                      src={result.image}
                      alt={result.name}
                      className="mx-auto mt-3 h-64 w-full object-contain drop-shadow-2xl"
                    />

                    <p className="mt-3 text-3xl font-black text-white [text-shadow:0_2px_0_rgba(0,0,0,1),0_4px_10px_rgba(0,0,0,0.9)]">
                      {result.name}
                    </p>

                    <p className="mt-2 text-xl font-black text-white [text-shadow:0_2px_0_rgba(0,0,0,1),0_4px_10px_rgba(0,0,0,0.9)]">
                      {result.rarity}
                    </p>

                    <p className="mt-1 text-3xl font-black text-yellow-300 drop-shadow">
                      {"★".repeat(rarityStars[result.rarity])}
                    </p>
                  </div>

                  <p className="relative z-50 mt-4 text-lg font-black text-white drop-shadow md:text-2xl">
                    タップで閉じる
                  </p>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedHistory && (
          <motion.div
            className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedHistory(null)}
          >
            <motion.div
              className={`relative w-full max-w-md rounded-[2rem] border-4 border-black bg-gradient-to-br ${
                rarityBg[selectedHistory.rarity]
              } p-5 text-center shadow-[0_10px_0_rgba(0,0,0,1)]`}
              initial={{ y: 70, scale: 0.75, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 70, scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 16 }}
            >
              {selectedHistory.isNew && (
                <div className="absolute -left-3 -top-5 rounded-full border-4 border-white bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 px-5 py-2 text-xl font-black text-white shadow-xl">
                  NEW
                </div>
              )}

              <p className="text-lg font-black text-white drop-shadow">
                🎨 STYLE DETAIL
              </p>

              <img
                src={selectedHistory.image}
                alt={selectedHistory.name}
                className="mx-auto mt-3 h-72 w-full object-contain drop-shadow-2xl"
              />

              <p className="mt-3 text-3xl font-black text-white [text-shadow:0_2px_0_rgba(0,0,0,1),0_4px_10px_rgba(0,0,0,0.9)]">
                {selectedHistory.name}
              </p>

              <p className="mt-2 text-xl font-black text-white [text-shadow:0_2px_0_rgba(0,0,0,1),0_4px_10px_rgba(0,0,0,0.9)]">
                {selectedHistory.rarity}
              </p>

              <p className="mt-1 text-3xl font-black text-yellow-300 drop-shadow">
                {"★".repeat(rarityStars[selectedHistory.rarity])}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}