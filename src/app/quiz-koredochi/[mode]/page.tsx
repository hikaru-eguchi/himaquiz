"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedMultiplayerGames from "@/app/components/RecommendedMultiplayerGames";

type KoredochiPhase =
  | "name"
  | "waiting"
  | "ready"
  | "playing"
  | "reveal"
  | "result";

type ChoiceKey = "A" | "B";

type Player = {
  socketId: string;
  playerName: string;
};

type KoredochiChoice = {
  key: ChoiceKey;
  text: string;
};

type KoredochiQuestionPayload = {
  questionId?: string;
  question: string;
  choices: KoredochiChoice[];
  questionIndex: number;
  totalQuestions: number;
};

type KoredochiRoundResultPayload = {
  questionId?: string;
  question: string;
  choices: KoredochiChoice[];
  answers: Record<string, ChoiceKey>;
  counts: Record<ChoiceKey, number>;
  matched: boolean;
  allMatched: boolean;
  majorityChoice: ChoiceKey | null;
  questionIndex: number;
  totalQuestions: number;
  synchroCount: number;
  allMatchCount: number;
};

type KoredochiGameEndPayload = {
  synchroCount: number;
  allMatchCount: number;
  totalQuestions: number;
  pairRates?: Record<string, number>;
  questionResults?: KoredochiRoundResultPayload[];
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

const getTheme = () => {
  return {
    page: "bg-gradient-to-b from-cyan-400 via-violet-300 to-pink-400",
    mainText: "text-violet-600",
    button:
      "bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 text-white hover:scale-105 hover:brightness-110",
    subButton:
      "bg-gradient-to-r from-cyan-100 via-violet-100 to-pink-100 text-gray-800 hover:scale-105 hover:brightness-105",
    questionBox:
      "bg-gradient-to-br from-cyan-50 via-white to-pink-50 border-violet-400 text-gray-900",
    choiceActive:
      "border-violet-600 bg-gradient-to-br from-cyan-100 via-violet-100 to-pink-100 ring-4 ring-violet-300 scale-[1.03]",
  };
};

const getSynchroLabel = (rate: number) => {
  if (rate >= 100) return "奇跡の全問シンクロ！";
  if (rate >= 85) return "息ピッタリ！";
  if (rate >= 70) return "かなり似てる！";
  if (rate >= 50) return "相性バツグン！";
  if (rate >= 30) return "いいコンビかも！";
  return "まだまだ発見がいっぱい！";
};

const getSynchroComment = (rate: number) => {
  if (rate >= 100) {
    return "全問一致！価値観がかなり近いです。同じことを考えていた瞬間が多すぎます。";
  }

  if (rate >= 85) {
    return "かなり高いシンクロ率です。好みや感覚が似ていて、自然と同じ答えを選べています。";
  }

  if (rate >= 70) {
    return "しっかり気が合っています。たまに違う答えが出るのも、会話が盛り上がるポイントです。";
  }

  if (rate >= 50) {
    return "半分以上は意見が合っています。似ているところと違うところのバランスがちょうどいいです。";
  }

  if (rate >= 30) {
    return "意外な違いがたくさん見つかる結果です。答え合わせをするとかなり盛り上がりそうです。";
  }

  return "かなり個性が分かれました。違いを楽しめます。次はもっと合うかも？";
};

const getResultStyle = (rate: number) => {
  if (rate >= 100) {
    return {
      card: "bg-gradient-to-br from-yellow-100 via-pink-100 to-cyan-100 border-yellow-400",
      text: "text-yellow-600",
      badge: "🌈👑",
    };
  }

  if (rate >= 85) {
    return {
      card: "bg-gradient-to-br from-pink-100 via-violet-100 to-cyan-100 border-pink-400",
      text: "text-pink-600",
      badge: "✨🤝",
    };
  }

  if (rate >= 70) {
    return {
      card: "bg-gradient-to-br from-cyan-100 via-violet-100 to-pink-50 border-violet-400",
      text: "text-violet-600",
      badge: "✨",
    };
  }

  if (rate >= 50) {
    return {
      card: "bg-gradient-to-br from-white via-cyan-50 to-pink-50 border-cyan-300",
      text: "text-cyan-600",
      badge: "🤝",
    };
  }

  return {
    card: "bg-gradient-to-br from-white via-violet-50 to-pink-50 border-violet-200",
    text: "text-violet-500",
    badge: "🎉",
  };
};

export default function QuizKoredochiCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams?.get("code") || "";
  const countParam = searchParams?.get("count") || "2";

  const playerMaxCount = (() => {
    const n = Number(countParam);
    if (!Number.isFinite(n)) return 2;
    if (n < 2) return 2;
    if (n > 8) return 8;
    return n;
  })();

  const questionCountParam = Number(searchParams?.get("questions") || "");
  const questionCount =
    Number.isFinite(questionCountParam) && questionCountParam > 0
      ? questionCountParam
      : 5;

  const theme = getTheme();

  const [phase, setPhase] = useState<KoredochiPhase>("name");
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const [roomCode, setRoomCode] = useState("");
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(`0/${playerMaxCount}`);
  const [readyToStart, setReadyToStart] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(questionCount);

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentChoices, setCurrentChoices] = useState<KoredochiChoice[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<ChoiceKey | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState(false);

  const [lastResult, setLastResult] =
    useState<KoredochiRoundResultPayload | null>(null);

  const [synchroCount, setSynchroCount] = useState(0);
  const [allMatchCount, setAllMatchCount] = useState(0);
  const [questionResults, setQuestionResults] = useState<
    KoredochiRoundResultPayload[]
  >([]);

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

  const displayPlayers = roomPlayers.length > 0 ? roomPlayers : players;

  const synchroRate =
    totalQuestions > 0 ? Math.round((synchroCount / totalQuestions) * 100) : 0;

  const resultStyle = getResultStyle(synchroRate);

  const myLastChoice =
    lastResult && mySocketId ? lastResult.answers?.[mySocketId] : null;

  const myLastChoiceText =
    lastResult?.choices.find((choice) => choice.key === myLastChoice)?.text ||
    "";

  const majorityChoiceText =
    lastResult?.choices.find(
      (choice) => choice.key === lastResult.majorityChoice
    )?.text || "";

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
    const normalizedRoomCode = `koredochi_${code}`;

    setRoomCode(normalizedRoomCode);
    setPhase("waiting");

    joinWithCode(code, String(playerMaxCount), "koredochi");
  };

  const handleStartReady = () => {
    if (!socket || !roomCode) return;

    setReadyToStart(true);

    socket.emit("player_ready", {
      roomCode,
      socketId: mySocketId,
      handicap: 0,
      gameType: "koredochi",
      questionCount,
      playerMaxCount,
    });
  };

  const handleSubmitAnswer = () => {
    if (!socket || !roomCode || !selectedChoice || submittedAnswer) return;

    setSubmittedAnswer(true);

    socket.emit("koredochi_submit_answer", {
      roomCode,
      choice: selectedChoice,
    });
  };

  const resetLocalGame = () => {
    setQuestionIndex(0);
    setTotalQuestions(questionCount);

    setCurrentQuestion("");
    setCurrentChoices([]);
    setSelectedChoice(null);
    setSubmittedAnswer(false);

    setLastResult(null);
    setSynchroCount(0);
    setAllMatchCount(0);
    setQuestionResults([]);
    setFinished(false);
  };

  const handleRematch = () => {
    if (!socket || !roomCode) return;

    resetLocalGame();
    setReadyToStart(false);

    socket.emit("request_rematch", {
      roomCode,
      gameType: "koredochi",
    });

    setPhase("waiting");
  };

  const handleShareX = () => {
    const text = [
      "【ひまQ｜これどっち？🤝】",
      `シンクロ率：${synchroRate}%`,
      `結果：${getSynchroLabel(synchroRate)}`,
      `全員一致：${allMatchCount}回`,
      "",
      "👇ひまQで遊ぶ",
      "#ひまQ #これどっち #シンクロゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() });
  };

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

      if (current >= playerMaxCount && phase === "waiting") {
        setPhase("ready");
      }
    };

    const onBothReadyStart = () => {
      setPhase("playing");
    };

    const onQuestionStart = (payload: KoredochiQuestionPayload) => {
      setQuestionIndex(payload.questionIndex);
      setTotalQuestions(payload.totalQuestions);
      setCurrentQuestion(payload.question);
      setCurrentChoices(payload.choices);
      setSelectedChoice(null);
      setSubmittedAnswer(false);
      setLastResult(null);
      setPhase("playing");
    };

    const onRoundResult = (payload: KoredochiRoundResultPayload) => {
      setLastResult(payload);
      setSynchroCount(payload.synchroCount ?? 0);
      setAllMatchCount(payload.allMatchCount ?? 0);
      setQuestionResults((prev) => [...prev, payload]);
      setSelectedChoice(null);
      setSubmittedAnswer(false);
      setPhase("reveal");
    };

    const onGameEnd = (payload: KoredochiGameEndPayload) => {
      setSynchroCount(payload.synchroCount ?? 0);
      setAllMatchCount(payload.allMatchCount ?? 0);
      setTotalQuestions(payload.totalQuestions ?? questionCount);

      if (payload.questionResults) {
        setQuestionResults(payload.questionResults);
      }

      setFinished(true);
      setPhase("result");
    };

    socket.on("update_room_count", onRoomCount);
    socket.on("both_ready_start", onBothReadyStart);
    socket.on("koredochi_question_start", onQuestionStart);
    socket.on("koredochi_round_result", onRoundResult);
    socket.on("koredochi_game_end", onGameEnd);

    return () => {
      socket.off("update_room_count", onRoomCount);
      socket.off("both_ready_start", onBothReadyStart);
      socket.off("koredochi_question_start", onQuestionStart);
      socket.off("koredochi_round_result", onRoundResult);
      socket.off("koredochi_game_end", onGameEnd);
    };
  }, [socket, phase, playerMaxCount, questionCount]);

  if (phase === "name") {
    return (
      <div className={`min-h-screen ${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-xl rounded-3xl border-4 border-black bg-white/85 p-5 shadow-xl backdrop-blur">
          {/* <div className="rounded-3xl border-4 border-black bg-gradient-to-r from-cyan-100 via-violet-100 to-pink-100 px-4 py-5 shadow">
            <p className="text-4xl md:text-5xl font-black text-gray-900">
              🤝 これどっち？
            </p>
            <p className="mt-2 text-sm md:text-base font-bold text-gray-700">
              みんなと何個気持ちが合うかな？
            </p>
          </div> */}

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
              className="mt-4 w-full rounded-xl border-4 border-black px-4 py-3 text-xl font-bold outline-none focus:ring-4 focus:ring-violet-300"
              placeholder="例：ひま太郎"
            />

            {nameError && (
              <p className="mt-3 text-red-600 text-lg font-extrabold">
                {nameError}
              </p>
            )}

            <button
              onClick={handleJoin}
              className={`mt-6 w-full rounded-full border-4 border-black px-6 py-4 text-xl md:text-2xl font-extrabold shadow-lg transition-all ${theme.button}`}
            >
              あいことばでマッチ
            </button>

            <p className="mt-3 text-sm font-bold text-gray-600">
              あいことば：{code || "未入力"} / 参加人数：{playerMaxCount}人
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div className={`min-h-screen ${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-xl rounded-3xl border-4 border-black bg-white/85 p-5 shadow-xl backdrop-blur">
          <p className="text-2xl md:text-4xl font-extrabold text-gray-800 animate-pulse">
            みんなを待っています…
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

          <div className="mt-5 grid grid-cols-2 gap-3">
            {displayPlayers.map((p) => (
              <div
                key={p.socketId}
                className="rounded-2xl border-4 border-black bg-white px-3 py-3 shadow"
              >
                <p className="truncate text-base md:text-lg font-extrabold">
                  {p.socketId === mySocketId
                    ? "あなた"
                    : ellipsizeName(p.playerName)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div className={`min-h-screen ${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-2xl rounded-3xl border-4 border-black bg-white/85 p-5 shadow-xl backdrop-blur">
          <p className={`text-3xl md:text-5xl font-extrabold ${theme.mainText}`}>
            全員そろったよ！
          </p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {displayPlayers.map((p) => (
              <div
                key={p.socketId}
                className="rounded-2xl border-4 border-black bg-white px-3 py-3 shadow"
              >
                <p className="truncate text-lg md:text-xl font-extrabold">
                  {p.socketId === mySocketId
                    ? "あなた"
                    : ellipsizeName(p.playerName)}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-gray-700 font-bold">
            ランダムに出る2択のお題に答えて、みんなと何問シンクロできるかチャレンジしよう！
          </p>

          {/* <p className="mt-2 text-sm md:text-base text-gray-600 font-bold">
            シンクロ率100％を目指す、ドキドキの2択ゲーム！
          </p> */}

          {!readyToStart ? (
            <motion.button
              onClick={handleStartReady}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mt-6 rounded-full border-4 border-black px-8 py-4 text-2xl font-extrabold shadow-lg transition-all ${theme.button}`}
            >
              準備OK！
            </motion.button>
          ) : (
            <p className="mt-6 text-xl md:text-2xl font-bold text-gray-700 animate-pulse">
              みんなの準備を待っています…
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.page} px-4 py-6 text-center`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 rounded-[32px] border-4 border-black bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 p-1 shadow-[0_8px_0_rgba(0,0,0,1)]">
          <div className="rounded-[28px] bg-white/90 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-3xl md:text-2xl font-black text-gray-900">
                  Q {questionIndex + 1}
                  <span className="text-lg md:text-base text-gray-500">
                    {" "}
                    / {totalQuestions}
                  </span>
                </p>

                <div className="mx-auto mt-2 h-4 max-w-[220px] overflow-hidden rounded-full border-2 border-black bg-white md:mx-0">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400"
                    style={{
                      width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-center gap-2 md:mt-0 md:justify-end">
                <div className="min-w-[120px] rounded-2xl border-4 border-black bg-violet-500 px-4 py-2 text-white shadow">
                  <p className="text-xs font-black">⚡シンクロ</p>
                  <p className="text-2xl font-black">{synchroCount}</p>
                </div>

                <div className="min-w-[120px] rounded-2xl border-4 border-black bg-pink-500 px-4 py-2 text-white shadow">
                  <p className="text-xs font-black">🌈全員一致</p>
                  <p className="text-2xl font-black">{allMatchCount}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {displayPlayers.map((p) => {
                const active = p.socketId === mySocketId;

                return (
                  <div
                    key={p.socketId}
                    className={`
                      rounded-full border-4 px-4 py-2 font-black shadow-sm
                      ${
                        active
                          ? "border-black bg-yellow-300 text-gray-900"
                          : "border-black bg-white text-gray-800"
                      }
                    `}
                  >
                    {active ? "👑 あなた" : `🤝 ${ellipsizeName(p.playerName)}`}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {phase === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border-4 border-black bg-white/90 p-5 shadow-xl"
            >
              <p className="text-lg md:text-xl font-bold text-gray-500">
                直感で選ぼう！
              </p>

              <div
                className={`mt-4 rounded-3xl border-4 px-4 py-5 shadow ${theme.questionBox}`}
              >
                <p className="text-2xl md:text-4xl font-extrabold">
                  {currentQuestion || "問題を読み込み中…"}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentChoices.map((choice) => {
                  const active = selectedChoice === choice.key;

                  return (
                    <button
                      key={choice.key}
                      onClick={() => {
                        if (submittedAnswer) return;
                        setSelectedChoice(choice.key);
                      }}
                      className={`
                        rounded-3xl border-4 px-4 py-8 text-2xl md:text-4xl font-extrabold shadow-md transition-all
                        ${
                          active
                            ? theme.choiceActive
                            : "border-black bg-white opacity-80 hover:opacity-100 hover:scale-[1.02]"
                        }
                      `}
                    >
                      {/* <span className="mb-2 block text-sm md:text-base text-gray-500">
                        {choice.key === "A" ? "A" : "B"}
                      </span> */}
                      {choice.text}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedChoice || submittedAnswer}
                className={`
                  mt-6 w-full rounded-full border-4 border-black px-6 py-4 text-xl md:text-2xl font-extrabold shadow-lg transition-all
                  ${
                    selectedChoice && !submittedAnswer
                      ? theme.button
                      : "bg-gray-200 text-gray-400"
                  }
                `}
              >
                {submittedAnswer ? "みんなの回答待ち…" : "これにする！"}
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
                {lastResult.allMatched
                  ? "🌈 全員一致！"
                  : lastResult.matched
                  ? "🤝 シンクロ！"
                  : "🤔 意見が分かれた！"}
              </h2>

              <div
                className={`mt-5 rounded-3xl border-4 px-4 py-5 ${theme.questionBox}`}
              >
                <p className="text-xl md:text-3xl font-extrabold">
                  {lastResult.question}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {lastResult.choices.map((choice) => {
                  const count = lastResult.counts?.[choice.key] ?? 0;
                  const isMine = myLastChoice === choice.key;
                  const isMajority = lastResult.majorityChoice === choice.key;

                  return (
                    <div
                      key={choice.key}
                      className={`
                        rounded-3xl border-4 px-4 py-5 shadow
                        ${
                          isMine
                            ? "border-violet-600 bg-gradient-to-br from-cyan-100 via-violet-100 to-pink-100"
                            : "border-black bg-white"
                        }
                      `}
                    >
                      <p className="text-sm font-bold text-gray-500">
                        {choice.key}
                      </p>

                      <p className="mt-1 text-2xl md:text-3xl font-extrabold text-gray-900">
                        {choice.text}
                      </p>

                      <p className="mt-3 text-xl md:text-2xl font-black text-violet-600">
                        {count}人
                      </p>

                      {isMine && (
                        <p className="mt-2 text-sm font-extrabold text-pink-600">
                          あなたの回答
                        </p>
                      )}

                      {isMajority && !lastResult.allMatched && (
                        <p className="mt-2 text-sm font-extrabold text-cyan-600">
                          多数派
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border-4 border-black bg-white px-4 py-4">
                <p className="text-lg md:text-xl font-bold text-gray-700">
                  あなたは「{myLastChoiceText || "未回答"}」を選びました
                </p>

                {lastResult.majorityChoice && (
                  <p className="mt-1 text-sm md:text-base font-bold text-gray-500">
                    多数派は「{majorityChoiceText}」
                  </p>
                )}
              </div>

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
                最終結果
              </p>

              <h2 className="mt-2 text-3xl md:text-6xl font-extrabold text-gray-900">
                シンクロ率 {synchroRate}%
              </h2>

              <p
                className={`mt-4 text-2xl md:text-4xl font-extrabold ${resultStyle.text}`}
              >
                {resultStyle.badge} {getSynchroLabel(synchroRate)}
              </p>

              <p className="mt-4 rounded-2xl border-4 border-black bg-white/80 px-4 py-4 text-lg md:text-xl font-bold text-gray-700">
                {getSynchroComment(synchroRate)}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border-4 border-black bg-white p-4">
                  <p className="text-sm font-bold text-gray-500">シンクロ</p>
                  <p className="text-3xl md:text-4xl font-black text-violet-600">
                    {synchroCount} / {totalQuestions}
                  </p>
                </div>

                <div className="rounded-2xl border-4 border-black bg-white p-4">
                  <p className="text-sm font-bold text-gray-500">全員一致</p>
                  <p className="text-3xl md:text-4xl font-black text-pink-600">
                    {allMatchCount}回
                  </p>
                </div>
              </div>

              {questionResults.length > 0 && (
                <div className="mt-6 rounded-3xl border-4 border-black bg-white/90 p-4 text-left">
                  <p className="text-xl md:text-2xl font-extrabold text-gray-900 text-center">
                    問題ごとの結果
                  </p>

                  <div className="mt-4 space-y-3">
                    {questionResults.map((result, index) => {
                      const choiceA = result.choices.find(
                        (choice) => choice.key === "A"
                      );
                      const choiceB = result.choices.find(
                        (choice) => choice.key === "B"
                      );

                      return (
                        <div
                          key={`${result.questionId ?? index}-${index}`}
                          className="rounded-2xl border-4 border-black bg-white px-4 py-3 shadow"
                        >
                          <p className="text-sm font-black text-violet-500">
                            Q{index + 1}
                          </p>

                          <p className="mt-1 text-base md:text-lg font-extrabold text-gray-900">
                            {result.question}
                          </p>

                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm md:text-base font-bold text-gray-700">
                            <p className="rounded-xl bg-cyan-50 px-3 py-2">
                              {choiceA?.text}：{result.counts?.A ?? 0}人
                            </p>
                            <p className="rounded-xl bg-pink-50 px-3 py-2">
                              {choiceB?.text}：{result.counts?.B ?? 0}人
                            </p>
                          </div>

                          <p className="mt-2 text-sm font-extrabold">
                            {result.allMatched
                              ? "🌈 全員一致"
                              : result.matched
                              ? "🤝 シンクロ"
                              : "🤔 意見が分かれた"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col md:flex-row justify-center gap-3">
                <button
                  onClick={handleShareX}
                  className="rounded-xl border-4 border-black bg-black px-6 py-3 text-xl font-extrabold text-white shadow-md transition-all hover:scale-105"
                >
                  Xで結果をシェア
                </button>

                <button
                  onClick={handleRematch}
                  className={`rounded-xl border-4 border-black px-6 py-3 text-xl font-extrabold shadow-md transition-all ${theme.button}`}
                >
                  もう一回遊ぶ
                </button>

                <button
                  onClick={() => router.push("/quiz-koredochi")}
                  className={`rounded-xl border-4 border-black px-6 py-3 text-xl font-extrabold shadow-md transition-all ${theme.subButton}`}
                >
                  トップに戻る
                </button>
              </div>

              <RecommendedMultiplayerGames
                title="次はどれで遊ぶ？🎮"
                count={4}
                excludeHref="/quiz-koredochi"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {finished && phase !== "result" && null}
      </div>
    </div>
  );
}