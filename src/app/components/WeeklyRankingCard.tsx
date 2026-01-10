import Link from "next/link";
import { createSupabasePublicServerClient } from "../../lib/supabase/public-server";
import { getWeekStartJST } from "../../lib/week";

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
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

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

      <div className="mt-4 grid grid-cols-3 gap-2 items-end">
        {[1, 0, 2].map((i) => {
          const u = top3[i];
          const rank = i + 1;

          // 高さ（差は上に伸びる＝下揃え）
          const podiumH =
            rank === 1 ? "h-48 md:h-52" : rank === 2 ? "h-44 md:h-48" : "h-40 md:h-44";

          const ring =
            rank === 1
              ? "ring-4 ring-yellow-400"
              : rank === 2
              ? "ring-2 ring-gray-300"
              : "ring-2 ring-amber-600/40";

          const medal = rank === 1 ? "👑" : rank === 2 ? "🥈" : "🥉";

          // ✅ 追加：順位ごとのカード背景
          const topBg =
            rank === 1
              ? "bg-gradient-to-b from-yellow-50 via-yellow-100 to-white"
              : rank === 2
              ? "bg-gradient-to-b from-gray-50 via-slate-100 to-white"
              : "bg-gradient-to-b from-amber-50 via-orange-100 to-white";

          return (
            <div key={rank} className="text-center">
              <div
                className={`rounded-xl ${topBg} ${podiumH} grid place-items-center p-2 md:p-3 shadow ${ring}`}
              >
                {/* 👑🥈🥉 */}
                <p className="text-2xl md:text-3xl">{medal}</p>

                {/* アイコン */}
                <div className="mt-1 w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-black bg-white overflow-hidden shadow">
                  <img
                    src={u?.avatar_url ?? "/images/初期アイコン.png"}
                    alt={u?.username ?? "user"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 名前 */}
                <p className="mt-2 text-xs md:text-sm font-extrabold truncate w-full px-1">
                  {u?.username ?? "---"}
                </p>

                {/* 値（score/回数など） */}
                <p className="text-xs md:text-sm font-bold">
                  {u ? valueLabel(u) : "--"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4位〜10位 */}
      <div className="mt-4 space-y-2">
        {rest.map((u, idx) => (
          <div
            key={u.user_id}
            className="flex items-center justify-between bg-white/80 border-2 border-black rounded-xl px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-extrabold w-10">{idx + 4}位</p>
              <div className="w-9 h-9 rounded-full border-2 border-black bg-white overflow-hidden">
                <img
                  src={u.avatar_url ?? "/images/初期アイコン.png"}
                  alt={u.username ?? "user"}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="font-bold truncate">{u.username ?? "名無し"}</p>
            </div>
            <p className="font-extrabold">{valueLabel(u)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
