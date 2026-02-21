import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// ✅ ChangePasswordPage と同じ強度チェック
function validatePassword(password: string): string | null {
  if (password.length < 12) return "パスワードは12文字以上にしてください。";
  if (!/[A-Z]/.test(password)) return "英大文字を1文字以上含めてください。";
  if (!/[a-z]/.test(password)) return "英小文字を1文字以上含めてください。";
  if (!/[0-9]/.test(password)) return "数字を1文字以上含めてください。";
  return null;
}

export async function POST(req: Request) {
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { ok: false, message: "入力が不足しています。" },
        { status: 400 }
      );
    }
    if (typeof token !== "string" || typeof newPassword !== "string") {
      return NextResponse.json(
        { ok: false, message: "入力が不正です。" },
        { status: 400 }
      );
    }

    // ✅ ここが変更点：12文字 + 大文字/小文字/数字
    const pwErr = validatePassword(newPassword);
    if (pwErr) {
      return NextResponse.json({ ok: false, message: pwErr }, { status: 400 });
    }

    const tokenHash = sha256(token);

    const { data: row, error: selErr } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("id, user_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (selErr) {
      console.error("select token error:", selErr);
      return NextResponse.json(
        { ok: false, message: "サーバーエラーが発生しました。" },
        { status: 500 }
      );
    }

    if (!row) {
      return NextResponse.json(
        { ok: false, message: "リンクが無効か期限切れです。" },
        { status: 400 }
      );
    }
    if (row.used_at) {
      return NextResponse.json(
        { ok: false, message: "このリンクはすでに使用されています。" },
        { status: 400 }
      );
    }
    if (Date.now() > new Date(row.expires_at).getTime()) {
      return NextResponse.json(
        { ok: false, message: "リンクの有効期限が切れています。" },
        { status: 400 }
      );
    }

    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(
      row.user_id,
      { password: newPassword }
    );

    if (updErr) {
      console.error("updateUserById error:", updErr);

      // Supabaseのエラーメッセージに応じて出し分け（任意）
      const raw = (updErr as any)?.message ?? "";
      if (typeof raw === "string" && raw.includes("different from the old")) {
        return NextResponse.json(
          { ok: false, message: "現在のパスワードと同じパスワードには変更できません。" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { ok: false, message: "更新に失敗しました。" },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, message: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}