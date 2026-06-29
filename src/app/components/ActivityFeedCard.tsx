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
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-orange-100 bg-white px-3 py-2 shadow-sm"
            >
              {/* <p className="text-sm font-bold text-gray-800">
                <span className="mr-1">{log.icon}</span>
                {log.username ?? "名無し"} が {log.message}
              </p> */}
              <p className="text-sm font-bold text-gray-800">
                <span className="mr-1">{log.icon}</span>
                {log.username ?? "名無し"} が{" "}
                {log.type === "character_get" && log.target_name ? (
                    <>
                    <span className="font-black text-orange-600">
                        {log.target_rarity ?? "レア"}「{log.target_name}」
                    </span>
                    をGET！
                    </>
                ) : (
                    log.message
                )}
            </p>

              {log.value_number !== null && (
                <p className="mt-1 text-xs font-bold text-orange-600">
                  記録：{log.value_number}
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}