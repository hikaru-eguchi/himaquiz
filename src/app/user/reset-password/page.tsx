"use client";

import { Suspense, FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">
        新しいパスワード設定
      </h1>
      <p className="text-gray-600 text-sm">読み込み中...</p>
    </div>
  );
}

// ✅ ChangePasswordPage と同じ強度チェック
function validatePassword(password: string): string | null {
  if (password.length < 12) return "パスワードは12文字以上にしてください。";
  if (!/[A-Z]/.test(password)) return "英大文字を1文字以上含めてください。";
  if (!/[a-z]/.test(password)) return "英小文字を1文字以上含めてください。";
  if (!/[0-9]/.test(password)) return "数字を1文字以上含めてください。";
  return null;
}

function ResetPasswordInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("リンクが不正です。最初からやり直してください。");
      return;
    }

    // ✅ ここが変更点：12文字 + 大文字/小文字/数字
    const pwErr = validatePassword(pw1);
    if (pwErr) {
      setError(pwErr);
      return;
    }

    if (pw1 !== pw2) {
      setError("パスワードが一致しません。");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/confirm-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pw1 }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(
          data?.message ??
            "更新に失敗しました。リンクが期限切れの可能性があります。"
        );
        return;
      }

      setMessage("パスワードを更新しました。ログインしてください。");
      setTimeout(() => router.push("/user/login"), 800);
    } catch (e: any) {
      setError(e?.message ?? "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">
          新しいパスワード設定
        </h1>
        <p className="text-red-500 text-sm">
          リンクが不正です。最初からやり直してください。
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">
        新しいパスワード設定
      </h1>

      <p className="text-sm text-gray-700 mb-3">
        12文字以上・英大文字・英小文字・数字をすべて含めてください。
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block font-medium">新しいパスワード</label>
          <input
            className="border rounded w-full p-2"
            type="password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">新しいパスワード（確認）</label>
          <input
            className="border rounded w-full p-2"
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? "更新中..." : "パスワードを更新する"}
        </button>
      </form>
    </div>
  );
}