type Props = {
  bestStage: number | null;
  totalStage?: number;
};

export default function DungeonBestStageCard({
  bestStage,
  totalStage = 23,
}: Props) {
  if (bestStage === null) return null;

  return (
    <div className="mx-auto mb-4 max-w-[360px] rounded-2xl border-2 border-purple-400 bg-white px-4 py-3 shadow">
      <p className="text-sm md:text-base font-bold text-gray-600">
        🏰 ダンジョン踏破
      </p>

      <p className="text-3xl md:text-4xl font-black text-purple-600">
        {bestStage} / {totalStage} 
        <span className="ml-1 text-lg md:text-xl font-bold">
          階
        </span>
      </p>
    </div>
  );
}