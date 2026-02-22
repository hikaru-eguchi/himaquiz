"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // ✅ UX：パスワード表示切り替え（任意）
  const [showPw, setShowPw] = useState(false);

  // パスワード強度チェック関数
  const validatePassword = (pw: string): string | null => {
    if (pw.length < 12) return "パスワードは12文字以上にしてください。";
    if (!/[A-Z]/.test(pw)) return "英大文字を1文字以上含めてください。";
    if (!/[a-z]/.test(pw)) return "英小文字を1文字以上含めてください。";
    if (!/[0-9]/.test(pw)) return "数字を1文字以上含めてください。";
    return null;
  };

  const passwordError = password ? validatePassword(password) : null;

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

      const pwErr = validatePassword(password);
      if (pwErr) {
        setError(pwErr);
        setLoading(false);
        return;
      }

      const { data: existingUser, error: selectError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (selectError && selectError.code !== "PGRST116") {
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

      const authEmail = `${userId}@hima-quiz.com`;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: authEmail,
        password,
      });

      if (signUpError) {
        console.error(signUpError);
        const msg = (signUpError as any).message ?? "";
        if (msg.includes("User already registered")) {
          setError("このユーザーIDはすでに使用されています。");
        } else {
          setError("ユーザー作成に失敗しました。");
        }
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("ユーザー作成に失敗しました。");
        setLoading(false);
        return;
      }

      const user = data.user;

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

      const { error: ensureErr } = await supabase.rpc("ensure_friend_code");
      if (ensureErr) console.warn("ensure_friend_code error:", ensureErr);

      setIsRegistered(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 登録完了画面（デザイン統一）
  if (isRegistered) {
    return (
      <div className="min-h-[calc(100vh-0px)] bg-gradient-to-b from-sky-50 via-white to-amber-50">
        <div className="max-w-md mx-auto px-4 py-10 space-y-4">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              ユーザー登録が完了しました！
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              登録した内容でログインしています。<br />
              そのままひまQを楽しんでね！
            </p>

            <button
              onClick={() => router.push("/")}
              className="mt-2 w-full rounded-xl py-3 font-extrabold text-white
                         bg-gradient-to-r from-sky-500 to-blue-600
                         hover:opacity-95 active:opacity-90"
            >
              トップページへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ 登録フォーム
  return (
    <div className="min-h-[calc(100vh-0px)] bg-gradient-to-b from-sky-50 via-white to-amber-50">
      <div className="max-w-md mx-auto px-4 py-10 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-black/5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              新規ユーザー登録（無料）
            </h1>
          </div>
          <p className="text-md md:text-lg text-gray-600">
            30秒でスタート！あとから変更もできます
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4 space-y-4"
        >
          {/* username */}
          <div className="space-y-1">
            <label className="block text-md md:text-lg font-extrabold text-gray-800">
              ユーザー名（表示名）
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3
                         outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="例）ひま太郎"
            />
          </div>

          {/* userId */}
          <div className="space-y-1">
            <label className="block text-md md:text-lg font-extrabold text-gray-800">
              ユーザーID（ログインに使うID）
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 font-mono
                         outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              placeholder="例）hima_taro"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <div className="text-xs text-gray-500 leading-relaxed">
              <p>・覚えやすいIDにしてください</p>
              <p>・半角英数字・記号OK（「@」は使用できません）</p>
            </div>
          </div>

          {/* password */}
          <div className="space-y-1">
            <label className="block text-md md:text-lg font-extrabold text-gray-800">
              パスワード
            </label>

            <div className="relative">
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 pr-20 font-mono
                           outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="12文字以上"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2
                           rounded-lg px-3 py-1 text-xs font-bold
                           bg-gray-100 hover:bg-gray-200"
              >
                {showPw ? "隠す" : "表示"}
              </button>
            </div>

            {/* ✅ ルール表示（エラーはここでも見えるように） */}
            <div className="text-xs text-gray-500 leading-relaxed">
              <p>・12文字以上</p>
              <p>・英大文字 / 英小文字 / 数字をすべて含める</p>
            </div>

            {password && passwordError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {passwordError}
              </div>
            )}
          </div>

          {/* recoveryEmail */}
          <div className="space-y-1">
            <label className="block text-md md:text-lg font-extrabold text-gray-800">
              復旧用メールアドレス（任意）
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3
                         outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              type="email"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              placeholder="登録しておくと、パスワードを忘れたときに復旧できます"
            />
          </div>

          {/* error */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              <p className="font-bold">エラー</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 font-extrabold text-white
                       bg-gradient-to-r from-sky-500 to-blue-600
                       hover:opacity-95 active:opacity-90
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-sm"
          >
            {loading ? "登録中..." : "登録する"}
          </button>
        </form>

        {/* back / login */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/user/login")}
            className="rounded-xl bg-white py-3 font-bold ring-1 ring-black/10 hover:bg-gray-50"
          >
            ログインへ
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-gray-100 py-3 font-bold hover:bg-gray-200"
          >
            トップへ
          </button>
        </div>
      </div>
    </div>
  );
}