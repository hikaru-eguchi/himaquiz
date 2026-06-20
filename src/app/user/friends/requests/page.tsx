"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useRouter } from "next/navigation";
import type { PublicFriendProfile } from "@/types/friend";

type FriendRequestRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at: string;
};

export default function FriendRequestsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const { user, loading: userLoading } = useSupabaseUser();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<FriendRequestRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PublicFriendProfile>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);

  // ✅ 二重クリック防止（承認/拒否の連打対策）
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/user/login");
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: reqs, error: reqErr } = await supabase
          .from("friend_requests")
          .select("id, from_user_id, to_user_id, status, created_at")
          .eq("to_user_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (reqErr) throw reqErr;

        const list = (reqs ?? []) as FriendRequestRow[];
        setRequests(list);

        const fromIds = Array.from(new Set(list.map((r) => r.from_user_id)));
        if (fromIds.length === 0) {
          setProfiles({});
          return;
        }

        const { data: ups, error: upErr } = await supabase
          .from("user_public_profiles")
          .select("*")
          .in("user_id", fromIds);

        if (upErr) throw upErr;

        const map: Record<string, PublicFriendProfile> = {};
        (ups ?? []).forEach((p: any) => {
          map[p.user_id] = p as PublicFriendProfile;
        });
        setProfiles(map);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user, userLoading, supabase, router]);

  const accept = async (id: string) => {
    setActingId(id);
    try {
      const { error } = await supabase.rpc("accept_friend_request", {
        p_request_id: id,
      });
      if (error) throw error;
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(e?.message ?? "承認に失敗しました");
    } finally {
      setActingId((prev) => (prev === id ? null : prev));
    }
  };

  const reject = async (id: string) => {
    setActingId(id);
    try {
      const { error } = await supabase.rpc("reject_friend_request", {
        p_request_id: id,
      });
      if (error) throw error;
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(e?.message ?? "拒否に失敗しました");
    } finally {
      setActingId((prev) => (prev === id ? null : prev));
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-0px)] bg-gradient-to-b from-sky-50 via-white to-amber-50">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
            <p className="font-extrabold text-gray-900">読み込み中...</p>
            <p className="text-sm text-gray-600">
              申請リストを確認しています
            </p>
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
            <span className="text-lg">📩</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {/* フレンド申請 */}
              とどいたフレンド申請
            </h1>
          </div>
          <p className="text-md md:text-xl text-gray-600">
            とどいている申請を確認して、承認できます
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            <p className="font-bold">エラー</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Body */}
        {requests.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <span className="text-2xl">🫧</span>
            </div>
            <p className="font-extrabold text-gray-900">申請はありません</p>
            <p className="text-sm text-gray-600">
              フレンド追加からID検索して申請を送れます
            </p>
            <button
              onClick={() => router.push("/user/friends/add")}
              className="mt-2 w-full rounded-xl py-3 font-bold text-white
                         bg-gradient-to-r from-sky-500 to-blue-600
                         hover:opacity-95 active:opacity-90 shadow-sm"
            >
              フレンドを追加する
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const p = profiles[r.from_user_id];
              const busy = actingId === r.id;

              return (
                <div
                  key={r.id}
                  className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4 space-y-3"
                >
                  {/* プロフィール表示 */}
                  <div className="flex items-center gap-3">
                    <img
                      src={p?.avatar_url ?? "/images/初期アイコン.png"}
                      className="w-14 h-14 rounded-full border bg-white object-contain"
                      alt="avatar"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold truncate">
                        {p?.username ?? "ユーザー"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Lv.{p?.level ?? 1} ・ キャラ所持 {p?.character_count ?? 0}
                      </p>
                      {/* ✅ いつ届いたか（表示したくなければ消してOK） */}
                      <p className="text-xs text-gray-500">
                        受信: {new Date(r.created_at).toLocaleString("ja-JP")}
                      </p>
                    </div>
                  </div>

                  {/* ボタン */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => accept(r.id)}
                      disabled={busy}
                      className="rounded-xl py-3 font-extrabold text-white
                                 bg-gradient-to-r from-amber-400 to-orange-500
                                 hover:opacity-95 active:opacity-90
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 shadow-sm"
                    >
                      {busy ? "処理中..." : "承認"}
                    </button>

                    <button
                      onClick={() => reject(r.id)}
                      disabled={busy}
                      className="rounded-xl py-3 font-extrabold
                                 bg-white ring-1 ring-black/10
                                 hover:bg-gray-50 active:bg-gray-100
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {busy ? "処理中..." : "拒否"}
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    承認するとフレンド一覧に追加されます
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {/* <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/user/friends")}
            className="rounded-xl bg-gray-100 py-3 font-bold hover:bg-gray-200"
          >
            戻る
          </button>

          <button
            onClick={() => router.push("/user/friends/add")}
            className="rounded-xl bg-white py-3 font-bold ring-1 ring-black/10 hover:bg-gray-50"
          >
            申請を送る
          </button>
        </div> */}
        <div className="flex justify-center">
          <button
            onClick={() => router.push("/user/friends")}
            className="w-full rounded-xl bg-gray-100 py-3 font-bold hover:bg-gray-200"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}