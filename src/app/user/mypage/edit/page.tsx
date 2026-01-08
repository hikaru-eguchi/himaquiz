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
  const [avatarCharacterId, setAvatarCharacterId] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/user/login");
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, user_id, recovery_email, avatar_character_id")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setUsername(data.username ?? "");
        setUserId(data.user_id ?? "");
        setOriginalUserId(data.user_id ?? "");
        setRecoveryEmail(data.recovery_email ?? "");
        setAvatarCharacterId(data.avatar_character_id ?? null);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, userLoading, supabase, router]);

  type OwnedChar = {
    id: string;
    name: string;
    image_url: string | null;
    rarity: string | null;
  };

  const [ownedChars, setOwnedChars] = useState<OwnedChar[]>([]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) return;

    const fetchOwned = async () => {
      // user_characters から所持キャラIDを取り、characters を引く
      const { data: rows, error } = await supabase
        .from("user_characters")
        .select("character_id")
        .eq("user_id", user.id);

      if (error) return;

      const ids = (rows ?? []).map(r => r.character_id);
      if (ids.length === 0) {
        setOwnedChars([]);
        return;
      }

      const { data: chars } = await supabase
        .from("characters")
        .select("id, name, image_url, rarity")
        .in("id", ids);

      setOwnedChars((chars ?? []) as OwnedChar[]);
    };

    fetchOwned();
  }, [user, userLoading, supabase]);

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
          avatar_character_id: avatarCharacterId,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error(updateError);
        setError("プロフィールの更新に失敗しました。");
        setSaving(false);
        return;
      }

      window.dispatchEvent(new Event("auth:changed"));
      window.dispatchEvent(new Event("points:updated"));

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

        <div className="border rounded p-3">
          <p className="text-md md:text-xl font-medium mb-2">アイコン</p>

          {/* 現在の選択 */}
          <div className="flex items-center gap-3 mb-3">
            <img
              src={
                avatarCharacterId
                  ? (ownedChars.find(c => c.id === avatarCharacterId)?.image_url?.startsWith("/")
                      ? ownedChars.find(c => c.id === avatarCharacterId)?.image_url!
                      : `/${ownedChars.find(c => c.id === avatarCharacterId)?.image_url}`
                    ) ?? "/images/初期アイコン.png"
                  : "/images/初期アイコン.png"
              }
              className="w-30 md:w-40 h-30 md:h-40 border-2 border-white shadow-lg rounded-full bg-white object-contain"
              alt="selected icon"
            />
            <button
              type="button"
              onClick={() => setAvatarCharacterId(null)}
              className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              初期アイコンにする
            </button>
          </div>

          {/* 所持キャラから選択 */}
          {ownedChars.length === 0 ? (
            <p className="text-sm text-gray-600">まだ所持キャラがいません（ガチャでゲットできます）</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {ownedChars.map(ch => {
                const url = ch.image_url
                  ? ch.image_url.startsWith("/") ? ch.image_url : `/${ch.image_url}`
                  : "/images/初期アイコン.png";

                const selected = avatarCharacterId === ch.id;

                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setAvatarCharacterId(ch.id)}
                    className={`p-1 rounded border ${selected ? "border-blue-600 ring-4 ring-blue-400" : "border-gray-400"}`}
                    title={ch.name}
                  >
                    <img src={url} alt={ch.name} className="w-full aspect-square object-contain" />
                  </button>
                );
              })}
            </div>
          )}
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
