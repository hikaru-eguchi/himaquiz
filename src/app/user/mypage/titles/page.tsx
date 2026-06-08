"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

type TitleRow = {
  game: string;
  title: string;
  unlocked_at: string;
};

const GAME_LABEL: Record<
  string,
  {
    label: string;
    emoji: string;
    color: string;
    soft: string;
    border: string;
    text: string;
    description: string;
  }
> = {
  level: {
    label: "レベル称号",
    emoji: "🌟",
    color: "from-yellow-300 via-orange-300 to-amber-400",
    soft: "from-yellow-50 to-orange-50",
    border: "border-yellow-200",
    text: "text-amber-700",
    description: "遊ぶほど育つ、基本の称号コレクション。",
  },
  streak: {
    label: "連続正解チャレンジ",
    emoji: "🔥",
    color: "from-orange-400 via-red-400 to-pink-500",
    soft: "from-orange-50 to-red-50",
    border: "border-orange-200",
    text: "text-orange-700",
    description: "連続正解で手に入る、ひらめきの証。",
  },
  time_attack: {
    label: "タイムアタック",
    emoji: "⚡",
    color: "from-cyan-400 via-sky-400 to-blue-500",
    soft: "from-cyan-50 to-sky-50",
    border: "border-cyan-200",
    text: "text-sky-700",
    description: "最速クリアを目指すスピード系称号。",
  },
  timed: {
    label: "制限時間クイズ",
    emoji: "⏱️",
    color: "from-sky-400 via-cyan-400 to-blue-500",
    soft: "from-sky-50 to-cyan-50",
    border: "border-sky-200",
    text: "text-sky-700",
    description: "スピード勝負で集まる称号。",
  },
  dungeon: {
    label: "クイズダンジョン",
    emoji: "🏰",
    color: "from-violet-400 via-purple-500 to-indigo-500",
    soft: "from-violet-50 to-purple-50",
    border: "border-violet-200",
    text: "text-violet-700",
    description: "階層を進んだ者だけが持つ称号。",
  },
  // battle: {
  //   label: "クイズバトル",
  //   emoji: "⚔️",
  //   color: "from-rose-400 via-pink-500 to-fuchsia-500",
  //   soft: "from-rose-50 to-pink-50",
  //   border: "border-rose-200",
  //   text: "text-rose-700",
  //   description: "勝負の中で手に入る称号。",
  // },
  coop_dungeon: {
    label: "協力ダンジョン",
    emoji: "🤝",
    color: "from-emerald-400 via-teal-400 to-cyan-500",
    soft: "from-emerald-50 to-teal-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    description: "協力プレイで集まる称号。",
  },
  // survival: {
  //   label: "サバイバルクイズ",
  //   emoji: "🏆",
  //   color: "from-lime-400 via-green-400 to-emerald-500",
  //   soft: "from-lime-50 to-green-50",
  //   border: "border-lime-200",
  //   text: "text-green-700",
  //   description: "最後まで生き残った証。",
  // },
  title_gacha: {
    label: "称号ガチャ",
    emoji: "👑",
    color: "from-purple-500 via-pink-400 to-yellow-300",
    soft: "from-purple-50 via-pink-50 to-yellow-50",
    border: "border-purple-200",
    text: "text-purple-700",
    description: "ガチャで出会った称号たち。",
  },
};

const ORDER = [
  "level",
  "streak",
  "time_attack",
  "timed",
  "dungeon",
  // "battle",
  "coop_dungeon",
  // "survival",
  "title_gacha",
];

const CATEGORY_TOTAL: Record<string, number> = {
  level: 30,
  streak: 32,
  time_attack: 16,
  timed: 32,
  dungeon: 22,
  coop_dungeon: 15,
  title_gacha: 50,
};

