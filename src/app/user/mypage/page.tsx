"use client";

import { useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { useRouter } from "next/navigation";

type Profile = {
  username: string | null;
  user_id: string | null;
  recovery_email: string | null;
  points: number | null;
};

export default function MyPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      router.push("/user/login");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, user_id, recovery_email, points")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("fetchProfile error:", error);
        } else {
          setProfile(data as Profile);
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

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl md:text-4xl font-bold text-center">マイページ</h1>

      <div className="border rounded p-3 space-y-2">
        <p>
          <span className="font-medium text-md md:text-xl">ユーザー名：</span>
          {profile?.username ?? "(未設定)"}
        </p>

        <p>
          <span className="font-medium text-md md:text-xl">ユーザーID：</span>
          {profile?.user_id ?? "(未設定)"}
        </p>

        <p>
          <span className="font-medium text-md md:text-xl">
            復旧用メールアドレス：
          </span>
          {profile?.recovery_email ?? "(未設定)"}
        </p>

        <p>
          <span className="font-medium text-md md:text-xl">現在の所持ポイント：</span>
          <span className="text-blue-600 font-bold">{totalPoints} pt</span>
        </p>
      </div>

      <button
        onClick={() => router.push("/user/mypage/edit")}
        className="w-full bg-yellow-500 text-white py-2 rounded cursor-pointer"
      >
        プロフィールを編集
      </button>

      <button
        onClick={() => router.push("/user/mypage/points-history")}
        className="w-full bg-blue-500 text-white py-2 rounded cursor-pointer"
      >
        ポイント履歴を見る
      </button>

      <button
        onClick={() => router.push("/user/change-password")}
        className="w-full bg-red-500 text-white py-2 rounded cursor-pointer"
      >
        パスワードを変更
      </button>
    </div>
  );
}
