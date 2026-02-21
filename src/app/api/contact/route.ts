import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// ⭐ Resend 初期化
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "すべての項目を入力してください" },
        { status: 400 }
      );
    }

    // ⭐ Resend送信
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!, // 例: noreply@hima-quiz.com
      to: process.env.TO_EMAIL!,            // 管理者メール
      subject: `[お問い合わせ] ${name} さんからのメッセージ`,
      text: `名前: ${name}\nメール: ${email}\n\nメッセージ:\n${message}`,
      html: `
        <p><strong>名前:</strong> ${name}</p>
        <p><strong>メール:</strong> ${email}</p>
        <p><strong>メッセージ:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json({ message: "送信成功" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "送信中にエラーが発生しました" },
      { status: 500 }
    );
  }
}