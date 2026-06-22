"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Image from "next/image";
import UserProfileModal, { PublicProfile } from "@/app/components/UserProfileModal";

type RankingRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  clear_time_ms: number;
};

function formatTime(ms: number) {
  return `${(ms / 1000).toFixed(2)}秒`;
}

export default function DailyHardChallengeCard() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      setLoggedIn(true);

      const today = new Date().toISOString().slice(0, 10);

      const { data } = await supabase
        .from("daily_hard_challenge_results")
        .select("id, cleared")
        .eq("user_id", user.id)
        .eq("mission_date", today)
        .maybeSingle();

      setAlreadyPlayed(!!data);
      const { data: rankingData } = await supabase
        .from("daily_hard_challenge_today_ranking")
        .select("*")
        .limit(50);

      setRanking((rankingData ?? []) as RankingRow[]);
      setLoading(false);
    };

    run();
  }, [supabase]);

  const openUserProfile = async (targetUserId: string) => {
    setSelected(null);
    setProfileLoading(true);
    setOpen(true);

    const { data, error } = await supabase
        .from("user_public_profiles")
        .select(
        "user_id, username, avatar_url, level, character_count, current_title, friend_code, friend_code_public, friend_recruiting"
        )
        .eq("user_id", targetUserId)
        .maybeSingle();

    setProfileLoading(false);

    if (error || !data) {
        setSelected({
        user_id: targetUserId,
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

  if (loading) return null;
  if (!loggedIn) return null;

  return (
    <>
        <div className="max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 p-2 md:p-5 bg-gradient-to-br from-amber-950 via-orange-800 to-yellow-500 shadow-xl">
            <p className="text-2xl md:text-4xl font-black text-center text-white drop-shadow mb-2">
                🔥今日の激ムズチャレンジ
            </p>

            <p className="text-lg md:text-xl font-extrabold text-center text-white leading-tight">
                最難関の3問に挑め！全問正解で1000Pゲット！
            </p>

            <p className="mt-1 mb-4 text-base md:text-lg font-bold text-center text-yellow-100">
                今日の激ムズ問題を突破できるか！？
            </p>

            {alreadyPlayed ? (
                <>
                <button
                    disabled
                    className="mx-auto block w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-black shadow-xl bg-gray-300 text-gray-600"
                >
                    本日は挑戦済み
                </button>
                <p className="mt-2 text-center text-sm font-black text-white">
                    また明日チャレンジしてね！
                </p>
                </>
            ) : (
                <>
                <Link href="/daily-hard-challenge" className="flex justify-center">
                    <button className="w-[240px] md:w-[280px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-black shadow-xl bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 text-white hover:scale-110 transition-all">
                    挑戦する
                    </button>
                </Link>
                <p className="mt-2 text-center text-xs md:text-sm font-bold text-yellow-100">
                    ※1日1回のみ挑戦できます
                </p>
                </>
            )}
            <div className="mt-5 rounded-2xl border-2 border-yellow-200 bg-white/85 p-1 md:p-3 shadow">
                <p className="text-center text-lg md:text-xl font-black text-orange-700">
                🏆今日のクリア者
                </p>

                {ranking.length === 0 ? (
                <p className="mt-2 text-center text-sm font-bold text-gray-600">
                    まだクリア者はいません
                </p>
                ) : (
                <div className="mt-3 max-h-[290px] space-y-2 overflow-y-auto pr-1">
                    {ranking.map((row, index) => (
                    <button
                        type="button"
                        key={`${row.user_id}-${index}`}
                        onClick={() => openUserProfile(row.user_id)}
                        className="flex w-full items-center justify-between rounded-xl bg-orange-50 px-3 py-2 border border-orange-200 text-left transition-transform hover:scale-[1.01]"
                    >
                        <div className="flex items-center gap-2">
                        <span className="font-black text-orange-700">
                            {index + 1}位
                        </span>
                        <Image
                            src={row.avatar_url || "/images/default-avatar.png"}
                            alt=""
                            width={40}
                            height={40}
                            className="rounded-full border-2 border-orange-100 object-cover"
                        />
                        <span className="font-black text-gray-800">
                            {row.username ?? "名無し"}
                        </span>
                        </div>

                        <span className="font-black text-red-600">
                        {formatTime(row.clear_time_ms)}
                        </span>
                    </button>
                    ))}
                </div>
                )}
            </div>
        </div>
        <UserProfileModal
            open={open}
            loading={profileLoading}
            selected={selected}
            onClose={() => {
                setOpen(false);
                setSelected(null);
                setProfileLoading(false);
            }}
        />
    </>
  );
}