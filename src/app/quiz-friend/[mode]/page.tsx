"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter  } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedFriendsGames from "@/app/components/RecommendedFriendsGames";
import OnlineGameNotice from "@/app/components/OnlineGameNotice";

type FriendMode = "friend" | "lover";
type FriendGenre = "daily" | "image" | "love" | "choice";

type FriendPhase =
  | "name"
  | "waiting"
  | "ready"
  | "createAll"
  | "waitingQuestions"
  | "guess"
  | "reveal"
  | "result";

type ChoiceKey = "A" | "B";

type Player = {
  socketId: string;
  playerName: string;
};

type FriendChoice = {
  key: ChoiceKey;
  text: string;
};

type DraftQuestion = {
  question: string;
  correctText: string;
  fakeText: string;
};

type FriendGuessStartPayload = {
  questionId?: string;
  ownerId: string;
  question: string;
  choices: FriendChoice[];
  questionIndex: number;
  totalQuestions: number;
};

type FriendRoundResultPayload = {
  questionId?: string;
  ownerId: string;
  question: string;
  choices: FriendChoice[];
  correctChoice: ChoiceKey;
  guessChoice: ChoiceKey | null;
  isCorrect: boolean;
  scores: Record<string, number>;
  questionIndex: number;
  totalQuestions: number;
};

type FriendPresetQuestionsPayload = {
  questions: string[];
};

const modeLabelMap: Record<FriendMode, string> = {
  friend: "友達モード",
  lover: "恋人モード",
};

const genreLabelMap: Record<FriendGenre, string> = {
  daily: "日常編",
  image: "イメージ編",
  love: "恋愛編",
  choice: "究極の2択編",
};

const getTheme = (mode: FriendMode) => {
  const isLover = mode === "lover";

  return {
    page: isLover
      ? "bg-gradient-to-b from-pink-400 via-rose-200 to-yellow-100"
      : "bg-gradient-to-b from-sky-400 via-cyan-300 to-yellow-200",

    mainText: isLover ? "text-pink-600" : "text-sky-500",

    button: isLover
      ? "bg-gradient-to-r from-pink-300 via-rose-100 to-yellow-100 text-gray-800 hover:scale-105 hover:brightness-105"
      : "bg-gradient-to-r from-sky-200 via-cyan-100 to-yellow-100 text-gray-800 hover:scale-105 hover:brightness-105",

    questionBox: isLover
      ? "bg-pink-50 border-pink-400 text-pink-900"
      : "bg-yellow-50 border-black text-gray-900",

    inputMain: isLover
      ? "border-pink-400 focus:ring-pink-200"
      : "border-sky-400 focus:ring-sky-200",

    inputSub: isLover
      ? "border-rose-300 focus:ring-rose-200"
      : "border-amber-400 focus:ring-amber-200",

    choiceActive: isLover
      ? "border-pink-500 bg-gradient-to-br from-pink-100 via-rose-50 to-yellow-50 ring-4 ring-pink-300 scale-[1.03]"
      : "border-sky-500 bg-gradient-to-br from-sky-100 via-cyan-50 to-yellow-50 ring-4 ring-sky-300 scale-[1.03]",
  };
};

const bannedWords = [
  "ばか",
  "馬鹿",
  "バカ",
  "くそ",
  "糞",
  "クソ",
  "死ね",
  "しね",
  "アホ",
  "あほ",
  "ごみ",
  "ゴミ",
  "fuck",
  "shit",
  "bastard",
  "idiot",
  "asshole",
];

const ellipsizeName = (name: string, maxLen = 6) => {
  const chars = Array.from(name);
  if (chars.length <= maxLen) return name;
  return chars.slice(0, maxLen).join("") + "...";
};

const createEmptyQuestions = (count: number): DraftQuestion[] =>
  Array.from({ length: count }, () => ({
    question: "",
    correctText: "",
    fakeText: "",
  }));


const getUnderstandingLabel = (
  rate: number,
  mode: FriendMode
) => {
  const isLover = mode === "lover";

  // 恋人モード
  if (isLover) {
    if (rate >= 100) return "脳内同期レベル";
    if (rate >= 80) return "ほぼ心読めてる";
    if (rate >= 60) return "好み把握済み";
    if (rate >= 40) return "まだ隠し要素あり";
    if (rate >= 20) return "意外とまだ未知";
    return "ここから恋愛アップデート";
  }

  // 友達モード
  if (rate >= 100) return "もはや同じ脳";
  if (rate >= 75) return "長年コンビ感";
  if (rate >= 50) return "だいたい心読める";
  if (rate >= 25) return "まだ知らない一面あり";
  return "ここから仲良しスタート";
};

