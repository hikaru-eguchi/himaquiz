import Link from "next/link";
import { createSupabasePublicServerClient } from "../../lib/supabase/public-server";
import { getMonthStartJST } from "@/lib/month";
import WeeklyRankingListClient from "@/app/components/WeeklyRankingListClient";

type RankKey = "score" | "correct_count" | "play_count";

type Row = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  score: number;
  correct_count: number;
  play_count: number;
};

export default async function MonthlyRankingCard({
  title,
  icon,
  bgClass,
  orderBy,
  valueLabel,
  moreHref,
}: {
  title: string;
  icon: string;
  bgClass: string;
  orderBy: RankKey;
  valueLabel: (r: Row) => string;
  moreHref?: string;
}) {
  const supabase = createSupabasePublicServerClient();
  const monthStart = getMonthStartJST(); // ← 月初（JST）

  const { data, error } = await supabase
    .from("v_monthly_ranking") // ← 月間ランキング用ビュー（作る）
    .select("user_id, username, avatar_url, score, correct_count, play_count")
    .eq("month_start", monthStart) // ← 月のキー列（作る）
    .order(orderBy, { ascending: false })
    .limit(10);

  if (error) return null;

  const list = (data ?? []) as Row[];

  return (
    <div
      className={`max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 p-5 bg-gradient-to-b ${bgClass}`}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div>
          <p className="text-2xl md:text-4xl font-extrabold drop-shadow-xl">
            {title}
            {icon}
          </p>
          <p className="text-xs md:text-sm text-gray-700">
            集計開始：{monthStart}（月初0:00〜）
          </p>

          {/* 任意：もっと見るリンク */}
          {moreHref && (
            <div className="mt-2">
              <Link href={moreHref} className="text-xs md:text-sm font-bold underline">
                一覧を見る →
              </Link>
            </div>
          )}
        </div>
      </div>

      <WeeklyRankingListClient rows={list} labelType={orderBy} />
    </div>
  );
}
