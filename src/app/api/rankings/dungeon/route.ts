import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_public_profiles")
    .select("user_id, username, avatar_url, best_stage")
    .order("best_stage", { ascending: false })
    .order("updated_at", { ascending: true }) // 同率なら古い記録優先
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}