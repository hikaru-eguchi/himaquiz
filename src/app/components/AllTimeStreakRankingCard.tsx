import Link from "next/link";
import { createSupabasePublicServerClient } from "../../lib/supabase/public-server";
import AllTimeRankingListClient from "@/app/components/AllTimeRankingListClient";

type Row = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  best_streak: number;
};

export default async function AllTimeStreakRankingCard({
  title,
  icon,
  bgClass,
  moreHref,
}: {
  title: string;
  icon: string;
  bgClass: string;
  moreHref?: string;
}) {
  const supabase = createSupabasePublicServerClient();

  const { data, error } = await supabase
    .from("v_alltime_streak_ranking")
    .select("user_id, username, avatar_url, best_streak")
    .order("best_streak", { ascending: false })
    .limit(10);

  if (error) return null;

  const list = (data ?? []) as Row[];

  return (
    <div className={`max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 p-5 bg-gradient-to-b ${bgClass}`}>
      <div className="flex flex-col items-center text-center gap-2">
        <div>
          <p className="text-2xl md:text-4xl font-extrabold drop-shadow-xl">
            {title}{icon}
          </p>
          <p className="text-xs md:text-sm text-gray-700">
            歴代最高連続正解のランキング！
          </p>

          {moreHref && (
            <div className="mt-2">
              <Link href={moreHref} className="text-xs md:text-sm font-bold underline">
                一覧を見る →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ↓ここは専用のランキングリストが必要（後述） */}
      <AllTimeRankingListClient rows={list as any} labelType="best_streak" />
    </div>
  );
}
