"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Image from "next/image";
import UserProfileModal, { PublicProfile } from "@/app/components/UserProfileModal";

type ArticleData = {
  id?: string;
  title: string;
  genre: string;
  quiz?: {
    title: string;
    question: string;
    answer: string | number;
    displayAnswer?: string;
    choices?: (string | number)[];
    genre: string;
    level: string;
    answerExplanation?: string;
    trivia?: string;
  };
};

type Question = {
  id: string;
  quiz: {
    title: string;
    question: string;
    answer: number;
    displayAnswer?: string;
    choices: string[];
    genre: string;
    level: string;
    answerExplanation?: string;
    trivia?: string;
  };
};

type RankingRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  clear_time_ms: number;
};

type GameState =
  | "loading"
  | "login_required"
  | "already_played"
  | "ready"
  | "playing"
  | "cleared"
  | "failed"
  | "error";

const TODAY = new Date().toISOString().slice(0, 10);

function formatTime(ms: number) {
  return `${(ms / 1000).toFixed(2)}秒`;
}

async function fetchAllQuestions() {
  const res = await fetch("/api/articles", { cache: "no-store" });

  if (!res.ok) {
    throw new Error("問題データの取得に失敗しました。");
  }

  const data: ArticleData[] = await res.json();

  const quizQuestions: Question[] = data
    .filter((a) => a.quiz)
    .map((a) => ({
      id: a.id || a.quiz!.question,
      quiz: {
        title: a.title,
        question: a.quiz!.question,
        answer: Number(a.quiz!.answer),
        displayAnswer: a.quiz!.displayAnswer,
        choices: a.quiz!.choices ? a.quiz!.choices.map(String) : [],
        genre: a.quiz!.genre,
        level: a.quiz!.level,
        answerExplanation: a.quiz!.answerExplanation,
        trivia: a.quiz!.trivia,
      },
    }));

  return quizQuestions;
}

function pickDailyQuestionIds(allQuestions: Question[]) {
  const normalQuestions = allQuestions.filter((q) => q.quiz.level === "ふつう");
  const hardQuestions = allQuestions.filter((q) => q.quiz.level === "難しい");
  const extremeQuestions = allQuestions.filter((q) => q.quiz.level === "激ムズ");

  const seed = TODAY.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);

  const pickOne = (list: Question[], salt: number) => {
    if (list.length === 0) return null;

    const index = (seed + salt) % list.length;
    return list[index];
  };

  const q1 = pickOne(normalQuestions, 11);
  const q2 = pickOne(hardQuestions, 22);
  const q3 = pickOne(extremeQuestions, 33);

  if (!q1?.id || !q2?.id || !q3?.id) return null;

  return [q1.id, q2.id, q3.id];
}

async function loadOrCreateTodayQuestionIds(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  allQuestions: Question[]
) {
  const { data: existing } = await supabase
    .from("daily_hard_challenges")
    .select("question_ids")
    .eq("mission_date", TODAY)
    .maybeSingle();

  if (existing?.question_ids?.length === 3) {
    return existing.question_ids as string[];
  }

  const questionIds = pickDailyQuestionIds(allQuestions);

  if (!questionIds) {
    throw new Error("ふつう・難しい・激ムズの問題がそれぞれ1問以上必要です。");
  }

  const { data: inserted, error } = await supabase
    .from("daily_hard_challenges")
    .insert({
      mission_date: TODAY,
      question_ids: questionIds,
    })
    .select("question_ids")
    .single();

  if (error) {
    const { data: retry } = await supabase
      .from("daily_hard_challenges")
      .select("question_ids")
      .eq("mission_date", TODAY)
      .maybeSingle();

    if (retry?.question_ids?.length === 3) {
      return retry.question_ids as string[];
    }

    throw error;
  }

  return inserted.question_ids as string[];
}

function findQuestionsByIds(allQuestions: Question[], questionIds: string[]) {
  return questionIds
    .map((id) => allQuestions.find((q) => q.id === id))
    .filter(Boolean) as Question[];
}

