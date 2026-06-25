"use client";
import ProfileReactions from "@/app/components/ProfileReactions";

export type PublicProfile = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  level: number | null;
  character_count: number | null;
  current_title: string | null;
  friend_code: string | null;
  friend_code_public: boolean | null;
  friend_recruiting: boolean | null;
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
    // <button
    //   type="button"
    //   onClick={onClose}
    //   className="fixed inset-0 z-[999] grid place-items-center bg-slate-950/60 p-4"
    // >
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999] grid place-items-center bg-slate-950/60 p-4"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/20 blur-lg" />
      </div>

      <div
        className="
          relative w-full max-w-sm overflow-hidden
          rounded-[32px]
          border border-white/70
          bg-white/90
          text-left
          shadow-[0_24px_70px_rgba(14,165,233,0.28)]
        "
      >
        {/* ヘッダー */}
        <div className="relative bg-gradient-to-br from-sky-100 via-cyan-50 to-white px-5 pb-16 pt-5 text-center">
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_18px_18px,rgba(14,165,233,0.16)_1.5px,transparent_1.6px)] [background-size:22px_22px]" />

          <p className="relative inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-1.5 text-xs font-black text-sky-700 shadow-sm">
            👤 USER PROFILE
          </p>
        </div>

        {/* アイコン */}
        <div className="relative -mt-14 grid place-items-center">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-cyan-300/35 blur-md" />
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl">
              <img
                src={selected?.avatar_url ?? "/images/初期アイコン.png"}
                alt={selected?.username ?? "user"}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-3">
          {/* 名前 */}
          <div className="text-center">
            <p className="text-xs font-black tracking-[0.22em] text-sky-400">
              NAME
            </p>
            <p className="mt-1 text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {loading ? "読み込み中..." : selected?.username ?? "名無し"}
            </p>
          </div>

          {/* ステータス */}
          <div className="mt-3 md:mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-4 text-center shadow-sm">
              <p className="text-xs font-black text-sky-500">
                🌟 レベル
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {loading ? "..." : `Lv.${selected?.level ?? "--"}`}
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-4 text-center shadow-sm">
              <p className="text-xs font-black text-emerald-500">
                📚 所持キャラ
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {loading ? "..." : `${selected?.character_count ?? "--"}体`}
              </p>
            </div>
          </div>

          {/* 称号 */}
          <div className="mt-1 md:mt-3 rounded-3xl border border-purple-100 bg-gradient-to-br from-white to-purple-50 px-4 py-4 text-center shadow-sm">
            <p className="text-xs font-black text-purple-500">
              🏅 マイ称号
            </p>
            <p className="mt-1 md:mt-2 text-xl md:text-2xl font-black text-slate-900 leading-tight">
              {loading ? "..." : selected?.current_title ?? "（未設定）"}
            </p>
          </div>

          <div className="mt-1 md:mt-3 rounded-3xl border border-yellow-100 bg-gradient-to-br from-white to-yellow-50 px-4 py-3 text-center shadow-sm">
            {/* <p className="text-xs font-black text-yellow-600">
              👥 フレンドID
            </p> */}
            <div className="relative">
              {selected?.friend_recruiting && (
                <div className="absolute left-0 top-0 rounded-full bg-green-100 px-3 py-1 text-[10px] font-black text-green-700">
                  🤝 フレンド募集中
                </div>
              )}

              <p className="text-center text-xs font-black text-yellow-600">
                👥 フレンドID
              </p>
            </div>
            <p className="mt-1 text-lg font-black text-slate-900">
              {loading
                ? "..."
                : selected?.friend_code_public
                  ? selected?.friend_code ?? "----"
                  : "非公開"}
            </p>
          </div>

          {/* リアクション */}
          {/* <ProfileReactions
            targetUserId={selected?.user_id}
            disabled={loading}
          /> */}

          <p className="mt-2 md:mt-5 text-center text-xs font-bold text-slate-400">
            画面をタップすると閉じます
          </p>
        </div>
      </div>
    {/* </button> */}
    </div>
  );
}