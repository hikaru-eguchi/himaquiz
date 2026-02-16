// AllTimeRankingListClient.tsx
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
};

export default function AllTimeRankingListClient({
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
      .select("user_id, username, avatar_url, level, character_count")
      .eq("user_id", userId)
      .single();

    setLoading(false);

    if (error) {
      setSelected({ user_id: userId, username: null, avatar_url: null, level: null, character_count: null, });
      return;
    }

    setSelected(data as PublicProfile);
  };

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, 10); // ✅ 4〜10位

  return (
    <>
      {/* ✅ 1〜3位 */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2 items-stretch sm:items-end">
        {[0, 1, 2].map((i) => {
            const u = top3[i];
            const rank = i + 1;
            const orderClass =
              rank === 1 ? "order-1 sm:order-2" : rank === 2 ? "order-2 sm:order-1" : "order-3 sm:order-3";

             const podiumH = rank === 1
               ? "h-44 sm:h-56 md:h-64"
               : rank === 2
               ? "h-42 sm:h-52 md:h-60"
               : "h-40 sm:h-48 md:h-56";

            const ring =
            rank === 1
                ? "ring-4 ring-yellow-400"
                : rank === 2
                ? "ring-2 ring-gray-300"
                : "ring-2 ring-amber-600/40";

            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";

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
                className={`text-center group ${orderClass}`}
              >
                <div
                  className={[
                    "relative rounded-2xl grid place-items-center p-2 md:p-3 shadow-xl overflow-hidden",
                    podiumH,
                    // ベースの枠（太く・立体）
                    "border-[3px] border-black",
                    // 触った時ちょい豪華
                    "transition-transform duration-200 group-hover:-translate-y-[2px] group-hover:shadow-2xl",
                    // 1位/2位/3位で背景変える
                    rank === 1
                      ? "bg-gradient-to-b from-yellow-200 via-amber-100 to-white"
                      : rank === 2
                      ? "bg-gradient-to-b from-slate-100 via-white to-white"
                      : "bg-gradient-to-b from-orange-100 via-amber-50 to-white",
                  ].join(" ")}
                >
                  {/* ふわっとしたオーラ */}
                  <div
                    className={[
                      "absolute -inset-6 blur-xl opacity-70",
                      rank === 1
                        ? "bg-[radial-gradient(circle,rgba(255,215,0,0.65)_0%,transparent_60%)]"
                        : rank === 2
                        ? "bg-[radial-gradient(circle,rgba(200,200,220,0.6)_0%,transparent_60%)]"
                        : "bg-[radial-gradient(circle,rgba(255,150,80,0.55)_0%,transparent_60%)]",
                    ].join(" ")}
                  />

                  {/* キラキラ（ドット） */}
                  <div className="absolute inset-0 opacity-25">
                    <div className="w-full h-full bg-[radial-gradient(circle_at_10px_10px,rgba(0,0,0,0.35)_1.2px,transparent_1.3px)] [background-size:18px_18px]" />
                  </div>

                  {/* リボン（順位ラベル） */}
                  <div
                    className={[
                      "absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-1 rounded-full",
                      "border-2 border-black shadow-[0_3px_0_rgba(0,0,0,1)]",
                      "text-[10px] sm:text-xs md:text-sm font-black text-white",
                      rank === 1
                        ? "bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300"
                        : rank === 2
                        ? "bg-gradient-to-r from-slate-400 via-gray-300 to-slate-200"
                        : "bg-gradient-to-r from-orange-500 via-amber-400 to-orange-300",
                    ].join(" ")}
                  >
                    {rank}位
                  </div>

                  {/* アバター：金属フレーム＋光 */}
                  <div className="mt-8 sm:mt-10 relative">
                    {/* 外側の輝き */}
                    <div
                      className={[
                        "absolute -inset-3 rounded-full blur-[8px] opacity-80",
                        rank === 1
                          ? "bg-gradient-to-br from-yellow-300 via-amber-200 to-transparent"
                          : rank === 2
                          ? "bg-gradient-to-br from-slate-300 via-gray-200 to-transparent"
                          : "bg-gradient-to-br from-orange-300 via-amber-200 to-transparent",
                      ].join(" ")}
                    />
                    {/* 金属っぽい枠 */}
                    <div
                      className={[
                        "relative w-16 h-16 md:w-20 md:h-20 rounded-full p-[3px]",
                        "border-2 border-black shadow-[0_5px_0_rgba(0,0,0,1)]",
                        rank === 1
                          ? "bg-gradient-to-br from-yellow-400 via-amber-300 to-yellow-200"
                          : rank === 2
                          ? "bg-gradient-to-br from-slate-300 via-gray-200 to-slate-100"
                          : "bg-gradient-to-br from-orange-400 via-amber-300 to-orange-200",
                      ].join(" ")}
                    >
                      <div className="w-full h-full rounded-full bg-white overflow-hidden">
                        <img
                          src={u?.avatar_url ?? "/images/初期アイコン.png"}
                          alt={u?.username ?? "user"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 名前：豪華プレート */}
                  <p className="mt-3 text-sm md:text-base font-black truncate w-full px-2 leading-tight">
                    {u?.username ?? "---"}
                  </p>

                  {/* 値：バッジ化 */}
                  <div
                    className={[
                      "mt-2 px-3 py-1 rounded-full",
                      "border-2 border-black bg-white",
                      "shadow-[0_3px_0_rgba(0,0,0,1)]",
                      "text-xs md:text-sm font-extrabold",
                    ].join(" ")}
                  >
                    {u ? formatValue(u) : "--"}
                  </div>

                  {/* 角のキラッ */}
                  <div className="absolute right-3 bottom-3 text-xl opacity-80">✨</div>
                </div>
              </button>
            );
        })}
        </div>

        {/* ✅ 4位〜5位 */}
        {/* <div className="mt-4 space-y-2">
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
        </div> */}

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
    <div className="w-full max-w-sm rounded-[28px] overflow-hidden shadow-[0_8px_0_rgba(0,0,0,1)] border-3 border-black bg-white">
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
        <div className="grid place-items-center gap-4">
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
            flex items-center gap-5
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
          <div className="w-full rounded-3xl border-3 border-black bg-gradient-to-br from-white via-white to-yellow-50 p-4 shadow-[0_6px_0_rgba(0,0,0,1)]">
            <p className="text-sm md:text-base font-black text-gray-700">
              🌟 ユーザーレベル 🌟
            </p>
            <p className="mt-1 text-3xl md:text-4xl font-extrabold">
              {loading ? "..." : `Lv.${selected?.level ?? "--"}`}
            </p>
          </div>

          {/* 所持キャラ数カード（ステッカー風） */}
          <div className="w-full rounded-3xl border-3 border-black bg-white p-4 shadow-[0_6px_0_rgba(0,0,0,1)]">
            <p className="text-sm md:text-base font-black text-gray-700">📚 所持キャラ数 📚</p>
            <p className="mt-1 text-3xl md:text-4xl font-extrabold">
              {loading ? "..." : `${selected?.character_count ?? "--"}体`}
            </p>
          </div>

          {/* 吹き出し案内 */}
          <div className="relative">
            <div className="rounded-2xl bg-white border-2 border-black px-4 py-2 font-bold text-sm text-gray-700 shadow">
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
