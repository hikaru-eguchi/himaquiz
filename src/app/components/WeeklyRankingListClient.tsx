// WeeklyRankingListClient.tsx
"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RankKey = "score" | "correct_count" | "play_count" | "best_streak";

type Row = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  score: number;
  correct_count: number;
  play_count: number;
  best_streak?: number;
};

type PublicProfile = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  level: number | null;
  character_count: number | null;
  current_title: string | null;
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
    if (labelType === "best_streak") return `${u.best_streak ?? 0}問連続✅`;
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
      .select("user_id, username, avatar_url, level, character_count, current_title")
      .eq("user_id", userId)
      .single();

    setLoading(false);

    if (error) {
      setSelected({ user_id: userId, username: null, avatar_url: null, level: null, character_count: null, current_title: null,});
      return;
    }

    setSelected(data as PublicProfile);
  };

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, 10); // ✅ 4〜10位

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

                 <div className="mt-1 relative">
                    {/* オーラ（プロフィールと同系統） */}
                    <div className="absolute -inset-2 rounded-full" />
                    <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-white overflow-hidden border-[2px] border-black shadow-[0_4px_0_rgba(0,0,0,1)]">
                      <img
                        src={u?.avatar_url ?? "/images/初期アイコン.png"}
                        alt={u?.username ?? "user"}
                        className="w-full h-full object-cover"
                      />
                    </div>
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

        {/* ✅ 4位〜5位 */}
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
                <div className="relative w-9 h-9 rounded-full bg-white overflow-hidden border-[2px] border-black shadow-[0_3px_0_rgba(0,0,0,1)]">
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
    className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-[2px] grid place-items-center p-4"
  >
    {/* クリック伝播を止めたいならここで stopPropagation も可 */}
    <div className="w-full max-w-sm rounded-[28px] overflow-hidden shadow-[0_6px_0_rgba(0,0,0,1)] border-3 border-black bg-white">
      {/* ヘッダー帯（ポップ） */}
      <div className="relative px-5 pt-5 pb-4 border-b-3 border-black bg-gradient-to-r from-yellow-200 via-pink-200 to-sky-200">
        {/* ドット柄っぽい演出 */}
        <div className="absolute inset-0 opacity-25">
          <div className="w-full h-full bg-[radial-gradient(circle_at_10px_10px,rgba(0,0,0,0.35)_1.2px,transparent_1.3px)] [background-size:20px_20px]" />
        </div>
        <p className="font-extrabold text-lg tracking-tight">
          ユーザープロフィール👤
        </p>
      </div>

      <div className="p-5">
        <div className="grid place-items-center gap-3">
          {/* アバター（オーラ＋バッジ） */}
          <div className="relative">
            {/* オーラ */}
            <div className="absolute -inset-4 rounded-full blur-[6px] opacity-70 bg-gradient-to-br from-yellow-200 via-pink-200 to-sky-200" />
            {/* 本体 */}
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full bg-white overflow-hidden border-3 border-black shadow-[0_6px_0_rgba(0,0,0,1)]">
              <img
                src={selected?.avatar_url ?? "/images/初期アイコン.png"}
                alt={selected?.username ?? "user"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 名前（ポップ太字＋縁取りっぽい） */}
          <div className="
            flex items-center gap-2
            px-4 py-2
            rounded-full
            border-3 border-black
            bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-50
          ">
            <span className="
              text-xs md:text-sm font-black
              bg-gradient-to-r from-sky-300 to-blue-400
              text-white
              px-3 py-1
              rounded-full
              shadow-[0_1px_0_rgba(0,0,0,1)]
            ">
              👤 NAME
            </span>

            <p className="font-extrabold text-2xl md:text-3xl leading-none text-black">
              {loading ? "読み込み中..." : selected?.username ?? "名無し"}　
            </p>
          </div>

          {/* レベルカード（ステッカー風） */}
          <div className="w-full rounded-3xl border-3 border-black bg-gradient-to-br from-white via-white to-yellow-50 p-2 shadow-[0_3px_0_rgba(0,0,0,1)]">
            <p className="text-sm md:text-base font-black text-yellow-500">
              🌟 ユーザーレベル 🌟
            </p>
            <p className="mt-1 text-3xl md:text-4xl font-extrabold">
              {loading ? "..." : `Lv.${selected?.level ?? "--"}`}
            </p>
          </div>

          {/* 所持キャラ数カード（ステッカー風） */}
          <div className="w-full rounded-3xl border-3 border-black bg-white p-2 shadow-[0_3px_0_rgba(0,0,0,1)]">
            <p className="text-sm md:text-base font-black text-emerald-500">📚 所持キャラ数 📚</p>
            <p className="mt-1 text-3xl md:text-4xl font-extrabold">
              {loading ? "..." : `${selected?.character_count ?? "--"}体`}
            </p>
          </div>

          {/* マイ称号カード（ステッカー風） */}
          <div className="w-full rounded-3xl border-3 border-black bg-white p-2 shadow-[0_3px_0_rgba(0,0,0,1)]">
            <p className="text-sm md:text-base font-black text-purple-500">🏅 マイ称号 🏅</p>
            <p className="mt-1 text-2xl md:text-3xl font-extrabold">
              {loading ? "..." : (selected?.current_title ?? "（未設定）")}
            </p>
          </div>

          {/* 吹き出し案内 */}
          <div className="relative">
            <div className="rounded-2xl bg-white pt-1 font-bold text-sm text-gray-700">
              画面をタップすると閉じます
            </div>
          </div>
        </div>
      </div>
    </div>
  </button>
)}
    </>
  );
}
