"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

export function DailyLoginBonusModal() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(0);

  // 二重実行防止
  const calledRef = useRef(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) return;
    if (calledRef.current) return;
    calledRef.current = true;

    const run = async () => {
      const { data, error } = await supabase.rpc("award_daily_login_bonus");

      if (error) {
        console.error("award_daily_login_bonus rpc error:", error);
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (row?.awarded) {
        setAdded(row.added_points ?? 500);
        setOpen(true);

        window.dispatchEvent(new Event("points:updated"));
      }
    };

    run();
  }, [userLoading, user, supabase]);

  if (!open) return null;

  return (
    // ▼ 画面全体（背景＋カード）を押したら閉じる
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60"
      onClick={() => setOpen(false)}
    >
      <div
        className="
          bg-white rounded-2xl p-6 w-[320px] md:w-[420px]
          shadow-2xl text-center cursor-pointer
        "
      >
        <p
          className="
            text-2xl md:text-4xl font-extrabold mb-2
            text-yellow-400
            drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]
          "
        >
          🎁 デイリーボーナス！
        </p>

        <p className="text-md md:text-xl text-gray-600">
          今日のログインありがとう！
        </p>
        <p className="text-md md:text-xl text-gray-600 mb-2">
          ポイントでひまQガチャを回してみよう🎰
        </p>

        <p className="text-xl md:text-3xl font-bold text-green-600 mb-4">
          +{added}P
        </p>

        <p className="text-sm text-gray-500">
          ※ 画面をタップすると閉じます
        </p>
      </div>
    </div>
  );
}
