"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [userId, setUserId] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      // ✅ ここを変更：リンク送信APIへ
      const res = await fetch("/api/user/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, recoveryEmail }),
      });

      // 形式は読んでおく（将来拡張用）
      await res.json().catch(() => null);

      // ✅ システムエラーだけ表示（ユーザー列挙対策）
      if (!res.ok) {
        setError("送信に失敗しました。時間をおいて再度お試しください。");
        return;
      }

      // ✅ 成否に関係なく同じ成功メッセージ
      setMessage(
        "入力内容が正しければ、再設定リンクをメールで送信しました。\n数分待って、迷惑メールも確認してください。"
      );
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">
        パスワード再設定
      </h1>

      <p className="text-sm md:text-base text-gray-700 mb-4">
        ユーザーIDと、登録している復旧用メールアドレスを入力してください。
        <br />
        入力内容が正しければ、パスワード再設定用のリンクをメールでお送りします。
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-md md:text-lg font-medium">ユーザーID</label>
          <input
            className="border rounded w-full p-2"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            placeholder="登録したユーザーID"
          />
        </div>

        <div>
          <label className="block text-md md:text-lg font-medium">復旧用メールアドレス</label>
          <input
            className="border rounded w-full p-2"
            type="email"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            required
            placeholder="プロフィールで設定したメールアドレス"
          />
        </div>

        {error && <p className="text-red-500 text-sm md:text-base">{error}</p>}
        {message && (
          <p className="text-green-600 text-sm md:text-base whitespace-pre-wrap">{message}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60 mt-2"
        >
          {loading ? "送信中..." : "再設定リンクを送る"}
        </button>
      </form>
    </div>
  );
}