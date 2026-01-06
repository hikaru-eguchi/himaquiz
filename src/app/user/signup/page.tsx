"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function SignUpPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  // パスワード強度チェック関数
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 0. ユーザーIDに「@」が入っていたら弾く（擬似メールに使うので）
      if (userId.includes("@")) {
        setError("ユーザーIDに「@」は使えません。");
        setLoading(false);
        return;
      }

      // パスワード強度チェック
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        setLoading(false);
        return;
      }

      // 1. ユーザーIDの重複チェック（profiles.user_id）
      const { data: existingUser, error: selectError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (selectError && selectError.code !== "PGRST116") {
        // PGRST116 = レコードなし（正常）
        console.error(selectError);
        setError("ユーザーIDの確認中にエラーが発生しました。");
        setLoading(false);
        return;
      }

      if (existingUser) {
        setError("このユーザーIDはすでに使用されています。");
        setLoading(false);
        return;
      }

      // 2. Supabase Auth に擬似メールでユーザー作成
      const authEmail = `${userId}@hima-quiz.com`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: authEmail,
        password,
      });

      if (signUpError) {
        console.error(signUpError);
        setError("ユーザー作成に失敗しました。");
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("ユーザー作成に失敗しました。");
        setLoading(false);
        return;
      }

      const user = data.user;

      // 3. profiles テーブルにレコード作成
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        username,
        user_id: userId,
        recovery_email: recoveryEmail || null,
      });

      if (profileError) {
        console.error(profileError);
        setError("プロフィールの作成に失敗しました。");
        setLoading(false);
        return;
      }

      // ここまで来たら登録完了
      setIsRegistered(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 登録完了後に表示する画面
  if (isRegistered) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-center">ユーザー登録が完了しました！</h1>
        <p className="text-center text-md md:text-xl">
          登録が完了しました。<br />
          下記のボタンからログインしてください。
        </p>
        <button
          onClick={() => router.push("/user/login")} // ルートに合わせて変更してOK（/login など）
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          ログイン画面へ
        </button>
      </div>
    );
  }

  // ✅ 通常の登録フォーム
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-center">新規ユーザー登録</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-md md:text-xl font-medium">ユーザー名（表示名）</label>
          <input
            className="border rounded w-full p-2 mb-1 md:mb-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-md md:text-xl font-medium">
            ユーザーID（ログインに使うID）
          </label>
          <input
            className="border rounded w-full p-2"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            placeholder="例）hima_taro"
          />
          <p className="text-sm md:text-md text-gray-500 mt-1">
            ログインに使うため、覚えやすいものにしてください。
          </p>
          <p className="text-sm md:text-md text-gray-500">
            半角英数字・記号OKですが、「@」は使用できません。
          </p>
        </div>

        <div>
          <label className="block text-md md:text-xl font-medium">パスワード</label>
          <input
            className="border rounded w-full p-2 mb-1 md:mb-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-sm md:text-md text-gray-500 mt-1">
            12文字以上・英大文字・英小文字・数字をすべて含めてください
          </p>
        </div>

        <div>
          <label className="block text-md md:text-xl font-medium">
            復旧用メールアドレス（任意）
          </label>
          <input
            className="border rounded w-full p-2 text-sm md:text-md"
            type="email"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            placeholder="登録しておくと、パスワードを忘れたときに復旧できます"
          />
        </div>

        {error && <p className="text-red-500 text-md md:text-xl">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60 mt-2 md:mt-4 cursor-pointer"
        >
          {loading ? "登録中..." : "登録"}
        </button>
      </form>
    </div>
  );
}
