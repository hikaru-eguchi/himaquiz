import MonthlyRankingCard from "./MonthlyRankingCard";
import AllTimeStreakRankingCard from "./AllTimeStreakRankingCard";
import StreakRankingTop10 from "./StreakRankingTop10_10";
import DungeonRankingTop10 from "./DungeonRankingTop10_10";
import HimaCharacterRankingTop10 from "./HimaCharacterRankingTop10";
import ArenaWinRankingTop20 from "./ArenaRankingTop10_10";
import OverallRankingTop10 from "./OverallRankingTop10";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

type StreakRankRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  best_streak: number;
};

type DungeonRankRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  best_stage: number;
};

type CharacterRankRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  character_count: number;
};

type ArenaRankRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  arena_wins: number;
  arena_current_win_streak?: number | null;
};

type OverallRankRow = {
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

export default async function WeeklyRankingSection() {
  const supabase = await createSupabaseServerClient();

  const [streakResult, dungeonResult, characterResult, arenaResult, overallResult] = await Promise.all([
    supabase
      .from("user_public_profiles")
      .select("user_id, username, avatar_url, best_streak")
      .order("best_streak", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(30),

    supabase
      .from("user_public_profiles")
      .select("user_id, username, avatar_url, best_stage")
      .order("best_stage", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(30),

    supabase
      .from("user_public_profiles")
      .select("user_id, username, avatar_url, character_count")
      .order("character_count", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(30),

    supabase
      .from("user_public_profiles")
      .select("user_id, username, avatar_url, arena_wins, arena_current_win_streak")
      .order("arena_wins", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(30),

    supabase
      .from("overall_ranking")
      .select(
        "user_id, username, avatar_url, best_streak, best_stage, arena_wins, character_count, streak_rank, dungeon_rank, arena_rank, character_rank, streak_point, dungeon_point, arena_point, character_point, total_rank_score, overall_point"
      )
      .limit(30),
  ]);

  const rows = (streakResult.data ?? []) as StreakRankRow[];
  const rows_d = (dungeonResult.data ?? []) as DungeonRankRow[];
  const rows_c = (characterResult.data ?? []) as CharacterRankRow[];
  const rows_a = (arenaResult.data ?? []) as ArenaRankRow[];
  const rows_o = (overallResult.data ?? []) as OverallRankRow[];

  return (
    <section className="max-w-[700px] mx-auto my-8">
      {/* セクション見出し */}
      <div className="
        border-2 border-gray-500 rounded-2xl
        bg-gradient-to-br from-yellow-100 via-pink-100 to-sky-100
        shadow-xl
        p-1 md:p-6
        relative
        overflow-hidden
      ">
        <div className="flex flex-col items-center text-center gap-3">
          <div>
            <p className="
              text-2xl md:text-4xl font-extrabold drop-shadow
              bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300
              text-white
              px-6 py-2
              rounded-full
              border-3 border-white
              shadow-lg
            ">
              🏆ひまQランキング
            </p>
            <p className="text-md md:text-xl text-gray-700 mt-1 md:mt-2">
              ひまQのトッププレイヤーたちをチェックしよう！
            </p>
          </div>

          {/* 任意：ランキング一覧ページがあるなら */}
          {/* <Link href="/ranking/weekly" className="text-sm md:text-base font-bold underline">
            一覧を見る →
          </Link> */}
        </div>

        {/* ログイン案内（固定でここに出す） */}
        {/* <div className="mt-1 md:mt-3 border-2 border-black rounded-xl bg-white px-3 py-2 text-center">
          <p className="text-sm md:text-md font-bold text-gray-800">
            🔔 ログインするとプレイ結果がランキングに反映されます
          </p>
          <p className="text-sm md:text-md text-gray-700">
            ※未ログインのプレイはランキング集計に入りません
          </p>
        </div> */}

        {/* 中身（3カード） */}
        <div className="mt-2 md:mt-5">
          <AllTimeStreakRankingCard
            title="歴代連続正解数"
            icon="🔥"
            bgClass="from-yellow-200 via-amber-300 to-orange-300"
          />

          {/* <StreakRankingTop10 rows={rows.slice(0, 30)} />

          <DungeonRankingTop10 rows={rows_d.slice(0, 30)} />

          <HimaCharacterRankingTop10 rows={rows_c.slice(0, 30)} /> */}

          <p className="text-center text-sm md:text-xl font-bold text-gray-600">
            👈👉 横にスライドして人気ランキングを見よう！ ✨
          </p>

          <div className="mt-4 overflow-x-auto pb-3">
            <div className="flex w-max gap-4 px-1">
              <div className="w-[320px] md:w-[620px] shrink-0">
                <StreakRankingTop10 rows={rows.slice(0, 30)} />
              </div>

              <div className="w-[320px] md:w-[620px] shrink-0">
                <DungeonRankingTop10 rows={rows_d.slice(0, 30)} />
              </div>

              <div className="w-[320px] md:w-[620px] shrink-0">
                <ArenaWinRankingTop20 rows={rows_a.slice(0, 30)} />
              </div>

              <div className="w-[320px] md:w-[620px] shrink-0">
                <HimaCharacterRankingTop10 rows={rows_c.slice(0, 30)} />
              </div>

              <div className="w-[320px] md:w-[620px] shrink-0">
                <OverallRankingTop10 rows={rows_o.slice(0, 30)} />
              </div>
            </div>
          </div>

          {/* <WeeklyRankingCard
            title="今週のスコア"
            icon="🏆"
            bgClass="from-emerald-50 via-emerald-100 to-emerald-200"
            orderBy="score"
            valueLabel={(r) => `${r.score}pt`}
          />

          <WeeklyRankingCard
            title="今週のプレイ回数"
            icon="🎮"
            bgClass="from-sky-50 via-sky-100 to-sky-200"
            orderBy="play_count"
            valueLabel={(r) => `${r.play_count}回`}
          /> */}

          {/* <MonthlyRankingCard
            title="今月の正解数"
            icon="✅"
            bgClass="from-orange-50 via-orange-100 to-orange-200 border-gray-200"
            orderBy="correct_count"
            valueLabel={(r) => `${r.correct_count}問`}
          /> */}
        </div>
      </div>
    </section>
  );
}
