"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedMultiplayerGames from "@/app/components/RecommendedMultiplayerGames";

type HiramekiPhase =
  | "name"
  | "waiting"
  | "ready"
  | "playing"
  | "reveal"
  | "result";

type Player = {
  socketId: string;
  playerName: string;
};

type HiramekiQuestionPayload = {
  questionId?: string;
  answerLength: number;
  maskedAnswer?: string;
  hints: string[];
  revealedHintCount: number;
  questionIndex: number;
  totalQuestions: number;
  deadline: number;
  startedAt: number;
};

type HiramekiHintPayload = {
  questionIndex: number;
  revealedHintCount: number;
  hints: string[];
  maskedAnswer?: string;
  timeLeft: number;
};

type HiramekiCorrectPayload = {
  socketId: string;
  playerName: string;
  rank: number;
  elapsedMs: number;
  addScore: number;
  scores: Record<string, number>;
  correctCount: number;
  totalPlayers: number;
};

type HiramekiWrongPayload = {
  message: string;
};

type HiramekiRoundResultPayload = {
  questionId?: string;
  answer: string;
  answerLength: number;
  hints: string[];
  questionIndex: number;
  totalQuestions: number;
  correctPlayers: {
    socketId: string;
    playerName: string;
    rank: number;
    elapsedMs: number;
    addScore: number;
  }[];
  scores: Record<string, number>;
  reason: "all_correct" | "timeout";
};

type HiramekiGameEndPayload = {
  scores: Record<string, number>;
  players?: Player[];
  results?: HiramekiRoundResultPayload[];
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

const ellipsizeName = (name: string, maxLen = 7) => {
  const chars = Array.from(name);
  if (chars.length <= maxLen) return name;
  return chars.slice(0, maxLen).join("") + "...";
};

const formatTime = (ms: number) => {
  if (!Number.isFinite(ms)) return "0.00";
  return (ms / 1000).toFixed(2);
};

const normalizeAnswer = (value: string) => {
  return value
    .trim()
    .replace(/\s/g, "")
    .replace(/[ァ-ン]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0x60)
    )
    .toLowerCase();
};

const getTheme = () => {
  return {
    page: "bg-gradient-to-b from-yellow-300 via-amber-200 to-orange-300",
    mainText: "text-orange-600",
    button:
      "bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white hover:scale-105 hover:brightness-110",
    subButton:
      "bg-gradient-to-r from-yellow-100 via-amber-100 to-orange-100 text-gray-800 hover:scale-105 hover:brightness-105",
    questionBox:
      "bg-gradient-to-br from-yellow-50 via-white to-orange-50 border-amber-400 text-gray-900",
    inputFocus: "focus:ring-4 focus:ring-yellow-300",
  };
};

const getRankLabel = (rank: number) => {
  if (rank === 1) return "最速ひらめき王！";
  if (rank === 2) return "かなり早い！";
  if (rank === 3) return "ナイスひらめき！";
  return "よく考えた！";
};

const getResultComment = (rank: number) => {
  if (rank === 1) return "一番早く答えにたどり着きました。ひらめき力ばつぐん！";
  if (rank === 2) return "かなり早い正解です。あと少しでトップでした！";
  if (rank === 3) return "しっかりヒントから答えを導けています！";
  return "次はもっと早くひらめけるかも！";
};

