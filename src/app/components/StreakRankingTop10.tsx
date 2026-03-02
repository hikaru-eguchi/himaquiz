"use client";

type Row = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  best_streak: number;
};

export default function StreakRankingTop10({ rows }: { rows: Row[] }) {
  // const list = rows.slice(0, 10);
  const list = rows.slice(0, 20);

  const formatValue = (u: Row) => `${u.best_streak ?? 0}問`;

  return (
    <div className="mt-8">
      <div className="mx-auto max-w-[660px]">
        <div className="bg-white/80 border-3 border-gray-300 rounded-3xl p-4">
          <div className="text-center">
            {/* 上段 */}
            <p className="text-lg md:text-xl font-black text-red-500 drop-shadow-sm">
                みんなの連続正解チャレンジ🔥
            </p>

            {/* 下段 */}
            <p className="text-xl md:text-2xl font-black text-gray-900 mt-1">
                連続正解ランキング TOP20🏆
            </p>
        </div>
          <div className="mt-4 space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {list.map((u, idx) => {
                const rank = idx + 1;

                const medal =
                rank === 1 ? "👑" :
                rank === 2 ? "🥈" :
                rank === 3 ? "🥉" :
                null;

                return (
                <div
                    key={u.user_id}
                    className={`
                    w-full text-left flex items-center justify-between
                    bg-white border-2 rounded-xl px-3 py-2
                    ${rank <= 10 ? "border-yellow-400 bg-yellow-50/50" : "border-gray-300"}
                    `}
                >
                    <div className="flex items-center gap-1 md:gap-4 min-w-0">
                    <p className="font-extrabold md:w-12">
                        {medal ? `${medal}` : `${rank}位`}
                    </p>

                    <div className="relative w-9 h-9 rounded-full bg-white overflow-hidden border-[2px] border-black shadow-[0_3px_0_rgba(0,0,0,1)]">
                        <img
                        src={u.avatar_url ?? "/images/初期アイコン.png"}
                        alt={u.username ?? "user"}
                        className="w-full h-full object-cover"
                        />
                    </div>

                    <p className="font-bold truncate">{u.username ?? "名無し"}</p>
                    </div>

                    <p className="font-extrabold">{formatValue(u)}</p>
                </div>
                );
            })}
            </div>

          {rows.length === 0 && (
            <p className="mt-4 text-gray-600 font-bold">
              ランキングを読み込み中…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}