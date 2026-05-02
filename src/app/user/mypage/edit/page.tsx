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

const GAME_LABEL: Record<string, { label: string; emoji: string }> = {
  level: { label: "レベル称号", emoji: "🌟" },
  streak: { label: "連続正解チャレンジ", emoji: "🔥" },
  timed: { label: "制限時間クイズ", emoji: "⏱️" },
  dungeon: { label: "クイズダンジョン", emoji: "🏰" },
  battle: { label: "クイズバトル", emoji: "⚔️" },
  coop_dungeon: { label: "協力ダンジョン", emoji: "🤝" },
  survival: { label: "サバイバルクイズ", emoji: "🏆" },
};

export default function ProfileEditPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [originalUserId, setOriginalUserId] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarType, setAvatarType] = useState<"initial" | "default" | "owned">("initial");
  const [avatarCharacterId, setAvatarCharacterId] = useState<string | null>(null);
  const [avatarDefaultId, setAvatarDefaultId] = useState<DefaultIconId | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>("");

  type OwnedTitle = { game: string; title: string; unlocked_at: string };
  const [ownedTitles, setOwnedTitles] = useState<OwnedTitle[]>([]);

  type OwnedChar = {
    id: string;
    name: string;
    image_url: string | null;
    rarity: string | null;
  };

  const [ownedChars, setOwnedChars] = useState<OwnedChar[]>([]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/user/login");
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, user_id, recovery_email, avatar_character_id, avatar_url, current_title")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setUsername(data.username ?? "");
        setUserId(data.user_id ?? "");
        setOriginalUserId(data.user_id ?? "");
        setRecoveryEmail(data.recovery_email ?? "");
        setCurrentTitle(data.current_title ?? "");

        const savedUrl = (data.avatar_url ?? "/images/初期アイコン.png").startsWith("/")
          ? (data.avatar_url ?? "/images/初期アイコン.png")
          : `/${data.avatar_url}`;

        if (data.avatar_character_id) {
          setAvatarType("owned");
          setAvatarCharacterId(data.avatar_character_id);
          setAvatarDefaultId(null);
        } else {
          const hit = DEFAULT_ICONS.find((i) => i.url === savedUrl);
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

  useEffect(() => {
    if (userLoading) return;
    if (!user) return;

    type UserCharacterRow = {
      character_id: string | null;
    };

    const fetchOwned = async () => {
      const { data: rows, error } = await supabase
        .from("user_characters")
        .select("character_id")
        .eq("user_id", user.id);

      if (error) return;

      const ids = ((rows ?? []) as UserCharacterRow[])
        .map((r) => r.character_id)
        .filter((v): v is string => !!v);

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

    const fetchTitles = async () => {
      const { data, error } = await supabase
        .from("user_titles")
        .select("game,title,unlocked_at")
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false });

      if (error) {
        console.warn("fetchTitles error:", error);
        setOwnedTitles([]);
        return;
      }

      setOwnedTitles((data ?? []) as OwnedTitle[]);
    };

    fetchOwned();
    fetchTitles();
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

      if (userId.includes("@")) {
        setError("ユーザーIDに「@」は使えません。");
        setSaving(false);
        return;
      }

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

      const INITIAL = "/images/初期アイコン.png";

      let selectedAvatarUrl = INITIAL;
      let nextAvatarCharacterId: string | null = null;

      if (avatarType === "default" && avatarDefaultId) {
        selectedAvatarUrl = DEFAULT_ICONS.find((i) => i.id === avatarDefaultId)?.url ?? INITIAL;
        nextAvatarCharacterId = null;
      }

      if (avatarType === "owned" && avatarCharacterId) {
        const raw = ownedChars.find((c) => c.id === avatarCharacterId)?.image_url ?? INITIAL;
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
          current_title: currentTitle || null,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("updateError:", updateError);
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
      return DEFAULT_ICONS.find((i) => i.id === avatarDefaultId)?.url ?? INITIAL;
    }

    if (avatarType === "owned" && avatarCharacterId) {
      const raw = ownedChars.find((c) => c.id === avatarCharacterId)?.image_url ?? INITIAL;
      return raw.startsWith("/") ? raw : `/${raw}`;
    }

    return INITIAL;
  }, [avatarType, avatarDefaultId, avatarCharacterId, ownedChars]);

  const uniqueTitleOptions = useMemo(() => {
    const titles = ownedTitles
      .map((t) => (t.title ?? "").trim())
      .filter(Boolean);

    return Array.from(new Set(titles));
  }, [ownedTitles]);

  if (userLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-yellow-50 px-4 py-5">
        <div className="mx-auto max-w-md space-y-4">
          <div className="h-12 animate-pulse rounded-2xl bg-gray-200" />
          <div className="h-40 animate-pulse rounded-[2rem] bg-gray-200" />
          <div className="h-72 animate-pulse rounded-[2rem] bg-gray-200" />
          <div className="h-72 animate-pulse rounded-[2rem] bg-gray-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-yellow-50 px-4 py-5">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex justify-start">
          <button
            onClick={() => router.push("/user/mypage")}
            className="rounded-full bg-white px-4 py-2 text-sm font-black text-blue-600 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50 active:scale-95"
          >
            ← マイページへ戻る
          </button>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-500 via-blue-500 to-purple-500 p-5 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-yellow-200/30 blur-2xl" />

          <div className="relative">
            <p className="text-xs font-black text-white/80">PROFILE EDIT</p>
            <h1 className="mt-1 text-2xl font-black">プロフィール編集</h1>
            <p className="mt-2 text-sm font-bold text-white/85">
              表示名・ログインID・アイコン・マイ称号を変更できます。
            </p>
{/* 
            <div className="mt-5 flex items-center gap-4 rounded-3xl bg-white/15 p-4 backdrop-blur">
              <img
                src={selectedUrl}
                className="h-24 w-24 shrink-0 rounded-full bg-white object-contain p-1 shadow-xl"
                alt="selected icon"
              />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white/75">現在の選択</p>
                <p className="truncate text-lg font-black">
                  {username || "ユーザー名未設定"}
                </p>
                <p className="mt-1 truncate text-sm font-bold text-white/80">
                  {currentTitle || "マイ称号未設定"}
                </p>
              </div>
            </div> */}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-[2rem] border border-blue-100 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-black text-blue-500">ACCOUNT</p>
              <h2 className="text-lg font-black text-gray-900">
                基本プロフィール
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-black text-gray-700">
                  ユーザー名（表示名）
                </label>
                <input
                  className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 font-bold text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-black text-gray-700">
                  ユーザーID（ログインに使うID）
                </label>
                <input
                  className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 font-bold text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
                <p className="mt-1 text-xs font-bold text-gray-500">
                  「@」は使用できません。
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-black text-gray-700">
                  復旧用メールアドレス（任意）
                </label>
                <input
                  className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 font-bold text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="パスワードを忘れたときのためのメールアドレス"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-black text-gray-700">
                  マイ称号
                </label>

                <select
                  className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 font-bold text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-100"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                >
                  <option value="">（未設定）</option>
                  {uniqueTitleOptions.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>

                <p className="mt-1 text-xs font-bold text-gray-500">
                  獲得済みの称号から選べます。
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-purple-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-purple-500">AVATAR</p>
                <h2 className="text-lg font-black text-gray-900">アイコン</h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAvatarType("initial");
                  setAvatarDefaultId(null);
                  setAvatarCharacterId(null);
                }}
                className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-black text-gray-700 transition hover:bg-gray-200 active:scale-95"
              >
                初期アイコンにする
              </button>
            </div>

            <div className="mb-5 flex items-center gap-4 rounded-3xl bg-gradient-to-br from-purple-50 to-sky-50 p-4">
              <img
                src={selectedUrl}
                className="h-28 w-28 shrink-0 rounded-full border-4 border-white bg-white object-contain p-1 shadow-lg md:h-36 md:w-36"
                alt="selected icon"
              />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-gray-500">現在の選択</p>
                <p className="mt-1 text-lg font-black text-gray-900">
                  {avatarType === "initial"
                    ? "初期アイコン"
                    : avatarType === "default"
                      ? "デフォルトアイコン"
                      : "所持キャラアイコン"}
                </p>
                <p className="mt-1 text-xs font-bold text-gray-500">
                  保存するとこのアイコンがプロフィールに反映されます。
                </p>
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-black text-gray-700">
                  最初から選べるアイコン
                </p>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-500">
                  {DEFAULT_ICONS.length}種類
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                {DEFAULT_ICONS.map((ic) => {
                  const selected = avatarType === "default" && avatarDefaultId === ic.id;

                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => {
                        setAvatarType("default");
                        setAvatarDefaultId(ic.id);
                        setAvatarCharacterId(null);
                      }}
                      className={`group rounded-3xl border-2 bg-white p-2 shadow-sm transition active:scale-95 ${
                        selected
                          ? "border-blue-500 ring-4 ring-blue-100"
                          : "border-gray-100 hover:border-blue-200 hover:bg-blue-50"
                      }`}
                      title={ic.name}
                    >
                      <div className="rounded-2xl bg-gray-50 p-2">
                        <img
                          src={ic.url}
                          alt={ic.name}
                          className="aspect-square w-full object-contain transition group-hover:scale-105"
                        />
                      </div>
                      <p className="mt-2 truncate text-xs font-black text-gray-700">
                        {ic.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-black text-gray-700">
                  所持キャラアイコン
                </p>
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-500">
                  {ownedChars.length}体
                </span>
              </div>

              {ownedChars.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                  <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                    🎁
                  </div>
                  <p className="font-black text-gray-700">
                    まだ所持キャラがいません
                  </p>
                  <p className="mt-1 text-xs font-bold text-gray-500">
                    ガチャでゲットできます
                  </p>
                </div>
              ) : (
                <div className="max-h-95 overflow-y-auto rounded-3xl border border-gray-100 bg-gray-50/70 p-3 pr-2 md:max-h-95">
                  <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                    {ownedChars.map((ch) => {
                      const url = ch.image_url
                        ? ch.image_url.startsWith("/")
                          ? ch.image_url
                          : `/${ch.image_url}`
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
                          className={`group rounded-3xl border-2 bg-white p-2 shadow-sm transition active:scale-95 ${
                            selected
                              ? "border-blue-500 ring-4 ring-blue-100"
                              : "border-gray-100 hover:border-purple-200 hover:bg-purple-50"
                          }`}
                          title={ch.name}
                        >
                          <div className="rounded-2xl bg-white p-1">
                            <img
                              src={url}
                              alt={ch.name}
                              className="aspect-square w-full object-contain transition group-hover:scale-105"
                            />
                          </div>
                          <p className="mt-2 truncate text-xs font-black text-gray-700">
                            {ch.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm font-black text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-3xl bg-gradient-to-r from-blue-600 via-sky-500 to-purple-500 py-4 text-lg font-black text-white shadow-lg transition hover:scale-[1.01] hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </form>
      </div>
    </main>
  );
}