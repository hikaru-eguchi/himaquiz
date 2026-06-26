"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MyRivalRankingCard from "./MyRivalRankingCard";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import UserProfileModal, { PublicProfile } from "@/app/components/UserProfileModal";

type Row = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  arena_wins: number;
  arena_current_win_streak?: number | null;
};

export default function ArenaWinRankingTop20({ rows }: { rows: Row[] }) {
  const list = rows.slice(0, 30);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, [supabase]);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);

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
      return "border-red-200 bg-white";
    }
    return "border-gray-200 bg-white";
  };

  const getScoreStyle = (rank: number) => {
    if (rank === 1) return "text-yellow-600";
    if (rank === 2) return "text-slate-500";
    if (rank === 3) return "text-orange-500";
    return "text-red-500";
  };

  const getArenaTitle = (wins: number) => {
    if (wins >= 1000) return "神";
    if (wins >= 500) return "超越者";
    if (wins >= 400) return "覇王";
    if (wins >= 300) return "神話";
    if (wins >= 200) return "伝説";
    if (wins >= 150) return "王者";
    if (wins >= 100) return "英雄";
    if (wins >= 70) return "達人";
    if (wins >= 50) return "熟練闘士";
    if (wins >= 40) return "上級闘士";
    if (wins >= 30) return "ベテラン闘士";
    if (wins >= 20) return "中級闘士";
    if (wins >= 10) return "初級闘士";
    if (wins >= 5) return "新人闘士";
    return "見習い闘士";
  };

  const openUserProfile = async (userId: string) => {
    setSelected(null);
    setLoading(true);
    setOpen(true);

    const { data, error } = await supabase
      .from("user_public_profiles")
      .select("user_id, username, avatar_url, level, character_count, current_title, friend_code, friend_code_public, friend_recruiting")
      .eq("user_id", userId)
      .single();

    setLoading(false);

    if (error) {
      setSelected({
        user_id: userId,
        username: null,
        avatar_url: null,
        level: null,
        character_count: null,
        current_title: null,
        friend_code: null,
        friend_code_public: false,
        friend_recruiting: null,
      });
      return;
    }

    setSelected(data as PublicProfile);
  };

  return (
    <>
      <div className="mt-6">
        <div className="mx-auto w-full max-w-[760px]">
          <div className="rounded-[28px] border border-red-200 bg-[#fbf8ff] p-1 md:p-4 shadow-[0_12px_30px_rgba(0,0,0,0.08)] md:p-6">
            <div className="text-center">
              <p className="text-sm font-black text-red-500 drop-shadow-sm md:text-base">
                クイズアリーナ⚔️
              </p>

              <p className="mt-1 text-lg font-black text-gray-900 md:text-2xl">
                {/* 勝利数ランキング TOP20🏆 */}
                🔥勝利数ランキング🏆
              </p>

              <p className="mt-2 text-xs font-semibold text-gray-500 md:text-sm">
                たくさん勝利してランキング入りを目指そう！
              </p>
            </div>

            <div className="mt-5 max-h-[380px] md:max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {list.map((u, idx) => {
                const rank = idx + 1;
                const avatar = u.avatar_url ?? "/images/初期アイコン.png";
                const username = u.username ?? "名無し";
                const wins = u.arena_wins ?? 0;
                const title = getArenaTitle(wins);
                const currentWinStreak = u.arena_current_win_streak ?? 0;

                return (
                  <button
                    type="button"
                    key={u.user_id}
                    onClick={() => openUserProfile(u.user_id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-transform duration-200 hover:scale-[1.01] md:px-4 md:py-3 ${getRowStyle(rank)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2 md:gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold md:h-12 md:w-12 md:text-base ${
                            rank <= 3
                              ? "border-black bg-white shadow-[0_3px_0_rgba(0,0,0,1)]"
                              : "border-gray-300 bg-gray-50 text-gray-700"
                          }`}
                        >
                          {getRankLabel(rank)}
                        </div>

                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-black bg-white shadow-[0_3px_0_rgba(0,0,0,1)] md:h-12 md:w-12">
                          <img
                            src={avatar}
                            alt={username}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 text-left">
                          <p className="truncate text-sm font-extrabold text-gray-900 md:text-base">
                            {username}
                          </p>
                          <p className="mt-1 text-xs font-black text-purple-500">
                            {title}
                            {currentWinStreak > 0 && (
                              <span className="ml-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600 md:text-xs">
                                🔥 {currentWinStreak}連勝中
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={`text-xl font-black leading-none md:text-2xl ${getScoreStyle(rank)}`}
                        >
                          {wins}勝
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {rows.length === 0 && (
              <p className="mt-4 text-center font-bold text-gray-600">
                ランキングを読み込み中…
              </p>
            )}

            {isLoggedIn && (
              <MyRivalRankingCard
                title="⚔️ あなたのライバル"
                column="arena_wins"
                unit="勝"
              />
            )}

            {/* チャレンジ導線ボタン */}
            <div className="mt-6 text-center">
              <p className="mb-3 text-sm md:text-base font-black text-purple-700">
                上位を目指して挑戦しよう⚔️
              </p>

              <Link
                href="/quiz-arena"
                className="w-full md:w-auto flex justify-center"
              >
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-[radial-gradient(circle_at_top,#fde68a_0%,#fb7185_28%,#7c3aed_62%,#111827_100%)] text-white hover:scale-110 active:scale-95 transition-all animate-pulse">
                  ⚔ 今すぐ挑戦する
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <UserProfileModal
        open={open}
        loading={loading}
        selected={selected}
        onClose={() => {
          setOpen(false);
          setSelected(null);
          setLoading(false);
        }}
      />
    </>
  );
}