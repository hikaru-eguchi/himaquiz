import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'すべての項目を入力してください' }, { status: 400 });
    }

    const msg = {
      to: process.env.TO_EMAIL!,       // 管理者のメールアドレス
      from: process.env.FROM_EMAIL!,   // SendGridで認証済みメール
      subject: `[お問い合わせ] ${name} さんからのメッセージ`,
      text: `名前: ${name}\nメール: ${email}\n\nメッセージ:\n${message}`,
      html: `<p><strong>名前:</strong> ${name}</p>
             <p><strong>メール:</strong> ${email}</p>
             <p><strong>メッセージ:</strong></p>
             <p>${message.replace(/\n/g, '<br>')}</p>`,
    };

    await sgMail.send(msg);

    return NextResponse.json({ message: '送信成功' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '送信中にエラーが発生しました' }, { status: 500 });
  }
}