const getResultComment = (rate: number, mode: FriendMode) => {
  const isLover = mode === "lover";

  if (isLover) {
    if (rate >= 100) {
      return "相手の好みや選び方をかなり正確に読めています。同じタイミングで同じこと考えてそうなレベル。";
    }
    if (rate >= 80) {
      return "かなり高い理解度です。普段の会話や反応をしっかり覚えているタイプです。";
    }
    if (rate >= 60) {
      return "相手の気持ちや好みをちゃんと見ています。自然と相手っぽい回答を選べています。";
    }
    if (rate >= 40) {
      return "まだ知らない一面がありそうです。ここから会話すると、かなり盛り上がります。";
    }
    if (rate >= 20) {
      return "新しい発見が多い結果です。相手の答えを聞くほど、もっと知りたくなるはず。";
    }
    return "ここから理解度アップ。お互いの好きなものや考え方を知るきっかけになります。";
  }

  if (rate >= 100) {
    return "ノリも考え方もかなり近いです。長年一緒にいた感がすごい。";
  }
  if (rate >= 75) {
    return "かなり息が合っています。相手の回答パターンをちゃんと読めています。";
  }
  if (rate >= 50) {
    return "いい感じに理解しています。たまに予想外が飛んでくるのも面白いところ。";
  }
  if (rate >= 25) {
    return "まだ知らない一面が結構あります。答え合わせすると意外な発見が多そうです。";
  }
  return "ここから理解度アップ。答え合わせをすると、次はもっと読めるようになります。";
};

const getResultStyle = (rate: number, mode: FriendMode) => {
  const isLover = mode === "lover";

  if (isLover) {
    if (rate >= 100) {
      return {
        card: "bg-gradient-to-br from-pink-200 via-rose-100 to-yellow-100 border-pink-500",
        text: "text-pink-600",
        badge: "💖👑",
      };
    }

    if (rate >= 80) {
      return {
        card: "bg-gradient-to-br from-pink-100 via-rose-50 to-yellow-50 border-rose-400",
        text: "text-rose-500",
        badge: "💕✨",
      };
    }

    if (rate >= 60) {
      return {
        card: "bg-gradient-to-br from-rose-50 via-pink-50 to-yellow-50 border-pink-300",
        text: "text-pink-500",
        badge: "🫶",
      };
    }

    if (rate >= 40) {
      return {
        card: "bg-gradient-to-br from-pink-50 via-white to-yellow-50 border-pink-200",
        text: "text-pink-400",
        badge: "🌸",
      };
    }

    return {
      card: "bg-gradient-to-br from-white via-pink-50 to-rose-50 border-rose-200",
      text: "text-rose-400",
      badge: "💞",
    };
  }

  // 通常モード
  if (rate >= 100) {
    return {
      card: "bg-gradient-to-br from-yellow-100 via-pink-100 to-sky-100 border-yellow-400",
      text: "text-yellow-600",
      badge: "🏆✨",
    };
  }

  if (rate >= 80) {
    return {
      card: "bg-gradient-to-br from-pink-100 via-sky-100 to-cyan-100 border-pink-400",
      text: "text-pink-600",
      badge: "🌈✨",
    };
  }

  if (rate >= 60) {
    return {
      card: "bg-gradient-to-br from-sky-100 via-cyan-100 to-yellow-50 border-sky-400",
      text: "text-sky-600",
      badge: "🫶",
    };
  }

  if (rate >= 40) {
    return {
      card: "bg-gradient-to-br from-white via-cyan-50 to-yellow-50 border-cyan-300",
      text: "text-cyan-600",
      badge: "🌱",
    };
  }

  return {
    card: "bg-gradient-to-br from-white via-sky-50 to-cyan-50 border-sky-200",
    text: "text-sky-500",
    badge: "💫",
  };
};

