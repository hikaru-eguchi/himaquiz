"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { motion, AnimatePresence } from "framer-motion";

type StyleRarity =
  | "ノーマル"
  | "レア"
  | "超レア"
  | "激レア"
  | "神レア"
  | "シークレット";

type StyleSkin = {
  id: string;
  no: string | null;
  name: string;
  image_url: string | null;
  rarity: StyleRarity | null;
  description: string | null;
};

type StyleSkinWithOwned = StyleSkin & {
  owned: boolean;
};

const HATENA_IMAGE = "/images/hatena_card.png";

const rarityToStarCount: Record<StyleRarity, number> = {
  ノーマル: 1,
  レア: 2,
  超レア: 3,
  激レア: 4,
  神レア: 5,
  シークレット: 6,
};

const rarityGradient: Record<StyleRarity, string> = {
  ノーマル: "from-slate-300 via-white to-cyan-100",
  レア: "from-sky-400 via-cyan-300 to-white",
  超レア: "from-violet-500 via-fuchsia-400 to-cyan-300",
  激レア: "from-pink-500 via-fuchsia-400 to-violet-500",
  神レア: "from-emerald-400 via-cyan-300 to-violet-400",
  シークレット: "from-zinc-950 via-violet-950 to-pink-700",
};

const rarityText: Record<StyleRarity, string> = {
  ノーマル: "text-slate-500",
  レア: "text-sky-500",
  超レア: "text-violet-500",
  激レア: "text-pink-500",
  神レア: "text-emerald-500",
  シークレット: "text-zinc-900",
};

