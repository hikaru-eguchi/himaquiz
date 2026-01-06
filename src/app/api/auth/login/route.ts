// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function calcLockSeconds(nextFailedCount: number) {
  if (nextFailedCount >= 30) return 5 * 60;
  if (nextFailedCount >= 20) return 2 * 60;
  if (nextFailedCount >= 10) return 30;
  return 0;
}

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const supabase = await createSupabaseServerClient(); // ✅ Cookie対応のserver client

  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json({ ok: false, message: "入力が不足しています。" }, { status: 400 });
    }
    if (userId.includes("@")) {
      return NextResponse.json({ ok: false, message: "ユーザーIDに「@」は使えません。" }, { status: 400 });
    }

    // --- ① DBでロック確認（前回案のまま） ---
    const { data: throttleRow } = await supabaseAdmin
      .from("login_throttles")
      .select("failed_count, locked_until")
      .eq("user_id", userId)
      .eq("ip", ip)
      .maybeSingle();

    const now = new Date();
    const lockedUntil = throttleRow?.locked_until ? new Date(throttleRow.locked_until) : null;

    if (lockedUntil && lockedUntil.getTime() > now.getTime()) {
      const remainingSec = Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000);
      return NextResponse.json(
        { ok: false, code: "LOCKED", remainingSec, message: `失敗が続いたため、あと${remainingSec}秒待ってからお試しください。` },
        { status: 429 }
      );
    }

    // --- ② Supabase Authログイン（ここが重要） ---
    const authEmail = `${userId}@hima-quiz.com`;

    // ✅ server clientでログインすると、必要なCookieがSet-Cookieされる
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (error || !data.session) {
      // 失敗カウント更新（前回案のまま）
      const currentFailed = throttleRow?.failed_count ?? 0;
      const nextFailed = currentFailed + 1;
      const lockSec = calcLockSeconds(nextFailed);
      const nextLockedUntil = lockSec > 0 ? new Date(Date.now() + lockSec * 1000).toISOString() : null;

      await supabaseAdmin
        .from("login_throttles")
        .upsert(
          { user_id: userId, ip, failed_count: nextFailed, locked_until: nextLockedUntil, updated_at: new Date().toISOString() },
          { onConflict: "user_id,ip" }
        );

      if (lockSec > 0) {
        const msg =
          lockSec >= 300 ? "失敗が続いたため、5分待ってからお試しください。"
          : lockSec >= 120 ? "失敗が続いたため、2分待ってからお試しください。"
          : "失敗が続いたため、30秒待ってからお試しください。";

        return NextResponse.json({ ok: false, code: "LOCKED", remainingSec: lockSec, message: msg }, { status: 429 });
      }

      const nextLockAt = Math.ceil(nextFailed / 10) * 10;
      const remainingToLock = nextLockAt - nextFailed;

      return NextResponse.json(
        {
          ok: false,
          code: "INVALID",
          message: "ユーザーIDまたはパスワードが正しくありません。",
          hint: remainingToLock === 1 ? "次に失敗すると待機が発生します。" : `あと${remainingToLock}回失敗すると待機が発生します。`,
        },
        { status: 401 }
      );
    }

    // --- ③ 成功：失敗カウントリセット ---
    await supabaseAdmin
      .from("login_throttles")
      .upsert(
        { user_id: userId, ip, failed_count: 0, locked_until: null, updated_at: new Date().toISOString() },
        { onConflict: "user_id,ip" }
      );

    // ✅ sessionを返さない（Cookieが入ってるのでこれでOK）
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}
