"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ActivityLog = {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  type: string;
  message: string;
  icon: string;
  target_name: string | null;
  target_rarity: string | null;
  value_number: number | null;
  created_at: string;
};

export default function ActivityFeedCard() {
  const supabase = createSupabaseBrowserClient();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("activity_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    setLogs((data ?? []) as ActivityLog[]);
    setLoading(false);
  };

  const renderActivityText = (log: ActivityLog) => {
    const username = (
        <span className="font-black text-sky-600">
            {log.username ?? "名無し"}
        </span>
    );
    const value = log.value_number ?? 0;

    if (log.type === "character_get") {
        return (
        <>
            {username} が{" "}
            <span className="font-black text-orange-600">
            {log.target_rarity ?? "レア"}「{log.target_name ?? "キャラ"}」
            </span>
            をGET！
        </>
        );
    }

    if (log.type === "best_streak") {
        return (
        <>
            {username} が{" "}
            <span className="font-black text-red-500">
            連続正解{value}問
            </span>
            を達成！
        </>
        );
    }

    if (log.type === "best_stage") {
        return (
        <>
            {username} が{" "}
            <span className="font-black text-purple-600">
            ダンジョン{value}階
            </span>
            に到達！
        </>
        );
    }

    if (log.type === "arena_win_streak") {
        return (
        <>
            {username} が{" "}
            <span className="font-black text-blue-600">
            アリーナ{value}連勝
            </span>
            を達成！
        </>
        );
    }

    if (log.type === "style_get") {
        return (
        <>
            {username} が{" "}
            <span className="font-black text-pink-600">
            {log.target_rarity ?? "レア"}スタイル「{log.target_name ?? "スタイル"}」
            </span>
            をGET！
        </>
        );
    }

    if (log.type === "level_milestone") {
        return (
        <>
            {username} が{" "}
            <span className="font-black text-amber-600">
            Lv.{value}
            </span>
            に到達！
        </>
        );
    }

    return (
        <>
        {username} が {log.message}
        </>
    );
    };

    const getTimeAgo = (createdAt: string) => {
        const created = new Date(createdAt).getTime();
        const now = Date.now();
        const diffMs = now - created;

        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return "たった今";
        if (diffMinutes < 60) return `${diffMinutes}分前`;
        if (diffHours < 24) return `${diffHours}時間前`;
        if (diffDays < 7) return `${diffDays}日前`;

        const year = new Date(createdAt).getFullYear();
        const month = String(new Date(createdAt).getMonth() + 1).padStart(2, "0");
        const day = String(new Date(createdAt).getDate()).padStart(2, "0");

        return `${year}/${month}/${day}`;
    };

    const getActivityColor = (type: string) => {
        if (type === "character_get") {
            return {
            border: "border-orange-200",
            bg: "bg-orange-50",
            iconBg: "bg-orange-100",
            iconText: "text-orange-600",
            nameText: "text-sky-600",
            };
        }

        if (type === "best_streak") {
            return {
            border: "border-red-200",
            bg: "bg-red-50",
            iconBg: "bg-red-100",
            iconText: "text-red-600",
            nameText: "text-sky-600",
            };
        }

        if (type === "best_stage") {
            return {
            border: "border-purple-200",
            bg: "bg-purple-50",
            iconBg: "bg-purple-100",
            iconText: "text-purple-600",
            nameText: "text-sky-600",
            };
        }

        if (type === "arena_win_streak") {
            return {
            border: "border-blue-200",
            bg: "bg-blue-50",
            iconBg: "bg-blue-100",
            iconText: "text-blue-600",
            nameText: "text-sky-600",
            };
        }

        return {
            border: "border-orange-100",
            bg: "bg-white",
            iconBg: "bg-orange-100",
            iconText: "text-orange-600",
            nameText: "text-sky-600",
        };
    };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="mx-auto w-full max-w-[700px] rounded-3xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 via-white to-yellow-100 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-black text-orange-600">
            みんなのプレイ速報
          </p>
          <p className="text-xs font-bold text-gray-500">
            すごい記録やレアな出来事をチェック！
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="rounded-full border-2 border-orange-300 bg-white px-3 py-1 text-sm font-black text-orange-600 shadow hover:scale-105 transition"
        >
          🔄
        </button>
      </div>

      <div className="mt-4 space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {loading && (
          <p className="text-sm font-bold text-gray-500 text-center">
            読み込み中…
          </p>
        )}

        {!loading && logs.length === 0 && (
          <p className="text-sm font-bold text-gray-500 text-center">
            まだ速報はありません
          </p>
        )}

        {!loading &&
            logs.map((log) => {
                const color = getActivityColor(log.type);

                return (
                <div
                    key={log.id}
                    className={`rounded-2xl border ${color.border} ${color.bg} px-3 py-2 shadow-sm`}
                >
                    <div className="flex items-start gap-3">
                    <img
                        src={log.avatar_url ?? "/images/初期アイコン.png"}
                        alt={log.username ?? "名無し"}
                        className="h-10 w-10 shrink-0 rounded-full border-2 border-black bg-white object-cover"
                    />

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-800 leading-snug">
                        <span
                            className={`mr-1 inline-flex h-6 w-6 items-center justify-center rounded-full ${color.iconBg} ${color.iconText}`}
                        >
                            {log.icon}
                        </span>
                        {renderActivityText(log)}
                        </p>

                        <p className="mt-1 text-right text-[11px] font-bold text-gray-400">
                        {getTimeAgo(log.created_at)}
                        </p>
                    </div>
                    </div>
                </div>
                );
        })}
      </div>
    </div>
  );
}