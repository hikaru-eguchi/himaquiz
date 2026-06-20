"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../../../hooks/useSupabaseUser";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type OwnedChar = {
  character_id: string;
  count: number;
  characters?: { name: string | null; image_url: string | null };
};

export default function GiftSendPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const router = useRouter();
  const params = useParams();
  const toUserId = typeof params?.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [owned, setOwned] = useState<OwnedChar[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ 送信完了モーダル（alertの代わり）
  const [successOpen, setSuccessOpen] = useState(false);
  const [successName, setSuccessName] = useState<string>("");

// ✅ 1日3体の制限モーダル
  const [limitOpen, setLimitOpen] = useState(false);

  // ✅ 送信ボタンのポップ演出用（クリック毎に+1してアニメを再発火）
  const [sendPopKey, setSendPopKey] = useState(0);

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
          .from("user_characters")
          .select("character_id, count, characters(name, image_url)")
          .eq("user_id", user.id)
          .gt("count", 0)
          .order("count", { ascending: false });

        if (error) throw error;

        const list = (data ?? []) as OwnedChar[];
        setOwned(list);
        if (list.length > 0) setSelected(list[0].character_id);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "所持キャラ取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user, userLoading, supabase, router]);

  // ✅ ESCで成功モーダル閉じ
  useEffect(() => {
    if (!successOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSuccessOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [successOpen]);

  const selectedChar = owned.find((c) => c.character_id === selected);
  const trimmed = message.trim();
  const overLimit = trimmed.length > 30;

  const send = async () => {
    setError(null);

    if (!selected) {
      setError("キャラを選んでください");
      return;
    }
    if (overLimit) {
      setError("コメントは30文字までです");
      return;
    }
    if (!toUserId) {
      setError("送信先が不正です");
      return;
    }

    // ✅ 押した瞬間に“ポップ”演出（送信成功/失敗に関係なく軽く反応）
    setSendPopKey((v) => v + 1);

    setSending(true);
    try {
      const { error } = await supabase.rpc("send_character_gift", {
        p_to_user_id: toUserId,
        p_character_id: selected,
        p_message: trimmed,
      });
      if (error) throw error;

      setSuccessName(selectedChar?.characters?.name ?? "キャラ");
      setSuccessOpen(true);

      window.dispatchEvent(new Event("points:updated"));
      setMessage("");
    } catch (e: any) {
      console.error(e);

      // ✅ Supabaseのエラー文言を拾う（message / details / hint などに入ることがある）
      const msg =
        (e?.message ?? "") +
        " " +
        (e?.details ?? "") +
        " " +
        (e?.hint ?? "");

      // ✅ 1日上限に達したら、エラー表示ではなくモーダルにする
      if (msg.toLowerCase().includes("daily gift limit reached")) {
        setLimitOpen(true);
        return; // ここで止める（error stateは触らない）
      }

      setError(e?.message ?? "送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-0px)] bg-gradient-to-b from-sky-50 via-white to-amber-50">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <span className="text-2xl">🎁</span>
            </div>
            <p className="font-extrabold text-gray-900">読み込み中...</p>
            <p className="text-sm text-gray-600">送れるキャラを探しています</p>
          </div>
        </div>
      </div>
    );
  }

  if (!toUserId) {
    return (
      <div className="min-h-[calc(100vh-0px)] bg-gradient-to-b from-sky-50 via-white to-amber-50">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="font-extrabold text-gray-900">送信先が見つかりません</p>
            <button
              onClick={() => router.back()}
              className="mt-2 w-full rounded-xl bg-gray-100 py-3 font-bold hover:bg-gray-200"
            >
              戻る
            </button>
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
              キャラをプレゼント
            </h1>
          </div>
          <p className="text-md md:text-xl text-gray-600">
            送るキャラを選んで、ひとこと添えよう！
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            <p className="font-bold">エラー</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {owned.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center">
              <span className="text-2xl">🫧</span>
            </div>
            <p className="font-extrabold text-gray-900">送れるキャラがありません</p>
            <p className="text-sm text-gray-600">まずはキャラを集めよう！</p>
          </div>
        ) : (
          <>
            {/* 選択中プレビュー */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
              <p className="font-extrabold text-gray-900 mb-3">選択中</p>
              <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <img
                  src={
                    selectedChar?.characters?.image_url
                      ? selectedChar.characters.image_url.startsWith("/")
                        ? selectedChar.characters.image_url
                        : `/${selectedChar.characters.image_url}`
                      : "/images/初期アイコン.png"
                  }
                  className="w-14 h-14 rounded-xl bg-white border object-contain"
                  alt="selected"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold truncate">
                    {selectedChar?.characters?.name ?? "キャラ"}
                  </p>
                  <p className="text-sm text-gray-600">
                    所持：{selectedChar?.count ?? 0}
                  </p>
                </div>
                {/* <span className="text-xs rounded-full bg-amber-50 text-amber-700 px-3 py-1">
                  PICK
                </span> */}
              </div>
            </div>

            {/* キャラ選択（固定高さ + スクロール） */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-gray-900">キャラを選ぶ</p>
                <span className="text-xs rounded-full bg-gray-100 text-gray-700 px-3 py-1">
                  {owned.length} 体
                </span>
              </div>

              {/* ✅ 高さ固定のスクロール枠 */}
              <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2">
                {owned.map((c) => {
                  const img = c.characters?.image_url
                    ? c.characters.image_url.startsWith("/")
                      ? c.characters.image_url
                      : `/${c.characters.image_url}`
                    : "/images/初期アイコン.png";

                  const active = selected === c.character_id;

                  return (
                    <button
                      key={c.character_id}
                      type="button"
                      onClick={() => setSelected(c.character_id)} // ✅ カード押下で選択（ラジオ無し）
                      className={[
                        "w-full text-left flex items-center gap-3 rounded-2xl border p-3",
                        "transition outline-none",
                        "focus:ring-2 focus:ring-sky-400",
                        active
                          ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200"
                          : "border-gray-100 bg-gray-50 hover:bg-gray-100",
                      ].join(" ")}
                      aria-pressed={active}
                    >
                      <img
                        src={img}
                        className="w-12 h-12 rounded-xl bg-white border object-contain"
                        alt="char"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold truncate">
                          {c.characters?.name ?? "キャラ"}
                        </p>
                        <p className="text-sm text-gray-600">所持：{c.count}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs rounded-full bg-white text-gray-700 px-3 py-1 ring-1 ring-black/10">
                          x{c.count}
                        </span>

                        {/* ✅ 選択中バッジ（あなたのプロフィール編集の選択UIに近いノリ） */}
                        {active && (
                          <span className="text-xs rounded-full bg-white text-amber-700 px-3 py-1 ring-1 ring-amber-200">
                            ✅ 選択中
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-gray-500 text-center">
                ※ スクロールしてキャラを選べます
              </p>
            </div>

            {/* コメント */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-gray-900">コメント</p>
                <span
                  className={`text-xs rounded-full px-3 py-1 ${
                    trimmed.length > 30
                      ? "bg-rose-50 text-rose-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {trimmed.length} / 30
                </span>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white p-3
                           outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                rows={3}
                placeholder="例）いつもありがとう！"
              />
            </div>

            {/* 送信ボタン：framer-motion でポップ */}
            <AnimatePresence mode="wait">
              <motion.button
                key={sendPopKey} // ✅ クリックのたびにキーが変わるので“ポップ”が毎回発火
                onClick={send}
                disabled={sending || !selected || overLimit}
                className="w-full rounded-xl py-3 font-extrabold text-white
                           bg-gradient-to-r from-amber-400 to-orange-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-sm"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.06, 1] }} // ✅ 軽いポップ
                transition={{ duration: 0.22 }}
                whileTap={{ scale: 0.97 }} // ✅ 押し込み感
              >
                {sending ? "送信中..." : "送信する"}
              </motion.button>
            </AnimatePresence>
          </>
        )}

        {/* Footer */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-xl bg-gray-100 py-3 font-bold hover:bg-gray-200"
          >
            戻る
          </button>

          <button
            onClick={() => router.push(`/user/friends/${toUserId}`)}
            className="rounded-xl bg-white py-3 font-bold ring-1 ring-black/10 hover:bg-gray-50"
          >
            フレンド詳細へ
          </button>
        </div>
      </div>

      {/* ✅ 送信完了モーダル */}
      {successOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setSuccessOpen(false)}
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
                プレゼントを送りました！
              </p>
              <p className="text-sm text-gray-600">
                送ったキャラ：<span className="font-extrabold">{successName}</span>
              </p>

              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                <p className="font-extrabold text-base">🎉 +100pt ゲット！</p>
                <p className="text-xs mt-1 text-emerald-700">
                    プレゼント成功！ごほうびポイントだよ ✨
                </p>
              </div>
            </div>

            <button
              className="mt-4 w-full rounded-xl py-3 font-bold text-white
                         bg-gradient-to-r from-emerald-500 to-green-600
                         hover:opacity-95 active:opacity-90"
              onClick={() => {
                setSuccessOpen(false);
                router.push(`/user/friends/${toUserId}`); // 遷移したくないならこの行を消す
              }}
              autoFocus
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* ✅ 1日3体制限モーダル（OKだけ） */}
      {limitOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setLimitOpen(false)} // 背景クリックで閉じる（不要なら消してOK）
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl ring-1 ring-black/10 p-5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                <span className="text-2xl">📌</span>
              </div>
              <p className="text-lg font-extrabold text-gray-900">
                今日はここまで！
              </p>
              <p className="text-sm text-gray-600">
                キャラのプレゼントは <span className="font-extrabold">1日3体まで</span> 送れます。
                <br />
                また明日送ってね！
              </p>
            </div>

            <button
              className="mt-4 w-full rounded-xl py-3 font-bold text-white
                         bg-gradient-to-r from-amber-400 to-orange-500
                         hover:opacity-95 active:opacity-90"
              onClick={() => setLimitOpen(false)}
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