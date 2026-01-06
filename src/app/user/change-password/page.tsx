"use client";

import { FormEvent, useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const supabase = createSupabaseBrowserClient();
  const { user, loading: userLoading } = useSupabaseUser();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // ✅ SignUp と同じ強度チェック
  const validatePassword = (password: string): string | null => {
    if (password.length < 12) {
      return "パスワードは12文字以上にしてください。";
    }
    if (!/[A-Z]/.test(password)) {
      return "英大文字を1文字以上含めてください。";
    }
    if (!/[a-z]/.test(password)) {
      return "英小文字を1文字以上含めてください。";
    }
    if (!/[0-9]/.test(password)) {
      return "数字を1文字以上含めてください。";
    }
    return null;
  };

  // 未ログインならログイン画面へ飛ばす
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/user/login");
    }
  }, [user, userLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!user) return;

    // ✅ 6文字チェックは削除して、12文字ルールに置き換え
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setError("新しいパスワードが一致しません。");
      return;
    }

    setSaving(true);

    const TIMEOUT_MS = 5000;

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.error("getSession error:", sessionError);
        setError("ログイン情報の取得に失敗しました。いったんログインし直してからお試しください。");
        return;
      }

      const accessToken = sessionData.session.access_token;

      const updatePromise = fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const timeoutPromise = new Promise<"timeout">((resolve) => {
        setTimeout(() => resolve("timeout"), TIMEOUT_MS);
      });

      const result = await Promise.race([updatePromise, timeoutPromise]);

      if (result === "timeout") {
        setError(
          "5秒以上サーバーから応答がありません。\n" +
            "パスワード自体は変更されている可能性があります。\n" +
            "しばらくしてから、新しいパスワードでログインできるか確認してみてください。"
        );
        return;
      }

      const res = result as Response;

      if (!res.ok) {
        let json: any = null;
        try {
          json = await res.json();
        } catch (_) {}

        const rawMsg = json?.error_description || json?.message || json?.error || "";

        if (
          typeof rawMsg === "string" &&
          rawMsg.includes("New password should be different from the old password")
        ) {
          setError("現在のパスワードと同じパスワードには変更できません。");
        } else if (rawMsg) {
          setError(rawMsg);
        } else {
          setError("パスワードの更新に失敗しました。時間をおいて再度お試しください。");
        }
        return;
      }

      setMessage("パスワードを更新しました。\n次回から新しいパスワードでログインできます。");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "エラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  if (userLoading) {
    return <p className="text-center">読み込み中...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-6 md:mb-8">
        <div className="flex justify-end">
          <button
            onClick={() => router.push("/user/mypage")}
            className="text-sm md:text-base text-blue-600 underline cursor-pointer"
          >
            ← マイページへ戻る
          </button>
        </div>

        <h1 className="text-2xl md:text-4xl font-extrabold text-center mt-4">パスワード変更</h1>
      </div>

      <p className="text-sm md:text-base text-gray-700 mb-4">
        新しいパスワードを入力してください。
        <br />
        12文字以上・英大文字・英小文字・数字をすべて含めてください。
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-md md:text-xl font-medium">新しいパスワード</label>
          <input
            className="border rounded w-full p-2"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            12文字以上・英大文字・英小文字・数字をすべて含めてください
          </p>
        </div>

        <div>
          <label className="block text-md md:text-xl font-medium">新しいパスワード（確認）</label>
          <input
            className="border rounded w-full p-2"
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm md:text-base">{error}</p>}
        {message && <p className="text-green-600 text-sm md:text-base whitespace-pre-wrap">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60 mt-2 md:mt-4 cursor-pointer"
        >
          {saving ? "更新中..." : "パスワードを更新する"}
        </button>
      </form>
    </div>
  );
}