function formatDateJP(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getCollectionRank(total: number) {
  if (total >= 50) return { label: "伝説級コレクター", emoji: "👑" };
  if (total >= 30) return { label: "上級コレクター", emoji: "💎" };
  if (total >= 15) return { label: "称号ハンター", emoji: "🏅" };
  if (total >= 5) return { label: "集めはじめ", emoji: "✨" };
  return { label: "これからコレクター", emoji: "📘" };
}

export default function TitlesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TitleRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedTitle, setSelectedTitle] = useState<TitleRow | null>(null);
  const [settingTitle, setSettingTitle] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (userLoading) return;

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_titles")
        .select("game,title,unlocked_at")
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setRows((data ?? []) as TitleRow[]);
      setLoading(false);
    };

    run();
  }, [supabase, user, userLoading]);

  const grouped = useMemo(() => {
    const result: Record<string, TitleRow[]> = {};
    for (const r of rows) {
      if (!result[r.game]) result[r.game] = [];
      result[r.game].push(r);
    }
    return result;
  }, [rows]);

  const total = rows.length;
  const collectedGames = ORDER.filter((key) => (grouped[key] ?? []).length > 0)
    .length;
  const rank = getCollectionRank(total);
  const latestTitle = rows[0];
  const handleSetMyTitle = async () => {
    if (!user || !selectedTitle) return;

    setSettingTitle(true);
    setModalError(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        current_title: selectedTitle.title,
      })
      .eq("id", user.id);

    if (error) {
      setModalError("マイ称号の設定に失敗しました。");
      setSettingTitle(false);
      return;
    }

    window.dispatchEvent(new Event("auth:changed"));
    window.dispatchEvent(new Event("points:updated"));
    window.dispatchEvent(new Event("title:updated"));

    setSettingTitle(false);
    setSelectedTitle(null);
  };

  if (userLoading) {
    return (
      <main className="bg-gradient-to-b from-purple-50 via-white to-yellow-50">
        <div className="mx-auto max-w-4xl p-4">
          <div className="animate-pulse h-40 rounded-[2rem] bg-gray-200 mb-4" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="animate-pulse h-32 rounded-3xl bg-gray-200" />
            <div className="animate-pulse h-32 rounded-3xl bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="bg-gradient-to-b from-purple-50 via-white to-yellow-50">
        <div className="mx-auto max-w-3xl p-4">
          <div className="overflow-hidden rounded-[2rem] border-2 border-purple-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-purple-500 via-pink-400 to-yellow-300 p-1" />
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-yellow-100 text-4xl shadow-inner">
                🏷️
              </div>
              <h1 className="text-2xl font-black text-gray-900">
                称号コレクション
              </h1>
              <p className="mt-2 text-sm font-bold text-gray-600">
                ログインすると、獲得した称号がアルバムに保存されます。
              </p>

              <div className="mt-6 grid gap-2">
                <button
                  onClick={() => router.push("/login")}
                  className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 py-3 font-black text-white shadow-md transition hover:scale-[1.01] hover:opacity-95"
                >
                  ログインして称号を見る
                </button>
                <button
                  onClick={() => router.push("/user/mypage")}
                  className="rounded-2xl bg-gray-100 py-3 font-black text-gray-800 transition hover:bg-gray-200"
                >
                  マイページへ戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gradient-to-b from-purple-50 via-white to-yellow-50">
      <div className="mx-auto max-w-4xl p-4 pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border-2 border-white bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-300 p-6 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-yellow-200/30 blur-2xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur">
              <span>{rank.emoji}</span>
              <span>{rank.label}</span>
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight">
                  称号コレクション
                </h1>
                <p className="mt-2 text-sm font-bold text-white/90">
                  集めた称号がここに並びます。遊ぶほどアルバムがにぎやかに。
                </p>
              </div>

              <div className="rounded-3xl bg-white/20 px-5 py-4 text-center backdrop-blur">
                <div className="text-xs font-black text-white/80">獲得数</div>
                <div className="text-4xl font-black leading-none">{total}</div>
                <div className="mt-1 text-xs font-bold text-white/80">
                  TITLES
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 p-4 font-bold text-red-700">
            読み込みエラー：{error}
          </div>
        ) : null}

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border bg-white p-4 shadow-sm hidden sm:grid">
            <div className="text-xs font-black text-gray-500">
              コレクション状況
            </div>
            <div className="mt-1 text-2xl font-black text-gray-900">
              {collectedGames}/{ORDER.length}
            </div>
            <div className="mt-1 text-xs font-bold text-gray-500">
              種類のカテゴリで獲得済み
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-4 shadow-sm hidden sm:grid">
            <div className="text-xs font-black text-gray-500">最新の称号</div>
            <div className="mt-1 truncate text-lg font-black text-gray-900">
              {latestTitle ? latestTitle.title : "まだありません"}
            </div>
            <div className="mt-1 text-xs font-bold text-gray-500">
              {latestTitle ? formatDateJP(latestTitle.unlocked_at) : "遊んで集めよう"}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="text-xs font-black text-gray-500">
              コレクターランク
            </div>
            <div className="mt-1 text-lg font-black text-gray-900">
              {rank.emoji} {rank.label}
            </div>
            <div className="mt-1 text-xs font-bold text-gray-500">
              称号数に応じてランクアップします
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-4 grid gap-4">
            <div className="animate-pulse h-48 rounded-[2rem] bg-gray-200" />
            <div className="animate-pulse h-48 rounded-[2rem] bg-gray-200" />
            <div className="animate-pulse h-48 rounded-[2rem] bg-gray-200" />
          </div>
        ) : (
          <>
            <section className="mt-5 grid gap-4">
              {ORDER.map((gameKey) => {
                const meta = GAME_LABEL[gameKey] ?? {
                  label: gameKey,
                  emoji: "🎮",
                  color: "from-gray-300 to-gray-400",
                  soft: "from-gray-50 to-white",
                  border: "border-gray-200",
                  text: "text-gray-700",
                  description: "このカテゴリの称号です。",
                };

                const list = grouped[gameKey] ?? [];
                const hasTitles = list.length > 0;

                return (
                  <div
                    key={gameKey}
                    className={`overflow-hidden rounded-[2rem] border-2 ${meta.border} bg-white shadow-sm`}
                  >
                    <div className={`h-2 bg-gradient-to-r ${meta.color}`} />

                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.soft} text-3xl shadow-inner`}
                          >
                            {meta.emoji}
                          </div>

                          <div>
                            <h2 className="text-lg font-black text-gray-900">
                              {meta.label}
                            </h2>
                            <p className="mt-1 text-xs font-bold text-gray-500">
                              {meta.description}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`rounded-full bg-gradient-to-r ${meta.soft} px-3 py-1 text-sm font-black ${meta.text}`}
                        >
                          {list.length}/{CATEGORY_TOTAL[gameKey] ?? "?"}個
                        </div>
                      </div>

                      {hasTitles ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {list.map((t) => (
                            <button
                              type="button"
                              key={`${t.game}:${t.title}:${t.unlocked_at}`}
                              title={`獲得日時：${formatDateJP(t.unlocked_at)}`}
                              onClick={() => {
                                setSelectedTitle(t);
                                setModalError(null);
                              }}
                              className={`group relative w-full overflow-hidden rounded-3xl border-2 ${meta.border} bg-gradient-to-br ${meta.soft} p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]`}
                            >
                              <div className="absolute right-3 top-3 text-2xl opacity-20 transition group-hover:scale-110 group-hover:opacity-30">
                                {meta.emoji}
                              </div>

                              <div className="relative">
                                {/* <div className="mb-2 inline-flex rounded-full bg-white/80 px-2 py-1 text-[10px] font-black text-gray-500">
                                  UNLOCKED
                                </div> */}
                                <div className="text-base font-black text-gray-900">
                                  {t.title}
                                </div>
                                {/* <div className="mt-2 text-[11px] font-bold text-gray-500">
                                  {formatDateJP(t.unlocked_at)}
                                </div> */}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl opacity-70">
                            🔒
                          </div>
                          <div className="font-black text-gray-600">
                            まだ未開放
                          </div>
                          <p className="mt-1 text-xs font-bold text-gray-500">
                            プレイしてこのカテゴリの称号を集めよう
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => router.push("/user/mypage/records")}
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 py-3 font-black text-white shadow-md transition hover:scale-[1.01] hover:opacity-95"
              >
                最高記録を見る
              </button>
              <button
                onClick={() => router.push("/user/mypage")}
                className="rounded-2xl bg-white py-3 font-black text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50"
              >
                マイページへ
              </button>
            </div>
          </>
        )}
      </div>
      {selectedTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-purple-500 via-pink-400 to-yellow-300 p-1" />

            <div className="p-5 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-yellow-100 text-3xl shadow-inner">
                👑
              </div>

              <p className="text-xs font-black text-purple-500">MY TITLE</p>

              <h2 className="mt-1 text-xl font-black text-gray-900">
                この称号をマイ称号に設定する？
              </h2>

              <div className="mt-4 rounded-3xl border-2 border-purple-100 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 p-4">
                <div className="text-lg font-black text-gray-900">
                  {selectedTitle.title}
                </div>
                <div className="mt-2 text-xs font-bold text-gray-500">
                  獲得日時：{formatDateJP(selectedTitle.unlocked_at)}
                </div>
              </div>

              {modalError && (
                <div className="mt-3 rounded-2xl border-2 border-red-200 bg-red-50 p-3 text-sm font-black text-red-600">
                  {modalError}
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={settingTitle}
                  onClick={() => {
                    setSelectedTitle(null);
                    setModalError(null);
                  }}
                  className="rounded-2xl bg-gray-100 py-3 font-black text-gray-700 transition hover:bg-gray-200 active:scale-95 disabled:opacity-60"
                >
                  いいえ
                </button>

                <button
                  type="button"
                  disabled={settingTitle}
                  onClick={handleSetMyTitle}
                  className="rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-400 py-3 font-black text-white shadow-md transition hover:scale-[1.01] hover:brightness-105 active:scale-95 disabled:opacity-60"
                >
                  {settingTitle ? "設定中..." : "はい"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}