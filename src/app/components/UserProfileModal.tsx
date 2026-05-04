"use client";

export type PublicProfile = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  level: number | null;
  character_count: number | null;
  current_title: string | null;
};

export default function UserProfileModal({
  open,
  loading,
  selected,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  selected: PublicProfile | null;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <button
      type="button"
      onClick={onClose}
      className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-[2px] grid place-items-center p-4"
    >
      <div
        className="w-full max-w-sm rounded-[28px] overflow-hidden shadow-[0_6px_0_rgba(0,0,0,1)] border-3 border-black bg-white"
      >
        <div className="relative px-5 pt-5 pb-4 border-b-3 border-black bg-gradient-to-r from-yellow-200 via-pink-200 to-sky-200">
          <div className="absolute inset-0 opacity-25">
            <div className="w-full h-full bg-[radial-gradient(circle_at_10px_10px,rgba(0,0,0,0.35)_1.2px,transparent_1.3px)] [background-size:20px_20px]" />
          </div>
          <p className="relative font-extrabold text-lg tracking-tight">
            ユーザープロフィール👤
          </p>
        </div>

        <div className="p-5">
          <div className="grid place-items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full blur-[6px] opacity-70 bg-gradient-to-br from-yellow-200 via-pink-200 to-sky-200" />
              <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full bg-white overflow-hidden border-3 border-black shadow-[0_6px_0_rgba(0,0,0,1)]">
                <img
                  src={selected?.avatar_url ?? "/images/初期アイコン.png"}
                  alt={selected?.username ?? "user"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full border-3 border-black bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-50">
              <span className="text-xs md:text-sm font-black bg-gradient-to-r from-sky-300 to-blue-400 text-white px-3 py-1 rounded-full shadow-[0_1px_0_rgba(0,0,0,1)]">
                👤 NAME
              </span>

              <p className="font-extrabold text-2xl md:text-3xl leading-none text-black">
                {loading ? "読み込み中..." : selected?.username ?? "名無し"}
              </p>
            </div>

            <div className="w-full rounded-3xl border-3 border-black bg-gradient-to-br from-white via-white to-yellow-50 p-2 shadow-[0_3px_0_rgba(0,0,0,1)] text-center">
              <p className="text-sm md:text-base font-black text-yellow-500">
                🌟 ユーザーレベル 🌟
              </p>
              <p className="mt-1 text-3xl md:text-4xl font-extrabold">
                {loading ? "..." : `Lv.${selected?.level ?? "--"}`}
              </p>
            </div>

            <div className="w-full rounded-3xl border-3 border-black bg-white p-2 shadow-[0_3px_0_rgba(0,0,0,1)] text-center">
              <p className="text-sm md:text-base font-black text-emerald-500">
                📚 所持キャラ数 📚
              </p>
              <p className="mt-1 text-3xl md:text-4xl font-extrabold">
                {loading ? "..." : `${selected?.character_count ?? "--"}体`}
              </p>
            </div>

            <div className="w-full rounded-3xl border-3 border-black bg-white p-2 shadow-[0_3px_0_rgba(0,0,0,1)] text-center">
              <p className="text-sm md:text-base font-black text-purple-500">
                🏅 マイ称号 🏅
              </p>
              <p className="mt-1 text-2xl md:text-3xl font-extrabold">
                {loading ? "..." : selected?.current_title ?? "（未設定）"}
              </p>
            </div>

            <p className="pt-1 font-bold text-sm text-gray-700">
              画面をタップすると閉じます
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}