export default function DailyHardChallengeClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [state, setState] = useState<GameState>("loading");
  const [userId, setUserId] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<"correct" | "wrong" | null>(null);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [clearTimeMs, setClearTimeMs] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const init = async () => {
      setState("loading");

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        setState("login_required");
        return;
      }

      setUserId(user.id);

      const { data: resultData } = await supabase
        .from("daily_hard_challenge_results")
        .select("id, cleared, clear_time_ms")
        .eq("user_id", user.id)
        .eq("mission_date", TODAY)
        .maybeSingle();

      if (resultData) {
        if (resultData.cleared && resultData.clear_time_ms) {
          setClearTimeMs(resultData.clear_time_ms);
        }
        setState("already_played");
      } else {
        try {
            const allQuestions = await fetchAllQuestions();
            const questionIds = await loadOrCreateTodayQuestionIds(supabase, allQuestions);
            const todayQuestions = findQuestionsByIds(allQuestions, questionIds);

            if (todayQuestions.length !== 3) {
                setError("今日の問題データが見つかりません。問題IDを確認してください。");
                setState("error");
                return;
            }

            setQuestions(todayQuestions);
            setState("ready");
        } catch (e) {
            setError(
                e instanceof Error
                ? e.message
                : "今日の問題を読み込めませんでした。"
            );
            setState("error");
            return;
        }
      }

      await loadRanking();
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    if (state !== "playing" || startTime == null) return;

    const timer = window.setInterval(() => {
        setElapsedMs(Date.now() - startTime);
    }, 50);

    return () => window.clearInterval(timer);
  }, [state, startTime]);

  const loadRanking = async () => {
    const { data } = await supabase
      .from("daily_hard_challenge_today_ranking")
      .select("*")
      .limit(50);

    setRanking((data ?? []) as RankingRow[]);
  };

  const openUserProfile = async (targetUserId: string) => {
    setSelected(null);
    setProfileLoading(true);
    setOpen(true);

    const { data, error } = await supabase
        .from("user_public_profiles")
        .select(
        "user_id, username, avatar_url, level, character_count, current_title, friend_code, friend_code_public, friend_recruiting"
        )
        .eq("user_id", targetUserId)
        .maybeSingle();

    setProfileLoading(false);

    if (error || !data) {
        setSelected({
        user_id: targetUserId,
        username: null,
        avatar_url: null,
        level: null,
        character_count: null,
        current_title: null,
        friend_code: null,
        friend_code_public: false,
        friend_recruiting: null,
        });
        return;
    }

    setSelected(data as PublicProfile);
  };

  const startGame = () => {
    setCurrentIndex(0);
    setSelectedChoice(null);
    setAnswered(false);
    setAnswerResult(null);
    setClearTimeMs(null);
    setElapsedMs(0);
    setStartTime(Date.now());
    setState("playing");
  };

  const handleAnswer = async (choiceIndex: number) => {
    if (!currentQuestion || answered) return;

    setSelectedChoice(choiceIndex);
    setAnswered(true);

    const isCorrect = choiceIndex === currentQuestion.quiz.answer;

    if (!isCorrect) {
        setAnswerResult("wrong");

        setTimeout(async () => {
        await supabase.rpc("fail_daily_hard_challenge");
        setState("failed");
        await loadRanking();
        }, 2000);

        return;
    }

    setAnswerResult("correct");

    const isLastQuestion = currentIndex === questions.length - 1;

    if (isLastQuestion) {
        setTimeout(async () => {
        const finishedMs = Date.now() - (startTime ?? Date.now());
        setClearTimeMs(finishedMs);

        const { error: rewardError } = await supabase.rpc(
            "reward_daily_hard_challenge",
            {
            p_clear_time_ms: finishedMs,
            }
        );

        if (rewardError) {
            setError(rewardError.message);
            setState("error");
            return;
        }

        setState("cleared");
        await loadRanking();
        }, 1200);

        return;
    }
  };

  const goNext = () => {
    setCurrentIndex((prev) => prev + 1);
    setSelectedChoice(null);
    setAnswered(false);
    setAnswerResult(null);
  };

  return (
    <>
        <div className="bg-gradient-to-b from-orange-50 via-amber-100 to-yellow-100 px-1 md:px-4 py-2 md:py-6">
        <div className="mx-auto max-w-[760px]">
            <div className="rounded-3xl border-2 border-black bg-gradient-to-br from-amber-950 via-orange-800 to-yellow-500 p-1 md:p-5 text-center shadow-xl">
            <p className="text-3xl md:text-5xl font-black text-white drop-shadow">
                🔥今日の激ムズチャレンジ
            </p>
            <p className="mt-3 text-lg md:text-xl font-black text-yellow-100">
                最難関の3問に挑め！全問正解で1000Pゲット！
            </p>
            <p className="mt-1 text-sm md:text-base font-bold text-white">
                ※1日1回のみ挑戦できます
            </p>
            </div>

            {state === "loading" && (
            <div className="mt-5 rounded-3xl border-2 border-black bg-white p-5 text-center font-black">
                読み込み中...
            </div>
            )}

            {state === "login_required" && (
            <div className="mt-5 rounded-3xl border-2 border-black bg-white p-5 text-center">
                <p className="text-2xl font-black">ログインすると挑戦できます！</p>
                <Link href="/user/login">
                <button className="mt-4 rounded-full border-2 border-black bg-yellow-300 px-6 py-2 text-xl font-black shadow">
                    ログインする
                </button>
                </Link>
            </div>
            )}

            {state === "ready" && (
                <div className="mt-2 md:mt-5 rounded-[32px] border-4 border-orange-300 bg-white p-5 text-center shadow-[0_14px_35px_rgba(251,146,60,0.18)]">
                    <p className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-black text-orange-700">
                    今日の激ムズ3問に挑戦！
                    </p>

                    <p className="mt-2 font-bold text-gray-700">
                    3問連続正解で1000P！1問でも間違えたら終了です。
                    </p>

                    <button
                    onClick={startGame}
                    className="mt-5 rounded-full border-2 border-black bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 px-8 py-3 text-2xl font-black text-white shadow-xl hover:scale-105 active:scale-95 transition-all animate-pulse"
                    >
                    🔥 挑戦開始
                    </button>
                </div>
            )}

            {state === "playing" && currentQuestion && (
            <div className="mt-1 md:mt-5 rounded-3xl border-2 border-black bg-white p-5 shadow">
                <p className="text-center text-sm font-black text-orange-700">
                第{currentIndex + 1}問 / 3問
                </p>

                <p className="mt-2 text-center text-xl font-black text-red-600">
                ⏱ {formatTime(elapsedMs)}
                </p>

                <p className="mt-3 text-center text-xl md:text-2xl font-black text-gray-900">
                {currentQuestion.quiz.question}
                </p>

                {answerResult === "correct" && (
                    <div className="mx-auto mt-4 max-w-[420px] rounded-3xl border-4 border-green-300 bg-gradient-to-br from-green-50 via-white to-emerald-100 px-5 py-4 text-center shadow-lg">
                        <p className="text-4xl md:text-5xl font-black text-green-600 animate-bounce">
                        ◎ 正解！
                        </p>
                        <p className="mt-1 text-sm md:text-base font-bold text-green-700">
                        いい感じ！この調子でいこう🔥
                        </p>
                    </div>
                    )}

                    {answerResult === "wrong" && (
                    <div className="mx-auto mt-4 max-w-[460px] rounded-3xl border-4 border-red-300 bg-gradient-to-br from-red-50 via-white to-orange-100 px-5 py-4 text-center shadow-lg">
                        <p className="text-3xl md:text-5xl font-black text-red-600">
                        ✕ 不正解…
                        </p>
                        <p className="mt-2 text-base md:text-xl font-black text-gray-800">
                        正解は「
                        {currentQuestion.quiz.displayAnswer ??
                            currentQuestion.quiz.choices[currentQuestion.quiz.answer]}
                        」
                        </p>
                    </div>
                )}

                <div className="mt-5 grid gap-3">
                {currentQuestion.quiz.choices.map((choice, index) => {
                    const isSelected = selectedChoice === index;
                    const isCorrect = currentQuestion.quiz.answer === index;

                    let className =
                    "w-full rounded-2xl border-2 border-black px-4 py-3 text-left text-lg font-black shadow transition-all";

                    if (!answered) {
                    className += " bg-yellow-50 hover:scale-[1.02]";
                    } else if (isCorrect) {
                    className += " bg-green-300";
                    } else if (isSelected) {
                    className += " bg-red-300";
                    } else {
                    className += " bg-gray-100";
                    }

                    return (
                    <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        disabled={answered}
                        className={className}
                    >
                        {choice}
                    </button>
                    );
                })}
                </div>

                {answered && selectedChoice === currentQuestion.quiz.answer && (
                <div className="mt-5 text-center">
                    {currentIndex === questions.length - 1 ? (
                    <p className="text-xl font-black text-green-600">
                        クリア処理中...
                    </p>
                    ) : (
                    <button
                        onClick={goNext}
                        className="rounded-full border-2 border-black bg-green-400 px-6 py-2 text-xl font-black text-white shadow"
                    >
                        次の問題へ
                    </button>
                    )}
                </div>
                )}
            </div>
            )}

            {state === "cleared" && (
                <div className="relative mt-2 md:mt-5 overflow-hidden rounded-[32px] border-4 border-yellow-300 bg-gradient-to-br from-yellow-100 via-white to-orange-100 p-6 text-center shadow-[0_18px_50px_rgba(251,146,60,0.28)]">
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-yellow-300/50 blur-2xl" />
                    <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-orange-400/30 blur-2xl" />

                    <div className="relative">
                    <p className="text-5xl md:text-7xl animate-bounce">🎉</p>

                    <p className="mt-2 text-3xl md:text-5xl font-black text-orange-600 drop-shadow-sm">
                        ミッションクリア！
                    </p>

                    <div className="mx-auto mt-4 max-w-[420px] rounded-3xl border-2 border-black bg-white px-4 py-4 shadow-[0_8px_0_rgba(0,0,0,0.16)]">
                        <p className="text-lg font-black text-gray-700">
                        報酬ゲット！
                        </p>
                        <p className="mt-1 text-4xl md:text-5xl font-black text-green-600">
                        1000P
                        </p>
                    </div>

                    {clearTimeMs != null && (
                        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border-2 border-orange-300 bg-orange-50 px-5 py-2 shadow">
                        <span className="text-xl">⏱</span>
                        <span className="text-xl md:text-2xl font-black text-red-600">
                            {formatTime(clearTimeMs)}
                        </span>
                        </div>
                    )}

                    <p className="mt-4 text-sm md:text-base font-bold text-gray-700">
                        今日のランキングに登録されました！
                    </p>

                    <Link href="/">
                        <button className="mt-5 rounded-full border-2 border-black bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 px-7 py-3 text-xl font-black text-white shadow-xl hover:scale-105 active:scale-95 transition-all">
                        ホームへ戻る
                        </button>
                    </Link>
                    </div>
                </div>
            )}

            {state === "failed" && (
                <div className="mt-2 md:mt-5 rounded-[32px] border-4 border-red-200 bg-gradient-to-br from-white via-red-50 to-orange-50 p-6 text-center shadow-xl">
                    <p className="text-5xl md:text-6xl">💥</p>
                    <p className="mt-2 text-3xl md:text-4xl font-black text-red-600">
                    チャレンジ失敗…
                    </p>
                    <p className="mt-3 text-lg md:text-xl font-black text-gray-800">
                    惜しい！また明日リベンジしてね！
                    </p>
                    <p className="mt-2 text-sm font-bold text-gray-500">
                    ※今日の挑戦は終了です
                    </p>

                    <Link href="/">
                    <button className="mt-5 rounded-full border-2 border-black bg-yellow-300 px-6 py-2 text-xl font-black shadow hover:scale-105 active:scale-95 transition-all">
                        ホームへ戻る
                    </button>
                    </Link>
                </div>
            )}

            {state === "already_played" && (
            <div className="mt-1 md:mt-5 rounded-3xl border-2 border-black bg-white p-5 text-center shadow">
                <p className="text-2xl font-black text-orange-700">
                本日は挑戦済みです
                </p>

                {clearTimeMs != null ? (
                <p className="mt-2 text-xl font-black text-green-600">
                    今日のクリアタイム：{formatTime(clearTimeMs)}
                </p>
                ) : (
                <p className="mt-2 text-xl font-black text-gray-700">
                    また明日チャレンジしてね！
                </p>
                )}

                <Link href="/">
                <button className="mt-5 rounded-full border-2 border-black bg-yellow-300 px-6 py-2 text-xl font-black shadow">
                    ホームへ戻る
                </button>
                </Link>
            </div>
            )}

            {state === "error" && (
            <div className="mt-1 md:mt-5 rounded-3xl border-2 border-black bg-white p-5 text-center shadow">
                <p className="text-2xl font-black text-red-600">エラー</p>
                <p className="mt-2 font-bold text-gray-700">
                {error ?? "エラーが発生しました。"}
                </p>
            </div>
            )}

            {state !== "playing" && (
                <div className="mt-2 md:mt-5 rounded-3xl border-2 border-black bg-white p-1 md:p-5 shadow">
                <p className="text-center text-2xl font-black text-orange-700">
                    🏆今日のクリア者
                </p>

                {ranking.length === 0 ? (
                    <p className="mt-3 text-center font-bold text-gray-600">
                    まだクリア者はいません。
                    </p>
                ) : (
                    <div className="mt-4 max-h-[290px] space-y-2 overflow-y-auto pr-1">
                    {ranking.map((row, index) => (
                        <button
                            type="button"
                            key={`${row.user_id}-${index}`}
                            onClick={() => openUserProfile(row.user_id)}
                            className="flex w-full items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-left transition-transform hover:scale-[1.01]"
                        >
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-orange-700">
                            {index + 1}位
                            </span>
                            <Image
                                src={row.avatar_url || "/images/default-avatar.png"}
                                alt=""
                                width={40}
                                height={40}
                                className="rounded-full border-2 border-orange-100 object-cover"
                            />
                            <span className="font-black">
                            {row.username ?? "名無し"}
                            </span>
                        </div>
                        <span className="font-black text-red-600">
                            {formatTime(row.clear_time_ms)}
                        </span>
                        </button>
                    ))}
                    </div>
                )}
                </div>
            )}
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