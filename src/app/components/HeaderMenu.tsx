"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function HeaderMenu() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null); // 所持ポイント
  const [avatarUrl, setAvatarUrl] = useState<string>("/images/初期アイコン.png");
  const [level, setLevel] = useState<number | null>(null);
  const [exp, setExp] = useState<number | null>(null);

  const fetchProfile = async (uid: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, points, level, exp, avatar_character_id")
      .eq("id", uid)
      .single();

    setUsername(profile?.username ?? null);
    setPoints(profile?.points ?? 0);
    setLevel(profile?.level ?? 1);
    setExp(profile?.exp ?? 0);

    // avatar_character_id があれば、そのキャラ画像を取りに行く
    if (profile?.avatar_character_id) {
      const { data: ch } = await supabase
        .from("characters")
        .select("image_url")
        .eq("id", profile.avatar_character_id)
        .single();

      const url = ch?.image_url
        ? ch.image_url.startsWith("/") ? ch.image_url : `/${ch.image_url}`
        : "/images/初期アイコン.png";

      setAvatarUrl(url);
    } else {
      setAvatarUrl("/images/初期アイコン.png");
    }
  };

  // ===== セッション監視（初回 & ログイン状態変化）=====
  useEffect(() => {
    let alive = true;

    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;

      if (!alive) return;

      setUser(currentUser);
      if (currentUser) await fetchProfile(currentUser.id);
      else {
        setUsername(null);
        setPoints(null);
      }
    };

    // 初回
    fetchUser();

    // Supabase の auth イベント（※Cookie方式では即時発火しないことがある）
    const { data: listener } = supabase.auth.onAuthStateChange(async () => {
      await fetchUser();
    });

    // ★ 追加：ログインAPI成功後に投げるカスタムイベント
    const onAuthChanged = () => setTimeout(() => fetchUser(), 0);
    window.addEventListener("auth:changed", onAuthChanged);

    // フォーカス復帰でも更新
    const onFocus = () => fetchUser();
    window.addEventListener("focus", onFocus);

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("auth:changed", onAuthChanged);
      window.removeEventListener("focus", onFocus);
    };
  }, [supabase]);

  useEffect(() => {
    const refreshPoints = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);

      if (currentUser) await fetchProfile(currentUser.id);
    };

    const handler = () => refreshPoints();
    window.addEventListener("points:updated", handler);
    return () => window.removeEventListener("points:updated", handler);
  }, [supabase]);

  const handleLogout = async () => {
    // ✅ サーバーでCookie削除
    await fetch("/api/auth/logout", { method: "POST" });

    setOpen(false);
    setUser(null);
    setUsername(null);
    setPoints(null);

    // ✅ 画面遷移＆Server Component再描画
    router.push("/");
    router.refresh();

    // ✅ fetchUserが走ってもCookieが消えてるので復活しない
    window.dispatchEvent(new Event("auth:changed"));
  };

  return (
    <>
      {/* ハンバーガーアイコン */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 right-4 z-50 p-2 bg-white shadow-lg rounded-full md:p-3 cursor-pointer"
      >
        <div className="w-6 md:w-8 space-y-1">
          <span className="block h-1 bg-black rounded"></span>
          <span className="block h-1 bg-black rounded"></span>
          <span className="block h-1 bg-black rounded"></span>
        </div>
      </button>

      {/* メニュー本体 */}
      {open && (
        <div className="fixed top-0 right-0 w-60 h-full bg-white shadow-xl z-40 p-5 flex flex-col space-y-4 text-lg">
          <button className="self-end text-2xl" onClick={() => setOpen(false)}>
            ✕
          </button>

          {/* ログイン済み：ユーザー名＆ポイント */}
          {user && (
            <div className="text-center text-lg font-bold text-gray-700 pb-2 border-b space-y-1">
              <div className="flex justify-center">
                <img
                  src={avatarUrl}
                  alt="icon"
                  className="w-30 h-30 rounded-md border-3 border-gray-400 bg-white object-contain"
                />
              </div>
              <div>{username ? `${username} さん` : "ユーザー"}</div>
              <div className="text-sm px-2 py-0.5 rounded text-green-600">
                ユーザーレベル：Lv.{level ?? 1}
              </div>
              <div className="text-sm text-blue-500">
                所持ポイント：
                <span className="font-extrabold"> {points ?? 0}</span> P
              </div>
            </div>
          )}

          {/* 未ログイン */}
          {!user && (
            <>
              <Link
                href="/"
                className="bg-gray-800 text-white py-2 px-4 rounded text-center hover:bg-gray-900"
                onClick={() => setOpen(false)}
              >
                トップページへ
              </Link>
              <Link
                href="/user/login"
                className="bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600"
                onClick={() => setOpen(false)}
              >
                ログイン
              </Link>

              <Link
                href="/user/signup"
                className="bg-green-500 text-white py-2 px-4 rounded text-center hover:bg-green-600"
                onClick={() => setOpen(false)}
              >
                新規ユーザー登録
              </Link>
            </>
          )}

          {/* ログイン後メニュー */}
          {user && (
            <>
              <Link
                href="/"
                className="bg-gray-800 text-white py-2 px-4 rounded text-center hover:bg-gray-900"
                onClick={() => setOpen(false)}
              >
                トップページへ
              </Link>
              <Link
                href="/quiz-gacha"
                className="bg-gradient-to-r from-red-500 via-sky-500 to-green-500 text-white py-2 px-4 rounded text-center hover:opacity-90"
                onClick={() => setOpen(false)}
              >
                クイズガチャ🎰
              </Link>
              <Link
                href="/user/mypage"
                className="bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600"
                onClick={() => setOpen(false)}
              >
                マイプロフィール
              </Link>

              <Link
                href="/user/mycharacters"
                className="
                  bg-gradient-to-r from-pink-400 via-purple-300 via-blue-300 to-green-400
                  text-white py-2 px-4 rounded text-center shadow-md
                  hover:opacity-90 transition
                "
                onClick={() => setOpen(false)}
              >
                マイキャラ図鑑📖
              </Link>

              <button
                onClick={handleLogout}
                className="bg-red-500 text-white py-2 px-4 rounded text-center hover:bg-red-600 cursor-pointer"
              >
                ログアウト
              </button>
            </>
          )}
        </div>
      )}

      {/* 背景 */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
