// app/api/user/reset-password/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sendGridApiKey = process.env.SENDGRID_API_KEY!;
const emailFrom = process.env.EMAIL_FROM ?? "no-reply@example.com";
const emailFromName = process.env.EMAIL_FROM_NAME ?? "ひまQ運営";

// Supabase 管理者クライアント（RLS無視して操作できる）
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// SendGrid 初期化（サーバー側のみ）
sgMail.setApiKey(sendGridApiKey);

export async function POST(req: Request) {
  if (!supabaseUrl || !serviceRoleKey || !sendGridApiKey) {
    console.error("Missing env vars");
    return NextResponse.json(
      { success: true, message: "入力が正しければメールを送信しました。" },
      { status: 200 }
    );
  }
  try {
    const { userId, recoveryEmail } = await req.json();

    if (!userId || !recoveryEmail) {
      return NextResponse.json(
        { success: true, message: "入力が正しければメールを送信しました。" },
        { status: 200 }
      );
    }
    if (typeof userId !== "string" || typeof recoveryEmail !== "string") {
      return NextResponse.json(
        { success: true, message: "入力が正しければメールを送信しました。" },
        { status: 200 }
      );
    }
    if (userId.length > 100 || recoveryEmail.length > 254) {
      return NextResponse.json(
        { success: true, message: "入力が正しければメールを送信しました。" },
        { status: 200 }
      );
    }

    // 1. profiles から user_id & recovery_email が一致するユーザーを探す
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, username, recovery_email")
      .eq("user_id", userId)
      .eq("recovery_email", recoveryEmail)
      .maybeSingle();

    if (profileError) console.error(profileError);
    if (!profile) {
      return NextResponse.json(
        { success: true, message: "入力が正しければメールを送信しました。" },
        { status: 200 }
      );
    }

    // 2. 仮パスワードを生成（だいたい12文字前後、英数字-_ みたいな安全なランダム）
    const tempPassword = crypto.randomBytes(9).toString("base64url"); 

    // 3. auth.users のパスワードを更新
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(profile.user_id, {
        password: tempPassword,
      });

    if (updateError) {
      console.error(updateError);
      return NextResponse.json(
        { success: true, message: "入力が正しければメールを送信しました。" },
        { status: 200 }
      );
    }

    // 4. SendGrid で仮パスワードをメール送信
    const toAddress = profile.recovery_email as string;
    const displayName = profile.username ?? profile.user_id ?? "ユーザー";

    const msg = {
      to: toAddress,
      from: {
        email: emailFrom,
        name: emailFromName,
      },
      subject: "【ひまQ】パスワード再設定のお知らせ",
      text: [
        `${displayName} 様`,
        "",
        "ひまQのパスワード再設定のご依頼を受け付けました。",
        "",
        "以下の仮パスワードでログインしてください。",
        "",
        `仮パスワード：${tempPassword}`,
        "",
        "ログイン後は、マイページからお早めにパスワードの再設定を行ってください。",
        "",
        "※このメールに心当たりがない場合は、このメールは破棄してください。",
        "",
        "ひまQ 運営",
      ].join("\n"),
    };

    try {
      await sgMail.send(msg);
    } catch (mailErr: any) {
      console.error("SendGrid error:", mailErr);

      // 応急ロールバック（別のランダムに戻す）
      const rollbackPassword = crypto.randomBytes(18).toString("base64url");
      await supabaseAdmin.auth.admin.updateUserById(profile.user_id, {
        password: rollbackPassword,
      });

      return NextResponse.json(
        { success: true, message: "入力が正しければメールを送信しました。" },
        { status: 200 }
      );
    }

    // 5. 成功レスポンス（仮パスワードは返さない）
    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { success: true, message: "入力が正しければメールを送信しました。" },
      { status: 200 }
    );
  }
}
