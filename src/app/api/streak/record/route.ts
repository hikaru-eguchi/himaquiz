// app/api/streak/record/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      streak,
      anonId,
      mode = null,
      genre = null,
      level = null,
      userId = null,
    } = body ?? {};

    const s = Number(streak);

    if (!Number.isFinite(s) || s < 0) {
      return NextResponse.json({ error: "invalid streak" }, { status: 400 });
    }

    // 1) 記録保存
    const { error: insErr } = await supabaseAdmin.from("streak_runs").insert({
      streak: s,
      anon_id: anonId ?? null,
      user_id: userId ?? null,
      mode,
      genre,
      level,
    });

    if (insErr) {
      console.error("insert streak_runs error:", insErr);
      return NextResponse.json({ error: "insert failed" }, { status: 500 });
    }

    // 2) 集計
    // select("*") ではなく select("id") にして無駄を減らす
    const totalQuery = supabaseAdmin
      .from("streak_runs")
      .select("id", { count: "exact", head: true });

    const betterQuery = supabaseAdmin
      .from("streak_runs")
      .select("id", { count: "exact", head: true })
      .gt("streak", s);

    const [
      { count: total, error: totalErr },
      { count: better, error: betterErr },
    ] = await Promise.all([totalQuery, betterQuery]);

    if (totalErr || betterErr) {
      console.error("count error:", totalErr ?? betterErr);
      return NextResponse.json({ error: "count failed" }, { status: 500 });
    }

    const T = total ?? 0;
    const B = better ?? 0;

    // 上位% = 自分より上の人数 / 全体人数 * 100
    const topPercent = T > 0 ? (B / T) * 100 : 0;

    return NextResponse.json({
      ok: true,
      streak: s,
      topPercent,
      total: T,
      better: B,
    });
  } catch (e) {
    console.error("streak record route error:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}