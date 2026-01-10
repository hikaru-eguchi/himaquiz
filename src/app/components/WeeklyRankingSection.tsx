import WeeklyRankingCard from "./WeeklyRankingCard";
import Link from "next/link";

export default async function WeeklyRankingSection() {
  return (
    <section className="max-w-[740px] mx-auto my-8">
      {/* セクション見出し */}
      <div className="border-2 border-black rounded-2xl bg-amber-50 shadow p-4 md:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl md:text-4xl font-extrabold drop-shadow">
              🏅 週間ランキング
            </p>
            <p className="text-sm md:text-md text-gray-700 mt-1">
              今週のトッププレイヤーをチェック！（スコア／プレイ回数／正解数）
            </p>
          </div>

          {/* 任意：ランキング一覧ページがあるなら */}
          {/* <Link href="/ranking/weekly" className="text-sm md:text-base font-bold underline">
            一覧を見る →
          </Link> */}
        </div>

        {/* ログイン案内（固定でここに出す） */}
        <div className="mt-3 border-2 border-black rounded-xl bg-white px-3 py-2">
          <p className="text-sm md:text-md font-bold text-gray-800">
            🔔 ログインするとプレイ結果がランキングに反映されます
          </p>
          <p className="text-sm md:text-md text-gray-700">
            ※未ログインのプレイはランキング集計に入りません
          </p>
        </div>

        {/* 中身（3カード） */}
        <div className="mt-5">
          <WeeklyRankingCard
            title="今週のスコア"
            icon="🏆"
            bgClass="from-emerald-50 via-emerald-100 to-emerald-200"
            orderBy="score"
            valueLabel={(r) => `${r.score}pt`}
          />

          <WeeklyRankingCard
            title="今週のプレイ回数"
            icon="🎮"
            bgClass="from-sky-50 via-sky-100 to-sky-200"
            orderBy="play_count"
            valueLabel={(r) => `${r.play_count}回`}
          />

          <WeeklyRankingCard
            title="今週の正解数"
            icon="✅"
            bgClass="from-yellow-50 via-yellow-100 to-yellow-200"
            orderBy="correct_count"
            valueLabel={(r) => `${r.correct_count}問`}
          />
        </div>
      </div>
    </section>
  );
}
