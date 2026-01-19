"use client";

import { useEffect, useState, FormEvent, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../../hooks/useSupabaseUser";
import { useRouter } from "next/navigation";

const DEFAULT_ICONS = [
  { id: "default_1", name: "はてなマーク", url: "/images/hatena.png" },
  { id: "default_2", name: "スターマーク", url: "/images/hosi.png" },
  { id: "default_3", name: "ハートマーク", url: "/images/ha-to.png" },
] as const;

type DefaultIconId = (typeof DEFAULT_ICONS)[number]["id"];

export default function ProfileEditPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [originalUserId, setOriginalUserId] = useState(""); // 変更前のID保持
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarType, setAvatarType] = useState<"initial" | "default" | "owned">("initial");
  const [avatarCharacterId, setAvatarCharacterId] = useState<string | null>(null);
  const [avatarDefaultId, setAvatarDefaultId] = useState<DefaultIconId | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/user/login");
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, user_id, recovery_email, avatar_character_id, avatar_url")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setUsername(data.username ?? "");
        setUserId(data.user_id ?? "");
        setOriginalUserId(data.user_id ?? "");
        setRecoveryEmail(data.recovery_email ?? "");

        const savedUrl = (data.avatar_url ?? "/images/初期アイコン.png").startsWith("/")
          ? (data.avatar_url ?? "/images/初期アイコン.png")
          : `/${data.avatar_url}`;

        if (data.avatar_character_id) {
          setAvatarType("owned");
          setAvatarCharacterId(data.avatar_character_id);
          setAvatarDefaultId(null);
        } else {
          const hit = DEFAULT_ICONS.find(i => i.url === savedUrl);
          if (hit) {
            setAvatarType("default");
            setAvatarDefaultId(hit.id);
            setAvatarCharacterId(null);
          } else {
            setAvatarType("initial");
            setAvatarDefaultId(null);
            setAvatarCharacterId(null);
          }
        }
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
      const INITIAL = "/images/初期アイコン.png";

      let selectedAvatarUrl = INITIAL;
      let nextAvatarCharacterId: string | null = null;

      if (avatarType === "default" && avatarDefaultId) {
        selectedAvatarUrl = DEFAULT_ICONS.find(i => i.id === avatarDefaultId)?.url ?? INITIAL;
        nextAvatarCharacterId = null;
      }

      if (avatarType === "owned" && avatarCharacterId) {
        const raw = ownedChars.find(c => c.id === avatarCharacterId)?.image_url ?? INITIAL;
        selectedAvatarUrl = raw.startsWith("/") ? raw : `/${raw}`;
        nextAvatarCharacterId = avatarCharacterId;
      }

      const normalizedAvatarUrl =
        selectedAvatarUrl.startsWith("/") ? selectedAvatarUrl : `/${selectedAvatarUrl}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username,
          user_id: userId,
          recovery_email: recoveryEmail || null,
          avatar_character_id: nextAvatarCharacterId,
          avatar_url: normalizedAvatarUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("updateError:", updateError);
        // ここが重要：message / code / details を直接見る
        console.error("message:", (updateError as any).message);
        console.error("code:", (updateError as any).code);
        console.error("details:", (updateError as any).details);
        console.error("hint:", (updateError as any).hint);

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
  
  const selectedUrl = useMemo(() => {
    const INITIAL = "/images/初期アイコン.png";
    
    if (avatarType === "default" && avatarDefaultId) {
      return DEFAULT_ICONS.find(i => i.id === avatarDefaultId)?.url ?? INITIAL;
    }
    if (avatarType === "owned" && avatarCharacterId) {
      const raw = ownedChars.find(c => c.id === avatarCharacterId)?.image_url ?? INITIAL;
      return raw.startsWith("/") ? raw : `/${raw}`;
    }
    return INITIAL;
  }, [avatarType, avatarDefaultId, avatarCharacterId, ownedChars]);
  
  if (userLoading || loading) return <p>読み込み中...</p>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="mb-6 md:mb-8">
        <div className="flex justify-start">
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
              src={selectedUrl}
              className="w-30 md:w-40 h-30 md:h-40 border-2 border-white shadow-lg rounded-full bg-white object-contain"
              alt="selected icon"
            />
            <button
              type="button"
              onClick={() => {
                setAvatarType("initial");
                setAvatarDefaultId(null);
                setAvatarCharacterId(null);
              }}
              className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              初期アイコンにする
            </button>
          </div>

          <p className="text-sm md:text-base text-gray-600 mb-2">＜ 最初から選べるアイコン ＞</p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
            {DEFAULT_ICONS.map((ic) => {
              const selected = avatarType === "default" && avatarDefaultId === ic.id;
              return (
                <button
                  key={ic.id}
                  type="button"
                  onClick={() => {
                    setAvatarType("default");
                    setAvatarDefaultId(ic.id);
                    setAvatarCharacterId(null); // ownedの選択を外す
                  }}
                  className={`p-1 rounded border ${selected ? "border-blue-600 ring-4 ring-blue-400" : "border-gray-400"}`}
                  title={ic.name}
                >
                  <img src={ic.url} alt={ic.name} className="w-full aspect-square object-contain" />
                </button>
              );
            })}
          </div>

          {/* 所持キャラから選択 */}
          <p className="text-sm md:text-base text-gray-600 mb-2">＜ 所持キャラアイコン ＞</p>
          {ownedChars.length === 0 ? (
            <p className="text-sm text-gray-600">まだ所持キャラがいません（ガチャでゲットできます）</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {ownedChars.map(ch => {
                const url = ch.image_url
                  ? ch.image_url.startsWith("/") ? ch.image_url : `/${ch.image_url}`
                  : "/images/初期アイコン.png";

                const selected = avatarType === "owned" && avatarCharacterId === ch.id;

                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setAvatarType("owned");
                      setAvatarCharacterId(ch.id);
                      setAvatarDefaultId(null);
                    }}
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
