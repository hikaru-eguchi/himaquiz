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
      {/* 背景 */}
      <div className="absolute inset-0 bg-slate-950/55" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/25 blur-xl" />
      </div>

      {/* カード */}
      <div
        className="
          relative w-full max-w-[400px] overflow-hidden
          rounded-[32px]
          border border-white/70
          bg-white/90
          shadow-[0_24px_80px_rgba(14,165,233,0.35)]
          backdrop-blur-xl
        "
      >
        {/* 上部グラデ */}
        <div className="relative px-6 pt-7 pb-6 text-center bg-gradient-to-br from-sky-100 via-cyan-50 to-white">
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20px_20px,rgba(14,165,233,0.18)_1.5px,transparent_1.6px)] [background-size:22px_22px]" />

          <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-cyan-300 to-sky-500 shadow-lg shadow-cyan-300/50">
            <span className="text-4xl">🎁</span>
          </div>

          <p className="relative text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            デイリーボーナス！
          </p>

          <p className="relative mt-2 text-base md:text-lg font-bold text-sky-700">
            今日のログインありがとう！
          </p>
        </div>

        <div className="px-6 pb-7 pt-5">
          {/* 報酬 */}
          <div className="grid place-items-center">
            <div className="relative">
              <div className="absolute -inset-5 rounded-full bg-cyan-300/40 blur-2xl" />

              <div
                className="
                  relative rounded-[28px]
                  border border-cyan-200
                  bg-gradient-to-br from-white via-cyan-50 to-sky-100
                  px-8 py-5
                  shadow-[0_14px_35px_rgba(14,165,233,0.22)]
                "
              >
                <p className="text-xs font-black tracking-[0.22em] text-sky-500 text-center">
                  GET POINT
                </p>

                <p className="mt-1 text-center text-5xl md:text-6xl font-black leading-none text-sky-500">
                  +{added}
                  <span className="ml-1 text-2xl md:text-3xl text-sky-400">
                    P
                  </span>
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-base md:text-lg font-bold text-slate-700 leading-relaxed">
            ポイントで{" "}
            <span className="rounded-full bg-sky-100 px-2 py-1 font-black text-sky-600">
              ガチャ
            </span>{" "}
            を回してみよう！
          </p>
{/* 
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="
              mt-6 w-full rounded-2xl
              bg-gradient-to-r from-sky-400 to-cyan-400
              px-5 py-3
              text-base font-black text-white
              shadow-lg shadow-sky-300/40
              active:scale-[0.98]
            "
          >
            OK
          </button> */}

          <p className="mt-3 text-center text-xs font-bold text-slate-400">
            {/* 背景をタップしても閉じられます */}
            画面をタップすると閉じます
          </p>
        </div>

        <div className="absolute right-5 top-5 text-xl opacity-80">✨</div>
        <div className="absolute left-5 bottom-5 text-lg opacity-70">💎</div>
      </div>
    </div>
  );
}