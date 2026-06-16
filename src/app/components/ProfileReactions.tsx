"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const REACTIONS = [
  { key: "sugoi", emoji: "👍", label: "すごい！" },
  { key: "atsui", emoji: "🔥", label: "アツい！" },
  { key: "iine", emoji: "❤️", label: "いいね！" },
] as const;

type ReactionKey = (typeof REACTIONS)[number]["key"];

export default function ProfileReactions({
  targetUserId,
  disabled,
}: {
  targetUserId: string | null | undefined;
  disabled?: boolean;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [showSentMessage, setShowSentMessage] = useState(false);

  useEffect(() => {
    if (!targetUserId) return;

    let alive = true;

    const load = async () => {
      setCounts({});
      setSent({});
      setShowSentMessage(false);

      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id ?? null;
      if (!alive) return;
      setMyUserId(uid);

      const { data: publicProfile } = await supabase
        .from("user_public_profiles")
        .select("sugoi_count, atsui_count, iine_count")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (!alive) return;

      setCounts({
        sugoi: publicProfile?.sugoi_count ?? 0,
        atsui: publicProfile?.atsui_count ?? 0,
        iine: publicProfile?.iine_count ?? 0,
      });

      if (!uid) return;

      const { data: myRows } = await supabase
        .from("profile_reactions")
        .select("reaction_type")
        .eq("target_user_id", targetUserId)
        .eq("sender_user_id", uid);

      if (!alive) return;

      const nextSent: Record<string, boolean> = {};
      for (const r of myRows ?? []) {
        nextSent[r.reaction_type] = true;
      }
      setSent(nextSent);
    };

    void load();

    return () => {
      alive = false;
    };
  }, [supabase, targetUserId]);

  const sendReaction = async (reactionType: ReactionKey) => {
    if (!targetUserId || !myUserId) return;
    if (myUserId === targetUserId) return;
    if (sent[reactionType]) return;

    setSavingKey(reactionType);

    const { error } = await supabase.from("profile_reactions").insert({
      target_user_id: targetUserId,
      sender_user_id: myUserId,
      reaction_type: reactionType,
    });

    setSavingKey(null);

    if (error) return;

    setSent((prev) => ({ ...prev, [reactionType]: true }));
    setCounts((prev) => ({
      ...prev,
      [reactionType]: (prev[reactionType] ?? 0) + 1,
    }));

    setShowSentMessage(true);

    setTimeout(() => {
      setShowSentMessage(false);
    }, 2000);
  };

  const isGuest = !myUserId;
  const isMe = !!myUserId && myUserId === targetUserId;

  return (
    // <div className="mt-4 rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50 px-4 py-4 text-center shadow-sm">
    <div
        onClick={(e) => e.stopPropagation()}
        className="mt-1 md:mt-4 rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50 px-2 md:px-4 py-2 md:py-4 text-center shadow-sm"
    >
      <p className="text-xs font-black text-rose-500">💬 リアクション</p>

      <div className="mt-1 md:mt-3 grid grid-cols-3 gap-2">
        {REACTIONS.map((r) => {
          const alreadySent = !!sent[r.key];
          const isSaving = savingKey === r.key;

          return (
            <button
              key={r.key}
              type="button"
              disabled={
                disabled ||
                isGuest ||
                isMe ||
                alreadySent ||
                isSaving ||
                !targetUserId
              }
              onClick={(e) => {
                e.stopPropagation();
                void sendReaction(r.key);
              }}
              className={[
                "rounded-2xl border-2 px-2 py-2 text-center shadow-sm transition",
                alreadySent
                  ? "border-rose-300 bg-rose-100"
                  : "border-slate-200 bg-white hover:scale-[1.03]",
                "disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              <p className="text-xl">{alreadySent ? "✅" : r.emoji}</p>
              <p className="text-[11px] font-black text-slate-700">
                {alreadySent ? "送信済み" : r.label}
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
                {counts[r.key] ?? 0}
              </p>
            </button>
          );
        })}
      </div>

      {isGuest && (
        <p className="mt-2 text-[11px] font-bold text-slate-400">
          ログインすると送れます
        </p>
      )}

      {isMe && (
        <p className="mt-2 text-[11px] font-bold text-slate-400">
          自分には送れません
        </p>
      )}

      {showSentMessage && (
        <p className="mt-2 text-[11px] font-bold text-emerald-500 animate-pulse">
          ✨ リアクションを送りました！
        </p>
      )}
    </div>
  );
}