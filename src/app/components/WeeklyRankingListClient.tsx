// WeeklyRankingListClient.tsx
"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RankKey = "score" | "correct_count" | "play_count";

type Row = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  score: number;
  correct_count: number;
  play_count: number;
};

type PublicProfile = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  level: number | null;
};

export default function WeeklyRankingListClient({
  rows,
  labelType,
}: {
  rows: Row[];
  labelType: RankKey;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const formatValue = (u: Row) => {
    if (labelType === "score") return `${u.score}pt`;
    if (labelType === "play_count") return `${u.play_count}回`;
    return `${u.correct_count}問`;
  };

  const toggleUser = async (userId: string) => {
    if (open && selected?.user_id === userId) {
      setOpen(false);
      setSelected(null);
      return;
    }

    setSelected(null);
    setLoading(true);
    setOpen(true);

    const { data, error } = await supabase
      .from("user_public_profiles")
      .select("user_id, username, avatar_url, level")
      .eq("user_id", userId)
      .single();

    setLoading(false);

    if (error) {
      setSelected({ user_id: userId, username: null, avatar_url: null, level: null });
      return;
    }

    setSelected(data as PublicProfile);
  };

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <>
      {/* ✅ 1〜3位 */}
        <div className="mt-4 grid grid-cols-3 gap-2 items-end">
        {[1, 0, 2].map((i) => {
            const u = top3[i];
            const rank = i + 1;

            const podiumH =
            rank === 1 ? "h-48 md:h-52" : rank === 2 ? "h-44 md:h-48" : "h-40 md:h-44";

            const ring =
            rank === 1
                ? "ring-4 ring-yellow-400"
                : rank === 2
                ? "ring-2 ring-gray-300"
                : "ring-2 ring-amber-600/40";

            const medal = rank === 1 ? "👑" : rank === 2 ? "🥈" : "🥉";

            const topBg =
            rank === 1
                ? "bg-gradient-to-b from-yellow-50 via-yellow-100 to-white"
                : rank === 2
                ? "bg-gradient-to-b from-gray-50 via-slate-100 to-white"
                : "bg-gradient-to-b from-amber-50 via-orange-100 to-white";

            return (
            <button
                type="button"
                key={rank}
                onClick={() => u?.user_id && toggleUser(u.user_id)}
                className="text-center"
            >
                <div className={`rounded-xl ${topBg} ${podiumH} grid place-items-center p-2 md:p-3 shadow ${ring}`}>
                <p className="text-2xl md:text-3xl">{medal}</p>

                <div className="mt-1 w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-black bg-white overflow-hidden shadow">
                    <img
                    src={u?.avatar_url ?? "/images/初期アイコン.png"}
                    alt={u?.username ?? "user"}
                    className="w-full h-full object-cover"
                    />
                </div>

                <p className="mt-2 text-xs md:text-sm font-extrabold truncate w-full px-1">
                    {u?.username ?? "---"}
                </p>

                <p className="text-xs md:text-sm font-bold">
                    {u ? formatValue(u) : "--"}
                </p>
                </div>
            </button>
            );
        })}
        </div>

        {/* ✅ 4位〜10位 */}
        <div className="mt-4 space-y-2">
        {rest.map((u, idx) => (
            <button
            type="button"
            key={u.user_id}
            onClick={() => toggleUser(u.user_id)}
            className="w-full text-left flex items-center justify-between bg-white/80 border-2 border-black rounded-xl px-3 py-2 hover:scale-[1.01] transition"
            >
            <div className="flex items-center gap-2 min-w-0">
                <p className="font-extrabold w-10">{idx + 4}位</p>
                <div className="w-9 h-9 rounded-full border-2 border-black bg-white overflow-hidden">
                <img
                    src={u.avatar_url ?? "/images/初期アイコン.png"}
                    alt={u.username ?? "user"}
                    className="w-full h-full object-cover"
                />
                </div>
                <p className="font-bold truncate">{u.username ?? "名無し"}</p>
            </div>
            <p className="font-extrabold">{formatValue(u)}</p>
            </button>
        ))}
        </div>

      {open && (
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setSelected(null);
            setLoading(false);
          }}
          className="fixed inset-0 z-[999] bg-black/50 grid place-items-center p-4"
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border-2 border-black p-5 shadow-2xl"
          >
            <p className="text-xl md:text-2xl font-extrabold mb-3 text-center">ユーザープロフィール</p>

            <div className="grid place-items-center gap-3">
              <div className="w-35 h-35 md:w-50 md:h-50 rounded-full border-2 border-black bg-white overflow-hidden">
                <img
                  src={selected?.avatar_url ?? "/images/初期アイコン.png"}
                  alt={selected?.username ?? "user"}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="font-extrabold text-3xl md:text-4xl">{loading ? "読み込み中..." : selected?.username ?? "名無し"}</p>

              <p className="text-xl md:text-2xl font-bold text-gray-700">
                ユーザーレベル：Lv.{loading ? "..." : selected?.level ?? "--"}
              </p>

              <p className="text-sm md:text-lg text-gray-500">※画面をタップすると閉じます</p>
            </div>
          </div>
        </button>
      )}
    </>
  );
}
