"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { useRouter } from "next/navigation";
import type { PublicFriendProfile } from "@/types/friend";

type FriendshipRow = {
  user_id: string;
  friend_user_id: string;
  created_at: string;
};

type MyFriendInfo = {
  friend_code: string | null;
  friend_code_public: boolean | null;
  friend_recruiting: boolean | null;
};

type FriendStreakRankingRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  best_streak: number | null;
};

type FriendDungeonRankingRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  best_stage: number | null;
};

type FriendCharacterRankingRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  character_count: number | null;
};

type FriendArenaRankingRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  arena_wins: number | null;
};

type FriendQuizRow = {
  id: string;
  creator_user_id: string;
  creator_name: string | null;
  creator_avatar_url: string | null;
  question: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  hint: string | null;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
  selected_choice: number | null;
  is_correct: boolean | null;
  correct_choice: number | null;
};

export default function FriendsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<PublicFriendProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [myFriendInfo, setMyFriendInfo] = useState<MyFriendInfo | null>(null);

  const [friendSettingOpen, setFriendSettingOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [giftCount, setGiftCount] = useState(0);

  const [friendStreakRows, setFriendStreakRows] = useState<FriendStreakRankingRow[]>([]);
  const [friendDungeonRows, setFriendDungeonRows] = useState<FriendDungeonRankingRow[]>([]);
  const [friendCharacterRows, setFriendCharacterRows] = useState<FriendCharacterRankingRow[]>([]);
  const [friendArenaRows, setFriendArenaRows] = useState<FriendArenaRankingRow[]>([]);

  const [friendQuizzes, setFriendQuizzes] = useState<FriendQuizRow[]>([]);
  const [answeringQuizId, setAnsweringQuizId] = useState<string | null>(null);
  const [likingQuizId, setLikingQuizId] = useState<string | null>(null);
  const [hasPostedQuizToday, setHasPostedQuizToday] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/user/login");
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { error: ensureErr } = await supabase.rpc("ensure_friend_code");
        if (ensureErr) {
          console.warn("ensure_friend_code error:", ensureErr);
        }

        const { data: myProfile, error: myProfileErr } = await supabase
          .from("profiles")
          .select("friend_code, friend_code_public, friend_recruiting")
          .eq("id", user.id)
          .single();

        if (myProfileErr) throw myProfileErr;

        setMyFriendInfo(myProfile);

        const { count: reqCount } = await supabase
          .from("friend_requests")
          .select("id", { count: "exact", head: true })
          .eq("to_user_id", user.id)
          .eq("status", "pending");

        setRequestCount(reqCount ?? 0);

        const { count: gCount } = await supabase
          .from("character_gifts")
          .select("id", { count: "exact", head: true })
          .eq("to_user_id", user.id)
          .is("claimed_at", null)
          .eq("deleted_by_receiver", false);

        setGiftCount(gCount ?? 0);

        const { data: frows, error: fErr } = await supabase
          .from("friendships")
          .select("user_id, friend_user_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (fErr) throw fErr;

        const ids = Array.from(new Set((frows ?? []).map((r: any) => r.friend_user_id)));

        const rankingIds = Array.from(new Set([user.id, ...ids]));

        const { data: rankingRows, error: rankingErr } = await supabase
          .from("user_public_profiles")
          .select("user_id, username, avatar_url, best_streak")
          .in("user_id", rankingIds);

        if (rankingErr) throw rankingErr;

        const sortedRanking = ((rankingRows ?? []) as FriendStreakRankingRow[])
          .sort((a, b) => (b.best_streak ?? 0) - (a.best_streak ?? 0));

        setFriendStreakRows(sortedRanking);

        const { data: dungeonRows, error: dungeonErr } = await supabase
          .from("user_public_profiles")
          .select("user_id, username, avatar_url, best_stage")
          .in("user_id", rankingIds);

        if (dungeonErr) throw dungeonErr;

        const sortedDungeon = ((dungeonRows ?? []) as FriendDungeonRankingRow[])
          .sort((a, b) => (b.best_stage ?? 0) - (a.best_stage ?? 0));

        setFriendDungeonRows(sortedDungeon);

        const { data: characterRows, error: characterErr } = await supabase
          .from("user_public_profiles")
          .select("user_id, username, avatar_url, character_count")
          .in("user_id", rankingIds);

        if (characterErr) throw characterErr;

        const sortedCharacter = ((characterRows ?? []) as FriendCharacterRankingRow[])
          .sort((a, b) => (b.character_count ?? 0) - (a.character_count ?? 0));

        setFriendCharacterRows(sortedCharacter);

        const { data: arenaRows, error: arenaErr } = await supabase
          .from("user_public_profiles")
          .select("user_id, username, avatar_url, arena_wins, arena_current_win_streak")
          .in("user_id", rankingIds);

        if (arenaErr) throw arenaErr;

        const sortedArena = ((arenaRows ?? []) as FriendArenaRankingRow[])
          .sort((a, b) => (b.arena_wins ?? 0) - (a.arena_wins ?? 0));

        setFriendArenaRows(sortedArena);

        const quizUserIds = Array.from(new Set([user.id, ...ids]));

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        const { data: quizRows, error: quizErr } = await supabase
          .from("friend_quizzes")
          .select(`
            id,
            creator_user_id,
            question,
            choice_1,
            choice_2,
            choice_3,
            choice_4,
            hint,
            created_at
          `)
          .in("creator_user_id", quizUserIds)
          .gte("created_at", todayStart.toISOString())
          .lt("created_at", tomorrowStart.toISOString())
          .order("created_at", { ascending: false })
          .limit(30);

        if (quizErr) throw quizErr;

        const quizIds = (quizRows ?? []).map((q: any) => q.id);
        const creatorIds = Array.from(
          new Set((quizRows ?? []).map((q: any) => q.creator_user_id))
        );

        let creatorMap: Record<string, any> = {};
        if (creatorIds.length > 0) {
          const { data: creators, error: creatorsErr } = await supabase
            .from("user_public_profiles")
            .select("user_id, username, avatar_url")
            .in("user_id", creatorIds);

          if (creatorsErr) throw creatorsErr;

          creatorMap = Object.fromEntries(
            (creators ?? []).map((p: any) => [p.user_id, p])
          );
        }

        let likeCountMap: Record<string, number> = {};
        let likedMap: Record<string, boolean> = {};
        let answerMap: Record<string, any> = {};

        if (quizIds.length > 0) {
          const { data: likes, error: likesErr } = await supabase
            .from("friend_quiz_likes")
            .select("quiz_id, user_id")
            .in("quiz_id", quizIds);

          if (likesErr) throw likesErr;

          for (const l of likes ?? []) {
            likeCountMap[l.quiz_id] = (likeCountMap[l.quiz_id] ?? 0) + 1;
            if (l.user_id === user.id) likedMap[l.quiz_id] = true;
          }

          const { data: answers, error: answersErr } = await supabase
            .from("friend_quiz_answers")
            .select("quiz_id, selected_choice, is_correct, correct_choice")
            .eq("user_id", user.id)
            .in("quiz_id", quizIds);

          if (answersErr) throw answersErr;

          answerMap = Object.fromEntries(
            (answers ?? []).map((a: any) => [a.quiz_id, a])
          );
        }

        setFriendQuizzes(
          ((quizRows ?? []) as any[]).map((q) => ({
            ...q,
            creator_name: creatorMap[q.creator_user_id]?.username ?? null,
            creator_avatar_url: creatorMap[q.creator_user_id]?.avatar_url ?? null,
            like_count: likeCountMap[q.id] ?? 0,
            liked_by_me: likedMap[q.id] ?? false,
            selected_choice: answerMap[q.id]?.selected_choice ?? null,
            is_correct: answerMap[q.id]?.is_correct ?? null,
            correct_choice: answerMap[q.id]?.correct_choice ?? null,
          }))
        );

        const today = new Date().toLocaleDateString("sv-SE", {
          timeZone: "Asia/Tokyo",
        });

        const { data: myPostToday, error: myPostTodayErr } = await supabase
          .from("friend_quiz_daily_posts")
          .select("user_id")
          .eq("user_id", user.id)
          .eq("post_date", today)
          .maybeSingle();

        if (myPostTodayErr) throw myPostTodayErr;

        setHasPostedQuizToday(!!myPostToday);

        if (ids.length === 0) {
          setFriends([]);
          return;
        }

        const { data: ups, error: upErr } = await supabase
          .from("user_public_profiles")
          .select("*")
          .in("user_id", ids);

        if (upErr) throw upErr;

        // 並び順をfriendships順に揃える
        const map = new Map<string, any>((ups ?? []).map((p: any) => [p.user_id, p]));
        const ordered = ids.map((id) => map.get(id)).filter(Boolean) as PublicFriendProfile[];
        setFriends(ordered);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user, userLoading, supabase, router]);

  const answerFriendQuiz = async (quizId: string, selected: number) => {
    setAnsweringQuizId(quizId);

    const { data, error } = await supabase.rpc("answer_friend_quiz", {
      p_quiz_id: quizId,
      p_selected_choice: selected,
    });

    setAnsweringQuizId(null);

    if (error) {
      if (error.message.includes("duplicate")) {
        alert("このクイズには回答済みです");
        return;
      }

      alert(error.message || "回答に失敗しました");
      return;
    }

    const result = Array.isArray(data) ? data[0] : null;

    setFriendQuizzes((prev) =>
      prev.map((q) =>
        q.id === quizId
          ? {
              ...q,
              selected_choice: selected,
              is_correct: result?.result_is_correct ?? false,
              correct_choice: result?.result_correct_choice ?? null,
            }
          : q
      )
    );
  };

  const toggleQuizLike = async (quizId: string) => {
    setLikingQuizId(quizId);

    const { data, error } = await supabase.rpc("toggle_friend_quiz_like", {
      p_quiz_id: quizId,
    });

    setLikingQuizId(null);

    if (error) {
      alert("いいねに失敗しました");
      return;
    }

    const nextCount = typeof data === "number" ? data : 0;

    setFriendQuizzes((prev) =>
      prev.map((q) =>
        q.id === quizId
          ? {
              ...q,
              liked_by_me: !q.liked_by_me,
              like_count: nextCount,
            }
          : q
      )
    );
  };

  const deleteFriendQuiz = async (quizId: string) => {
    if (!confirm("このクイズを削除しますか？")) return;

    const { error } = await supabase.rpc("delete_friend_quiz", {
      p_quiz_id: quizId,
    });

    if (error) {
      alert("クイズの削除に失敗しました");
      return;
    }

    setFriendQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  };

  if (userLoading || loading) return <p className="p-4">読み込み中...</p>;

  return (
    <div className="bg-gradient-to-b from-yellow-100 to-white">
      <div className="max-w-md mx-auto p-1 md:p-4 space-y-2 md:space-y-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center tracking-wide">
        👥 フレンド
        </h1>
        {/* <p className="text-center text-md text-xl text-gray-600">
        フレンドと一緒にひまQを楽しもう！
        </p> */}
        <p className="text-center text-gray-600 font-bold">
          フレンドを作ると楽しさアップ！🎉<br />
          キャラ交換や自作クイズ、フレンド内ランキングで盛り上がろう！
        </p>

        <section className="rounded-2xl border border-sky-100 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setFriendSettingOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-xl bg-sky-50 px-4 py-3 font-black text-sky-700 hover:bg-sky-100 active:scale-[0.99]"
          >
            <span>⚙️ フレンド設定</span>
            <span>{friendSettingOpen ? "▲" : "▼"}</span>
          </button>

          {friendSettingOpen && (
            <div className="mt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-gray-500">FRIEND ID</p>
                  <h2 className="text-lg font-black text-gray-900">フレンドID</h2>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const code = myFriendInfo?.friend_code;
                    if (!code) return;

                    try {
                      await navigator.clipboard.writeText(code);
                      alert("フレンドIDをコピーしました！");
                    } catch {
                      alert("コピーに失敗しました…");
                    }
                  }}
                  className="rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-4 py-2 text-sm font-black text-white shadow transition hover:brightness-110 active:scale-95"
                >
                  コピー
                </button>
              </div>

              <div className="rounded-2xl bg-sky-50 px-4 py-3 text-center">
                <p className="text-2xl font-black tracking-widest text-sky-700">
                  {myFriendInfo?.friend_code ?? "----"}
                </p>
              </div>

              <p className="mt-2 text-center text-xs font-bold text-gray-500">
                友達追加画面でこのIDを入力してもらうとフレンド申請できます👥
              </p>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-yellow-50 px-4 py-3">
                <div>
                  <p className="text-sm font-black text-gray-800">
                    {/* フレンドIDを公開する */}
                    プロフィールからのフレンド申請を受け付ける
                  </p>
                  <p className="text-xs font-bold text-gray-500">
                    {/* ONにすると他の人のプロフィールに表示されます */}
                    ONにすると公開プロフィールからフレンド申請を受け付けます
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!user) return;

                    const next = !(myFriendInfo?.friend_code_public ?? false);

                    setMyFriendInfo((prev) =>
                      prev ? { ...prev, friend_code_public: next } : prev
                    );

                    const { error } = await supabase
                      .from("profiles")
                      .update({ friend_code_public: next })
                      .eq("id", user.id);

                    if (error) {
                      console.error(error);
                      alert("設定の保存に失敗しました");

                      setMyFriendInfo((prev) =>
                        prev ? { ...prev, friend_code_public: !next } : prev
                      );
                    }
                  }}
                  className={`
                    relative h-8 w-14 rounded-full transition
                    ${(myFriendInfo?.friend_code_public ?? false) ? "bg-yellow-400" : "bg-gray-300"}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 h-6 w-6 rounded-full bg-white shadow transition
                      ${(myFriendInfo?.friend_code_public ?? false) ? "left-7" : "left-1"}
                    `}
                  />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-green-50 px-4 py-3">
                <div>
                  <p className="text-sm font-black text-gray-800">
                    「🤝 フレンド募集中」マークを表示する
                  </p>

                  <p className="text-xs font-bold text-gray-500">
                    ONにするとプロフィールに表示されます
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!user) return;

                    const next = !(myFriendInfo?.friend_recruiting ?? false);

                    setMyFriendInfo((prev) =>
                      prev ? { ...prev, friend_recruiting: next } : prev
                    );

                    const { error } = await supabase
                      .from("profiles")
                      .update({ friend_recruiting: next })
                      .eq("id", user.id);

                    if (error) {
                      console.error(error);
                      alert("設定の保存に失敗しました");

                      setMyFriendInfo((prev) =>
                        prev ? { ...prev, friend_recruiting: !next } : prev
                      );
                    }
                  }}
                  className={`
                    relative h-8 w-14 rounded-full transition
                    ${(myFriendInfo?.friend_recruiting ?? false)
                      ? "bg-green-400"
                      : "bg-gray-300"}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 h-6 w-6 rounded-full bg-white shadow transition
                      ${(myFriendInfo?.friend_recruiting ?? false)
                        ? "left-7"
                        : "left-1"}
                    `}
                  />
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
              onClick={() => router.push("/user/friends/add")}
              className="
              rounded-xl py-2 text-white font-extrabold
              bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500
              shadow-md hover:brightness-110 active:scale-95 transition
              "
          >
              ➕ フレンド追加
          </button>

          {/* <button
              onClick={() => router.push("/user/friends/requests")}
              className="
              rounded-xl py-2 text-white font-extrabold
              bg-gradient-to-r from-emerald-400 via-green-400 to-lime-400
              shadow-md hover:brightness-110 active:scale-95 transition
              "
          >
              ✉️ とどいた申請
          </button> */}
          <button
            onClick={() => router.push("/user/friends/requests")}
            className="
              relative
              rounded-xl py-2 text-white font-extrabold
              bg-gradient-to-r from-emerald-400 via-green-400 to-lime-400
              shadow-md hover:brightness-110 active:scale-95 transition
            "
          >
            ✉️ とどいた申請

            {/* {requestCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-red-500 px-1.5 text-xs font-black text-white shadow">
                {requestCount > 99 ? "99+" : requestCount}
              </span>
            )} */}
            {requestCount > 0 && (
              <>
                {/* スマホ用 */}
                <span
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    md:hidden
                    grid h-6 min-w-6 place-items-center
                    rounded-full border-2 border-white
                    bg-red-500 px-1.5
                    text-sm font-black text-white shadow
                  "
                >
                  {requestCount > 99 ? "99+" : requestCount}
                </span>

                {/* PC用 */}
                <span
                  className="
                    hidden md:grid
                    absolute -right-2 -top-2
                    h-6 min-w-6 place-items-center
                    rounded-full border-2 border-white
                    bg-red-500 px-1.5
                    text-sm font-black text-white shadow
                  "
                >
                  {requestCount > 99 ? "99+" : requestCount}
                </span>
              </>
            )}
          </button>

          {/* <button
              onClick={() => router.push("/user/friends/gifts")}
              className="
              rounded-xl py-2 text-white font-extrabold
              bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400
              shadow-md hover:brightness-110 active:scale-95 transition
              "
          >
              🎁 プレゼントBOX
          </button> */}

          <button
            onClick={() => router.push("/user/friends/gifts")}
            className="
              relative
              rounded-xl py-2 text-white font-extrabold
              bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400
              shadow-md hover:brightness-110 active:scale-95 transition
            "
          >
            🎁 プレゼントBOX

            {/* {giftCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-red-500 px-1.5 text-xs font-black text-white shadow">
                {giftCount > 99 ? "99+" : giftCount}
              </span>
            )} */}
            {giftCount > 0 && (
              <>
                {/* スマホ用 */}
                <span
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    md:hidden
                    grid h-6 min-w-6 place-items-center
                    rounded-full border-2 border-white
                    bg-red-500 px-1.5
                    text-sm font-black text-white shadow
                  "
                >
                  {giftCount > 99 ? "99+" : giftCount}
                </span>

                {/* PC用 */}
                <span
                  className="
                    hidden md:grid
                    absolute -right-2 -top-2
                    h-6 min-w-6 place-items-center
                    rounded-full border-2 border-white
                    bg-red-500 px-1.5
                    text-sm font-black text-white shadow
                  "
                >
                  {giftCount > 99 ? "99+" : giftCount}
                </span>
              </>
            )}
          </button>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <section className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900">
              👥 フレンド一覧
            </h2>

            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
              {friends.length}人
            </span>
          </div>

          {friends.length === 0 ? (
            <p className="text-center text-gray-600 rounded-xl bg-gray-50 border p-4">
              まだフレンドがいません 😢<br />
              「➕ 追加」から友達を増やそう！
            </p>
          ) : (
            <div className="max-h-[270px] space-y-3 overflow-y-auto pr-1">
              {friends.map((p) => (
                <button
                  key={p.user_id}
                  onClick={() => router.push(`/user/friends/${p.user_id}`)}
                  className="
                    w-full text-left
                    rounded-2xl border border-gray-200
                    bg-white p-3
                    shadow-sm hover:shadow-md
                    hover:-translate-y-[1px]
                    active:scale-[0.99]
                    transition
                  "
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.avatar_url ?? "/images/初期アイコン.png"}
                      className="w-14 h-14 rounded-full border-2 border-white shadow bg-white object-contain"
                      alt="avatar"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold truncate text-gray-900">
                        {p.username ?? "ユーザー"}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs md:text-sm">
                        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold">
                          Lv.{p?.level ?? 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                          キャラ {p?.character_count ?? 0}
                        </span>
                      </div>
                    </div>

                    <span className="text-gray-300 text-xl font-black">›</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-900">
              🎉 みんなのクイズ
            </h2>

            <p className="mt-1 text-sm font-bold text-gray-500">
              {/* フレンドだけが見られる共有クイズ！自分だけのクイズを作っていいねをもらおう！ */}
              {/* 自分だけのクイズを作ってフレンドに共有しよう！公開すると100Pゲット！ */}
              {/* オリジナルクイズを作ってフレンドと楽しもう！公開すると100Pゲット！ */}
              フレンドにクイズを出題しよう！いいねを集めて人気クイズを目指そう！出題すると100Pゲット！
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {friendQuizzes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-pink-200 bg-pink-50 p-5 text-center">
                <div className="text-3xl">🫧</div>

                <p className="mt-2 font-black text-gray-900">
                  まだクイズが作られてないよ！
                </p>

                <p className="mt-1 text-sm font-bold text-gray-500">
                  最初のクイズを投稿してみよう！
                </p>
              </div>
            ) : (
              friendQuizzes.map((q) => {
                const isMine = q.creator_user_id === user?.id;
                const answered = q.selected_choice != null;
                const choices = [q.choice_1, q.choice_2, q.choice_3, q.choice_4];

                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50 p-3 shadow-sm"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <img
                        src={q.creator_avatar_url ?? "/images/初期アイコン.png"}
                        className="h-10 w-10 rounded-full border bg-white object-contain"
                        alt="creator"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-gray-900">
                          製作者：{q.creator_name ?? "ユーザー"}
                        </p>

                        <p className="text-xs font-bold text-gray-500">
                          作成日：{new Date(q.created_at).toLocaleString("ja-JP")}
                        </p>
                      </div>

                      <div className="shrink-0 rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-600">
                        ❤️ {q.like_count}
                      </div>
                    </div>

                    <p className="rounded-xl bg-white p-3 text-base font-black text-gray-900">
                      {q.question}
                    </p>

                    {q.hint && (
                      <p className="mt-2 rounded-xl bg-yellow-50 p-2 text-xs font-bold text-yellow-700">
                        💡 ヒント：{q.hint}
                      </p>
                    )}

                    <div className="mt-3 grid gap-2">
                      {choices.map((choice, index) => {
                        const choiceNo = index + 1;
                        const selected = q.selected_choice === choiceNo;
                        const correct = q.correct_choice === choiceNo;

                        return (
                          <button
                            key={choiceNo}
                            disabled={answered || isMine || answeringQuizId === q.id}
                            onClick={() => answerFriendQuiz(q.id, choiceNo)}
                            className={`
                              rounded-xl border px-3 py-2 text-left font-black transition
                              ${
                                answered && correct
                                  ? "border-green-300 bg-green-100 text-green-700"
                                  : answered && selected && !q.is_correct
                                    ? "border-rose-300 bg-rose-100 text-rose-700"
                                    : "border-gray-200 bg-white text-gray-800 hover:bg-pink-50"
                              }
                              disabled:cursor-not-allowed
                            `}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>

                    {answered && (
                      <p
                        className={`mt-3 rounded-xl p-3 text-center font-black ${
                          q.is_correct
                            ? "bg-green-100 text-green-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {q.is_correct ? "🎉 正解！100Pゲット！" : "😢 不正解！"}
                      </p>
                    )}

                    {isMine && (
                      <div className="mt-3 rounded-xl bg-gray-100 p-2 text-center">
                        <p className="text-xs font-bold text-gray-500">
                          自分が作ったクイズです
                        </p>

                        <button
                          onClick={() => deleteFriendQuiz(q.id)}
                          className="mt-2 w-full rounded-xl bg-gray-200 py-2 text-sm font-black text-gray-700 hover:bg-gray-300"
                        >
                          🗑️ クイズを削除
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => toggleQuizLike(q.id)}
                      disabled={likingQuizId === q.id}
                      className="mt-3 w-full rounded-xl bg-white py-2 text-sm font-black text-pink-600 ring-1 ring-pink-200 hover:bg-pink-50 disabled:opacity-50"
                    >
                      {q.liked_by_me ? "❤️ いいね済み" : "🤍 いいね"} {q.like_count}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => {
              if (hasPostedQuizToday) return;
              router.push("/user/friends/quizzes/new");
            }}
            disabled={hasPostedQuizToday}
            className={`
              mt-4 w-full rounded-xl py-3 font-black shadow-md transition
              ${
                hasPostedQuizToday
                  ? "cursor-not-allowed bg-gray-200 text-gray-500"
                  : "bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:brightness-110 active:scale-95"
              }
            `}
          >
            {hasPostedQuizToday
              ? "✅ 今日のクイズは投稿済み"
              : "✏️ クイズを投稿する"}
          </button>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-white p-1 md:p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900">
              🏆 フレンド内ランキング
            </h2>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
              自分＋フレンド
            </span>
          </div>

          <p className="mb-3 text-center text-xs md:text-base font-black text-amber-600">
            👉 横にスライドしてランキングを見る
          </p>

          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-2">
              <div className="w-[310px] md:w-[380px] shrink-0">
                <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50 p-3">
                  <div className="mb-3 text-center">
                    <h3 className="font-black text-gray-900 text-xl">
                      🔥 連続正解ランキング
                    </h3>

                    <p className="mt-1 text-xs font-bold text-gray-500">
                      🌟最高連続正解数🌟
                    </p>
                  </div>

                  {friendStreakRows.length === 0 ? (
                    <p className="rounded-xl bg-white p-4 text-center text-sm font-bold text-gray-500">
                      まだランキングがありません
                    </p>
                  ) : (
                    <div className="max-h-[350px] space-y-1 overflow-y-auto pr-1">
                      {friendStreakRows.slice(0, 10).map((r, idx) => {
                        const rank = idx + 1;

                        return (
                          <div
                            key={r.user_id}
                            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3"
                          >
                            <div className="w-8 text-center font-black text-gray-700">
                              {rank === 1 ? "👑" : `${rank}位`}
                            </div>

                            <img
                              src={r.avatar_url ?? "/images/初期アイコン.png"}
                              className="h-10 w-10 rounded-full border bg-white object-contain"
                              alt="avatar"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-black text-gray-900">
                                {r.username ?? "ユーザー"}
                                {r.user_id === user?.id ? "（自分）" : ""}
                              </p>
                            </div>

                            <p className="text-lg font-black text-red-500">
                              {r.best_streak ?? 0}
                              <span className="ml-1 text-xs text-gray-500">問</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => router.push("/streak-challenge")}
                  className="
                    mt-3 w-full rounded-xl py-2
                    font-black text-white text-sm
                    bg-gradient-to-r from-red-500 to-orange-400
                    shadow-md
                    hover:brightness-110 active:scale-95
                    transition
                  "
                >
                  🔥 1位を奪え！
                </button>
              </div>

              <div className="w-[310px] md:w-[380px] shrink-0">
                <div className="mt-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-white to-purple-50 p-3">
                  <div className="mb-3 text-center">
                    <h3 className="font-black text-gray-900 text-xl">
                      🏰 ダンジョン攻略ランキング
                    </h3>

                    <p className="mt-1 text-xs font-bold text-gray-500">
                      🌟最高到達階🌟
                    </p>
                  </div>

                  {friendDungeonRows.length === 0 ? (
                    <p className="rounded-xl bg-white p-4 text-center text-sm font-bold text-gray-500">
                      まだランキングがありません
                    </p>
                  ) : (
                    <div className="max-h-[350px] space-y-1 overflow-y-auto pr-1">
                      {friendDungeonRows.slice(0, 10).map((r, idx) => {
                        const rank = idx + 1;

                        return (
                          <div
                            key={r.user_id}
                            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3"
                          >
                            <div className="w-8 text-center font-black text-gray-700">
                              {rank === 1 ? "👑" : `${rank}位`}
                            </div>

                            <img
                              src={r.avatar_url ?? "/images/初期アイコン.png"}
                              className="h-10 w-10 rounded-full border bg-white object-contain"
                              alt="avatar"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-black text-gray-900">
                                {r.username ?? "ユーザー"}
                                {r.user_id === user?.id ? "（自分）" : ""}
                              </p>
                            </div>

                            <p className="text-lg font-black text-purple-600">
                              {r.best_stage ?? 0}
                              <span className="ml-1 text-xs text-gray-500">階</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => router.push("/quiz-master")}
                  className="
                    mt-3 w-full rounded-xl py-2
                    font-black text-white text-sm
                    bg-gradient-to-r from-purple-500 to-indigo-400
                    shadow-md
                    hover:brightness-110 active:scale-95
                    transition
                  "
                >
                  🏰 さらに上へ！
                </button>
              </div>

              <div className="w-[310px] md:w-[380px] shrink-0">
                <div className="mt-4 rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50 p-3">
                  <div className="mb-3 text-center">
                    <h3 className="font-black text-gray-900 text-xl">
                      ⚔️ アリーナ勝利数ランキング
                    </h3>

                    <p className="mt-1 text-xs font-bold text-gray-500">
                      🌟総勝利数🌟
                    </p>
                  </div>

                  {friendArenaRows.length === 0 ? (
                    <p className="rounded-xl bg-white p-4 text-center text-sm font-bold text-gray-500">
                      まだランキングがありません
                    </p>
                  ) : (
                    <div className="max-h-[350px] space-y-1 overflow-y-auto pr-1">
                      {friendArenaRows.slice(0, 10).map((r, idx) => {
                        const rank = idx + 1;

                        return (
                          <div
                            key={r.user_id}
                            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3"
                          >
                            <div className="w-8 text-center font-black text-gray-700">
                              {rank === 1 ? "👑" : `${rank}位`}
                            </div>

                            <img
                              src={r.avatar_url ?? "/images/初期アイコン.png"}
                              className="h-10 w-10 rounded-full border bg-white object-contain"
                              alt="avatar"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-black text-gray-900">
                                {r.username ?? "ユーザー"}
                                {r.user_id === user?.id ? "（自分）" : ""}
                              </p>
                            </div>

                            <p className="text-lg font-black text-purple-500">
                              {r.arena_wins ?? 0}
                              <span className="ml-1 text-xs text-gray-500">勝</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => router.push("/quiz-arena")}
                  className="
                    mt-3 w-full rounded-xl py-2
                    font-black text-white text-sm
                    bg-gradient-to-r from-red-500 to-purple-500
                    shadow-md
                    hover:brightness-110 active:scale-95
                    transition
                  "
                >
                  ⚔️ ライバルを撃破！
                </button>
              </div>

              <div className="w-[310px] md:w-[380px] shrink-0">
                <div className="mt-4 rounded-2xl border border-fuchsia-100 bg-gradient-to-br from-white via-pink-50 to-cyan-50 p-3">
                  <div className="mb-3 text-center">
                    <h3 className="font-black text-gray-900 text-xl">
                      🌈 ひまキャラコレクターランキング
                    </h3>

                    <p className="mt-1 text-xs font-bold text-gray-500">
                      🌟所持キャラ数🌟
                    </p>
                  </div>

                  {friendCharacterRows.length === 0 ? (
                    <p className="rounded-xl bg-white p-4 text-center text-sm font-bold text-gray-500">
                      まだランキングがありません
                    </p>
                  ) : (
                    <div className="max-h-[350px] space-y-1 overflow-y-auto pr-1">
                      {friendCharacterRows.slice(0, 10).map((r, idx) => {
                        const rank = idx + 1;

                        return (
                          <div
                            key={r.user_id}
                            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3"
                          >
                            <div className="w-8 text-center font-black text-gray-700">
                              {rank === 1 ? "👑" : `${rank}位`}
                            </div>

                            <img
                              src={r.avatar_url ?? "/images/初期アイコン.png"}
                              className="h-10 w-10 rounded-full border bg-white object-contain"
                              alt="avatar"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-black text-gray-900">
                                {r.username ?? "ユーザー"}
                                {r.user_id === user?.id ? "（自分）" : ""}
                              </p>
                            </div>

                            <p className="text-lg font-black text-fuchsia-500">
                              {r.character_count ?? 0}
                              <span className="ml-1 text-xs text-gray-500">体</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => router.push("/quiz-gacha")}
                  className="
                    mt-3 w-full rounded-xl py-2
                    font-black text-white text-sm
                    bg-[linear-gradient(90deg,#ff4d6d,#ffb703,#38b000,#00b4d8,#7b2cbf)]
                    shadow-md
                    hover:brightness-110 active:scale-95
                    transition
                  "
                >
                  🌈 新キャラをゲット！
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* <button
          onClick={() => router.push("/user/mypage")}
          className="
              w-full rounded-xl py-2 font-extrabold
              bg-gray-100 hover:bg-gray-200
              active:scale-95 transition
          "
          >
          ⬅️ マイページへ
      </button> */}
      </div>
    </div>
  );
}