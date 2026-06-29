"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import UserProfileModal, {
  PublicProfile,
} from "@/app/components/UserProfileModal";

type OverallRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  best_streak: number;
  best_stage: number;
  arena_wins: number;
  character_count: number;

  streak_rank: number;
  dungeon_rank: number;
  arena_rank: number;
  character_rank: number;

  streak_point: number;
  dungeon_point: number;
  arena_point: number;
  character_point: number;

  total_rank_score: number;
  overall_point: number;
};

export default function OverallRankingTop10({
  rows,
}: {
  rows: OverallRow[];
}) {
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
      return "border-purple-200 bg-white";
    }
    return "border-gray-200 bg-white";
  };

  const getScoreStyle = (rank: number) => {
    if (rank === 1) return "text-yellow-600";
    if (rank === 2) return "text-slate-500";
    if (rank === 3) return "text-orange-500";
    return "text-purple-600";
  };

  const openUserProfile = async (userId: string) => {
    setSelected(null);
    setLoading(true);
    setOpen(true);

    const { data, error } = await supabase
      .from("user_public_profiles")
      .select(
        "user_id, username, avatar_url, level, character_count, current_title, friend_code, friend_code_public, friend_recruiting"
      )
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
          <div className="rounded-[28px] border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 via-amber-100 to-yellow-200 p-4 md:p-6 shadow-[0_18px_40px_rgba(234,179,8,0.28)]">
            <div className="text-center">
                <div
                    className="
                    inline-block
                    rounded-2xl
                    border-4 border-yellow-400
                    bg-gradient-to-r
                    from-yellow-100
                    via-amber-200
                    to-yellow-100
                    px-6
                    py-3
                    shadow-lg
                    "
                >
                    <p className="text-sm md:text-base font-black text-amber-700">
                    🌟ひまQ最強プレイヤー🌟
                    </p>

                    <p className="mt-1 text-2xl md:text-3xl font-extrabold text-gray-900">
                    👑 総合ランキング 👑
                    </p>
                </div>

                <div className="mt-3 text-xs md:text-sm font-bold text-gray-600">
                  <p>各ゲームの順位で決まるランキング！</p>
                  <p>あらゆる実力を極めた最強プレイヤーは誰だ！？</p>
                </div>
            </div>

            {/* <div className="mt-5 space-y-3 max-h-[830px] overflow-y-auto pr-1"> */}
            <div
              className={`mt-5 space-y-3 overflow-y-auto pr-1 ${
                isLoggedIn ? "max-h-[830px]" : "max-h-[480px]"
              }`}
            >
              {list.map((u, idx) => {
                const rank = idx + 1;
                const avatar = u.avatar_url ?? "/images/初期アイコン.png";
                const username = u.username ?? "名無し";

                return (
                  <button
                    type="button"
                    key={u.user_id}
                    onClick={() => openUserProfile(u.user_id)}
                    className={`w-full rounded-2xl border px-3 py-3 md:px-4 md:py-3 text-left transition-transform duration-200 hover:scale-[1.01] ${getRowStyle(
                      rank
                    )}`}
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

                          {/* <p className="mt-1 text-[10px] md:text-xs font-bold text-gray-500">
                            連続 {u.best_streak ?? 0}問 / ダンジョン{" "}
                            {u.best_stage ?? 0}制覇
                          </p>

                          <p className="text-[10px] md:text-xs font-bold text-gray-500">
                            アリーナ {u.arena_wins ?? 0}勝 / キャラ{" "}
                            {u.character_count ?? 0}体
                          </p> */}

                          <p className="mt-1 text-[10px] md:text-xs font-bold text-gray-500">
                            連続 {u.best_streak ?? 0}問（{u.streak_rank}位） / ダンジョン {u.best_stage ?? 0}制覇（{u.dungeon_rank}位）
                          </p>

                          <p className="text-[10px] md:text-xs font-bold text-gray-500">
                            アリーナ {u.arena_wins ?? 0}勝（{u.arena_rank}位） / キャラ {u.character_count ?? 0}体（{u.character_rank}位）
                          </p>
                        </div>
                      </div>

                      {/* <div className="shrink-0 text-right">
                        <p
                          className={`text-xl md:text-2xl font-black leading-none ${getScoreStyle(
                            rank
                          )}`}
                        >
                          {u.total_rank_score}
                          <span className="ml-1 text-sm md:text-md font-bold text-gray-600">
                            pt
                          </span>
                        </p>

                        <p className="mt-1 text-[10px] md:text-xs font-bold text-gray-500">
                          連{u.streak_rank}位 / ダ{u.dungeon_rank}位
                        </p>

                        <p className="text-[10px] md:text-xs font-bold text-gray-500">
                          ア{u.arena_rank}位 / キ{u.character_rank}位
                        </p>
                      </div> */}
                      <div className="shrink-0 text-right">
                        <p
                            className={`text-xl md:text-2xl font-black leading-none ${getScoreStyle(
                            rank
                            )}`}
                        >
                            {u.overall_point}
                            <span className="ml-1 text-sm md:text-md font-bold text-gray-600">
                            pt
                            </span>
                        </p>

                        {rank === 1 && (
                            <p className="mt-1 text-xs font-bold text-amber-700">
                            総合王者
                            </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {rows.length === 0 && (
              <p className="mt-4 text-center text-gray-600 font-bold">
                ランキングを読み込み中…
              </p>
            )}
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