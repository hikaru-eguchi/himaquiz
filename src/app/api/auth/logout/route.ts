import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  // ✅ サーバー側でサインアウト → Cookieが消える
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
