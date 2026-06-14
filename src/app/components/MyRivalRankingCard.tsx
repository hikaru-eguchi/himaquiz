"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import UserProfileModal, { PublicProfile } from "@/app/components/UserProfileModal";

type Props = {
  title: string;
  column: "best_streak" | "best_stage" | "character_count" | "arena_wins";
  unit: string;
};

type Row = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  value: number;
  rank: number;
};

type RivalRow = Row & {
  kind: "above" | "me" | "below";
};

export default function MyRivalRankingCard({ title, column, unit }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RivalRow[]>([]);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("get_my_rival_ranking", {
        p_column: column,
      });

      if (error || !data) {
        console.error("get_my_rival_ranking error:", error);
        setLoading(false);
        return;
      }

      const rivalRows = data as Row[];
      const myIndex = rivalRows.findIndex((r) => r.user_id === user.id);

      if (myIndex === -1) {
        setLoading(false);
        return;
      }

      const mapped: RivalRow[] = rivalRows.map((r, index) => ({
        ...r,
        kind: index < myIndex ? "above" : index > myIndex ? "below" : "me",
      }));

      setRows(mapped);
      setLoading(false);
    };

    fetchData();
  }, [column, supabase]);

  const openUserProfile = async (userId: string) => {
    setSelected(null);
    setProfileLoading(true);
    setOpen(true);

    const { data, error } = await supabase
      .from("user_public_profiles")
      .select("user_id, username, avatar_url, level, character_count, current_title")
      .eq("user_id", userId)
      .single();

    setProfileLoading(false);

    if (error) {
      setSelected({
        user_id: userId,
        username: null,
        avatar_url: null,
        level: null,
        character_count: null,
        current_title: null,
      });
      return;
    }

    setSelected(data as PublicProfile);
  };

  if (loading) return null;
  if (rows.length === 0) return null;

  const me = rows.find((r) => r.kind === "me");
  if (!me) return null;

  const renderMessage = (row: RivalRow) => {
    if (row.kind === "me") {
      return <span>あなたの現在位置</span>;
    }

    if (row.kind === "above") {
      const diff = Math.max(row.value - me.value, 0);

      return (
        <div className="flex items-center justify-center gap-1">
          <span className="text-xs">🔥 あと</span>
          <span className="text-lg font-black text-red-600 md:text-xl">
            {diff}
          </span>
          <span className="text-xs">{unit}で逆転！</span>
        </div>
      );
    }

    const diff = Math.max(me.value - row.value, 0);

    return (
      <div className="flex items-center justify-center gap-1">
        <span className="text-xs">⚠️ あと</span>
        <span className="text-lg font-black text-orange-600 md:text-xl">
          {diff}
        </span>
        <span className="text-xs">{unit}差！</span>
      </div>
    );
  };

  const getRowStyle = (kind: RivalRow["kind"]) => {
    if (kind === "me") {
      return "border-4 border-yellow-400 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-100 shadow-[0_6px_16px_rgba(234,179,8,0.2)]";
    }

    if (kind === "above") {
      return "border-red-300 bg-white/95";
    }

    return "border-orange-300 bg-white/95";
  };

  const getMessageStyle = (kind: RivalRow["kind"]) => {
    if (kind === "me") {
      // return "text-yellow-800 bg-yellow-100 border-yellow-300";
      return `
        border-4 border-yellow-500
        bg-gradient-to-r
        from-yellow-50 via-amber-50 to-orange-100
        shadow-[0_8px_20px_rgba(234,179,8,0.35)]
      `;
    }

    if (kind === "above") {
      return "text-red-700 bg-red-50 border-red-200";
    }

    return "text-orange-700 bg-orange-50 border-orange-200";
  };

  return (
    <>
      <div className="mt-6 rounded-[26px] border-2 border-orange-300 bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 p-3 shadow-[0_10px_28px_rgba(239,68,68,0.18)] md:p-4">
        <div className="text-center">
          <p className="text-base font-black text-red-600 drop-shadow-sm md:text-xl">
            {title}
          </p>
          <p className="mt-1 text-xs font-bold text-orange-700 md:text-sm">
            近くのライバルをチェックしよう！
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {rows.map((row) => {
            const avatar = row.avatar_url ?? "/images/初期アイコン.png";
            const username =
              row.kind === "me" ? "あなた" : row.username ?? "名無し";

            return (
              <button
                type="button"
                key={row.user_id}
                onClick={() => openUserProfile(row.user_id)}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] ${row.kind === "me" ? "scale-[1.02]" : ""} ${getRowStyle(row.kind)}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2 md:gap-3">
                    <div
                      className={`flex h-9 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-white text-xs font-black shadow-[0_2px_0_rgba(0,0,0,1)] md:h-10 md:w-14 md:text-sm ${
                        row.kind === "me"
                          ? "border-4 border-yellow-500 text-yellow-700"
                          : "border-black text-gray-800"
                      }`}
                    >
                      {row.rank}位
                    </div>

                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-black bg-white shadow-[0_3px_0_rgba(0,0,0,1)] md:h-11 md:w-11">
                      <img
                        src={avatar}
                        alt={username}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-gray-900 md:text-base">
                        {username}
                      </p>
                      <p className="text-xs font-black text-gray-500 md:text-sm">
                        {row.value}
                        {unit}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mx-auto w-fit rounded-full border px-2 py-1 text-center text-[11px] font-black sm:mx-0 sm:shrink-0 md:px-3 md:text-xs ${getMessageStyle(
                      row.kind
                    )}`}
                  >
                    {renderMessage(row)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <UserProfileModal
        open={open}
        loading={profileLoading}
        selected={selected}
        onClose={() => {
          setOpen(false);
          setSelected(null);
          setProfileLoading(false);
        }}
      />
    </>
  );
}