"use client";

import { useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { useRouter } from "next/navigation";

type Profile = {
  username: string | null;
  user_id: string | null;
  recovery_email: string | null;
  points: number | null;
  level: number | null;
  exp: number | null;
  avatar_character_id: string | null;
  avatar_url: string | null;
  friend_code: string | null;
};

export default function MyPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string>("/images/初期アイコン.png");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      router.push("/user/login");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);

      try {
        // friend_codeが無いユーザーもいる可能性があるので先に保証
        const { data: ensuredCode, error: ensureErr } = await supabase.rpc("ensure_friend_code");
        if (ensureErr) {
          console.warn("ensure_friend_code error:", ensureErr);
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("username, user_id, recovery_email, points, level, exp, avatar_character_id, avatar_url, friend_code")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("fetchProfile error:", error);
        } else {
          const p = data as Profile;
          setProfile(p);

          // ✅ アイコンURLを作る
          const initial = "/images/初期アイコン.png";
          const saved = p.avatar_url ? (p.avatar_url.startsWith("/") ? p.avatar_url : `/${p.avatar_url}`) : initial;

          if (!p.avatar_character_id) {
            // default も initial もここに入る（avatar_url が入ってればそれが表示される）
            setAvatarUrl(saved);
          } else {
            const { data: ch, error: chErr } = await supabase
              .from("characters")
              .select("image_url")
              .eq("id", p.avatar_character_id)
              .single();

            if (chErr || !ch?.image_url) {
              setAvatarUrl(saved); // ← fallbackを初期じゃなく saved にすると強い
            } else {
              const url = ch.image_url.startsWith("/") ? ch.image_url : `/${ch.image_url}`;
              setAvatarUrl(url);
            }
          }
        }
      } catch (err) {
        console.error("fetchProfile exception:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, userLoading, supabase, router]);

  if (userLoading) return <p>読み込み中...</p>;
  if (!user) return null;
  if (loading) return <p>プロフィール読み込み中...</p>;

  const totalPoints = profile?.points ?? 0;

  const level = profile?.level ?? 1;
  const exp = profile?.exp ?? 0;

  // 次レベルに到達するための「累積」必要EXP
  const nextLevelTotalExp = (level * (level + 1) / 2) * 100;

  // 現レベル開始時点の累積EXP
  const currentLevelStartExp = ((level - 1) * level / 2) * 100;

  // 現レベル内での必要量（例：Lv3なら 300）
  const needThisLevel = nextLevelTotalExp - currentLevelStartExp;

  // 現レベル内での獲得量
  const gainedThisLevel = Math.max(0, exp - currentLevelStartExp);

  // 次のレベルまで残り
  const expToNext = Math.max(0, nextLevelTotalExp - exp);

  // ゲージ(0〜100)
  const expPercent = Math.min(100, Math.floor((gainedThisLevel / needThisLevel) * 100));

  return (
    <>
      <div className="max-w-md mx-auto p-4 space-y-4">
        <h1 className="text-2xl md:text-4xl font-bold text-center">マイページ</h1>

        <div className="border rounded p-3 space-y-2">
          <p>
            <span className="font-medium text-md md:text-xl">ユーザー名：</span>
            <span className="text-md md:text-xl">{profile?.username ?? "(未設定)"}</span>
          </p>

          <p>
            <span className="font-medium text-md md:text-xl">ユーザーID：</span>
            <span className="text-md md:text-xl">{profile?.user_id ?? "(未設定)"}</span>
          </p>

          <div className="pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* ラベル */}
              <p className="font-medium text-md md:text-xl whitespace-nowrap">
                フレンドID：
              </p>

              {/* コード */}
              <span className="text-md md:text-xl font-bold tracking-widest">
                {profile?.friend_code ?? "----"}
              </span>

              {/* コピーボタン */}
              <button
                type="button"
                onClick={async () => {
                  const code = profile?.friend_code;
                  if (!code) return;
                  try {
                    await navigator.clipboard.writeText(code);
                    alert("フレンドIDをコピーしました！");
                  } catch {
                    alert("コピーに失敗しました…");
                  }
                }}
                className="
                  px-3 py-1 rounded-lg font-extrabold
                  bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500
                  text-white shadow
                  hover:brightness-110 active:scale-95
                  transition
                "
              >
                コピー
              </button>
            </div>

            <p className="text-xs md:text-sm text-gray-500 mt-1">
              友達追加画面でこのIDを入力してもらうとフレンド申請できます👥
            </p>
          </div>
          <p>
            <span className="font-medium text-md md:text-xl">
              復旧用メールアドレス：
            </span>
            <span className="text-md md:text-xl">{profile?.recovery_email ?? "(未設定)"}</span>
          </p>

          <p>
            <span className="font-medium text-md md:text-xl">
              アイコン：
            </span>
            <span className="text-md md:text-xl">
              {profile?.avatar_character_id
                ? "所持キャラ"
                : (profile?.avatar_url && profile.avatar_url !== "/images/初期アイコン.png" ? "デフォルト" : "初期アイコン")}
            </span>
          </p>
          <div className="flex items-center justify-center gap-3">
            <img
              src={avatarUrl}
              alt="icon"
              onClick={() => setIsPreviewOpen(true)}
              className="w-30 h-30 md:w-40 md:h-40 border-2 border-white shadow-lg rounded-full bg-white object-contain"
            />
          </div>

          <p>
            <span className="font-medium text-md md:text-xl">現在のユーザーレベル：</span>
            <span className="font-medium text-md md:text-xl text-amber-500">Lv.{profile?.level ?? 1}</span>
          </p>

          <div className="space-y-2">
            <p className="text-sm md:text-base text-gray-700 font-bold">
              次のレベルまで <span className="text-green-700">{expToNext}</span> EXP
            </p>

            {/* ゲージ */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden border">
              <div
                className="h-4 bg-green-500"
                style={{ width: `${expPercent}%` }}
              />
            </div>

            {/* 数字 */}
            <p className="text-sm md:text-md text-gray-600">
              {gainedThisLevel} / {needThisLevel} 
            </p>
          </div>

          <p>
            <span className="font-medium text-md md:text-xl">現在の所持ポイント：</span>
            <span className="text-blue-500 font-bold text-md md:text-xl">{totalPoints} pt</span>
          </p>
        </div>

        <button
          onClick={() => router.push("/user/mypage/edit")}
          className="w-full bg-yellow-500 text-white py-2 rounded cursor-pointer font-bold"
        >
          プロフィールを編集✏️
        </button>

        <button
          onClick={() => router.push("/user/friends")}
          className="w-full bg-sky-400 text-white py-2 rounded cursor-pointer font-bold"
        >
          フレンド👥
        </button>

        <button
          onClick={() => router.push("/user/mypage/points-history")}
          className="w-full bg-blue-500 text-white py-2 rounded cursor-pointer font-bold"
        >
          ポイント履歴💰
        </button>

        <button
          onClick={() => router.push("/user/mypage/records")}
          className="w-full bg-green-500 text-white py-2 rounded cursor-pointer font-bold"
        >
          プレイ記録🎮
        </button>

        <button
          onClick={() => router.push("/user/mypage/titles")}
          className="w-full bg-purple-500 text-white py-2 rounded cursor-pointer font-bold"
        >
          称号コレクション🏅
        </button>

        <button
          onClick={() => router.push("/user/change-password")}
          className="w-full bg-red-500 text-white py-2 rounded cursor-pointer font-bold"
        >
          パスワードを変更🔑
        </button>
      </div>

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsPreviewOpen(false)} // 外側クリックで閉じる
        >
          {/* 中身（ここをクリックしても閉じない） */}
          <div
            className="w-[80vw] max-w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={avatarUrl}
              alt="icon preview"
              className="w-full aspect-square rounded-full bg-white shadow-2xl object-contain"
            />

            <button
              type="button"
              onClick={() => {
                setIsPreviewOpen(false);
                router.push("/user/mypage/edit");
                router.refresh();
              }}
              className="mt-4 md:mt-8 w-full rounded-4xl bg-white py-3 text-lg md:text-xl font-extrabold hover:scale-[1.01] transition"
            >
              変更する
            </button>
          </div>
        </div>
      )}
    </>
  );
}
