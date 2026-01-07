"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

export function DailyLoginBonusModal() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(0);

  // 連打・再レンダー対策
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

      // data は returns table なので配列で返ることが多い
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.awarded) {
        setAdded(row.added_points ?? 500);
        setOpen(true);

        // 既存のポイント表示を更新してるならイベント発火
        window.dispatchEvent(new Event("points:updated"));
      }
    };

    run();
  }, [userLoading, user, supabase]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl p-6 w-[320px] md:w-[420px] shadow-2xl text-center">
        <p
          className="
            text-2xl md:text-4xl font-extrabold mb-2
            text-yellow-400
            drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]
          "
        >
          🎁 デイリーボーナス！
        </p>
        <p className="text-md md:text-xl text-gray-600 mb-2">
          今日のログインありがとう！
        </p>
        <p className="text-xl md:text-3xl font-bold text-green-600 mb-4">+{added}P</p>

        <button
          onClick={() => setOpen(false)}
          className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
