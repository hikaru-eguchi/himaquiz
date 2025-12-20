"use client";

type Enemy = {
  id: string;
  name: string;
};

export default function EnemyAttackEffect({
  enemy,
}: {
  enemy: Enemy | null;
}) {
  if (!enemy) return null;

  const bg =
    enemy.id === "dragon"
      ? "from-red-800 via-orange-600 to-yellow-400"
      : enemy.id === "blackdragon"
      ? "from-black via-purple-900 to-red-800"
      : enemy.id === "leviathan"
      ? "from-blue-900 via-blue-600 to-cyan-400"
      : "from-red-700 via-purple-800 to-black";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-none">
      <div className={`absolute inset-0 bg-gradient-to-r ${bg} animate-bg-fade`} />

      {/* ===== 敵別エフェクト ===== */}
      {enemy.id === "slime" && (
        <div className="absolute w-52 h-52 bg-blue-300 opacity-40 rounded-full animate-enemy-slime-wave" />
      )}

      {enemy.id === "dragon" && (
        <>
          <div className="absolute w-48 h-48 bg-red-200 opacity-40 rounded-full animate-fire-front z-20" />
          <div className="absolute w-72 h-72 bg-red-500 opacity-70 rounded-full animate-fire-back z-10" />
        </>
      )}

      {enemy.id === "blackdragon" && (
        <>
          <div className="absolute w-48 h-48 bg-purple-200 opacity-40 rounded-full animate-fire-front z-20" />
          <div className="absolute w-72 h-72 bg-purple-600 opacity-60 rounded-full animate-fire-back z-10" />
          <div className="absolute w-72 h-72 bg-black opacity-90 rounded-full animate-fire-back2 z-10" />
        </>
      )}

      {/* テキスト */}
      <p className="text-6xl md:text-8xl font-extrabold text-white drop-shadow-2xl animate-swing">
        {enemy.name} の攻撃！
      </p>
    </div>
  );
}
