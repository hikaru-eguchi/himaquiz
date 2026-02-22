"use client";

import { useMemo, useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { PublicFriendProfile } from "@/types/friend";

export default function FriendAddPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [input, setInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<PublicFriendProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const normalized = input.replace(/\s+/g, "").toUpperCase();
  const canSearch = normalized.length > 0 && !searching;
  const canSend = !!result && !sending;

  useEffect(() => {
    if (!successOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSuccessOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [successOpen]);

  const onSearch = async () => {
    setError(null);
    setResult(null);

    if (!normalized) {
      setError("フレンドIDを入力してください");
      return;
    }
    setSearching(true);

    try {
      const { data, error } = await supabase.rpc("search_user_by_friend_code", {
        p_friend_code: normalized,
      });
      if (error) throw error;

      const user = Array.isArray(data) ? data[0] : null;
      if (!user) {
        setError("そのフレンドIDのユーザーが見つかりませんでした");
        return;
      }
      setResult(user as PublicFriendProfile);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "検索に失敗しました");
    } finally {
      setSearching(false);
    }
  };

  const onSendRequest = async () => {
    if (!normalized) return;
    setError(null);
    setSending(true);

    try {
      const { error } = await supabase.rpc("send_friend_request_by_code", {
        p_friend_code: normalized,
      });
      if (error) throw error;

      // ✅ 成功したら「完了モーダル」を表示（画面遷移はしない）
      setSuccessOpen(true);

      // ✅ もし結果カードを残したくないならここで消せる（好み）
      setResult(null);
      setInput("");
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "申請に失敗しました");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-0px)] bg-gradient-to-b from-sky-50 via-white to-amber-50">
      <div className="max-w-md mx-auto px-4 py-8 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-black/5">
            <span className="text-lg">🤝</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              フレンド追加
            </h1>
          </div>
          <p className="text-md md:text-xl text-gray-600">
            フレンドID（10文字）を入力して検索・申請できます
          </p>
        </div>

        {/* Search Card */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4 space-y-3">
          <label className="block text-md md:text-xl font-bold text-gray-700 text-center">
            フレンドID
          </label>

          <div className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例：ABCD2345EF"
              inputMode="text"
              autoCapitalize="characters"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 pr-20
                         outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400
                         font-mono tracking-wider"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <span
                className={`text-xs px-2 py-1 rounded-md ${
                  normalized.length === 10
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {normalized.length}/10
              </span>
            </div>
          </div>

          {/* helper */}
          {/* <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              自動で <span className="font-semibold">大文字化</span>・
              <span className="font-semibold">空白除去</span>します
            </span>
            <span className="font-mono">{normalized || "----------"}</span>
          </div> */}

          <button
            onClick={onSearch}
            disabled={!canSearch}
            className="w-full rounded-xl py-3 font-bold text-white
                       bg-gradient-to-r from-sky-500 to-blue-600
                       hover:opacity-95 active:opacity-90
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-sm"
          >
            {searching ? "検索中..." : "検索する"}
          </button>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        {/* Result Card */}
        {result && (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-gray-900">見つかりました 🎉</p>
              {/* <span className="text-xs rounded-full bg-amber-50 text-amber-700 px-3 py-1">
                申請前に確認
              </span> */}
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <img
                src={result.avatar_url ?? "/images/初期アイコン.png"}
                alt="avatar"
                className="w-14 h-14 rounded-full bg-white border object-contain"
              />
              <div className="min-w-0">
                <p className="font-bold truncate">
                  {result.username ?? "(no name)"}
                </p>
                <p className="text-sm text-gray-600">
                  Lv.{result.level ?? 1} ・ キャラ所持 {result.character_count ?? 0}
                </p>
              </div>
            </div>

            <button
              onClick={onSendRequest}
              disabled={!canSend}
              className="w-full rounded-xl py-3 font-extrabold text-white
                         bg-gradient-to-r from-amber-400 to-orange-500
                         hover:opacity-95 active:opacity-90
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-sm"
            >
              {sending ? "申請中..." : "フレンド申請を送る"}
            </button>

            <p className="text-xs text-gray-500 text-center">
              ※ すでに申請済み / フレンド済みの場合はエラーが表示されます
            </p>
          </div>
        )}

        {/* Footer Buttons */}
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
      {/* ✅ 送信完了モーダル（OKで閉じるだけ・画面はそのまま） */}
      {successOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setSuccessOpen(false)} // 背景クリックで閉じる（好みで消してOK）
        >
          {/* 背景 */}
          <div className="absolute inset-0 bg-black/40" />

          {/* 本体 */}
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl ring-1 ring-black/10 p-5"
            onMouseDown={(e) => e.stopPropagation()} // ✅ モーダル内クリックで閉じないように
          >
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-lg font-extrabold text-gray-900">
                フレンド申請を送りました！
              </p>
              <p className="text-sm text-gray-600">
                相手が承認するとフレンドになります
              </p>
            </div>

            <button
              className="mt-4 w-full rounded-xl py-3 font-bold text-white
                         bg-gradient-to-r from-emerald-500 to-green-600
                         hover:opacity-95 active:opacity-90"
              onClick={() => setSuccessOpen(false)}
              autoFocus
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}