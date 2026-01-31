"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

type GameStatsRow = {
  game: string;
  best_streak: number;
  best_score: number;
  best_stage: number;
  wins: number;
  first_places: number;
  updated_at: string;
};

const GAME_META: Record<
  string,
  {
    label: string;
    emoji: string;
    description: string;
    primaryKind:
      | "best_streak"
      | "best_score"
      | "best_stage"
      | "wins"
      | "first_places";
    primaryLabel: string;
    suffix?: string;
    showExtras?: Array<{
      key: keyof GameStatsRow;
      label: string;
      suffix?: string;
    }>;
  }
> = {
  streak: {
    label: "連続正解チャレンジ",
    emoji: "🔥",
    description: "連続でどこまで正解できる？限界に挑戦！",
    primaryKind: "best_streak",
    primaryLabel: "最高連続正解",
    suffix: "問",
  },
  timed: {
    label: "制限時間クイズ",
    emoji: "⏱️",
    description: "時間内にどれだけ稼げるか！ハイスコアを狙え！",
    primaryKind: "best_score",
    primaryLabel: "歴代最高得点",
    suffix: "点",
  },
  dungeon: {
    label: "クイズダンジョン",
    emoji: "🏰",
    description: "ステージを駆け上がれ！深層へ…！",
    primaryKind: "best_stage",
    primaryLabel: "歴代最高到達ステージ",
    suffix: "F",
  },
  battle: {
    label: "クイズバトル",
    emoji: "⚔️",
    description: "知識で勝負！勝利数も積み上げよう！",
    primaryKind: "best_score",
    primaryLabel: "歴代最高得点",
    suffix: "点",
    showExtras: [{ key: "wins", label: "勝利回数", suffix: "回" }],
  },
  coop_dungeon: {
    label: "協力ダンジョン",
    emoji: "🤝",
    description: "力を合わせて攻略！連携が勝利の鍵！",
    primaryKind: "best_stage",
    primaryLabel: "歴代最高クリアステージ",
    suffix: "F",
  },
  survival: {
    label: "サバイバルクイズ",
    emoji: "🏆",
    description: "最後まで生き残れ！1位の回数を増やそう！",
    primaryKind: "first_places",
    primaryLabel: "1位を取った回数",
    suffix: "回",
  },
};

const ORDER = ["streak", "timed", "dungeon", "battle", "coop_dungeon", "survival"];

function formatDateJP(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" });
}

export default function RecordsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Record<string, GameStatsRow>>({});
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
        .from("user_game_stats")
        .select("game,best_streak,best_score,best_stage,wins,first_places,updated_at");

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const map: Record<string, GameStatsRow> = {};
      (data ?? []).forEach((r: any) => {
        map[r.game] = r;
      });

      setRows(map);
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
        <div className="animate-pulse h-28 bg-gray-200 rounded mb-3" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h1 className="text-xl font-extrabold mb-2">📌 最高記録を見るにはログイン（無料）が必要です</h1>
          <p className="text-gray-600 mb-4">
            ログインすると、ゲームごとの最高記録が保存されていつでも確認できます。
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl"
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

  const cards = ORDER.map((gameKey) => {
    const meta = GAME_META[gameKey];
    const r = rows[gameKey];

    const best: GameStatsRow = r ?? {
      game: gameKey,
      best_streak: 0,
      best_score: 0,
      best_stage: 0,
      wins: 0,
      first_places: 0,
      updated_at: "",
    };

    const primaryValue = best[meta.primaryKind] ?? 0;

    return (
      <div
        key={gameKey}
        className="rounded-2xl border bg-white shadow-sm p-5 hover:shadow-md transition"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{meta.emoji}</span>
              <h2 className="text-lg font-extrabold">{meta.label}</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">{meta.description}</p>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500">最終更新</div>
            <div className="text-xs font-medium">{formatDateJP(best.updated_at)}</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border">
          <div className="text-sm text-gray-700 font-bold">{meta.primaryLabel}</div>
          <div className="mt-1 flex items-end gap-2">
            <div className="text-3xl font-extrabold">{primaryValue}</div>
            <div className="text-gray-600 font-bold">{meta.suffix ?? ""}</div>
          </div>

          {meta.showExtras?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {meta.showExtras.map((ex) => (
                <div
                  key={String(ex.key)}
                  className="px-3 py-2 rounded-xl bg-white border text-sm font-bold"
                >
                  <span className="text-gray-700">{ex.label}：</span>
                  <span className="ml-1">{best[ex.key] ?? 0}</span>
                  <span className="text-gray-600">{ex.suffix ?? ""}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  });

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">🎉 これまでの最高記録</h1>
        <p className="mt-1 text-white/90 text-sm">
          目指せ更新！ゲームごとのベストをいつでもチェック。
        </p>
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
        <>
          <div className="mt-4 space-y-3">{cards}</div>

          {/* ▼ ページ最下部にだけボタンを配置 */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              onClick={() => router.push("/user/mypage/titles")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl"
            >
              称号を見る
            </button>
            <button
              onClick={() => router.push("/user/mypage")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl"
            >
              マイページへ
            </button>
          </div>
        </>
      )}
    </div>
  );
}
