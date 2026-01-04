"use client";

import { useEffect, useState, FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSupabaseUser } from "../../../../hooks/useSupabaseUser";
import { useRouter } from "next/navigation";

export default function ProfileEditPage() {
  const supabase = createSupabaseBrowserClient();
  const { user, loading: userLoading } = useSupabaseUser();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [originalUserId, setOriginalUserId] = useState(""); // 変更前のID保持
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/user/login");
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, user_id, recovery_email")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setUsername(data.username ?? "");
        setUserId(data.user_id ?? "");
        setOriginalUserId(data.user_id ?? "");
        setRecoveryEmail(data.recovery_email ?? "");
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, userLoading, supabase, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      if (!username.trim()) {
        setError("ユーザー名を入力してください。");
        setSaving(false);
        return;
      }
      
      if (!userId.trim()) {
        setError("ユーザーIDを入力してください。");
        setSaving(false);
        return;
      }
      
      // ユーザーIDに「@」は禁止（擬似メールで使うため）
      if (userId.includes("@")) {
        setError("ユーザーIDに「@」は使えません。");
        setSaving(false);
        return;
      }

      // 1. ユーザーID重複チェック（自分以外で同じ user_id がないか）
      const { data: existing, error: selectError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .neq("id", user.id)
        .maybeSingle();

      if (selectError && selectError.code !== "PGRST116") {
        console.error(selectError);
        setError("ユーザーIDの確認中にエラーが発生しました。");
        setSaving(false);
        return;
      }

      if (existing) {
        setError("このユーザーIDはすでに使用されています。");
        setSaving(false);
        return;
      }

      // 2. userId が変わっていた場合は auth 側の擬似メールも更新
      if (userId !== originalUserId) {
        const newAuthEmail = `${userId}@hima-quiz.com`;

        const { error: authUpdateError } = await supabase.auth.updateUser({
          email: newAuthEmail,
        });

        if (authUpdateError) {
          console.error(authUpdateError);
          setError("ユーザーIDの更新中にエラーが発生しました。");
          setSaving(false);
          return;
        }
      }

      // 3. profiles の更新
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username,
          user_id: userId,
          recovery_email: recoveryEmail || null,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error(updateError);
        setError("プロフィールの更新に失敗しました。");
        setSaving(false);
        return;
      }

      router.push("/user/mypage");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || loading) return <p>読み込み中...</p>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="mb-6 md:mb-8">
        <div className="flex justify-end">
          <button
            onClick={() => router.push("/user/mypage")}
            className="text-sm md:text-base text-blue-600 underline cursor-pointer"
          >
            ← マイページへ戻る
          </button>
        </div>

        <h1 className="text-2xl md:text-4xl font-extrabold text-center mt-4">
          プロフィール編集
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-md md:text-xl font-medium">ユーザー名（表示名）</label>
          <input
            className="border rounded w-full p-2 mb-1 md:mb-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
          />
          <p className="text-sm md:text-md text-gray-500 mt-1">
            「@」は使用できません。
          </p>
        </div>

        <div>
          <label className="block text-md md:text-xl font-medium">
            復旧用メールアドレス（任意）
          </label>
          <input
            className="border rounded w-full p-2"
            type="email"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            placeholder="パスワードを忘れたときのためのメールアドレス"
          />
        </div>

        {error && <p className="text-red-500 text-md md:text-xl">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60 mt-2 md:mt-4 cursor-pointer"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </form>
    </div>
  );
}
