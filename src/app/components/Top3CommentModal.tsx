"use client";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function Top3CommentModal({
  open,
  rank,
  initialValue,
  onClose,
  onSaved,
  userId,
}: {
  open: boolean;
  rank: number;
  initialValue: string;
  userId: string;
  onClose: () => void;
  onSaved: (comment: string) => void;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [draft, setDraft] = useState(initialValue ?? "");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // openのたびに初期値を反映（前回のdraftが残るのを防ぐ）
  useEffect(() => {
    if (!open) return;
    setDraft(initialValue ?? "");
    setErrorMsg(null);
  }, [open, initialValue]);

  if (!open) return null;

  // =========================
  // NGワード（軽量版）
  // =========================
  const normalize = (s: string) =>
    (s ?? "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[._\-・,，。、/\\|!！?？'"“”‘’()（）[\]{}<>]/g, "");

  const NG_PATTERNS: RegExp[] = [
    // 下ネタ系（代表例。必要に応じて増やしてOK）
    /sex/,
    /sexy/,
    /s〇x/,
    /せっくす/,
    /セックス/,
    /えっち/,
    /エッチ/,
    /hentai/,
    /ちんこ/,
    /チンコ/,
    /まんこ/,
    /マンコ/,
    /ちんぽ/,
    /おっぱい/,
    /オッパイ/,
    /ぱんつ/,
    /ペニス/,
    /ぺにす/,
    /あなる/,
    /アナル/,
    /まら/,
    /乳首/,
    /処女/,
    /童貞/,
    // 暴言（代表例）
    /しね/,
    /死ね/,
    /ころす/,
    /殺す/,
    /きえろ/,
    /消えろ/,
    /くそ/,
    /ざこ/,
    /雑魚/,
    /クソ/,
    /ばか/,
    /馬鹿/,
    /バカ/,
    /アホ/,
    /あほ/,
    /カス/,
    /かす/,
    /ゴミ/,
    /きもい/,
    /キモい/,
    /うざい/,
    /ウザい/,
  ];

  const isForbidden = (text: string) => {
    const n = normalize(text);
    if (!n) return { ok: true as const, reason: null as string | null };
    const hit = NG_PATTERNS.some((re) => re.test(n) || re.test(text));
    if (hit) return { ok: false as const, reason: "ごめんね。その言葉はつかえないよ！🙏" };
    return { ok: true as const, reason: null as string | null };
  };

  const save = async () => {
    const trimmed = (draft ?? "").slice(0, 10);

    const check = isForbidden(trimmed);
    if (!check.ok) {
      setErrorMsg(check.reason);
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const { error } = await supabase
      .from("streak_top_comments")
      .upsert({ user_id: userId, comment: trimmed }, { onConflict: "user_id" });

    setSaving(false);

    if (error) {
      setErrorMsg("保存に失敗しました🙏 もう一度おねがいします");
      return;
    }

    onSaved(trimmed);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-[2px] grid place-items-center p-4"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className={[
          "relative w-full max-w-sm rounded-[28px] overflow-hidden",
          "border-[3px] border-black bg-white",
          "shadow-[0_10px_0_rgba(0,0,0,1)]",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* 背景キラキラ（軽い） */}
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="w-full h-full bg-[radial-gradient(circle_at_10px_10px,rgba(0,0,0,0.35)_1.2px,transparent_1.3px)] [background-size:18px_18px]" />
        </div>

        {/* ヘッダー */}
        <div className="relative px-5 pt-5 pb-4 border-b-[3px] border-black bg-gradient-to-r from-yellow-200 via-pink-200 to-sky-200">
          {/* キラッ（軽アニメ） */}
          <div className="absolute right-3 top-3 text-xl animate-pulse">✨</div>
          <div className="absolute left-3 top-3 text-xl animate-pulse">✨</div>

          <p className="font-extrabold text-2xl md:text-3xl tracking-tight text-center">
            TOP3入りおめでとう！🎉
          </p>
          <p className="text-md md:text-lg font-bold text-gray-700 mt-1 text-center">
            コメントを設定しよう！（10文字まで）
          </p>
        </div>

        <div className="relative p-5">
          {/* ステッカー風入力 */}
          <div className="rounded-2xl border-2 border-black bg-gradient-to-br from-white via-white to-yellow-50 p-3 shadow-[0_6px_0_rgba(0,0,0,1)]">
            <p className="text-xs font-black text-gray-700 mb-2">
              みんなに一言！💬（例：まだまだ！/ 最強！/ ありがとう！）
            </p>
            <input
              value={draft}
              onChange={(e) => {
                const v = e.target.value.slice(0, 10);
                setDraft(v);
                // 入力中も軽くチェックして表示
                const check = isForbidden(v);
                setErrorMsg(check.ok ? null : check.reason);
              }}
              maxLength={10}
              placeholder="例：まだまだ！"
              className="w-full rounded-xl border-2 border-black px-3 py-2 text-base font-extrabold bg-white"
              autoFocus
            />
          </div>

          {/* エラー */}
          {errorMsg && (
            <div className="mt-3 rounded-xl border-2 border-black bg-red-50 px-3 py-2 shadow-[0_4px_0_rgba(0,0,0,1)]">
              <p className="text-sm font-extrabold text-red-700">⚠️ {errorMsg}</p>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs md:text-md font-bold text-gray-600">
              あと{Math.max(0, 10 - (draft?.length ?? 0))}文字
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded-xl border-2 border-black bg-white font-extrabold text-sm shadow-[0_4px_0_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,1)]"
                onClick={onClose}
                disabled={saving}
              >
                あとで
              </button>

              <button
                type="button"
                className={[
                  "px-3 py-2 rounded-xl border-2 border-black",
                  "bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-200",
                  "font-extrabold text-sm",
                  "shadow-[0_6px_0_rgba(0,0,0,1)]",
                  "hover:opacity-95 active:translate-y-[2px] active:shadow-[0_4px_0_rgba(0,0,0,1)]",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
                onClick={save}
                disabled={saving || !!errorMsg}
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}