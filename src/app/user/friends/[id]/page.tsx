"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import type { PublicFriendProfile } from "@/types/friend";

export default function FriendDetailPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const friendId = params.id;

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<PublicFriendProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("user_public_profiles")
          .select("*")
          .eq("user_id", friendId)
          .single();

        if (error) throw error;
        setP(data as any);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [supabase, friendId]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-0px)] bg-gradient-to-b from-sky-50 via-white to-amber-50">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
            <p className="font-extrabold text-gray-900">読み込み中...</p>
            <p className="text-sm text-gray-600">フレンド情報を取得しています</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-0px)] bg-gradient-to-b from-sky-50 via-white to-amber-50">
      <div className="max-w-md mx-auto px-4 py-8 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-black/5">
            <span className="text-lg">👤</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              フレンド詳細
            </h1>
          </div>
          <p className="text-md md:text-xl text-gray-600">
            フレンドのプロフィールを確認できます
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            <p className="font-bold">エラー</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Profile */}
        {p && (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4 space-y-4">
            {/* 上段：アイコン + 名前 */}
            <div className="flex items-center gap-3">
              <img
                src={p.avatar_url ?? "/images/初期アイコン.png"}
                className="w-16 h-16 rounded-full border bg-white object-contain"
                alt="avatar"
              />

              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-lg truncate">
                  {p.username ?? "ユーザー"}
                </p>
                <div className="mt-1 inline-flex items-center gap-2">
                  <span className="text-xs rounded-full bg-sky-50 text-sky-700 px-3 py-1">
                    Lv.{p.level ?? 1}
                  </span>
                </div>
              </div>
            </div>

            {/* ステータス */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">キャラ所持数</p>
                <p className="text-xl font-extrabold">{p.character_count ?? 0}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">ひとこと</p>
                <p className="text-sm font-bold text-gray-700">
                  よろしくね！
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => router.push(`/user/friends/${friendId}/gift`)}
              className="w-full rounded-xl py-3 font-extrabold text-white
                         bg-gradient-to-r from-amber-400 to-orange-500
                         hover:opacity-95 active:opacity-90
                         shadow-sm"
            >
              キャラをプレゼント 🎁
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/user/friends")}
            className="rounded-xl bg-gray-100 py-3 font-bold hover:bg-gray-200"
          >
            戻る
          </button>

          <button
            onClick={() => router.push("/user/friends/requests")}
            className="rounded-xl bg-white py-3 font-bold ring-1 ring-black/10 hover:bg-gray-50"
          >
            申請一覧へ
          </button>
        </div>
      </div>
    </div>
  );
}