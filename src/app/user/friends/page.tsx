"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { useRouter } from "next/navigation";
import type { PublicFriendProfile } from "@/types/friend";

type FriendshipRow = {
  user_id: string;
  friend_user_id: string;
  created_at: string;
};

export default function FriendsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<PublicFriendProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        const { data: frows, error: fErr } = await supabase
          .from("friendships")
          .select("user_id, friend_user_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (fErr) throw fErr;

        const ids = Array.from(new Set((frows ?? []).map((r: any) => r.friend_user_id)));
        if (ids.length === 0) {
          setFriends([]);
          return;
        }

        const { data: ups, error: upErr } = await supabase
          .from("user_public_profiles")
          .select("*")
          .in("user_id", ids);

        if (upErr) throw upErr;

        // 並び順をfriendships順に揃える
        const map = new Map<string, any>((ups ?? []).map((p: any) => [p.user_id, p]));
        const ordered = ids.map((id) => map.get(id)).filter(Boolean) as PublicFriendProfile[];
        setFriends(ordered);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user, userLoading, supabase, router]);

  if (userLoading || loading) return <p className="p-4">読み込み中...</p>;

  return (
    <div className="bg-gradient-to-b from-yellow-100 to-white">
      <div className="max-w-md mx-auto p-4 space-y-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center tracking-wide">
        👥 フレンド
        </h1>
        <p className="text-center text-md text-xl text-gray-600">
        フレンドと一緒にひまQを楽しもう！
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
              onClick={() => router.push("/user/friends/add")}
              className="
              rounded-xl py-2 text-white font-extrabold
              bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500
              shadow-md hover:brightness-110 active:scale-95 transition
              "
          >
              ➕ フレンド追加
          </button>

          <button
              onClick={() => router.push("/user/friends/requests")}
              className="
              rounded-xl py-2 text-white font-extrabold
              bg-gradient-to-r from-emerald-400 via-green-400 to-lime-400
              shadow-md hover:brightness-110 active:scale-95 transition
              "
          >
              ✉️ とどいた申請
          </button>

          <button
              onClick={() => router.push("/user/friends/gifts")}
              className="
              rounded-xl py-2 text-white font-extrabold
              bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400
              shadow-md hover:brightness-110 active:scale-95 transition
              "
          >
              🎁 プレゼントBOX
          </button>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        {friends.length === 0 ? (
          <p className="text-gray-600 text-center bg-white rounded-xl border p-4 shadow-sm">
          まだフレンドがいません 😢<br />
          「➕ 追加」から友達を増やそう！
          </p>
        ) : (
          <div className="space-y-3">
            {friends.map((p) => (
              <button
                  key={p.user_id}
                  onClick={() => router.push(`/user/friends/${p.user_id}`)}
                  className="
                      w-full text-left
                      rounded-2xl border border-gray-200
                      bg-white p-3
                      shadow-sm hover:shadow-md
                      hover:-translate-y-[1px]
                      active:scale-[0.99]
                      transition
                  "
                  >
                  <div className="flex items-center gap-3">
                      <img
                      src={p.avatar_url ?? "/images/初期アイコン.png"}
                      className="w-14 h-14 rounded-full border-2 border-white shadow bg-white object-contain"
                      alt="avatar"
                      />

                      <div className="flex-1 min-w-0">
                      <p className="font-extrabold truncate text-gray-900">
                          {p.username ?? "ユーザー"}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs md:text-sm">
                          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold">
                          Lv.{p?.level ?? 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                          キャラ {p?.character_count ?? 0}
                          </span>
                      </div>
                      </div>

                      <span className="text-gray-300 text-xl font-black">›</span>
                  </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push("/user/mypage")}
          className="
              w-full rounded-xl py-2 font-extrabold
              bg-gray-100 hover:bg-gray-200
              active:scale-95 transition
          "
          >
          ⬅️ マイページへ
      </button>
      </div>
    </div>
  );
}