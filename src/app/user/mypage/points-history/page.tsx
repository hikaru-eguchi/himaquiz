"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSupabaseUser } from "../../../../hooks/useSupabaseUser";

type PointLog = {
  id: string;
  change: number;
  reason: string;
  created_at: string;
};

export default function PointHistoryPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const router = useRouter();

  const [logs, setLogs] = useState<PointLog[]>([]);
  const [currentPoints, setCurrentPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;

    // 未ログインならログインページへ
    if (!user) {
      router.push("/user/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // ① 現在のポイントを取得（profiles.points）
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("points")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("fetch profile points error:", profileError);
        } else {
          setCurrentPoints(profile?.points ?? 0);
        }

        // ② 自分のポイント履歴を取得
        const { data: rows, error: logsError } = await supabase
          .from("user_point_logs")
          .select("id, change, reason, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (logsError) {
          console.error("fetch point logs error:", logsError);
          setError("ポイント履歴の取得に失敗しました。時間をおいて再度お試しください。");
          setLogs([]);
          return;
        }

        setLogs(rows ?? []);
      } catch (e) {
        console.error("point history page error:", e);
        setError("ポイント履歴の読み込み中にエラーが発生しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, userLoading, router, supabase]);

  // 認証状態の読み込み中
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-lg md:text-2xl">読み込み中...</p>
      </div>
    );
  }

  // 未ログインなら何も表示しない（router.push に任せる）
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
      {/* タイトル */}
      <div className="mb-6 md:mb-8">
        <div className="flex justify-start">
          <button
            onClick={() => router.push("/user/mypage")}
            className="text-sm md:text-base text-blue-600 underline cursor-pointer"
          >
            ← マイページへ戻る
          </button>
        </div>

        <h1 className="text-2xl md:text-4xl font-extrabold text-center mt-4">
          ポイント履歴
        </h1>
      </div>

      {/* 現在のポイント */}
      <div className="mb-6 md:mb-8">
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-sm md:text-base font-medium text-gray-700">
            現在の所持ポイント
          </p>
          <p className="text-xl md:text-2xl font-extrabold text-yellow-600">
            {currentPoints ?? 0} P
          </p>
        </div>
      </div>

      {/* エラー */}
      {error && (
        <p className="text-center text-red-500 mb-4 whitespace-pre-line">
          {error}
        </p>
      )}

      {/* ローディング */}
      {loading && !error && (
        <div className="flex items-center justify-center min-h-[30vh]">
          <p className="text-lg md:text-2xl">履歴を読み込み中...</p>
        </div>
      )}

      {/* 履歴本体 */}
      {!loading && !error && (
        <>
          {logs.length === 0 ? (
            <p className="text-center text-gray-500">
              まだポイントの履歴がありません。
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const isPlus = log.change > 0;
                const sign = isPlus ? "+" : "";
                const date = new Date(log.created_at);

                return (
                  <div
                    key={log.id}
                    className="border border-gray-200 rounded-lg px-3 py-2 md:px-4 md:py-3 flex flex-col md:flex-row md:items-center md:justify-between bg-white shadow-sm"
                  >
                    <div className="flex-1">
                      <p className="text-xs md:text-sm text-gray-500">
                        {date.toLocaleString("ja-JP")}
                      </p>
                      <p className="text-sm md:text-base text-gray-800 mt-1">
                        {log.reason}
                      </p>
                    </div>
                    <div className="mt-1 md:mt-0 md:ml-4 text-right">
                      <p
                        className={`text-lg md:text-xl font-extrabold ${
                          isPlus ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {sign}
                        {log.change} P
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
