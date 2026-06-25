import StreakRankingTop10 from "./StreakRankingTop10_10";
import DungeonRankingTop10 from "./DungeonRankingTop10_10";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export default async function GuestRankingSection() {
  const supabase = await createSupabaseServerClient();

  const [streakResult, dungeonResult] = await Promise.all([
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
  ]);

  const rows = (streakResult.data ?? []) as StreakRankRow[];
  const rows_d = (dungeonResult.data ?? []) as DungeonRankRow[];

  return (
    <section className="max-w-[700px] mx-auto my-8">
      <div
        className="
          border-2 border-gray-500 rounded-2xl
          bg-gradient-to-br from-yellow-100 via-pink-100 to-sky-100
          shadow-xl
          p-1 md:p-6
          relative
          overflow-hidden
        "
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div>
            <p
              className="
                text-2xl md:text-4xl font-extrabold drop-shadow
                bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300
                text-white
                px-6 py-2
                rounded-full
                border-3 border-white
                shadow-lg
              "
            >
              🏆ひまQランキング
            </p>

            <p className="text-md md:text-xl text-gray-700 mt-1 md:mt-2">
              まずは人気ランキングをチェックしよう！
            </p>
          </div>
        </div>

        <div className="mt-2 md:mt-5">
          <StreakRankingTop10 rows={rows.slice(0, 30)} />

          <DungeonRankingTop10 rows={rows_d.slice(0, 30)} />
        </div>
      </div>
    </section>
  );
}