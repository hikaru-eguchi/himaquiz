"use client";

import { useEffect, useRef } from "react";
import { useSupabaseUser } from "../hooks/useSupabaseUser";
import { submitGameResult } from "@/lib/gameResults";
import { buildResultModalPayload } from "@/lib/resultMessages";
import { getWeekStartJST } from "@/lib/week";
import { getMonthStartJST } from "@/lib/month";
import { useResultModal } from "@/app/components/ResultModalProvider";

const PENDING_RANKING_KEY = "streak_ranking_pending_v1";

type PendingRanking = {
  streak: number;
  title: string;
  topPercent: number | null;
  at: number;
};

export function useRegisterPendingStreakRanking() {
  const { user, supabase } = useSupabaseUser();
  const { pushModal } = useResultModal();
  const runningRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;
    if (runningRef.current) return;

    const run = async () => {
      runningRef.current = true;

      try {
        const raw = localStorage.getItem(PENDING_RANKING_KEY);
        if (!raw) return;

        const pending = JSON.parse(raw) as PendingRanking;
        if (!pending?.streak || !pending?.title) return;

        const uid = user.id;
        const weekStart = getWeekStartJST();
        const monthStart = getMonthStartJST();

        const { error: weeklyErr } = await supabase.rpc("upsert_weekly_stats", {
          p_user_id: uid,
          p_week_start: weekStart,
          p_score_add: 0,
          p_correct_add: pending.streak,
          p_play_add: 1,
          p_best_streak: pending.streak,
        });
        if (weeklyErr) {
          console.error("pending weekly stats error:", weeklyErr);
          return;
        }

        const { error: monthlyErr } = await supabase.rpc("upsert_monthly_stats", {
          p_user_id: uid,
          p_month_start: monthStart,
          p_score_add: 0,
          p_correct_add: pending.streak,
          p_play_add: 1,
          p_best_streak: pending.streak,
        });
        if (monthlyErr) {
          console.error("pending monthly stats error:", monthlyErr);
          return;
        }

        const res = await submitGameResult(supabase, {
          game: "streak",
          streak: pending.streak,
          score: 0,
          stage: 0,
          title: pending.title,
          writeLog: true,
        });

        const modal = buildResultModalPayload("streak", res);
        if (modal) pushModal(modal);

        const { error: bsErr } = await supabase.rpc("update_best_streak", {
          p_user_id: uid,
          p_best_streak: pending.streak,
        });
        if (bsErr) {
          console.error("pending update_best_streak error:", bsErr);
          return;
        }

        localStorage.removeItem(PENDING_RANKING_KEY);
        window.dispatchEvent(new Event("ranking:updated"));
      } catch (e) {
        console.error("register pending streak ranking error:", e);
      } finally {
        runningRef.current = false;
      }
    };

    run();
  }, [user?.id, supabase, pushModal]);
}