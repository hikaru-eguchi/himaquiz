"use client";

import Link from "next/link";

type Row = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  best_streak: number;
};

export default function StreakRankingTop10({ rows }: { rows: Row[] }) {
  const list = rows.slice(0, 10);

  const getRankLabel = (rank: number) => {
    if (rank === 1) return "👑";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}位`;
  };

  const getRowStyle = (rank: number) => {
    if (rank === 1) {
      return "border-yellow-400 bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100 shadow-[0_6px_18px_rgba(234,179,8,0.18)]";
    }
    if (rank === 2) {
      return "border-slate-300 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-100 shadow-[0_6px_16px_rgba(148,163,184,0.15)]";
    }
    if (rank === 3) {
      return "border-orange-300 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100 shadow-[0_6px_16px_rgba(251,146,60,0.15)]";
    }
    if (rank <= 10) {
      return "border-yellow-200 bg-white";
    }
    return "border-gray-200 bg-white";
  };

  const getScoreStyle = (rank: number) => {
    if (rank === 1) return "text-yellow-600";
    if (rank === 2) return "text-slate-500";
    if (rank === 3) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="mt-6">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="rounded-[28px] border border-[#e6dccf] bg-[#f8f8f8] p-4 md:p-6 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
          <div className="text-center">
            <p className="text-sm md:text-base font-black text-red-500 drop-shadow-sm">
              みんなの連続正解チャレンジ🔥
            </p>
            <p className="mt-1 text-lg md:text-2xl font-black text-gray-900">
              連続正解ランキング TOP10🏆
            </p>
          </div>

          <div className="mt-5 space-y-3 max-h-[380px] md:max-h-[420px] overflow-y-auto pr-1">
            {list.map((u, idx) => {
              const rank = idx + 1;
              const avatar = u.avatar_url ?? "/images/初期アイコン.png";
              const username = u.username ?? "名無し";

              return (
                <div
                  key={u.user_id}
                  className={`w-full rounded-2xl border px-3 py-3 md:px-4 md:py-3 transition-transform duration-200 hover:scale-[1.01] ${getRowStyle(rank)}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 md:gap-4">
                      <div
                        className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full border-2 font-extrabold text-sm md:text-base ${
                          rank <= 3
                            ? "border-black bg-white shadow-[0_3px_0_rgba(0,0,0,1)]"
                            : "border-gray-300 bg-gray-50 text-gray-700"
                        }`}
                      >
                        {getRankLabel(rank)}
                      </div>

                      <div className="relative h-10 w-10 md:h-12 md:w-12 shrink-0 overflow-hidden rounded-full border-2 border-black bg-white shadow-[0_3px_0_rgba(0,0,0,1)]">
                        <img
                          src={avatar}
                          alt={username}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm md:text-base font-extrabold text-gray-900">
                          {username}
                        </p>
                        {/* <p className="text-[11px] md:text-xs font-semibold text-gray-500">
                          {rank <= 3
                            ? "TOP3ランカー"
                            : rank <= 10
                            ? "TOP10入り"
                            : "チャレンジャー"}
                        </p> */}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-xl md:text-2xl font-black leading-none ${getScoreStyle(rank)}`}
                      >
                        {u.best_streak ?? 0}
                        <span className="ml-1 mt-1 text-sm md:text-md font-bold text-gray-600">
                          問
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {rows.length === 0 && (
            <p className="mt-4 text-center text-gray-600 font-bold">
              ランキングを読み込み中…
            </p>
          )}

          {/* チャレンジ導線ボタン */}
          <div className="mt-6 text-center">
            <p className="mb-3 text-sm md:text-base font-bold text-gray-700">
              連続正解でランキング入りを目指そう🔥
            </p>

            <Link
              href="/streak-challenge"
              className="w-full md:w-auto flex justify-center"
            >
              <button className="w-[240px] md:w-[280px] px-4 md:px-6 py-3 text-xl md:text-2xl border-2 border-black rounded-full font-black shadow-xl bg-gradient-to-r from-red-500 to-orange-400 text-white hover:scale-110 active:scale-95 transition-all animate-pulse">
                {/* ✅連続正解チャレンジ */}
                🔥 今すぐ挑戦する
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}