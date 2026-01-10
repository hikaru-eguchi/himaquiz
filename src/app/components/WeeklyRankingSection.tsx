import WeeklyRankingCard from "./WeeklyRankingCard";

export default async function WeeklyRankingSection() {
  return (
    <>
      <WeeklyRankingCard
        title="今週のスコア"
        icon="🏆"
        bgClass="from-emerald-50 via-emerald-100 to-emerald-200"
        orderBy="score"
        valueLabel={(r) => `${r.score}pt`}
        // moreHref="/ranking/weekly?type=score"
      />

      <WeeklyRankingCard
        title="今週のプレイ回数"
        icon="🎮"
        bgClass="from-sky-50 via-sky-100 to-sky-200"
        orderBy="play_count"
        valueLabel={(r) => `${r.play_count}回`}
        // moreHref="/ranking/weekly?type=play"
      />

      <WeeklyRankingCard
        title="今週の正解数"
        icon="✅"
        bgClass="from-yellow-50 via-yellow-100 to-yellow-200"
        orderBy="correct_count"
        valueLabel={(r) => `${r.correct_count}問`}
        // moreHref="/ranking/weekly?type=correct"
      />
    </>
  );
}
