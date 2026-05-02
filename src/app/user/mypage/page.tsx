"use client";

import { useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { useRouter } from "next/navigation";

type Profile = {
  username: string | null;
  user_id: string | null;
  recovery_email: string | null;
  points: number | null;
  level: number | null;
  exp: number | null;
  avatar_character_id: string | null;
  avatar_url: string | null;
  friend_code: string | null;
  current_title: string | null;
};

export default function MyPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string>("/images/初期アイコン.png");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      router.push("/user/login");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);

      try {
        const { error: ensureErr } = await supabase.rpc("ensure_friend_code");
        if (ensureErr) {
          console.warn("ensure_friend_code error:", ensureErr);
        }

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "username, user_id, recovery_email, points, level, exp, avatar_character_id, avatar_url, friend_code, current_title"
          )
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("fetchProfile error:", error);
        } else {
          const p = data as Profile;
          setProfile(p);

          const initial = "/images/初期アイコン.png";
          const saved = p.avatar_url
            ? p.avatar_url.startsWith("/")
              ? p.avatar_url
              : `/${p.avatar_url}`
            : initial;

          if (!p.avatar_character_id) {
            setAvatarUrl(saved);
          } else {
            const { data: ch, error: chErr } = await supabase
              .from("characters")
              .select("image_url")
              .eq("id", p.avatar_character_id)
              .single();

            if (chErr || !ch?.image_url) {
              setAvatarUrl(saved);
            } else {
              const url = ch.image_url.startsWith("/")
                ? ch.image_url
                : `/${ch.image_url}`;
              setAvatarUrl(url);
            }
          }
        }
      } catch (err) {
        console.error("fetchProfile exception:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, userLoading, supabase, router]);

  if (userLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-yellow-50 p-4">
        <div className="mx-auto max-w-md space-y-4">
          <div className="h-44 animate-pulse rounded-[2rem] bg-gray-200" />
          <div className="h-28 animate-pulse rounded-3xl bg-gray-200" />
          <div className="h-72 animate-pulse rounded-3xl bg-gray-200" />
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-yellow-50 p-4">
        <div className="mx-auto max-w-md space-y-4">
          <div className="h-44 animate-pulse rounded-[2rem] bg-gray-200" />
          <div className="h-28 animate-pulse rounded-3xl bg-gray-200" />
          <div className="h-72 animate-pulse rounded-3xl bg-gray-200" />
        </div>
      </main>
    );
  }

  const totalPoints = profile?.points ?? 0;
  const level = profile?.level ?? 1;
  const exp = profile?.exp ?? 0;

  const nextLevelTotalExp = ((level * (level + 1)) / 2) * 100;
  const currentLevelStartExp = (((level - 1) * level) / 2) * 100;
  const needThisLevel = nextLevelTotalExp - currentLevelStartExp;
  const gainedThisLevel = Math.max(0, exp - currentLevelStartExp);
  const expToNext = Math.max(0, nextLevelTotalExp - exp);
  const expPercent = Math.min(
    100,
    Math.floor((gainedThisLevel / needThisLevel) * 100)
  );

  const iconLabel = profile?.avatar_character_id
    ? "所持キャラ"
    : profile?.avatar_url && profile.avatar_url !== "/images/初期アイコン.png"
      ? "デフォルト"
      : "初期アイコン";

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-yellow-50 px-4 py-5">
        <div className="mx-auto max-w-md space-y-4">
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-500 via-blue-500 to-purple-500 p-5 text-white shadow-lg">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-yellow-200/30 blur-2xl" />

            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-white/80">MY PAGE</p>
                  <h1 className="text-2xl font-black">マイページ</h1>
                </div>

                <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur">
                  Lv.{level}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="shrink-0 rounded-full bg-white p-1 shadow-xl transition active:scale-95"
                >
                  <img
                    src={avatarUrl}
                    alt="icon"
                    className="h-24 w-24 rounded-full bg-white object-contain"
                  />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white/80">ユーザー名</p>
                  <p className="truncate text-xl font-black">
                    {profile?.username ?? "(未設定)"}
                  </p>

                  <p className="mt-2 text-xs font-bold text-white/80">
                    ユーザーID
                  </p>
                  <p className="break-all text-sm font-bold text-white">
                    {profile?.user_id ?? "(未設定)"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl bg-white/15 p-4 backdrop-blur">
                <p className="text-xs font-black text-white/75">マイ称号</p>
                <p className="mt-1 text-base font-black">
                  {profile?.current_title ?? "（未設定）"}
                </p>
              </div>

              <div className="mt-4 rounded-3xl bg-white/15 p-4 backdrop-blur">
                <div className="mb-2 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-black text-white/75">
                      現在のユーザーレベル
                    </p>
                    <p className="text-lg font-black text-yellow-100">
                      Lv.{profile?.level ?? 1}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-white/75">
                      次のレベルまで
                    </p>
                    <p className="text-lg font-black">{expToNext} EXP</p>
                  </div>
                </div>

                <div className="h-4 overflow-hidden rounded-full bg-white/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lime-200 to-white"
                    style={{ width: `${expPercent}%` }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-xs font-bold text-white/80">
                  <span>
                    {gainedThisLevel} / {needThisLevel}
                  </span>
                  <span>{expPercent}%</span>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-black text-gray-500">
                現在の所持ポイント
              </p>
              <p className="mt-1 text-2xl font-black text-blue-500">
                {totalPoints}
                <span className="ml-1 text-sm text-gray-500">pt</span>
              </p>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-black text-gray-500">アイコン</p>
              <p className="mt-1 truncate text-lg font-black text-amber-500">
                {iconLabel}
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-sky-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-gray-500">FRIEND ID</p>
                <h2 className="text-lg font-black text-gray-900">
                  フレンドID
                </h2>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const code = profile?.friend_code;
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
                {profile?.friend_code ?? "----"}
              </p>
            </div>

            <p className="mt-2 text-xs font-bold text-gray-500">
              友達追加画面でこのIDを入力してもらうとフレンド申請できます👥
            </p>
          </section>

          <section className="rounded-[2rem] bg-white p-4 shadow-sm">
            {/* <h2 className="mb-3 text-lg font-black text-gray-900">
              プロフィール情報
            </h2> */}

            <div className="space-y-3">
              {/* <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-black text-gray-500">ユーザー名</p>
                <p className="text-base font-bold text-gray-900">
                  {profile?.username ?? "(未設定)"}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-black text-gray-500">ユーザーID</p>
                <p className="break-all text-base font-bold text-gray-900">
                  {profile?.user_id ?? "(未設定)"}
                </p>
              </div> */}

              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-black text-gray-500">
                  復旧用メールアドレス
                </p>
                <p className="break-all text-base font-bold text-gray-900">
                  {profile?.recovery_email ?? "(未設定)"}
                </p>
              </div>

              {/* <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-black text-gray-500">アイコン</p>
                <p className="text-base font-bold text-gray-900">
                  {iconLabel}
                </p>
              </div> */}

              {/* <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-black text-gray-500">
                  現在のユーザーレベル
                </p>
                <p className="text-base font-black text-amber-500">
                  Lv.{profile?.level ?? 1}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-black text-gray-500">マイ称号</p>
                <p className="text-base font-black text-purple-600">
                  {profile?.current_title ?? "（未設定）"}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs font-black text-gray-500">
                  現在の所持ポイント
                </p>
                <p className="text-base font-black text-blue-500">
                  {totalPoints} pt
                </p>
              </div> */}
            </div>
          </section>

          <section className="grid gap-3">
            <button
              onClick={() => router.push("/user/mypage/edit")}
              className="flex w-full items-center justify-between rounded-3xl bg-gradient-to-r from-yellow-400 to-orange-400 px-5 py-4 font-black text-white shadow-md transition hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>プロフィールを編集</span>
              <span>✏️</span>
            </button>

            <button
              onClick={() => router.push("/user/mypage/titles")}
              className="flex w-full items-center justify-between rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-4 font-black text-white shadow-md transition hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>称号コレクション</span>
              <span>🏅</span>
            </button>

            <button
              onClick={() => router.push("/user/mypage/records")}
              className="flex w-full items-center justify-between rounded-3xl bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-4 font-black text-white shadow-md transition hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>プレイ記録</span>
              <span>🎮</span>
            </button>

            <button
              onClick={() => router.push("/user/friends")}
              className="flex w-full items-center justify-between rounded-3xl bg-gradient-to-r from-sky-400 to-blue-500 px-5 py-4 font-black text-white shadow-md transition hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>フレンド</span>
              <span>👥</span>
            </button>

            <button
              onClick={() => router.push("/user/mypage/points-history")}
              className="flex w-full items-center justify-between rounded-3xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-4 font-black text-white shadow-md transition hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>ポイント履歴</span>
              <span>💰</span>
            </button>

            <button
              onClick={() => router.push("/user/change-password")}
              className="flex w-full items-center justify-between rounded-3xl bg-gradient-to-r from-red-500 to-rose-500 px-5 py-4 font-black text-white shadow-md transition hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>パスワードを変更</span>
              <span>🔑</span>
            </button>
          </section>
        </div>
      </main>

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="w-[80vw] max-w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={avatarUrl}
              alt="icon preview"
              className="aspect-square w-full rounded-full bg-white object-contain shadow-2xl"
            />

            <button
              type="button"
              onClick={() => {
                setIsPreviewOpen(false);
                router.push("/user/mypage/edit");
                router.refresh();
              }}
              className="mt-4 w-full rounded-full bg-white py-3 text-lg font-black text-gray-900 shadow-xl transition hover:scale-[1.01] md:mt-8 md:text-xl"
            >
              変更する
            </button>
          </div>
        </div>
      )}
    </>
  );
}