export default function QuizHiramekiCodePage() {
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

  const [phase, setPhase] = useState<HiramekiPhase>("name");
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const [roomCode, setRoomCode] = useState("");
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(`0/${playerMaxCount}`);
  const [readyToStart, setReadyToStart] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(questionCount);
  const [answerLength, setAnswerLength] = useState(0);
  const [maskedAnswer, setMaskedAnswer] = useState("");
  const [hints, setHints] = useState<string[]>([]);
  const [revealedHintCount, setRevealedHintCount] = useState(0);

  const [deadline, setDeadline] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  const [answerInput, setAnswerInput] = useState("");
  const [submittedCorrect, setSubmittedCorrect] = useState(false);
  const [answerMessage, setAnswerMessage] = useState<string | null>(null);

  const [correctPlayers, setCorrectPlayers] = useState<
    HiramekiCorrectPayload[]
  >([]);

  const [lastResult, setLastResult] =
    useState<HiramekiRoundResultPayload | null>(null);
  const [roundResults, setRoundResults] = useState<
    HiramekiRoundResultPayload[]
  >([]);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const {
    joinWithCode,
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

  const ranking = useMemo(() => {
    return displayPlayers
      .map((p) => ({
        ...p,
        score: scores[p.socketId] ?? 0,
      }))
      .sort((a, b) => b.score - a.score);
  }, [displayPlayers, scores]);

  const myScore = mySocketId ? scores[mySocketId] ?? 0 : 0;

  const timeLeftMs = Math.max(0, deadline - now);
  const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);
  const elapsedMs = startedAt > 0 ? Math.max(0, now - startedAt) : 0;
  const progressPercent =
    deadline > startedAt && startedAt > 0
      ? Math.min(100, Math.max(0, ((now - startedAt) / (deadline - startedAt)) * 100))
      : 0;

  const visibleHints = hints.slice(0, revealedHintCount);
  const answerBoxes =
    maskedAnswer && maskedAnswer.length > 0
      ? Array.from(maskedAnswer)
      : Array.from({ length: answerLength || 4 }).map(() => "□");

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

    const normalizedRoomCode = `hirameki_${code}`;

    setRoomCode(normalizedRoomCode);
    setPhase("waiting");

    joinWithCode(code, String(playerMaxCount), "hirameki");
  };

  const handleStartReady = () => {
    if (!socket || !roomCode) return;

    setReadyToStart(true);

    socket.emit("player_ready", {
      roomCode,
      socketId: mySocketId,
      handicap: 0,
      gameType: "hirameki",
      questionCount,
      playerMaxCount,
    });
  };

  const handleSubmitAnswer = () => {
    if (!socket || !roomCode || submittedCorrect) return;

    const normalized = normalizeAnswer(answerInput);

    if (!normalized) {
      setAnswerMessage("答えを入力してください");
      return;
    }

    socket.emit("hirameki_submit_answer", {
      roomCode,
      questionIndex,
      answer: normalized,
    });
  };

  const resetLocalGame = () => {
    setQuestionIndex(0);
    setTotalQuestions(questionCount);
    setAnswerLength(0);
    setMaskedAnswer("");
    setHints([]);
    setRevealedHintCount(0);

    setDeadline(0);
    setStartedAt(0);
    setNow(Date.now());

    setAnswerInput("");
    setSubmittedCorrect(false);
    setAnswerMessage(null);
    setCorrectPlayers([]);

    setLastResult(null);
    setRoundResults([]);
    setScores({});
    setFinished(false);
  };

  const handleRematch = () => {
    if (!socket || !roomCode) return;

    resetLocalGame();
    setReadyToStart(false);

    socket.emit("request_rematch", {
      roomCode,
      gameType: "hirameki",
    });

    setPhase("waiting");
  };

  const handleShareX = () => {
    const top = ranking[0];

    const text = [
      "【ひまQ｜ひらめきクイズ💡】",
      top
        ? `優勝：${top.playerName}さん（${top.score}点）`
        : `自分の得点：${myScore}点`,
      "ヒントから答えをひらめけ！",
      "",
      "👇ひまQで遊ぶ",
      "#ひまQ #ひらめきクイズ #ヒントで当てろ",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() });
  };

  useEffect(() => {
    if (phase !== "playing") return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => window.clearInterval(timer);
  }, [phase]);

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

    const onQuestionStart = (payload: HiramekiQuestionPayload) => {
      setQuestionIndex(payload.questionIndex);
      setTotalQuestions(payload.totalQuestions);
      setAnswerLength(payload.answerLength);
      setMaskedAnswer(payload.maskedAnswer || "");
      setHints(payload.hints || []);
      setRevealedHintCount(payload.revealedHintCount ?? 1);
      setDeadline(payload.deadline);
      setStartedAt(payload.startedAt);
      setNow(Date.now());

      setAnswerInput("");
      setSubmittedCorrect(false);
      setAnswerMessage(null);
      setCorrectPlayers([]);
      setLastResult(null);

      setPhase("playing");
    };

    const onHintUpdate = (payload: HiramekiHintPayload) => {
      setRevealedHintCount(payload.revealedHintCount);
      setHints(payload.hints || []);
      if (payload.maskedAnswer !== undefined) {
        setMaskedAnswer(payload.maskedAnswer);
      }
    };

    const onCorrect = (payload: HiramekiCorrectPayload) => {
      setScores(payload.scores ?? {});
      setCorrectPlayers((prev) => {
        if (prev.some((p) => p.socketId === payload.socketId)) return prev;
        return [...prev, payload].sort((a, b) => a.rank - b.rank);
      });

      if (payload.socketId === mySocketId) {
        setSubmittedCorrect(true);
        setAnswerMessage(`正解！${payload.rank}位 / +${payload.addScore}点`);
      }
    };

    const onWrong = (payload: HiramekiWrongPayload) => {
      setAnswerMessage(payload.message || "ちがうみたい…");
    };

    const onRoundResult = (payload: HiramekiRoundResultPayload) => {
      setLastResult(payload);
      setScores(payload.scores ?? {});
      setRoundResults((prev) => [...prev, payload]);
      setAnswerInput("");
      setSubmittedCorrect(false);
      setAnswerMessage(null);
      setPhase("reveal");
    };

    const onGameEnd = (payload: HiramekiGameEndPayload) => {
      setScores(payload.scores ?? {});

      if (payload.players) {
        setRoomPlayers(payload.players);
      }

      if (payload.results) {
        setRoundResults(payload.results);
      }

      setFinished(true);
      setPhase("result");
    };

    socket.on("update_room_count", onRoomCount);
    socket.on("both_ready_start", onBothReadyStart);
    socket.on("hirameki_question_start", onQuestionStart);
    socket.on("hirameki_hint_update", onHintUpdate);
    socket.on("hirameki_correct", onCorrect);
    socket.on("hirameki_wrong", onWrong);
    socket.on("hirameki_round_result", onRoundResult);
    socket.on("hirameki_game_end", onGameEnd);

    return () => {
      socket.off("update_room_count", onRoomCount);
      socket.off("both_ready_start", onBothReadyStart);
      socket.off("hirameki_question_start", onQuestionStart);
      socket.off("hirameki_hint_update", onHintUpdate);
      socket.off("hirameki_correct", onCorrect);
      socket.off("hirameki_wrong", onWrong);
      socket.off("hirameki_round_result", onRoundResult);
      socket.off("hirameki_game_end", onGameEnd);
    };
  }, [socket, phase, playerMaxCount, questionCount, mySocketId]);

  if (phase === "name") {
    return (
      <div className={`${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-xl rounded-3xl border-4 border-black bg-white/90 p-5 shadow-xl backdrop-blur">
          <div className="rounded-3xl border-4 border-black bg-gradient-to-r from-yellow-100 via-white to-orange-100 px-4 py-5 shadow">
            <p className="text-3xl md:text-5xl font-black text-gray-900">
              💡 ひらめきクイズ
            </p>
            <p className="mt-2 text-sm md:text-base font-bold text-gray-700">
              ヒントで当てろ！早押しひらめき勝負！
            </p>
          </div>

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
              className={`mt-4 w-full rounded-xl border-4 border-black px-4 py-3 text-xl font-bold outline-none ${theme.inputFocus}`}
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
      <div className={`${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-xl rounded-3xl border-4 border-black bg-white/90 p-5 shadow-xl backdrop-blur">
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
      <div className={`${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-2xl rounded-3xl border-4 border-black bg-white/90 p-5 shadow-xl backdrop-blur">
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
            文字数とヒントを見て、答えがわかったらひらがなで解答しよう！
          </p>

          {/* <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border-4 border-black bg-yellow-300 px-3 py-3">
              <p className="text-xl md:text-2xl font-black">💡ヒント</p>
              <p className="text-xs md:text-sm font-bold">10秒ごと</p>
            </div>

            <div className="rounded-2xl border-4 border-black bg-amber-300 px-3 py-3">
              <p className="text-xl md:text-2xl font-black">⌛60秒</p>
              <p className="text-xs md:text-sm font-bold">最大時間</p>
            </div>

            <div className="rounded-2xl border-4 border-black bg-orange-300 px-3 py-3">
              <p className="text-xl md:text-2xl font-black">🏆早押し</p>
              <p className="text-xs md:text-sm font-bold">早い人が高得点</p>
            </div>
          </div> */}

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
    <div className={`${theme.page} px-4 py-6 text-center`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 rounded-[32px] border-4 border-black bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 p-1 shadow-[0_8px_0_rgba(0,0,0,1)]">
          <div className="rounded-[28px] bg-white/95 p-4">
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
                    className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400"
                    style={{
                      width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-center gap-2 md:mt-0 md:justify-end">
                <div className="min-w-[120px] rounded-2xl border-4 border-black bg-orange-500 px-4 py-2 text-white shadow">
                  <p className="text-xs font-black">あなた</p>
                  <p className="text-2xl font-black">{myScore}点</p>
                </div>

                <div className="min-w-[120px] rounded-2xl border-4 border-black bg-yellow-400 px-4 py-2 text-gray-900 shadow">
                  <p className="text-xs font-black">残り時間</p>
                  <p className="text-2xl font-black">{timeLeftSeconds}秒</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {displayPlayers.map((p) => {
                const me = p.socketId === mySocketId;
                const score = scores[p.socketId] ?? 0;

                return (
                  <div
                    key={p.socketId}
                    className={`
                      rounded-full border-4 px-4 py-2 font-black shadow-sm
                      ${
                        me
                          ? "border-black bg-yellow-300 text-gray-900"
                          : "border-black bg-white text-gray-800"
                      }
                    `}
                  >
                    {me ? "👑 あなた" : `💡 ${ellipsizeName(p.playerName)}`}
                    <span className="ml-2 text-sm">({score}点)</span>
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
              className="rounded-3xl border-4 border-black bg-white/95 p-5 shadow-xl"
            >
              <div className="rounded-3xl border-4 border-black bg-gray-900 px-4 py-3 text-white shadow">
                <div className="flex items-center justify-between text-sm md:text-base font-black">
                  <span>経過 {formatTime(elapsedMs)}秒</span>
                  <span>残り {timeLeftSeconds}秒</span>
                </div>

                <div className="mt-2 h-4 overflow-hidden rounded-full border-2 border-white bg-white/20">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className={`mt-5 rounded-3xl border-4 px-4 py-5 shadow ${theme.questionBox}`}>
                <p className="text-sm md:text-base font-black text-orange-600">
                  答えの文字数
                </p>

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {answerBoxes.map((char, index) => (
                    <div
                      key={`${char}-${index}`}
                      className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl border-4 border-black bg-yellow-100 text-3xl md:text-5xl font-black text-gray-900 shadow"
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-3xl border-4 border-black bg-white px-4 py-5 shadow">
                <p className="text-xl md:text-2xl font-black text-gray-900">
                  💡 ヒント
                </p>

                <div className="mt-4 space-y-3 text-left">
                  {visibleHints.length > 0 ? (
                    visibleHints.map((hint, index) => (
                      <motion.div
                        key={`${hint}-${index}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl border-4 border-black bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-3 shadow"
                      >
                        <p className="text-sm font-black text-orange-500">
                          ヒント{index + 1}
                        </p>
                        <p className="mt-1 text-lg md:text-2xl font-extrabold text-gray-900">
                          {hint}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 font-bold">
                      ヒントを読み込み中…
                    </p>
                  )}
                </div>

                {revealedHintCount < hints.length && (
                  <p className="mt-4 text-sm md:text-base font-bold text-gray-500">
                    次のヒントは10秒ごとに追加されます
                  </p>
                )}
              </div>

              <div className="mt-5 rounded-3xl border-4 border-black bg-gradient-to-br from-yellow-50 via-white to-orange-50 px-4 py-5 shadow">
                <p className="text-lg md:text-xl font-black text-gray-900">
                  ひらめいたら入力！
                </p>

                <div className="mt-3 flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={answerInput}
                    disabled={submittedCorrect}
                    onChange={(e) => {
                      setAnswerInput(e.target.value);
                      setAnswerMessage(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSubmitAnswer();
                      }
                    }}
                    className={`w-full rounded-2xl border-4 border-black px-4 py-3 text-xl md:text-2xl font-black outline-none ${theme.inputFocus} disabled:bg-gray-100 disabled:text-gray-400`}
                    placeholder="ひらがなで入力"
                  />

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={submittedCorrect}
                    className={`
                      rounded-2xl border-4 border-black px-6 py-3 text-xl md:text-2xl font-black shadow-lg transition-all md:min-w-[160px]
                      ${
                        submittedCorrect
                          ? "bg-gray-200 text-gray-400"
                          : theme.button
                      }
                    `}
                  >
                    送信！
                  </button>
                </div>

                {answerMessage && (
                  <p className="mt-3 text-lg md:text-xl font-black text-orange-600">
                    {answerMessage}
                  </p>
                )}
              </div>

              <div className="mt-5 rounded-3xl border-4 border-black bg-white px-4 py-4 shadow">
                <p className="text-xl font-black text-gray-900">
                  正解者
                </p>

                {correctPlayers.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {correctPlayers.map((p) => (
                      <div
                        key={p.socketId}
                        className="rounded-2xl border-2 border-black bg-yellow-50 px-4 py-2 font-bold text-gray-800"
                      >
                        {p.rank}位：{p.playerName}さん / {formatTime(p.elapsedMs)}秒 / +{p.addScore}点
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500 font-bold">
                    まだ正解者はいません
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {phase === "reveal" && lastResult && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border-4 border-black bg-white/95 p-5 shadow-xl"
            >
              <p className="text-lg md:text-xl font-bold text-gray-500">
                答え発表
              </p>

              <h2 className="mt-2 text-4xl md:text-6xl font-black text-orange-600">
                {lastResult.answer}
              </h2>

              <div className={`mt-5 rounded-3xl border-4 px-4 py-5 ${theme.questionBox}`}>
                <p className="text-lg font-bold text-gray-500">
                  出ていたヒント
                </p>

                <div className="mt-4 space-y-2 text-left">
                  {lastResult.hints.map((hint, index) => (
                    <p
                      key={`${hint}-${index}`}
                      className="rounded-2xl border-2 border-black bg-white px-4 py-2 text-base md:text-lg font-bold text-gray-800"
                    >
                      ヒント{index + 1}：{hint}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-3xl border-4 border-black bg-white p-4 shadow">
                <p className="text-xl md:text-2xl font-black text-gray-900">
                  この問題の正解者
                </p>

                {lastResult.correctPlayers.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {lastResult.correctPlayers.map((p) => (
                      <div
                        key={p.socketId}
                        className={`
                          rounded-2xl border-4 border-black px-4 py-3 shadow
                          ${
                            p.rank === 1
                              ? "bg-yellow-100"
                              : "bg-gradient-to-r from-yellow-50 to-orange-50"
                          }
                        `}
                      >
                        <p className="text-xl md:text-2xl font-black text-gray-900">
                          {p.rank === 1 ? "🏆" : `${p.rank}位`} {p.playerName}さん
                        </p>
                        <p className="mt-1 text-sm md:text-base font-bold text-gray-600">
                          {formatTime(p.elapsedMs)}秒 / +{p.addScore}点
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-xl font-black text-gray-500">
                    正解者なし…
                  </p>
                )}
              </div>

              <p className="mt-5 text-sm md:text-base text-gray-500">
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
              className="rounded-3xl border-4 border-black bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-5 shadow-xl"
            >
              <p className="text-lg md:text-xl font-bold text-gray-500">
                GAME SET！
              </p>

              <h2 className="mt-2 text-4xl md:text-6xl font-black text-orange-600">
                最終結果
              </h2>

              {ranking[0] && (
                <div className="mt-5 rounded-3xl border-4 border-black bg-gradient-to-br from-yellow-100 via-white to-orange-100 px-4 py-5 shadow">
                  <p className="text-xl font-black text-gray-500">優勝</p>
                  <p className="mt-2 text-4xl md:text-6xl font-black text-gray-900">
                    🏆 {ranking[0].playerName}さん
                  </p>
                  <p className="mt-3 text-2xl md:text-3xl font-black text-orange-600">
                    {ranking[0].score}点
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-4">
                {ranking.map((player, index) => (
                  <div
                    key={player.socketId}
                    className={`
                      rounded-3xl border-4 border-black px-4 py-4 shadow text-left
                      ${
                        index === 0
                          ? "bg-yellow-50"
                          : "bg-gradient-to-r from-white to-orange-50"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-2xl md:text-3xl font-black text-gray-900">
                        {index === 0 ? "🏆" : `${index + 1}位`}
                      </p>

                      <p className="text-xl md:text-2xl font-black text-orange-600">
                        {player.score}点
                      </p>
                    </div>

                    <p className="mt-2 text-xl md:text-2xl font-black text-gray-900">
                      {player.playerName}さん
                    </p>

                    <p className="mt-1 text-sm md:text-base font-bold text-gray-600">
                      {getRankLabel(index + 1)}
                    </p>

                    <p className="mt-1 text-sm md:text-base text-gray-500">
                      {getResultComment(index + 1)}
                    </p>
                  </div>
                ))}
              </div>

              {roundResults.length > 0 && (
                <div className="mt-6 rounded-3xl border-4 border-black bg-white/90 p-4 text-left">
                  <p className="text-xl md:text-2xl font-extrabold text-gray-900 text-center">
                    問題ごとの結果
                  </p>

                  <div className="mt-4 space-y-3">
                    {roundResults.map((result, index) => (
                      <div
                        key={`${result.questionId ?? index}-${index}`}
                        className="rounded-2xl border-4 border-black bg-white px-4 py-3 shadow"
                      >
                        <p className="text-sm font-black text-orange-500">
                          Q{index + 1}
                        </p>

                        <p className="mt-1 text-xl md:text-2xl font-black text-gray-900">
                          答え：{result.answer}
                        </p>

                        <p className="mt-2 text-sm md:text-base font-bold text-gray-600">
                          正解者：{result.correctPlayers.length}人 / 終了理由：
                          {result.reason === "all_correct"
                            ? "全員正解"
                            : "タイムアップ"}
                        </p>
                      </div>
                    ))}
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
                  onClick={() => router.push("/quiz-hirameki")}
                  className={`rounded-xl border-4 border-black px-6 py-3 text-xl font-extrabold shadow-md transition-all ${theme.subButton}`}
                >
                  トップに戻る
                </button>
              </div>

              <RecommendedMultiplayerGames
                title="次はどれで遊ぶ？🎮"
                count={4}
                excludeHref="/quiz-hirameki"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {finished && phase !== "result" && null}
      </div>
    </div>
  );
}
