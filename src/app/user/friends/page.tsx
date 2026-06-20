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

type MyFriendInfo = {
  friend_code: string | null;
  friend_code_public: boolean | null;
  friend_recruiting: boolean | null;
};

export default function FriendsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<PublicFriendProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [myFriendInfo, setMyFriendInfo] = useState<MyFriendInfo | null>(null);

  const [friendSettingOpen, setFriendSettingOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [giftCount, setGiftCount] = useState(0);

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
        const { error: ensureErr } = await supabase.rpc("ensure_friend_code");
        if (ensureErr) {
          console.warn("ensure_friend_code error:", ensureErr);
        }

        const { data: myProfile, error: myProfileErr } = await supabase
          .from("profiles")
          .select("friend_code, friend_code_public, friend_recruiting")
          .eq("id", user.id)
          .single();

        if (myProfileErr) throw myProfileErr;

        setMyFriendInfo(myProfile);

        const { count: reqCount } = await supabase
          .from("friend_requests")
          .select("id", { count: "exact", head: true })
          .eq("to_user_id", user.id)
          .eq("status", "pending");

        setRequestCount(reqCount ?? 0);

        const { count: gCount } = await supabase
          .from("character_gifts")
          .select("id", { count: "exact", head: true })
          .eq("to_user_id", user.id)
          .is("claimed_at", null)
          .eq("deleted_by_receiver", false);

        setGiftCount(gCount ?? 0);

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

        <section className="rounded-2xl border border-sky-100 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setFriendSettingOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-xl bg-sky-50 px-4 py-3 font-black text-sky-700 hover:bg-sky-100 active:scale-[0.99]"
          >
            <span>⚙️ フレンド設定</span>
            <span>{friendSettingOpen ? "▲" : "▼"}</span>
          </button>

          {friendSettingOpen && (
            <div className="mt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-gray-500">FRIEND ID</p>
                  <h2 className="text-lg font-black text-gray-900">フレンドID</h2>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const code = myFriendInfo?.friend_code;
                    if (!code) return;

                    try {
                      await navigator.clipboard.writeText(code);
                      alert("フレンドIDをコピーしました！");
                    } catch {
                      alert("コピーに失敗しました…");
                    }
                  }}
                  className="rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-4 py-2 text-sm font-black text-white shadow transition hover:brightness-110 active:scale-95"
                >
                  コピー
                </button>
              </div>

              <div className="rounded-2xl bg-sky-50 px-4 py-3 text-center">
                <p className="text-2xl font-black tracking-widest text-sky-700">
                  {myFriendInfo?.friend_code ?? "----"}
                </p>
              </div>

              <p className="mt-2 text-center text-xs font-bold text-gray-500">
                友達追加画面でこのIDを入力してもらうとフレンド申請できます👥
              </p>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-yellow-50 px-4 py-3">
                <div>
                  <p className="text-sm font-black text-gray-800">
                    フレンドIDを公開する
                  </p>
                  <p className="text-xs font-bold text-gray-500">
                    ONにすると他の人のプロフィールに表示されます
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!user) return;

                    const next = !(myFriendInfo?.friend_code_public ?? false);

                    setMyFriendInfo((prev) =>
                      prev ? { ...prev, friend_code_public: next } : prev
                    );

                    const { error } = await supabase
                      .from("profiles")
                      .update({ friend_code_public: next })
                      .eq("id", user.id);

                    if (error) {
                      console.error(error);
                      alert("設定の保存に失敗しました");

                      setMyFriendInfo((prev) =>
                        prev ? { ...prev, friend_code_public: !next } : prev
                      );
                    }
                  }}
                  className={`
                    relative h-8 w-14 rounded-full transition
                    ${(myFriendInfo?.friend_code_public ?? false) ? "bg-yellow-400" : "bg-gray-300"}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 h-6 w-6 rounded-full bg-white shadow transition
                      ${(myFriendInfo?.friend_code_public ?? false) ? "left-7" : "left-1"}
                    `}
                  />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-green-50 px-4 py-3">
                <div>
                  <p className="text-sm font-black text-gray-800">
                    「🤝 フレンド募集中」マークを表示する
                  </p>

                  <p className="text-xs font-bold text-gray-500">
                    ONにするとプロフィールに表示されます
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!user) return;

                    const next = !(myFriendInfo?.friend_recruiting ?? false);

                    setMyFriendInfo((prev) =>
                      prev ? { ...prev, friend_recruiting: next } : prev
                    );

                    const { error } = await supabase
                      .from("profiles")
                      .update({ friend_recruiting: next })
                      .eq("id", user.id);

                    if (error) {
                      console.error(error);
                      alert("設定の保存に失敗しました");

                      setMyFriendInfo((prev) =>
                        prev ? { ...prev, friend_recruiting: !next } : prev
                      );
                    }
                  }}
                  className={`
                    relative h-8 w-14 rounded-full transition
                    ${(myFriendInfo?.friend_recruiting ?? false)
                      ? "bg-green-400"
                      : "bg-gray-300"}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 h-6 w-6 rounded-full bg-white shadow transition
                      ${(myFriendInfo?.friend_recruiting ?? false)
                        ? "left-7"
                        : "left-1"}
                    `}
                  />
                </button>
              </div>
            </div>
          )}
        </section>

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

          {/* <button
              onClick={() => router.push("/user/friends/requests")}
              className="
              rounded-xl py-2 text-white font-extrabold
              bg-gradient-to-r from-emerald-400 via-green-400 to-lime-400
              shadow-md hover:brightness-110 active:scale-95 transition
              "
          >
              ✉️ とどいた申請
          </button> */}
          <button
            onClick={() => router.push("/user/friends/requests")}
            className="
              relative
              rounded-xl py-2 text-white font-extrabold
              bg-gradient-to-r from-emerald-400 via-green-400 to-lime-400
              shadow-md hover:brightness-110 active:scale-95 transition
            "
          >
            ✉️ とどいた申請

            {/* {requestCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-red-500 px-1.5 text-xs font-black text-white shadow">
                {requestCount > 99 ? "99+" : requestCount}
              </span>
            )} */}
            {requestCount > 0 && (
              <>
                {/* スマホ用 */}
                <span
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    md:hidden
                    grid h-6 min-w-6 place-items-center
                    rounded-full border-2 border-white
                    bg-red-500 px-1.5
                    text-sm font-black text-white shadow
                  "
                >
                  {requestCount > 99 ? "99+" : requestCount}
                </span>

                {/* PC用 */}
                <span
                  className="
                    hidden md:grid
                    absolute -right-2 -top-2
                    h-6 min-w-6 place-items-center
                    rounded-full border-2 border-white
                    bg-red-500 px-1.5
                    text-sm font-black text-white shadow
                  "
                >
                  {requestCount > 99 ? "99+" : requestCount}
                </span>
              </>
            )}
          </button>

          {/* <button
              onClick={() => router.push("/user/friends/gifts")}
              className="
              rounded-xl py-2 text-white font-extrabold
              bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400
              shadow-md hover:brightness-110 active:scale-95 transition
              "
          >
              🎁 プレゼントBOX
          </button> */}

          <button
            onClick={() => router.push("/user/friends/gifts")}
            className="
              relative
              rounded-xl py-2 text-white font-extrabold
              bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400
              shadow-md hover:brightness-110 active:scale-95 transition
            "
          >
            🎁 プレゼントBOX

            {/* {giftCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-red-500 px-1.5 text-xs font-black text-white shadow">
                {giftCount > 99 ? "99+" : giftCount}
              </span>
            )} */}
            {giftCount > 0 && (
              <>
                {/* スマホ用 */}
                <span
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    md:hidden
                    grid h-6 min-w-6 place-items-center
                    rounded-full border-2 border-white
                    bg-red-500 px-1.5
                    text-sm font-black text-white shadow
                  "
                >
                  {giftCount > 99 ? "99+" : giftCount}
                </span>

                {/* PC用 */}
                <span
                  className="
                    hidden md:grid
                    absolute -right-2 -top-2
                    h-6 min-w-6 place-items-center
                    rounded-full border-2 border-white
                    bg-red-500 px-1.5
                    text-sm font-black text-white shadow
                  "
                >
                  {giftCount > 99 ? "99+" : giftCount}
                </span>
              </>
            )}
          </button>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <section className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">
              👥 フレンド一覧
            </h2>

            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
              {friends.length}人
            </span>
          </div>

          {friends.length === 0 ? (
            <p className="text-center text-gray-600 rounded-xl bg-gray-50 border p-4">
              まだフレンドがいません 😢<br />
              「➕ 追加」から友達を増やそう！
            </p>
          ) : (
            <div className="max-h-[270px] space-y-3 overflow-y-auto pr-1">
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
        </section>

        {/* <button
          onClick={() => router.push("/user/mypage")}
          className="
              w-full rounded-xl py-2 font-extrabold
              bg-gray-100 hover:bg-gray-200
              active:scale-95 transition
          "
          >
          ⬅️ マイページへ
      </button> */}
      </div>
    </div>
  );
}