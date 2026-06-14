import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_public_profiles")
    .select("user_id, username, avatar_url, arena_wins")
    .not("arena_wins", "is", null)
    .gt("arena_wins", 0)
    .order("arena_wins", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}