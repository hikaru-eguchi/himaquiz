"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import type { PublicFriendProfile } from "@/types/friend";
import { useSupabaseUser } from "../../../../hooks/useSupabaseUser";

export default function FriendDetailPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const friendId = params.id;

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<PublicFriendProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: userLoading } = useSupabaseUser();
  const [friends, setFriends] = useState<PublicFriendProfile[]>([]);
  const [skinName, setSkinName] = useState<string>("ボードスタイル");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        const { data, error } = await supabase
          .from("user_public_profiles")
          .select("*")
          .eq("user_id", friendId)
          .single();

        const { data: frows } = await supabase
          .from("friendships")
          .select("friend_user_id")
          .eq("user_id", user.id);

        const ids = Array.from(
          new Set((frows ?? []).map((r: any) => r.friend_user_id))
        ).filter((id) => id !== friendId);

        if (ids.length > 0) {
          const { data: ups } = await supabase
            .from("user_public_profiles")
            .select("*")
            .in("user_id", ids);

          setFriends((ups ?? []) as PublicFriendProfile[]);
        }

        if (data?.current_skin_id) {
          const { data: skin, error: skinErr } = await supabase
            .from("skins")
            .select("name")
            .eq("id", data.current_skin_id)
            .single();

          if (!skinErr && skin?.name) {
            setSkinName(skin.name);
          }
        }

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
  }, [supabase, friendId, user, userLoading, router]);

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
            {/* <div className="grid grid-cols-2 gap-2"> */}
            <div className="space-y-3">
              {/* <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">📚 キャラ所持数</p>
                <p className="text-xl font-extrabold">{p.character_count ?? 0}</p>
              </div> */}

              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-4 text-center shadow-sm">
                <p className="text-xs font-black text-emerald-500">
                  📚 所持キャラ
                </p>

                <p className="mt-1 text-2xl font-black text-slate-900">
                  {p.character_count ?? 0}体
                </p>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-white to-purple-50 px-4 py-4 text-center shadow-sm">
                <p className="text-xs font-black text-purple-500">
                  🏅 マイ称号
                </p>

                <p className="mt-1 text-xl font-black text-slate-900 leading-tight">
                  {p.current_title ?? "（未設定）"}
                </p>
              </div>

              <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50 p-4 text-center shadow-sm">
                <p className="text-xs font-black text-cyan-500">
                  🎨 使用中スタイル
                </p>

                <div className="mt-3 flex items-center justify-center gap-3">
                  <img
                    src={
                      p.current_skin_image_url
                        ? p.current_skin_image_url.startsWith("/")
                          ? p.current_skin_image_url
                          : `/${p.current_skin_image_url}`
                        : "/images/skin_chara1_ボード.png"
                    }
                    alt={skinName}
                    className="h-20 w-20 rounded-2xl bg-white object-contain p-1 shadow"
                  />

                  <div className="text-left">
                    <p className="font-black text-slate-900">
                      {skinName}
                    </p>

                    <p className="text-xs font-bold text-slate-500">
                      使用中
                    </p>
                  </div>
                </div>
              </div>

              {/* <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">ひとこと</p>
                <p className="text-sm font-bold text-gray-700">
                  よろしくね！
                </p>
              </div> */}
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

            <button
              onClick={() => setDeleteOpen(true)}
              className="w-full rounded-xl bg-gray-100 py-3 font-extrabold text-gray-600 hover:bg-rose-50 hover:text-rose-600"
            >
              フレンドをやめる
            </button>
          </div>
        )}

        <section className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">
              {/* 👥 フレンド一覧 */}
              👥 ほかのフレンド
            </h2>

            {/* <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
              {friends.length}人
            </span> */}
          </div>

          <div className="max-h-[250px] space-y-3 overflow-y-auto pr-1">
            {friends.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
                <div className="text-3xl">🫧</div>

                <p className="mt-2 font-extrabold text-gray-800">
                  まだほかのフレンドはいません
                </p>
              </div>
            ) : (
              friends.map((f) => (
                <button
                  key={f.user_id}
                  onClick={() => router.push(`/user/friends/${f.user_id}`)}
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
                      src={f.avatar_url ?? "/images/初期アイコン.png"}
                      className="w-12 h-12 rounded-full border bg-white object-contain"
                      alt="avatar"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold truncate">
                        {f.username ?? "ユーザー"}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs md:text-sm">
                        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold">
                          Lv.{f.level ?? 1}
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                          キャラ {f.character_count ?? 0}
                        </span>
                      </div>
                    </div>

                    <span className="text-gray-300 text-xl font-black">›</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Footer */}
        {/* <div className="grid grid-cols-2 gap-3">
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
      {deleteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-xl">
            <p className="text-xl font-black text-gray-900">
              フレンドをやめますか？
            </p>

            <p className="mt-2 text-sm font-bold text-gray-500">
              フレンド一覧から削除されます
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="rounded-xl bg-gray-100 py-3 font-bold"
              >
                キャンセル
              </button>

              <button
                onClick={async () => {
                  setDeleting(true);

                  const { error } = await supabase.rpc("delete_friend", {
                    p_friend_id: friendId,
                  });

                  if (error) {
                    setDeleting(false);
                    alert("フレンド削除に失敗しました");
                    return;
                  }

                  router.push("/user/friends");
                }}
                disabled={deleting}
                className="rounded-xl bg-rose-500 py-3 font-extrabold text-white"
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}