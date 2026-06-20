"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

export default function HeaderMenu() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [username, setUsername] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("/images/初期アイコン.png");
  const [level, setLevel] = useState<number | null>(null);
  const [exp, setExp] = useState<number | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);

  const [infoOpen, setInfoOpen] = useState(false);
  const [gachaOpen, setGachaOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);

  const [friendNoticeCount, setFriendNoticeCount] = useState(0);

  const fetchFriendNoticeCount = async (uid: string) => {
    const { count: reqCount } = await supabase
      .from("friend_requests")
      .select("id", { count: "exact", head: true })
      .eq("to_user_id", uid)
      .eq("status", "pending");

    const { count: giftCount } = await supabase
      .from("character_gifts")
      .select("id", { count: "exact", head: true })
      .eq("to_user_id", uid)
      .is("claimed_at", null)
      .eq("deleted_by_receiver", false);

    setFriendNoticeCount((reqCount ?? 0) + (giftCount ?? 0));
  };

  const [reactionCounts, setReactionCounts] =
    useState({
      sugoi: 0,
      atsui: 0,
      iine: 0,
    });

  const resetHeader = () => {
    setUser(null);
    setUsername(null);
    setPoints(null);
    setLevel(null);
    setExp(null);
    setAvatarUrl("/images/初期アイコン.png");
    setReactionCounts({
      sugoi: 0,
      atsui: 0,
      iine: 0,
    });
  };

  const fetchProfile = async (uid: string) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("username, points, level, exp, avatar_character_id, avatar_url")
      .eq("id", uid)
      .single();

    if (error) {
      console.error("fetchProfile error:", error);
      return;
    }

    setUsername(profile?.username ?? null);
    setPoints(profile?.points ?? 0);
    setLevel(profile?.level ?? 1);
    setExp(profile?.exp ?? 0);

    const initial = "/images/初期アイコン.png";
    const saved = profile?.avatar_url
      ? (profile.avatar_url.startsWith("/") ? profile.avatar_url : `/${profile.avatar_url}`)
      : initial;

    if (profile?.avatar_character_id) {
      const { data: ch } = await supabase
        .from("characters")
        .select("image_url")
        .eq("id", profile.avatar_character_id)
        .single();

      const url = ch?.image_url
        ? (ch.image_url.startsWith("/") ? ch.image_url : `/${ch.image_url}`)
        : saved;

      setAvatarUrl(url);
    } else {
      setAvatarUrl(saved);
    }
  };

  const fetchReactionCounts = async (uid: string) => {
    const { data, error } = await supabase
      .from("user_public_profiles")
      .select("sugoi_count, atsui_count, iine_count")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) {
      console.error("fetchReactionCounts error:", error);

      setReactionCounts({
        sugoi: 0,
        atsui: 0,
        iine: 0,
      });

      return;
    }

    setReactionCounts({
      sugoi: data?.sugoi_count ?? 0,
      atsui: data?.atsui_count ?? 0,
      iine: data?.iine_count ?? 0,
    });
  };

  // ✅ 初回だけ getSession。イベントでは session 引数だけ使う
  useEffect(() => {
    let alive = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;

      if (!alive) return;

      if (!u) {
        resetHeader();
        return;
      }

      setUser(u);
      // プロフィール取得は別タスク（イベント内await回避）
      // setTimeout(() => void fetchProfile(u.id), 0);
      setTimeout(() => {
        void fetchProfile(u.id);
        void fetchReactionCounts(u.id);
        void fetchFriendNoticeCount(u.id);
      }, 0);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        // 🚫 ここで supabase.auth.getSession/getUser/refreshSession を await しない
        const u = session?.user ?? null;

        if (!u) {
          resetHeader();
          return;
        }

        setUser(u);
        // setTimeout(() => void fetchProfile(u.id), 0);
        setTimeout(() => {
          void fetchProfile(u.id);
          void fetchReactionCounts(u.id);
        }, 0);
      }
    );

    const onAuthChanged = () => setTimeout(() => void init(), 0);
    window.addEventListener("auth:changed", onAuthChanged);

    const onFocus = () => setTimeout(() => void init(), 0);
    window.addEventListener("focus", onFocus);

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("auth:changed", onAuthChanged);
      window.removeEventListener("focus", onFocus);
    };
  }, [supabase]);

  // points:updated はOK（ただし getUser を多用しすぎない）
  useEffect(() => {
    const refreshPoints = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;

      setUser(u);
      // if (u) await fetchProfile(u.id);
      if (u) {
        await fetchProfile(u.id);
        await fetchReactionCounts(u.id);
        void fetchFriendNoticeCount(u.id);
      }
    };

    const handler = () => void refreshPoints();
    window.addEventListener("points:updated", handler);
    return () => window.removeEventListener("points:updated", handler);
  }, [supabase]);

  const handleLogout = async () => {
    setConfirmOpen(false);
    setOpen(false);

    // ✅ もし以前Cookie方式も混ざってたなら「両方」消すのが安全
    // await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});

    await supabase.auth.signOut(); // localStorage のセッションを消す

    resetHeader();
    window.dispatchEvent(new Event("auth:changed"));

    router.push("/");
    router.refresh();
  };

  const closeAllMenu = () => {
    setGachaOpen(false);
    setCollectionOpen(false);
    setInfoOpen(false);
    setOpen(false);
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
        // <div className="fixed top-0 right-0 w-68 h-full bg-white shadow-xl z-40 p-5 flex flex-col space-y-2 md:space-y-3 text-lg">
        <div className="fixed top-0 right-0 w-68 h-dvh bg-white shadow-xl z-40 p-5 flex flex-col text-lg">
          <button className="self-end text-2xl" onClick={() => setOpen(false)}>
            ✕
          </button>

          {/* ログイン済み：ユーザー名＆ポイント */}
          {user && (
            // <div className="pb-1 md:pb-2 border-b-3 border-black">
            <div className="-mt-6 md:-mt-8 pb-1 md:pb-2 border-b-3 border-black">
              <div className="rounded-[22px] overflow-hidden bg-white">
                <div className="p-3 md:p-4 grid place-items-center gap-2 md:gap-3">
                  {/* アバター（オーラ＋バッジ） */}
                  <button
                    type="button"
                    onClick={() => !confirmOpen && setAvatarPreviewOpen(true)}
                    className="relative"
                  >
                    <div className="absolute -inset-3 rounded-full blur-[6px] opacity-70 bg-gradient-to-br from-yellow-200 via-pink-200 to-sky-200" />
                    <div className="relative w-25 h-25 md:w-30 md:h-30 rounded-full bg-white overflow-hidden border-3 border-black shadow-[0_5px_0_rgba(0,0,0,1)]">
                      <img
                        src={avatarUrl}
                        alt="icon"
                        className="w-full h-full object-contain bg-white"
                      />
                    </div>
                  </button>

                  {/* 名前 */}
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-extrabold tracking-tight leading-none my-2">
                      {username ? `${username} さん` : "ユーザー"}
                    </p>
                    <p className="mt-1 text-xs font-bold text-gray-600">
                      アイコンをタップで拡大＆変更
                    </p>
                  </div>

                  {/* ステータス（ミニカード2枚） */}
                  <div className="w-full grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border-3 border-black bg-white p-3 shadow-[0_6px_0_rgba(0,0,0,1)]">
                      <p className="text-xs font-black text-gray-600">ユーザーレベル🌟</p>
                      <p className="text-lg font-extrabold">{`Lv.${level ?? 1}`}</p>
                    </div>

                    <div className="rounded-2xl border-3 border-black bg-white p-3 shadow-[0_6px_0_rgba(0,0,0,1)]">
                      <p className="text-xs font-black text-gray-600">所持ポイント💰</p>
                      <p className="text-lg font-extrabold">
                        {points ?? 0}
                        <span className="text-sm font-black ml-1">P</span>
                      </p>
                    </div>
                  </div>

                  {/* もらったリアクション */}
                  {/* <div className="w-full rounded-2xl border-3 border-black bg-white p-3 pb-1 shadow-[0_6px_0_rgba(0,0,0,1)]">
                    <p className="text-xs font-black text-gray-600 text-center">
                      もらったリアクション💬
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div className="flex items-center justify-center gap-1 rounded-xl bg-gray-50 px-2 py-2">
                        <span className="text-lg">👍</span>
                        <span className="text-sm font-extrabold">
                          {reactionCounts.sugoi}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-1 rounded-xl bg-gray-50 px-2 py-2">
                        <span className="text-lg">🔥</span>
                        <span className="text-sm font-extrabold">
                          {reactionCounts.atsui}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-1 rounded-xl bg-gray-50 px-2 py-2">
                        <span className="text-lg">❤️</span>
                        <span className="text-sm font-extrabold">
                          {reactionCounts.iine}
                        </span>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          )}

          {/* 未ログイン */}
          {!user && (
            <div className="flex-1 overflow-y-auto pt-3 space-y-2">
              <Link
                href="/"
                className="block w-full bg-gray-800 text-white py-2 px-4 rounded text-center hover:bg-gray-900"
                onClick={() => setOpen(false)}
              >
                トップページへ
              </Link>
              <Link
                href="/user/login"
                className="block w-full bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600"
                onClick={() => setOpen(false)}
              >
                ログイン
              </Link>

              <Link
                href="/user/signup"
                className="block w-full bg-green-500 text-white py-2 px-4 rounded text-center hover:bg-green-600"
                onClick={() => setOpen(false)}
              >
                新規ユーザー登録（無料）
              </Link>

              {/* ===== その他（共通） ===== */}
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="block w-full bg-gray-500 text-white py-2 px-4 rounded text-center hover:bg-gray-600 cursor-pointer"
              >
                その他
              </button>
            </div>
          )}

          {/* ログイン後メニュー */}
          {/* {user && (
            <> */}
          {user && (
            <div className="flex-1 overflow-y-auto pt-3 space-y-2">
              <Link
                href="/"
                className="block w-full bg-gray-800 text-white py-2 px-4 rounded text-center hover:bg-gray-900"
                onClick={() => setOpen(false)}
              >
                トップページへ
              </Link>
              
              <Link
                href="/user/mypage"
                className="block w-full bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600"
                onClick={() => setOpen(false)}
              >
                マイプロフィール
              </Link>

              {/* <Link
                href="/user/friends"
                className="block w-full bg-yellow-400 text-white py-2 px-4 rounded text-center hover:bg-yellow-500"
                onClick={() => setOpen(false)}
              >
                フレンド👥
              </Link> */}

              <Link
                href="/user/friends"
                className="relative block w-full rounded bg-yellow-400 py-2 px-4 text-center text-white hover:bg-yellow-500"
                onClick={() => setOpen(false)}
              >
                フレンド👥

                {friendNoticeCount > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 grid h-7 min-w-7 place-items-center rounded-full border-2 border-white bg-red-500 px-1.5 text-sm font-black text-white shadow">
                    {friendNoticeCount > 99 ? "99+" : friendNoticeCount}
                  </span>
                )}
              </Link>
              
              {/* <Link
                href="/quiz-gacha"
                className="bg-gradient-to-r from-red-500 via-sky-500 to-green-500 text-white py-2 px-4 rounded text-center hover:opacity-90"
                onClick={() => setOpen(false)}
              >
                ひまキャラガチャ
              </Link>

              <Link
                href="/title-gacha"
                className="bg-gradient-to-r from-purple-500 via-pink-400 to-yellow-300 text-white py-2 px-4 rounded text-center hover:opacity-90"
                onClick={() => setOpen(false)}
              >
                称号ガチャ
              </Link> */}

              <button
                type="button"
                onClick={() => setGachaOpen(true)}
                className="
                  block w-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500
                  text-white py-2 px-4 rounded text-center
                  hover:opacity-90 transition cursor-pointer shadow-md
                "
              >
                ガチャ🎰
              </button>

              {/* <Link
                href="/user/mycharacters"
                className="
                  bg-gradient-to-r from-pink-500 via-purple-400 via-blue-300 to-green-400
                  text-white py-2 px-4 rounded text-center shadow-md
                  hover:opacity-90 transition
                "
                onClick={() => setOpen(false)}
              >
                マイキャラ図鑑📖
              </Link> */}

              <button
                type="button"
                onClick={() => setCollectionOpen(true)}
                className="
                  block w-full bg-gradient-to-r from-pink-500 via-purple-400 via-blue-300 to-green-400
                  text-white py-2 px-4 rounded text-center
                  hover:opacity-90 transition cursor-pointer shadow-md
                "
              >
                図鑑📖
              </button>

              <button
                onClick={() => setConfirmOpen(true)}
                className="block w-full bg-red-500 text-white py-2 px-4 rounded text-center hover:bg-red-600 cursor-pointer"
              >
                ログアウト
              </button>
            {/* </>
          )} */}

              {/* ===== その他（共通） ===== */}
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="block w-full bg-gray-500 text-white py-2 px-4 rounded text-center hover:bg-gray-600 cursor-pointer"
              >
                その他
              </button>
            </div>
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

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmOpen(false)}
          >
            {/* 背景 */}
            <div className="absolute inset-0 bg-black/50" />

            {/* 本体 */}
            <motion.div
              className="relative w-[92%] max-w-sm md:max-w-md rounded-2xl bg-white p-5 shadow-xl"
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, y: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()} // 外側クリックで閉じる、内側は閉じない
            >
              <div className="text-xl md:text-3xl font-extrabold text-gray-900 text-center">
                ⚠ 本当にログアウトしますか？
              </div>

              <div className="mt-2 text-md md:text-xl text-gray-600 leading-relaxed text-center">
                ポイントは保持されます。
                <br />
                いつでも再ログインできます。
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-xl bg-gray-200 py-2 font-bold text-gray-700 hover:bg-gray-300"
                >
                  キャンセル
                </button>

                <button
                  onClick={async () => {
                    setConfirmOpen(false);
                    await handleLogout();
                  }}
                  className="flex-1 rounded-xl bg-red-500 py-2 font-bold text-white hover:bg-red-600"
                >
                  ログアウトする
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {avatarPreviewOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAvatarPreviewOpen(false)} // どこ押しても閉じる
          >
            {/* 背景 */}
            <div className="absolute inset-0 bg-black/60" />

            {/* 画像（拡大）＋ボタン */}
            <motion.div
              className="relative w-[80vw] max-w-[420px]"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()} // 中身クリックで閉じない
            >
              <img
                src={avatarUrl}
                alt="avatar preview"
                className="w-full aspect-square rounded-full bg-white shadow-2xl object-contain"
              />

              <button
                type="button"
                onClick={() => {
                  setAvatarPreviewOpen(false);
                  setOpen(false); // メニューも閉じたいなら（不要なら消してOK）
                  router.push("/user/mypage/edit");
                  router.refresh();
                }}
                className="mt-4 md:mt-8 w-full rounded-4xl bg-white py-3 text-lg md:text-xl font-extrabold hover:scale-[1.01] transition"
              >
                変更する
              </button>
            </motion.div>
          </motion.div>
        )}
        {gachaOpen && (
          <motion.div
            className="fixed inset-0 z-[65] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGachaOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60" />

            <motion.div
              className="relative w-[92%] max-w-sm rounded-3xl bg-white p-5 shadow-2xl border-3 border-black"
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, y: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-black text-gray-900">
                  ガチャ一覧🎰
                </p>
                <p className="mt-1 text-sm font-bold text-gray-500">
                  ポイントでいろんな報酬をゲット！
                </p>
              </div>

              <button
                type="button"
                onClick={() => setGachaOpen(false)}
                className="absolute top-3 right-3 text-xl text-gray-500 hover:text-black"
              >
                ✕
              </button>

              <div className="mt-5 grid gap-3">
                <Link
                  href="/quiz-gacha"
                  onClick={closeAllMenu}
                  className="
                    rounded-2xl border-2 border-black
                    bg-gradient-to-r from-red-500 via-sky-500 to-green-500
                    px-4 py-3 text-white shadow-md hover:scale-[1.02] transition
                  "
                >
                  <p className="text-lg font-black">ひまキャラガチャ</p>
                  <p className="mt-1 text-xs font-bold text-white/90">
                    キャラを集めて図鑑を埋めよう！
                  </p>
                </Link>

                <Link
                  href="/title-gacha"
                  onClick={closeAllMenu}
                  className="
                    rounded-2xl border-2 border-black
                    bg-gradient-to-r from-purple-500 via-pink-400 to-yellow-300
                    px-4 py-3 text-white shadow-md hover:scale-[1.02] transition
                  "
                >
                  <p className="text-lg font-black">称号ガチャ👑</p>
                  <p className="mt-1 text-xs font-bold text-white/90">
                    プロフィールに飾れる称号をゲット！
                  </p>
                </Link>

                <Link
                  href="/style-gacha"
                  onClick={closeAllMenu}
                  className="
                    rounded-2xl border-2 border-black
                    bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500
                    px-4 py-3 text-white shadow-md hover:scale-[1.02] transition
                  "
                >
                  <p className="text-lg font-black">ひまスタイルガチャ🎨</p>
                  <p className="mt-1 text-xs font-bold text-white/90">
                    ゲームで使う自分の見た目をゲット！
                  </p>
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setGachaOpen(false)}
                className="mt-5 w-full rounded-xl bg-black text-white py-2 font-bold hover:opacity-90 transition"
              >
                閉じる
              </button>
            </motion.div>
          </motion.div>
        )}
        {collectionOpen && (
          <motion.div
            className="fixed inset-0 z-[65] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCollectionOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60" />

            <motion.div
              className="relative w-[92%] max-w-sm rounded-3xl bg-white p-5 shadow-2xl border-3 border-black"
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, y: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-black text-gray-900">
                  図鑑一覧📖
                </p>
                <p className="mt-1 text-sm font-bold text-gray-500">
                  集めたキャラやスタイルを確認しよう！
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCollectionOpen(false)}
                className="absolute top-3 right-3 text-xl text-gray-500 hover:text-black"
              >
                ✕
              </button>

              <div className="mt-5 grid gap-3">
                <Link
                  href="/user/mycharacters"
                  onClick={closeAllMenu}
                  className="
                    rounded-2xl border-2 border-black
                    bg-gradient-to-r from-pink-500 via-purple-400 via-blue-300 to-green-400
                    px-4 py-3 text-white shadow-md hover:scale-[1.02] transition
                  "
                >
                  <p className="text-lg font-black">マイキャラ図鑑📖</p>
                  <p className="mt-1 text-xs font-bold text-white/90">
                    ガチャで手に入れたキャラを確認！
                  </p>
                </Link>

                <Link
                  href="/user/mystyle"
                  onClick={closeAllMenu}
                  className="
                    rounded-2xl border-2 border-black
                    bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500
                    px-4 py-3 text-white shadow-md hover:scale-[1.02] transition
                  "
                >
                  <p className="text-lg font-black">ひまスタイル図鑑🎨</p>
                  <p className="mt-1 text-xs font-bold text-white/90">
                    ゲームで使う見た目を確認！
                  </p>
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setCollectionOpen(false)}
                className="mt-5 w-full rounded-xl bg-black text-white py-2 font-bold hover:opacity-90 transition"
              >
                閉じる
              </button>
            </motion.div>
          </motion.div>
        )}
        {infoOpen && (
          <motion.div
            className="fixed inset-0 z-[65] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInfoOpen(false)}
          >
            {/* 背景 */}
            <div className="absolute inset-0 bg-black/60" />

            {/* 本体 */}
            <motion.div
              className="relative w-[92%] max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, y: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* タイトル（中央） */}
              <div className="text-center">
                <p className="text-xl md:text-2xl font-extrabold text-gray-800">その他</p>
              </div>

              {/* ×ボタン */}
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="absolute top-3 right-3 text-xl text-gray-500 hover:text-black"
              >
                ✕
              </button>

              {/* メニュー */}
              <div className="mt-5 grid gap-2">
                <Link
                  href="/profile"
                  onClick={() => {
                    setInfoOpen(false);
                    setOpen(false);
                  }}
                  className="rounded-xl bg-gray-100 py-3 text-center font-bold text-gray-800 hover:bg-gray-200 transition"
                >
                  サイト紹介
                </Link>

                <Link
                  href="/privacy"
                  onClick={() => {
                    setInfoOpen(false);
                    setOpen(false);
                  }}
                  className="rounded-xl bg-gray-100 py-3 text-center font-bold text-gray-800 hover:bg-gray-200 transition"
                >
                  プライバシー
                </Link>

                <Link
                  href="/contact"
                  onClick={() => {
                    setInfoOpen(false);
                    setOpen(false);
                  }}
                  className="rounded-xl bg-gray-100 py-3 text-center font-bold text-gray-800 hover:bg-gray-200 transition"
                >
                  お問い合わせ
                </Link>
              </div>

              {/* 閉じる */}
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="mt-4 w-full rounded-xl bg-black text-white py-2 font-bold hover:opacity-90 transition"
              >
                閉じる
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
