import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server"; // あなたのプロジェクトに合わせて

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_public_profiles")
    .select("user_id, username, avatar_url, best_streak")
    .order("best_streak", { ascending: false })
    .order("updated_at", { ascending: true }) // 同率時の安定化（あれば）
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}