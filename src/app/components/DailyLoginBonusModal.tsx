"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

export function DailyLoginBonusModal() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(0);

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
        // ✅ 表示のデフォルトも 100 に
        setAdded(row.added_points ?? 100);
        setOpen(true);

        window.dispatchEvent(new Event("points:updated"));
      }
    };

    run();
  }, [userLoading, user, supabase]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] grid place-items-center p-4"
      onClick={() => setOpen(false)}
    >
      {/* 背景（グラデ＋ぼかし＋ドット） */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div className="absolute inset-0 opacity-25">
        <div className="w-full h-full bg-[radial-gradient(circle_at_12px_12px,rgba(255,255,255,0.35)_1.2px,transparent_1.3px)] [background-size:22px_22px]" />
      </div>

      {/* カード */}
      <div
        className="
          relative w-full max-w-[420px]
          rounded-[28px] overflow-hidden
          border-[3px] border-black
          bg-white
          shadow-[0_10px_0_rgba(0,0,0,1)]
        "
      >
        {/* ヘッダー帯 */}
        <div className="relative px-5 pt-5 pb-4 border-b-[3px] border-black bg-gradient-to-r from-yellow-200 via-pink-200 to-sky-200 text-center">
          <div className="absolute inset-0 opacity-25">
            <div className="w-full h-full bg-[radial-gradient(circle_at_10px_10px,rgba(0,0,0,0.35)_1.2px,transparent_1.3px)] [background-size:20px_20px]" />
          </div>

          <p className="relative text-3xl md:text-4xl font-black tracking-tight">
            🎁 デイリーボーナス！
          </p>
          <p className="relative mt-1 md:mt-2 text-lg md:text-xl font-bold text-gray-700">
            今日のログインありがとう！
          </p>
        </div>

        <div className="p-5">
          {/* 目立つ報酬バッジ */}
          <div className="grid place-items-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full blur-[10px] opacity-70 bg-[radial-gradient(circle,rgba(255,215,0,0.65)_0%,transparent_60%)]" />
              <div
                className="
                  relative inline-flex items-center gap-2
                  px-5 py-3 rounded-full
                  border-[3px] border-black
                  bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-100
                  shadow-[0_6px_0_rgba(0,0,0,1)]
                "
              >
                <span className="text-lg md:text-xl">✨</span>
                <span className="text-3xl md:text-4xl font-black text-green-600">
                  +{added}P
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-lg md:text-xl text-gray-700 font-bold text-center">
            ポイントで <span className="font-black">ひまQガチャ</span> を回してみよう！
          </p>

          <p className="mt-6 text-md md:text-lg text-gray-500 text-center">
            ※ タップすると閉じます
          </p>
        </div>

        {/* 右下キラッ */}
        <div className="absolute right-4 bottom-4 text-xl opacity-80">✨</div>
      </div>
    </div>
  );
}
