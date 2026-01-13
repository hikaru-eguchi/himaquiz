import Link from "next/link";
import { createSupabasePublicServerClient } from "../../lib/supabase/public-server";
import { getWeekStartJST } from "../../lib/week";
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

export default async function WeeklyRankingCard({
  title,
  icon,
  bgClass,
  orderBy,
  valueLabel,
  moreHref,
}: {
  title: string;
  icon: string;
  bgClass: string; // 例: "from-emerald-50 via-emerald-100 to-emerald-200"
  orderBy: RankKey;
  valueLabel: (r: Row) => string; // 例: (r)=>`${r.score}pt`
  moreHref?: string;
}) {
  const supabase = createSupabasePublicServerClient();
  const weekStart = getWeekStartJST();

  const { data, error } = await supabase
    .from("v_weekly_ranking")
    .select("user_id, username, avatar_url, score, correct_count, play_count")
    .eq("week_start", weekStart)
    .order(orderBy, { ascending: false })
    .limit(10);

  if (error) return null;

  const list = (data ?? []) as Row[];

  return (
    <div className={`max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 p-5 bg-gradient-to-b ${bgClass}`}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl md:text-4xl font-extrabold drop-shadow-xl">
            {icon} {title}
          </p>
          <p className="text-xs md:text-sm text-gray-700">
            集計開始：{weekStart}（月曜0:00〜）
          </p>
        </div>

        {moreHref ? (
          <Link href={moreHref} className="text-sm md:text-base font-bold underline">
            もっと見る →
          </Link>
        ) : null}
      </div>

      <WeeklyRankingListClient rows={list} labelType={orderBy} />
    </div>
  );
}