export default function MyStylePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [styles, setStyles] = useState<StyleSkinWithOwned[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] =
    useState<StyleSkinWithOwned | null>(null);

  const [settingSkin, setSettingSkin] = useState(false);
  const [currentSkinId, setCurrentSkinId] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      router.push("/user/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: allStyles, error: styleError } = await supabase
          .from("skins")
          .select("id, no, name, image_url, rarity, description");

        if (styleError) {
          console.error("skins fetch error:", styleError);
          setError("スタイル一覧の取得に失敗しました。");
          return;
        }

        const { data: ownedRows, error: ownedError } = await supabase
          .from("user_skins")
          .select("skin_id")
          .eq("user_id", user.id);

        if (ownedError) {
          console.error("user_skins fetch error:", ownedError);
          setError("所持スタイルの取得に失敗しました。");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("current_skin_id")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.warn("current_skin_id fetch error:", profileError);
        } else {
          setCurrentSkinId(profile?.current_skin_id ?? null);
        }

        const ownedSet = new Set(
          (ownedRows ?? []).map((row: { skin_id: string }) => row.skin_id)
        );

        const merged: StyleSkinWithOwned[] = (allStyles ?? []).map((style) => ({
          ...style,
          rarity: style.rarity as StyleRarity | null,
          owned: ownedSet.has(style.id),
        }));

        merged.sort((a, b) => {
          const na = a.no ? parseInt(a.no, 10) : 9999;
          const nb = b.no ? parseInt(b.no, 10) : 9999;
          return na - nb;
        });

        setStyles(merged);
      } catch (err) {
        console.error("mystyle page error:", err);
        setError("データ取得中にエラーが発生しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, userLoading, supabase, router]);

  const handleUseStyle = async (style: StyleSkinWithOwned) => {
    if (!user) return;

    if (!style.owned) {
      router.push("/style-gacha");
      return;
    }

    setSettingSkin(true);
    setError(null);

    try {
      const { error } = await supabase.rpc("set_current_skin", {
        p_skin_id: style.id,
      });

      if (error) {
        console.error("set_current_skin error:", error);
        setError("スタイルの設定に失敗しました。");
        return;
      }

      setCurrentSkinId(style.id);
      setSelectedStyle(null);

      window.dispatchEvent(new Event("auth:changed"));
    } finally {
      setSettingSkin(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-cyan-300 via-violet-500 to-pink-400">
        <p className="text-2xl font-black text-white drop-shadow">
          読み込み中...
        </p>
      </div>
    );
  }

  if (!user) return null;

  const totalCount = styles.length;
  const ownedCount = styles.filter((style) => style.owned).length;
  const completionRate =
    totalCount > 0 ? Math.round((ownedCount / totalCount) * 1000) / 10 : 0;

  const isOwnedSelected = !!selectedStyle?.owned;
  const selectedRarity = selectedStyle?.rarity ?? "ノーマル";

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-violet-500 to-pink-400 px-4 py-6 md:py-10">
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-10 right-[-80px] h-80 w-80 rounded-full bg-cyan-200 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 rounded-full bg-pink-300 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-6xl">
        <section className="rounded-[2rem] border-4 border-black bg-white/85 p-5 text-center shadow-[0_10px_0_rgba(0,0,0,1)] backdrop-blur md:p-8">
          <p className="inline-flex rounded-full border-3 border-black bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-[0_4px_0_rgba(0,0,0,1)]">
            🎨 MY STYLE COLLECTION
          </p>

          <h1 className="mt-4 text-4xl font-black text-zinc-950 md:text-6xl">
            ひまスタイル
            <span className="bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
              図鑑
            </span>
          </h1>

          <p className="mt-3 text-sm font-bold text-zinc-600 md:text-lg">
            手に入れたスタイルを確認できるよ！
            <br />
            プロフィールから、ゲームで使う見た目を変更できます。
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border-3 border-black bg-white p-4 shadow-[0_6px_0_rgba(0,0,0,1)]">
              <p className="text-sm font-black text-zinc-500">コレクション数</p>
              <p className="text-3xl font-black text-zinc-950">
                {ownedCount} / {totalCount}
              </p>
            </div>

            <div className="rounded-2xl border-3 border-black bg-white p-4 shadow-[0_6px_0_rgba(0,0,0,1)]">
              <p className="text-sm font-black text-zinc-500">コンプリート率</p>
              <p className="text-3xl font-black text-zinc-950">
                {completionRate}%
              </p>
            </div>
          </div>
        </section>

        {error && (
          <p className="mt-5 rounded-2xl bg-white p-4 text-center font-bold text-red-500">
            {error}
          </p>
        )}

        {loading && (
          <div className="mt-8 grid place-items-center rounded-[2rem] bg-white/80 p-10">
            <p className="text-xl font-black text-zinc-700">
              図鑑を読み込み中...
            </p>
          </div>
        )}

        {!loading && !error && (
          <section className="mt-6 rounded-[2rem] border-4 border-black bg-white/90 p-4 shadow-[0_10px_0_rgba(0,0,0,1)] md:p-6">
            {styles.length === 0 ? (
              <p className="py-10 text-center font-bold text-zinc-500">
                まだスタイルが登録されていません。
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 md:gap-5">
                {styles.map((style) => {
                  const isOwned = style.owned;
                  const imageSrc =
                    isOwned && style.image_url
                      ? style.image_url.startsWith("/")
                        ? style.image_url
                        : `/${style.image_url}`
                      : HATENA_IMAGE;

                  const rarity = style.rarity ?? "ノーマル";
                  const starCount = rarityToStarCount[rarity] ?? 1;

                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style)}
                      className={`
                        relative flex flex-col items-center justify-between
                        rounded-2xl border-3 border-black bg-white p-2
                        shadow-[0_5px_0_rgba(0,0,0,1)]
                        transition hover:scale-105 md:p-3
                        ${!isOwned ? "opacity-70" : ""}
                      `}
                    >
                      {currentSkinId === style.id && (
                        <div className="absolute -top-2 -right-2 rounded-full border-2 border-white bg-cyan-500 px-2 py-1 text-[10px] font-black text-white shadow">
                          使用中
                        </div>
                      )}
                      <p className="text-[10px] font-black text-zinc-500 md:text-xs">
                        No.{style.no ?? "??"}
                      </p>

                      <div className="mt-1 flex aspect-square w-full items-center justify-center">
                        <img
                          src={imageSrc}
                          alt={isOwned ? style.name : "？？？"}
                          className={`
                            h-full w-full object-contain
                            ${!isOwned ? "grayscale" : ""}
                          `}
                        />
                      </div>

                      <div className="mt-2 text-center">
                        <p className="max-w-[80px] truncate text-[10px] font-black text-zinc-900 md:max-w-[120px] md:text-sm">
                          {isOwned ? style.name : "？？？？？？"}
                        </p>

                        {isOwned && (
                          <>
                            <p
                              className={`mt-0.5 text-[10px] font-black md:text-xs ${rarityText[rarity]}`}
                            >
                              {rarity}
                            </p>
                            <p className="text-[10px] font-black text-yellow-400 md:text-xs">
                              {"★".repeat(starCount)}
                            </p>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      <AnimatePresence>
        {selectedStyle && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedStyle(null)}
          >
            {isOwnedSelected ? (
              <div
                className="fixed inset-0 -z-10"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #22d3ee, #8b5cf6, #ec4899, #ffffff)",
                  filter: "blur(40px)",
                  opacity: 0.75,
                }}
              />
            ) : (
              <div className="fixed inset-0 -z-10 bg-black/60" />
            )}

            <motion.div
              onClick={(e) => e.stopPropagation()}
              className={`
                relative w-full max-w-md rounded-[2rem] border-4 border-black p-5 text-center
                shadow-[0_10px_0_rgba(0,0,0,1)]
                ${
                  isOwnedSelected
                    ? `bg-gradient-to-br ${rarityGradient[selectedRarity]}`
                    : "bg-white"
                }
              `}
              initial={{ y: 70, scale: 0.7, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 70, scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 16 }}
            >
              <p
                className={`text-lg font-black ${
                  isOwnedSelected ? "text-white drop-shadow" : "text-zinc-500"
                }`}
              >
                No.{selectedStyle.no ?? "??"}
              </p>

              <img
                src={
                  isOwnedSelected && selectedStyle.image_url
                    ? selectedStyle.image_url.startsWith("/")
                      ? selectedStyle.image_url
                      : `/${selectedStyle.image_url}`
                    : HATENA_IMAGE
                }
                alt={isOwnedSelected ? selectedStyle.name : "？？？"}
                className={`
                  mx-auto mt-3 h-64 w-full object-contain drop-shadow-2xl
                  ${!isOwnedSelected ? "grayscale" : ""}
                `}
              />

              <p
                className={`mt-3 text-3xl font-black md:text-4xl ${
                  isOwnedSelected ? "text-white [text-shadow:0_2px_0_rgba(0,0,0,1),0_4px_10px_rgba(0,0,0,0.9)]" : "text-zinc-900"
                }`}
              >
                {isOwnedSelected ? selectedStyle.name : "？？？？？？"}
              </p>

              {isOwnedSelected ? (
                <>
                  <p className="mt-2 text-xl font-black text-white [text-shadow:0_2px_0_rgba(0,0,0,1),0_4px_10px_rgba(0,0,0,0.9)]">
                    {selectedStyle.rarity}
                  </p>

                  <p className="mt-1 text-3xl font-black text-yellow-300 drop-shadow">
                    {"★".repeat(rarityToStarCount[selectedRarity] ?? 1)}
                  </p>

                  <p className="mt-4 rounded-2xl bg-white/80 p-3 text-sm font-bold text-zinc-700">
                    {selectedStyle.description ??
                      "このスタイルの説明文はまだありません。"}
                  </p>
                </>
              ) : (
                <p className="mt-4 rounded-2xl bg-zinc-100 p-4 text-sm font-bold text-zinc-700">
                  まだ手に入れていないスタイルです。
                  <br />
                  ひまスタイルガチャでゲットしよう！
                </p>
              )}

              <div className="mt-5 grid gap-3">
                {isOwnedSelected ? (
                  <button
                    type="button"
                    onClick={() => handleUseStyle(selectedStyle)}
                    disabled={settingSkin || currentSkinId === selectedStyle.id}
                    className={`rounded-full border-3 border-black px-6 py-3 font-black shadow-[0_5px_0_rgba(0,0,0,1)] transition active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,1)] ${
                      currentSkinId === selectedStyle.id
                        ? "cursor-default bg-emerald-100 text-emerald-700"
                        : "bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 text-white hover:scale-[1.02]"
                    }`}
                  >
                    {currentSkinId === selectedStyle.id
                      ? "このスタイルを使用中"
                      : settingSkin
                        ? "設定中..."
                        : "✨ このスタイルを使用する"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push("/style-gacha")}
                    className="rounded-full border-3 border-black bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 px-6 py-3 font-black text-white shadow-[0_5px_0_rgba(0,0,0,1)] transition hover:scale-[1.02]"
                  >
                    🎨 ガチャでゲットする
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedStyle(null)}
                  className="rounded-full border-3 border-black bg-white px-6 py-3 font-black text-zinc-900 shadow-[0_5px_0_rgba(0,0,0,1)]"
                >
                  閉じる
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}