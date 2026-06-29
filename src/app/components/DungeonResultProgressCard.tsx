type Props = {
  currentStage: number;
  bestStage: number | null;
  totalStage?: number;
};

export default function DungeonResultProgressCard({
  currentStage,
  bestStage,
  totalStage = 23,
}: Props) {
  const displayBest = Math.max(bestStage ?? 0, currentStage);
  const isNewRecord = currentStage > (bestStage ?? 0);

  return (
    <div className="mx-auto mb-6 max-w-[420px] rounded-2xl border-2 border-purple-400 bg-white px-4 py-4 shadow">
      <p className="text-sm md:text-base font-bold text-gray-600">
        🏰 ダンジョン踏破
      </p>

      {isNewRecord && (
        <p className="mt-1 text-lg md:text-xl font-black text-yellow-500">
          🏆 新記録達成！
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-purple-50 border border-purple-200 py-3">
          <p className="text-sm font-bold text-gray-500">今回</p>
          <p className="text-2xl md:text-3xl font-black text-purple-600">
            {currentStage}階
          </p>
        </div>

        <div className="rounded-xl bg-yellow-50 border border-yellow-200 py-3">
          <p className="text-sm font-bold text-gray-500">最高</p>
          <p className="text-2xl md:text-3xl font-black text-yellow-600">
            {displayBest}
            <span className="text-base md:text-lg ml-1">/ {totalStage}階</span>
          </p>
        </div>
      </div>
    </div>
  );
}