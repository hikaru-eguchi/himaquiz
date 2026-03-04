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

const GAME_LABEL: Record<string, { label: string; emoji: string }> = {
  level: { label: "レベル称号", emoji: "🌟" },
  streak: { label: "連続正解チャレンジ", emoji: "🔥" },
  timed: { label: "制限時間クイズ", emoji: "⏱️" },
  dungeon: { label: "クイズダンジョン", emoji: "🏰" },
  battle: { label: "クイズバトル", emoji: "⚔️" },
  coop_dungeon: { label: "協力ダンジョン", emoji: "🤝" },
  survival: { label: "サバイバルクイズ", emoji: "🏆" },
};

const ORDER = ["level", "streak", "timed", "dungeon", "battle", "coop_dungeon", "survival"];

function formatDateJP(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" });
}

export default function TitlesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TitleRow[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  if (userLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="animate-pulse h-10 w-52 bg-gray-200 rounded mb-4" />
        <div className="animate-pulse h-28 bg-gray-200 rounded mb-3" />
        <div className="animate-pulse h-28 bg-gray-200 rounded mb-3" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h1 className="text-xl font-extrabold mb-2">🏷️ 称号を見るにはログイン（無料）が必要です</h1>
          <p className="text-gray-600 mb-4">
            ログインすると、獲得した称号がコレクションとして保存されます。
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl"
          >
            ログインへ
          </button>
          <button
            onClick={() => router.push("/user/mypage")}
            className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl"
          >
            マイページへ戻る
          </button>
        </div>
      </div>
    );
  }

  // gameごとにグルーピング
  const grouped: Record<string, TitleRow[]> = {};
  for (const r of rows) {
    if (!grouped[r.game]) grouped[r.game] = [];
    grouped[r.game].push(r);
  }

  const total = rows.length;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">🏅 取得した称号</h1>
            <p className="mt-1 text-white/90 text-sm">
              集めるほど強者感アップ！どんどん増やそう。
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/80">獲得数</div>
            <div className="text-2xl font-extrabold">{total}</div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border bg-red-50 p-4 text-red-700 font-bold">
          読み込みエラー：{error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 space-y-3">
          <div className="animate-pulse h-28 bg-gray-200 rounded-2xl" />
          <div className="animate-pulse h-28 bg-gray-200 rounded-2xl" />
          <div className="animate-pulse h-28 bg-gray-200 rounded-2xl" />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {ORDER.map((gameKey) => {
            const meta = GAME_LABEL[gameKey] ?? { label: gameKey, emoji: "🎮" };
            const list = grouped[gameKey] ?? [];

            return (
              <div key={gameKey} className="rounded-2xl border bg-white shadow-sm p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{meta.emoji}</span>
                    <h2 className="text-lg font-extrabold">{meta.label}</h2>
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    {list.length} 個
                  </div>
                </div>

                {list.length === 0 ? (
                  <div className="mt-3 rounded-xl bg-gray-50 border p-4 text-gray-600">
                    まだ称号がありません。プレイして獲得しよう！✨
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {list.map((t) => (
                      <div
                        key={`${t.game}:${t.title}`}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border"
                        title={`獲得日時：${formatDateJP(t.unlocked_at)}`}
                      >
                        <div className="text-sm font-extrabold">{t.title}</div>
                        <div className="text-[11px] text-gray-600">
                          {formatDateJP(t.unlocked_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => router.push("/user/mypage/records")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl"
            >
              最高記録を見る
            </button>
            <button
              onClick={() => router.push("/user/mypage")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl"
            >
              マイページへ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
