"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import UserProfileModal, { PublicProfile } from "@/app/components/UserProfileModal";
import MyRivalRankingCard from "./MyRivalRankingCard";

type Row = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  character_count: number;
};

export default function HimaCharacterRankingTop10({ rows }: { rows: Row[] }) {
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
    // return "border-pink-200 bg-white";
    return "border-fuchsia-200 bg-gradient-to-r from-pink-50 via-yellow-50 to-cyan-50";
  };

  const getScoreStyle = (rank: number) => {
    if (rank === 1) return "text-yellow-600";
    if (rank === 2) return "text-slate-500";
    if (rank === 3) return "text-orange-500";
    // return "text-pink-500";
    return "text-fuchsia-500";
  };

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

  const openUserProfile = async (userId: string) => {
    setSelected(null);
    setLoading(true);
    setOpen(true);

    const { data, error } = await supabase
      .from("user_public_profiles")
      .select("user_id, username, avatar_url, level, character_count, current_title, friend_code, friend_code_public")
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
      });
      return;
    }

    setSelected(data as PublicProfile);
  };

  return (
    <>
      <div className="mt-6">
        <div className="mx-auto w-full max-w-[760px]">
          <div className="rounded-[28px] border border-[#e6dccf] bg-[#f8f8f8] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.08)] md:p-6">
            <div className="text-center">
              {/* <p className="text-sm font-black text-pink-500 drop-shadow-sm md:text-base"> */}
              <p className="text-sm md:text-base font-black text-emerald-500 drop-shadow-sm">
                {/* ひまキャラを集めよう🎨 */}
                {/* ひまキャラ図鑑🌈 */}
                ひまキャラコレクション🌈
              </p>
              <p className="mt-1 text-lg font-black text-gray-900 md:text-2xl">
                {/* ひまキャラ所持数ランキング TOP10🏆 */}
                ひまキャラコレクターランキング🏆
              </p>
            </div>

            {/* <div className="mt-5 space-y-3 max-h-[225px] md:max-h-[250px] overflow-y-auto pr-1"> */}
            <div
              className={`mt-5 space-y-3 overflow-y-auto pr-1 ${
                isLoggedIn
                  ? "max-h-[225px] md:max-h-[250px]"
                  : "max-h-[380px] md:max-h-[420px]"
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
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-transform duration-200 hover:scale-[1.01] md:px-4 ${getRowStyle(rank)}`}
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
                          {/* <p className="text-[11px] font-semibold text-gray-500 md:text-xs">
                            ひまキャラコレクター
                          </p> */}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={`text-xl font-black leading-none md:text-2xl ${getScoreStyle(rank)}`}
                        >
                          {u.character_count ?? 0}
                          <span className="ml-1 text-sm font-bold text-gray-600 md:text-md">
                            体
                          </span>
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
                title="🌈 あなたのライバル"
                column="character_count"
                unit="体"
              />
            )}

            <div className="mt-6 text-center">
              <p className="mb-3 text-sm font-bold text-gray-700 md:text-base">
                ガチャでひまキャラを集めてランキング入りを目指そう🌈
              </p>

              <Link href="/quiz-gacha" className="flex w-full justify-center md:w-auto">
                {/* <button className="w-[240px] rounded-full border-2 border-black bg-gradient-to-r from-pink-500 to-fuchsia-400 px-4 py-3 text-xl font-black text-white shadow-xl transition-all hover:scale-110 active:scale-95 md:w-[280px] md:px-6 md:text-2xl"> */}
                <button className="w-[240px] rounded-full border-2 border-black bg-[linear-gradient(90deg,#ff4d6d,#ffb703,#38b000,#00b4d8,#7b2cbf)] px-4 py-3 text-xl font-black text-white shadow-xl transition-all hover:scale-110 active:scale-95 md:w-[280px] md:px-6 md:text-2xl animate-pulse">
                  🎰 ガチャを引く
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