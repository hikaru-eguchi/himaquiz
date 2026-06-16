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
  best_stage: number;
};

export default function DungeonRankingTop10({ rows }: { rows: Row[] }) {
  const list = rows.slice(0, 10);

  const getRankLabel = (rank: number) => {
    if (rank === 1) return "👑";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}位`;
  };

  const getRowStyle = (rank: number) => {
    if (rank === 1) {
      return "border-yellow-400 bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100";
    }
    if (rank === 2) {
      return "border-gray-300 bg-gradient-to-r from-gray-50 via-slate-50 to-gray-100";
    }
    if (rank === 3) {
      return "border-orange-300 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100";
    }
    if (rank <= 10) {
      return "border-yellow-200 bg-white";
    }
    return "border-gray-200 bg-white";
  };

  const getScoreColor = (rank: number) => {
    if (rank === 1) return "text-yellow-600";
    if (rank === 2) return "text-gray-500";
    if (rank === 3) return "text-orange-500";
    return "text-purple-600";
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
          <div className="rounded-[28px] border border-[#e6dccf] bg-[#f7f5ff] p-4 md:p-6 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">

            {/* タイトル */}
            <div className="text-center">
              <p className="text-sm md:text-base font-black text-purple-600">
                みんなのクイズダンジョン🏰
              </p>
              <p className="mt-1 text-lg md:text-2xl font-black text-gray-900">
                {/* 最高到達ステージ TOP10🏆 */}
                ダンジョン攻略ランキング🏆
              </p>
            </div>

            {/* リスト */}
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
                    className={`w-full rounded-2xl border px-3 py-3 md:px-4 md:py-3 text-left transition-transform duration-200 hover:scale-[1.01] ${getRowStyle(rank)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* 左側 */}
                      <div className="flex items-center gap-2 md:gap-4 min-w-0">
                        
                        {/* 順位 */}
                        <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full font-extrabold border-2 ${
                          rank <= 3
                            ? "bg-white border-black shadow-[0_3px_0_rgba(0,0,0,1)]"
                            : "bg-gray-50 border-gray-300 text-gray-700"
                        }`}>
                          {getRankLabel(rank)}
                        </div>

                        {/* アイコン */}
                        <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full border-2 border-black bg-white shadow-[0_3px_0_rgba(0,0,0,1)]">
                          <img
                            src={avatar}
                            alt={username}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* 名前 */}
                        <div className="min-w-0 text-left">
                          <p className="truncate text-sm md:text-base font-extrabold text-gray-900">
                            {username}
                          </p>
                          {/* <p className="text-[11px] md:text-xs text-gray-500 font-semibold">
                            {rank <= 3
                              ? "ダンジョン覇者"
                              : rank <= 10
                              ? "上級冒険者"
                              : "挑戦者"}
                          </p> */}
                        </div>
                      </div>

                      {/* 右側スコア */}
                      <div className="text-right shrink-0">
                        <p className={`text-xl md:text-2xl font-black leading-none ${getScoreColor(rank)}`}>
                          {u.best_stage ?? 0}
                          <span className="ml-1 text-gray-500 text-base md:text-lg font-bold">
                            階
                          </span>
                        </p>
                        {/* <p className="mt-1 text-xs md:text-sm font-bold text-gray-600">
                          到達
                        </p> */}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ローディング */}
            {rows.length === 0 && (
              <p className="mt-4 text-center text-gray-600 font-bold">
                ランキングを読み込み中…
              </p>
            )}

            {isLoggedIn && (
              <MyRivalRankingCard
                title="🏰 あなたのライバル"
                column="best_stage"
                unit="階"
              />
            )}

            {/* チャレンジ導線ボタン */}
            <div className="mt-6 text-center">
              <p className="mb-3 text-sm md:text-base font-black text-purple-700">
                最上階を目指して挑戦しよう🏰
              </p>

              <Link
                href="/quiz-master"
                className="w-full md:w-auto flex justify-center"
              >
                <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-purple-500 to-indigo-400 text-white hover:scale-110 active:scale-95 transition-all animate-pulse">
                  {/* ⚔クイズダンジョン */}
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