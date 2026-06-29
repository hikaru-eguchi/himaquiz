import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("overall_ranking")
    .select(
        "user_id, username, avatar_url, best_streak, best_stage, arena_wins, character_count, streak_rank, dungeon_rank, arena_rank, character_rank, streak_point, dungeon_point, arena_point, character_point, total_rank_score, overall_point"
    )
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}