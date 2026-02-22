"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../../hooks/useSupabaseUser";
import { useRouter } from "next/navigation";

type GiftRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  character_id: string;
  message: string | null;
  created_at: string;
  characters?: { name: string | null; image_url: string | null };
};

export default function GiftInboxPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [gifts, setGifts] = useState<GiftRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ 連打防止（どのギフトを受け取り中か）
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // ✅ alertの代わり：受け取り完了モーダル
  const [successOpen, setSuccessOpen] = useState(false);
  const [successName, setSuccessName] = useState<string>("");

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
          .from("character_gifts")
          .select(
            "id, from_user_id, to_user_id, character_id, message, created_at, characters(name, image_url)"
          )
          .eq("to_user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setGifts((data ?? []) as GiftRow[]);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user, userLoading, supabase, router]);

  // ✅ ESCでモーダル閉じ（地味に便利）
  useEffect(() => {
    if (!successOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSuccessOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [successOpen]);

  const claim = async (giftId: string, charName?: string | null) => {
    setClaimingId(giftId);
    try {
      const { error } = await supabase.rpc("claim_character_gift", {
        p_gift_id: giftId,
      });
      if (error) throw error;

      // ✅ 受け取り完了モーダル表示（alertより体験が良い）
      setSuccessName(charName ?? "キャラ");
      setSuccessOpen(true);

      setGifts((prev) => prev.filter((g) => g.id !== giftId));
    } catch (e: any) {
      alert(e?.message ?? "受け取りに失敗しました");
    } finally {
      setClaimingId((prev) => (prev === giftId ? null : prev));
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-0px)] bg-gradient-to-b from-sky-50 via-white to-amber-50">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <p className="font-extrabold text-gray-900">読み込み中...</p>
            <p className="text-sm text-gray-600">プレゼントを確認しています</p>
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
            <span className="text-lg">🎁</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              プレゼントBOX
            </h1>
          </div>
          <p className="text-md md:text-xl text-gray-600">
            受け取れるキャラをチェックしよう！
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            <p className="font-bold">エラー</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Empty */}
        {gifts.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center">
              <span className="text-2xl">🫧</span>
            </div>
            <p className="font-extrabold text-gray-900">
              受け取れるプレゼントはありません
            </p>
            <p className="text-sm text-gray-600">
              フレンドからプレゼントが届くとここに表示されます
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {gifts.map((g) => {
              const img = g.characters?.image_url
                ? g.characters.image_url.startsWith("/")
                  ? g.characters.image_url
                  : `/${g.characters.image_url}`
                : "/images/初期アイコン.png";

              const busy = claimingId === g.id;

              return (
                <div
                  key={g.id}
                  className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4 space-y-3"
                >
                  {/* 上段：キャラ情報 */}
                  <div className="flex items-center gap-3">
                    <img
                      src={img}
                      className="w-14 h-14 rounded-xl bg-white border object-contain"
                      alt="char"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold truncate">
                        {g.characters?.name ?? "キャラ"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(g.created_at).toLocaleString("ja-JP")}
                      </p>
                    </div>

                    <span className="text-xs rounded-full bg-amber-50 text-amber-700 px-3 py-1">
                      GIFT
                    </span>
                  </div>

                  {/* メッセージ */}
                  {g.message && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-800 whitespace-pre-wrap">
                      {/* ✅ 改行があっても綺麗に見えるように */}
                      <p className="text-xs text-gray-500 mb-1">メッセージ</p>
                      {g.message}
                    </div>
                  )}

                  {/* 受け取りボタン */}
                  <button
                    onClick={() => claim(g.id, g.characters?.name)}
                    disabled={busy}
                    className="w-full rounded-xl py-3 font-extrabold text-white
                               bg-gradient-to-r from-amber-400 to-orange-500
                               hover:opacity-95 active:opacity-90
                               disabled:opacity-50 disabled:cursor-not-allowed
                               shadow-sm"
                  >
                    {busy ? "受け取り中..." : "受け取る"}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    受け取ると所持キャラに追加されます
                  </p>
                </div>
              );
            })}
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
            onClick={() => router.push("/user/friends/add")}
            className="rounded-xl bg-white py-3 font-bold ring-1 ring-black/10 hover:bg-gray-50"
          >
            フレンド追加へ
          </button>
        </div>
      </div>

      {/* ✅ 受け取り完了モーダル（OKで閉じるだけ） */}
      {successOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setSuccessOpen(false)} // 背景クリックで閉じる（不要なら消してOK）
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl ring-1 ring-black/10 p-5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-lg font-extrabold text-gray-900">
                受け取りました！
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-bold">{successName}</span> が所持キャラに追加されました
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