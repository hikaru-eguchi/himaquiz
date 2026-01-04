"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function HeaderMenu() {
  const supabase = createSupabaseBrowserClient();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null); // 所持ポイント

  // ===== セッション監視（初回 & ログイン状態変化）=====
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, points")
          .eq("id", currentUser.id)
          .single();

        setUsername(profile?.username ?? null);
        setPoints(profile?.points ?? 0);
      } else {
        setUsername(null);
        setPoints(null);
      }
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, points")
            .eq("id", currentUser.id)
            .single();

          setUsername(profile?.username ?? null);
          setPoints(profile?.points ?? 0);
        } else {
          setUsername(null);
          setPoints(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // ===== ★ 追加：ポイント更新イベント監視 =====
  useEffect(() => {
    const refreshPoints = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, points")
          .eq("id", currentUser.id)
          .single();

        setUsername(profile?.username ?? null);
        setPoints(profile?.points ?? 0);
      }
    };

    const handler = () => refreshPoints();
    window.addEventListener("points:updated", handler);

    return () => window.removeEventListener("points:updated", handler);
  }, [supabase]);

  // ===== ログアウト =====
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    setUser(null);
    setUsername(null);
    setPoints(null);
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
              <div>{username ? `${username} さん` : "ユーザー"}</div>
              <div className="text-sm text-gray-600">
                所持ポイント：
                <span className="font-extrabold"> {points ?? 0}</span> P
              </div>
            </div>
          )}

          {/* 未ログイン */}
          {!user && (
            <>
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
                マイキャラ図鑑
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
