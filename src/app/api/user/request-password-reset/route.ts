import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { Resend } from "resend";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_ORIGIN = process.env.APP_ORIGIN ?? "https://www.hima-quiz.com";

// ⭐ Resend
const resend = new Resend(process.env.RESEND_API_KEY!);

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// ⭐ メール送信（Resend版）
async function sendResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: "【ひまQ】パスワード再設定リンク",
    html: `
      <p>ひまQのパスワード再設定です。</p>
      <p>下のリンクから新しいパスワードを設定してください（30分有効）</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>※心当たりがない場合は破棄してください。</p>
    `,
  });
}

export async function POST(req: Request) {
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const { userId, recoveryEmail } = await req.json();

    // 成否を出さない（ユーザー列挙対策）
    const safeOk = NextResponse.json({ ok: true }, { status: 200 });

    if (!userId || !recoveryEmail) return safeOk;
    if (typeof userId !== "string" || typeof recoveryEmail !== "string") return safeOk;
    if (userId.includes("@")) return safeOk;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, recovery_email")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) return safeOk;

    const inputEmail = recoveryEmail.trim().toLowerCase();
    const savedEmail = (profile.recovery_email ?? "").trim().toLowerCase();

    if (!savedEmail) return safeOk;
    if (inputEmail !== savedEmail) return safeOk;

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await supabaseAdmin.from("password_reset_tokens").insert({
      user_id: profile.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    const resetUrl = `${APP_ORIGIN}/user/reset-password?token=${token}`;

    // ⭐ Resend送信
    await sendResetEmail(savedEmail, resetUrl);

    return safeOk;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}