"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (userId.includes("@")) {
        setError("ユーザーIDに「@」は使えません。");
        setLoading(false);
        return;
      }

      const authEmail = `${userId}@hima-quiz.com`;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (signInError) {
        console.error(signInError);
        setError("ユーザーIDまたはパスワードが正しくありません。");
        setLoading(false);
        return;
      }

      // ログイン成功
      router.push("/"); // トップページへ（ルートに合わせて変えてOK）
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-center">ログイン</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-md md:text-xl font-medium">ユーザーID</label>
          <input
            className="border rounded w-full p-2"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            placeholder="登録したユーザーID"
          />
        </div>

        <div>
          <label className="block text-md md:text-xl font-medium">パスワード</label>
          <input
            className="border rounded w-full p-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-500 text-md md:text-xl">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60 mt-2 md:mt-4 cursor-pointer"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <div className="mt-4 text-center space-y-3">
        <button
          type="button"
          onClick={() => router.push("/user/forgot-password")}
          className="text-md md:text-base text-blue-700 underline hover:text-blue-900 cursor-pointer"
        >
          パスワードをお忘れの方はこちら
        </button>

        <div className="text-sm md:text-base text-gray-600 mt-6">
          まだユーザー登録がお済みでない方はこちら👇
        </div>

        <button
          type="button"
          onClick={() => router.push("/user/signup")} // ★ここをあなたの新規登録ページのパスに
          className="inline-block px-4 py-2 bg-green-500 text-white rounded-md text-sm md:text-base font-semibold hover:bg-green-600 cursor-pointer"
        >
          新規ユーザー登録
        </button>
      </div>
    </div>
  );
}