export default function QuizFriendCodePage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const code = searchParams?.get("code") || "";
  const mode = (searchParams?.get("mode") || "friend") as FriendMode;
  const genre = (searchParams?.get("genre") || "daily") as FriendGenre;

  const questionCountParam = Number(searchParams?.get("questions") || "");
  const questionCount =
    Number.isFinite(questionCountParam) && questionCountParam > 0
      ? questionCountParam
      : mode === "lover"
      ? 5
      : 4;

  const [phase, setPhase] = useState<FriendPhase>("name");
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const [roomCode, setRoomCode] = useState("");
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState("0/2");
  const [readyToStart, setReadyToStart] = useState(false);

  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>(
    createEmptyQuestions(questionCount)
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedQuestions, setSubmittedQuestions] = useState(false);
  const [presetQuestionsLoaded, setPresetQuestionsLoaded] = useState(false);

  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(questionCount);

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentChoices, setCurrentChoices] = useState<FriendChoice[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<ChoiceKey | null>(null);

  const [lastResult, setLastResult] = useState<FriendRoundResultPayload | null>(
    null
  );

  const [scores, setScores] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const {
    joinWithCode,
    resetMatch,
    players: rawPlayers,
    mySocketId,
    socket,
  } = useBattle(playerName);

  const players: Player[] = useMemo(
    () =>
      rawPlayers.map((p) => ({
        socketId: p.socketId,
        playerName: p.name,
      })),
    [rawPlayers]
  );

  const myScore = scores[mySocketId] ?? 0;
  const maxGuessCount = totalQuestions || questionCount;
  const understandingRate =
    maxGuessCount > 0 ? Math.round((myScore / maxGuessCount) * 100) : 0;

  const resultStyle = getResultStyle(understandingRate, mode);

  const theme = getTheme(mode);

  const modeLabel = modeLabelMap[mode] ?? "友達モード";
  const genreLabel = genreLabelMap[genre] ?? "日常編";

  const allQuestionsLoaded =
    draftQuestions.length > 0 &&
    draftQuestions.every((q) => q.question.trim().length > 0);

  const canSubmitQuestions =
    !submittedQuestions &&
    presetQuestionsLoaded &&
    allQuestionsLoaded &&
    draftQuestions.every(
      (q) => q.correctText.trim() && q.fakeText.trim()
    );

  const handleJoin = () => {
    const trimmedName = playerName.trim();

    if (!trimmedName) {
      setNameError("名前を入力してください");
      return;
    }

    const lower = trimmedName.toLowerCase();
    const found = bannedWords.some((word) => lower.includes(word));

    if (found) {
      setNameError("不適切な言葉は使えません");
      return;
    }

    setNameError(null);
    setRoomCode(`friend_${code}`);
    setPhase("waiting");

    joinWithCode(code, "2", "friend");
  };

  const handleStartReady = () => {
    if (!socket || !roomCode) return;

    setReadyToStart(true);

    socket.emit("player_ready", {
      roomCode,
      socketId: mySocketId,
      handicap: 0,
      gameType: "friend",
      genre,
      questionCount,
    });
  };

  const updateDraftQuestion = (
    index: number,
    key: keyof DraftQuestion,
    value: string
  ) => {
    setDraftQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [key]: value } : q))
    );
  };

  const validateQuestions = () => {
    if (!presetQuestionsLoaded || !allQuestionsLoaded) {
      return "質問を読み込み中です。少し待ってから送信してください";
    }

    for (let i = 0; i < draftQuestions.length; i++) {
      const q = draftQuestions[i];
      const question = q.question.trim();
      const correctText = q.correctText.trim();
      const fakeText = q.fakeText.trim();

      if (!question || !correctText || !fakeText) {
        return `${i + 1}問目の「本当の回答・違う回答」を入力してください`;
      }

      if (correctText === fakeText) {
        return `${i + 1}問目の「本当の回答」と「違う回答」は別の内容にしてください`;
      }
    }

    return null;
  };

  const handleSubmitAllQuestions = () => {
    if (!socket || !roomCode) return;

    const error = validateQuestions();

    if (error) {
      setFormError(error);
      return;
    }

    setFormError(null);
    setSubmittedQuestions(true);
    setPhase("waitingQuestions");

    socket.emit("friend_submit_questions", {
      roomCode,
      mode,
      genre,
      questionCount: draftQuestions.length,
      questions: draftQuestions.map((q) => ({
        question: q.question.trim(),
        correctText: q.correctText.trim(),
        fakeText: q.fakeText.trim(),
      })),
    });
  };

  const handleSubmitGuess = () => {
    if (!socket || !roomCode || !selectedChoice) return;

    socket.emit("friend_guess_answer", {
      roomCode,
      choice: selectedChoice,
    });
  };

  const resetLocalGame = () => {
    setOwnerId(null);
    setQuestionIndex(0);
    setTotalQuestions(questionCount);

    setDraftQuestions(createEmptyQuestions(questionCount));
    setFormError(null);
    setSubmittedQuestions(false);
    setPresetQuestionsLoaded(false);

    setCurrentQuestion("");
    setCurrentChoices([]);
    setSelectedChoice(null);

    setLastResult(null);
    setScores({});
    setFinished(false);
  };

  const handleRematch = () => {
    if (!socket || !roomCode) return;

    resetLocalGame();
    setReadyToStart(false);
    resetMatch();

    joinWithCode(code, "2", "friend");
    setPhase("waiting");
  };

  const handleShareX = () => {
    const text = [
      "【ひまQ｜なかよし診断🫶】",
      `${modeLabel}・${genreLabel}`,
      `理解度：${understandingRate}%`,
      `結果：${getUnderstandingLabel(understandingRate, mode)}`,
      "",
      "👇ひまQで遊ぶ",
      "#ひまQ #なかよし診断 #理解度テスト",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() });
  };

  useEffect(() => {
    setDraftQuestions(createEmptyQuestions(questionCount));
    setPresetQuestionsLoaded(false);
    setTotalQuestions(questionCount);
  }, [questionCount]);

  useEffect(() => {
    if (!socket) return;

    const onRoomCount = ({
      players,
      current,
      max,
    }: {
      players: Player[];
      current: number;
      max: number;
    }) => {
      setRoomPlayers(players);
      setPlayerCount(`${current}/${max}`);

      if (current >= 2 && phase === "waiting") {
        setPhase("ready");
      }
    };

    const onBothReadyStart = () => {
      setPhase("createAll");
    };

    const onPresetQuestions = (payload: FriendPresetQuestionsPayload) => {
      const questions = payload.questions ?? [];

      if (questions.length === 0) {
        setFormError("質問の読み込みに失敗しました");
        setPresetQuestionsLoaded(false);
        return;
      }

      setDraftQuestions(
        questions.map((question) => ({
          question,
          correctText: "",
          fakeText: "",
        }))
      );

      setTotalQuestions(questions.length);
      setPresetQuestionsLoaded(true);
      setFormError(null);
    };

    const onAllQuestionsReady = () => {
      setPhase("guess");
    };

    const onGuessStart = (payload: FriendGuessStartPayload) => {
      setOwnerId(payload.ownerId);
      setQuestionIndex(payload.questionIndex);
      setTotalQuestions(payload.totalQuestions);
      setCurrentQuestion(payload.question);
      setCurrentChoices(payload.choices);
      setSelectedChoice(null);
      setLastResult(null);

      setPhase("guess");
    };

    const onRoundResult = (payload: FriendRoundResultPayload) => {
      setLastResult(payload);
      setScores(payload.scores ?? {});
      setSelectedChoice(null);
      setPhase("reveal");
    };

    const onGameEnd = ({ scores }: { scores: Record<string, number> }) => {
      setScores(scores ?? {});
      setFinished(true);
      setPhase("result");
    };

    socket.on("update_room_count", onRoomCount);
    socket.on("both_ready_start", onBothReadyStart);
    socket.on("friend_preset_questions", onPresetQuestions);
    socket.on("friend_all_questions_ready", onAllQuestionsReady);
    socket.on("friend_guess_start", onGuessStart);
    socket.on("friend_round_result", onRoundResult);
    socket.on("friend_game_end", onGameEnd);

    return () => {
      socket.off("update_room_count", onRoomCount);
      socket.off("both_ready_start", onBothReadyStart);
      socket.off("friend_preset_questions", onPresetQuestions);
      socket.off("friend_all_questions_ready", onAllQuestionsReady);
      socket.off("friend_guess_start", onGuessStart);
      socket.off("friend_round_result", onRoundResult);
      socket.off("friend_game_end", onGameEnd);
    };
  }, [socket, phase]);

  if (phase === "name") {
    return (
      <>
      <OnlineGameNotice />
      <div className={`${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-xl rounded-3xl border-4 border-black bg-white/80 p-5 shadow-xl">
          <div className="mt-6">
            <p className="text-xl md:text-2xl font-extrabold text-gray-800">
              ニックネームを入力してください
            </p>

            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                const value = e.target.value.slice(0, 10);
                setPlayerName(value);

                const lower = value.toLowerCase();
                const found = bannedWords.some((word) => lower.includes(word));
                setNameError(found ? "不適切な言葉は使えません" : null);
              }}
              maxLength={10}
              className="mt-4 w-full rounded-xl border-4 border-black px-4 py-3 text-xl font-bold outline-none focus:ring-4 focus:ring-sky-300"
              placeholder="例：ひま太郎"
            />

            {nameError && (
              <p className="mt-3 text-red-600 text-lg font-extrabold">
                {nameError}
              </p>
            )}

            <button
              onClick={handleJoin}
              className="mt-6 w-full rounded-full border-4 border-black bg-gradient-to-r from-sky-200 via-cyan-100 to-yellow-100 px-6 py-4 text-xl md:text-2xl font-extrabold text-gray-800 shadow-lg transition-all hover:scale-105 hover:brightness-105"
            >
              あいことばでマッチ
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (phase === "waiting") {
    return (
      <>
      <OnlineGameNotice />
      <div className={`${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-xl rounded-3xl border-4 border-black bg-white/80 p-5 shadow-xl">
          <p className="text-2xl md:text-4xl font-extrabold text-gray-800 animate-pulse">
            相手を待っています…
          </p>

          <p className="mt-4 text-xl md:text-2xl font-bold text-gray-700">
            参加人数：{playerCount}
          </p>

          <p className="mt-2 text-sm md:text-base text-gray-600">
            あいことば：{code}
          </p>

          {playerName && (
            <p className="mt-5 text-lg md:text-xl font-bold text-gray-700">
              あなた：{playerName}
            </p>
          )}
        </div>
      </div>
      </>
    );
  }

  if (phase === "ready") {
    return (
      <>
      <OnlineGameNotice />
      <div className={`${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-2xl rounded-3xl border-4 border-black bg-white/80 p-5 shadow-xl">
          <p className={`text-3xl md:text-5xl font-extrabold ${theme.mainText}`}>
            2人そろったよ！
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {roomPlayers.map((p) => (
              <div
                key={p.socketId}
                className="rounded-2xl border-4 border-black bg-white px-3 py-3 shadow"
              >
                <p className="truncate text-lg md:text-xl font-extrabold">
                  {p.playerName}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-gray-700 font-bold">
            質問は自動で決まります。お互いに本当の回答と、相手を迷わせる違う回答を入力します。
          </p>

          {!readyToStart ? (
            <motion.button
              onClick={handleStartReady}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mt-6 rounded-full border-4 border-black px-8 py-4 text-2xl font-extrabold text-gray-800 shadow-lg transition-all ${theme.button}`}
            >
              回答入力へ進む！
            </motion.button>
          ) : (
            <p className="mt-6 text-xl md:text-2xl font-bold text-gray-700 animate-pulse">
              相手の準備を待っています…
            </p>
          )}
        </div>
      </div>
      </>
    );
  }

  if (phase === "createAll") {
    return (
      <>
      <OnlineGameNotice />
      <div className={`${theme.page} px-4 py-6 text-center`}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 rounded-3xl border-4 border-black bg-white/80 px-4 py-4 shadow-xl">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900">
              回答を入力しよう
            </h1>

            <p className="mt-2 text-sm md:text-lg font-bold text-gray-700">
              {modeLabel}・{genreLabel} / {draftQuestions.length}問
            </p>

            <p className="mt-2 text-sm md:text-base text-gray-600">
              質問は2人とも同じです。本当の回答と、相手を迷わせる「違う回答」を入力してください。
            </p>
          </div>

          {!presetQuestionsLoaded && (
            <div className="mb-4 rounded-2xl border-4 border-black bg-white/90 p-5 text-center shadow-xl">
              <p className="text-xl md:text-2xl font-extrabold text-gray-800 animate-pulse">
                質問を読み込み中…
              </p>
              <p className="mt-2 text-sm md:text-base font-bold text-gray-500">
                ジャンル内からランダムに質問を選んでいます。
              </p>
            </div>
          )}

          <div className="space-y-4">
            {draftQuestions.map((q, index) => (
              <div
                key={index}
                className="rounded-3xl border-4 border-black bg-white/90 p-4 text-left shadow-xl"
              >
                <p className="text-xl md:text-2xl font-extrabold text-gray-900">
                  {index + 1}問目
                </p>

                <div className="mt-3 space-y-3">
                  <div>
                    <label className="font-extrabold text-gray-800">
                      質問
                    </label>

                    <div className={`mt-1 rounded-xl border-4 px-3 py-3 text-lg md:text-xl font-extrabold ${theme.questionBox}`}>
                      {q.question || "質問を読み込み中..."}
                    </div>
                  </div>

                  <div>
                    <label className="font-extrabold text-gray-800">
                      本当の回答
                    </label>
                    <input
                      value={q.correctText}
                      onChange={(e) =>
                        updateDraftQuestion(index, "correctText", e.target.value)
                      }
                      className={`mt-1 w-full rounded-xl border-4 px-3 py-3 text-lg font-bold outline-none focus:ring-4 ${theme.inputMain}`}
                      placeholder="例：グミ"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-gray-800">
                      違う回答
                    </label>
                    <input
                      value={q.fakeText}
                      onChange={(e) =>
                        updateDraftQuestion(index, "fakeText", e.target.value)
                      }
                      className={`mt-1 w-full rounded-xl border-4 px-3 py-3 text-lg font-bold outline-none focus:ring-4 ${theme.inputSub}`}
                      placeholder="例：からあげ"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {formError && (
            <p className="mt-4 rounded-xl bg-white px-4 py-3 text-red-600 font-extrabold border-4 border-red-400">
              {formError}
            </p>
          )}

          <button
            onClick={handleSubmitAllQuestions}
            disabled={!canSubmitQuestions}
            className={`
              mt-6 w-full rounded-full border-4 border-black px-6 py-4 text-xl md:text-2xl font-extrabold shadow-lg transition-all
              ${
                canSubmitQuestions
                  ? theme.button
                  : "bg-gray-200 text-gray-400"
              }
            `}
          >
            {submittedQuestions ? "送信済み" : "回答完了！"}
          </button>
        </div>
      </div>
      </>
    );
  }

  if (phase === "waitingQuestions") {
    return (
      <>
      <OnlineGameNotice />
      <div className={`${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-xl rounded-3xl border-4 border-black bg-white/80 p-5 shadow-xl">
          <p className="text-2xl md:text-4xl font-extrabold text-gray-800 animate-pulse">
            相手の入力完了を待っています…
          </p>

          <p className="mt-4 text-lg md:text-xl font-bold text-gray-700">
            あなたの回答は送信済みです。
          </p>

          <p className="mt-2 text-sm md:text-base text-gray-600">
            2人とも完了したら、相手の回答を予想します。
          </p>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
    <OnlineGameNotice />
    <div className={`${theme.page} px-4 py-6 text-center`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 rounded-3xl border-4 border-black bg-white/80 px-4 py-4 shadow-xl">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900">
            なかよし診断
          </h1>

          <p className="mt-2 text-sm md:text-lg font-bold text-gray-700">
            {modeLabel}・{genreLabel}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {players.map((p) => {
              const active = p.socketId === mySocketId;
              const score = scores[p.socketId] ?? 0;

              return (
                <div
                  key={p.socketId}
                  className={`
                    rounded-2xl border-4 px-3 py-3 shadow
                    ${
                      active
                        ? theme.choiceActive
                        : "border-black bg-white"
                    }
                  `}
                >
                  <p className="truncate text-lg md:text-xl font-extrabold">
                    {active ? "あなた" : ellipsizeName(p.playerName)}
                  </p>
                  <p className="mt-1 text-sm md:text-base font-bold text-gray-600">
                    正解：{score}問
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {phase === "guess" && (
            <motion.div
              key="guess"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border-4 border-black bg-white/90 p-5 shadow-xl"
            >
              <p className="text-lg md:text-xl font-bold text-gray-500">
                {questionIndex + 1} / {totalQuestions}
              </p>

              <h2 className="mt-2 text-2xl md:text-4xl font-extrabold text-gray-900">
                相手の回答を予想しよう
              </h2>

              <div className="mt-5 rounded-2xl border-4 border-black bg-yellow-50 px-4 py-4">
                <p className="text-xl md:text-3xl font-extrabold text-gray-900">
                  {currentQuestion}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentChoices.map((choice) => {
                  const active = selectedChoice === choice.key;

                  return (
                    <button
                      key={choice.key}
                      onClick={() => setSelectedChoice(choice.key)}
                      className={`
                        rounded-2xl border-4 px-4 py-5 text-xl md:text-2xl font-extrabold shadow-md transition-all
                        ${
                          active
                            ? theme.choiceActive
                            : "border-black bg-white opacity-70 hover:opacity-100 hover:scale-[1.02]"
                        }
                      `}
                    >
                      {choice.text}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSubmitGuess}
                disabled={!selectedChoice}
                className={`
                  mt-6 w-full rounded-full border-4 border-black px-6 py-4 text-xl md:text-2xl font-extrabold shadow-lg transition-all
                  ${
                    selectedChoice
                      ? theme.button
                      : "bg-gray-200 text-gray-400"
                  }
                `}
              >
                これだと思う！
              </button>
            </motion.div>
          )}

          {phase === "reveal" && lastResult && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border-4 border-black bg-white/90 p-5 shadow-xl"
            >
              <p className="text-lg md:text-xl font-bold text-gray-500">
                結果発表
              </p>

              <h2 className="mt-2 text-2xl md:text-4xl font-extrabold text-gray-900">
                {players.find((p) => p.socketId === lastResult.ownerId)
                  ?.playerName ?? "相手"}
                さんの本当の回答は…
              </h2>

              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`
                  mt-5 rounded-2xl border-4 px-4 py-5 text-3xl md:text-5xl font-extrabold
                  ${
                    mode === "lover"
                      ? "border-pink-400 bg-pink-50 text-pink-700"
                      : "border-sky-400 bg-sky-50 text-sky-700"
                  }
                `}
              >
                {
                  lastResult.choices.find(
                    (choice) => choice.key === lastResult.correctChoice
                  )?.text
                }
              </motion.p>

              <p
                className={`
                  mt-5 text-2xl md:text-4xl font-extrabold
                  ${lastResult.isCorrect ? "text-green-600" : "text-red-500"}
                `}
              >
                {lastResult.isCorrect
                  ? "正解！よくわかってる！"
                  : "不正解！意外だった！？"}
              </p>

              <p className="mt-4 text-sm md:text-base text-gray-500">
                次の問題に進みます…
              </p>
            </motion.div>
          )}

          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`rounded-3xl border-4 ${resultStyle.card} p-5 shadow-xl`}
            >
              <p className="text-lg md:text-xl font-bold text-gray-500">
                診断結果
              </p>

              <h2 className="mt-2 text-3xl md:text-5xl font-extrabold text-gray-900">
                理解度 {understandingRate}%
              </h2>

              <p className={`mt-4 text-2xl md:text-4xl font-extrabold ${resultStyle.text}`}>
                {resultStyle.badge} {getUnderstandingLabel(understandingRate, mode)}
              </p>

              <p
                className={`
                  mt-4 rounded-2xl border-4 px-4 py-4 text-lg md:text-xl font-bold
                  ${
                    mode === "lover"
                      ? "border-pink-300 bg-pink-50 text-rose-700"
                      : "border-yellow-300 bg-yellow-50 text-gray-700"
                  }
                `}
              >
                {getResultComment(understandingRate, mode)}
              </p>

              <div className="mt-5 rounded-2xl border-4 border-black bg-white p-4">
                <p className="text-xl md:text-2xl font-extrabold text-gray-800">
                  あなたの正解数：{myScore} / {maxGuessCount}問
                </p>
              </div>

              <div className="mt-6 flex flex-col md:flex-row justify-center gap-3">
                <button
                  onClick={handleShareX}
                  className="rounded-xl border-4 border-black bg-black px-6 py-3 text-xl font-extrabold text-white shadow-md transition-all hover:scale-105"
                >
                  Xで結果をシェア
                </button>

                <button
                  onClick={() =>
                    router.push(
                      `/quiz-friend/rematch-select?code=${encodeURIComponent(code)}`
                    )
                  }
                  className={`rounded-xl border-4 border-black px-6 py-3 text-xl font-extrabold text-gray-800 shadow-md transition-all hover:scale-105 hover:brightness-105 ${theme.button}`}
                >
                  もう一回遊ぶ
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {phase === "result" && (
        <>
          <RecommendedFriendsGames
            title="次はどれで遊ぶ？👥"
            count={4}
            excludeHref="/quiz-friend"
          />
        </>
      )}
    </div>
    </>
  );
}