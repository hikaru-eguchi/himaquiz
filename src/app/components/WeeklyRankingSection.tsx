import MonthlyRankingCard from "./MonthlyRankingCard";
import AllTimeStreakRankingCard from "./AllTimeStreakRankingCard";
import Link from "next/link";

export default async function WeeklyRankingSection() {
  return (
    <section className="max-w-[700px] mx-auto my-8">
      {/* セクション見出し */}
      <div className="
        border-2 border-gray-500 rounded-2xl
        bg-gradient-to-br from-yellow-100 via-pink-100 to-sky-100
        shadow-xl
        p-4 md:p-6
        relative
        overflow-hidden
      ">
        <div className="flex flex-col items-center text-center gap-3">
          <div>
            <p className="
              text-2xl md:text-4xl font-extrabold drop-shadow
              bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300
              text-white
              px-6 py-2
              rounded-full
              border-3 border-white
              shadow-lg
            ">
              ひまQランキング🏆
            </p>
            <p className="text-md md:text-xl text-gray-700 mt-1 md:mt-2">
              ひまQのトッププレイヤーたちをチェックしよう！
            </p>
          </div>

          {/* 任意：ランキング一覧ページがあるなら */}
          {/* <Link href="/ranking/weekly" className="text-sm md:text-base font-bold underline">
            一覧を見る →
          </Link> */}
        </div>

        {/* ログイン案内（固定でここに出す） */}
        {/* <div className="mt-1 md:mt-3 border-2 border-black rounded-xl bg-white px-3 py-2 text-center">
          <p className="text-sm md:text-md font-bold text-gray-800">
            🔔 ログインするとプレイ結果がランキングに反映されます
          </p>
          <p className="text-sm md:text-md text-gray-700">
            ※未ログインのプレイはランキング集計に入りません
          </p>
        </div> */}

        {/* 中身（3カード） */}
        <div className="mt-2 md:mt-5">
          <AllTimeStreakRankingCard
            title="歴代 連続正解数"
            icon="🔥"
            bgClass="from-yellow-200 via-amber-300 to-orange-300"
          />

          {/* <WeeklyRankingCard
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
          /> */}

          <MonthlyRankingCard
            title="今月の正解数"
            icon="✅"
            bgClass="from-orange-50 via-orange-100 to-orange-200 border-gray-200"
            orderBy="correct_count"
            valueLabel={(r) => `${r.correct_count}問`}
          />
        </div>
      </div>
    </section>
  );
}
