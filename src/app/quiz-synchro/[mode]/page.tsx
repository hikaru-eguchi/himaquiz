"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedMultiplayerGames from "@/app/components/RecommendedMultiplayerGames";
import OnlineGameNotice from "@/app/components/OnlineGameNotice";

type SynchroPhase =
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

type SynchroChoice = {
  id: string;
  text: string;
};

type SynchroQuestionPayload = {
  questionId?: string;
  question: string;
  choices: SynchroChoice[];
  questionIndex: number;
  totalQuestions: number;
};

type SynchroRoundResultPayload = {
  questionId?: string;
  question: string;
  choices: SynchroChoice[];
  answers: Record<string, string[]>;
  playerNames?: Record<string, string>;
  sameRankCount: number;
  sameItemCount: number;
  roundScore: number;
  maxRoundScore: number;
  roundRate: number;
  questionIndex: number;
  totalQuestions: number;
  totalScore: number;
  maxTotalScore: number;
  synchroRate: number;
};

type SynchroGameEndPayload = {
  totalScore: number;
  maxTotalScore: number;
  synchroRate: number;
  totalQuestions: number;
  questionResults?: SynchroRoundResultPayload[];
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

const rankLabels = ["1位", "2位", "3位"];

const ellipsizeName = (name: string, maxLen = 6) => {
  const chars = Array.from(name);
  if (chars.length <= maxLen) return name;
  return chars.slice(0, maxLen).join("") + "...";
};

const getTheme = () => {
  return {
    page: "bg-gradient-to-b from-violet-400 via-fuchsia-300 to-yellow-300",
    mainText: "text-violet-600",
    button:
      "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-yellow-400 text-white hover:scale-105 hover:brightness-110",
    subButton:
      "bg-gradient-to-r from-violet-100 via-fuchsia-100 to-yellow-100 text-gray-800 hover:scale-105 hover:brightness-105",
    questionBox:
      "bg-gradient-to-br from-violet-50 via-white to-yellow-50 border-violet-400 text-gray-900",
    choiceActive:
      "border-violet-600 bg-gradient-to-br from-violet-100 via-fuchsia-100 to-yellow-100 ring-4 ring-violet-300 scale-[1.03]",
  };
};

const getSynchroLabel = (rate: number) => {
  if (rate >= 100) return "奇跡の完全シンクロ！";
  if (rate >= 85) return "ほぼ同じランキング！";
  if (rate >= 70) return "かなり好みが近い！";
  if (rate >= 50) return "いい感じに合ってる！";
  if (rate >= 30) return "似てるところもある！";
  return "違いが楽しいランキング！";
};

const getSynchroComment = (rate: number) => {
  if (rate >= 100) {
    return "1位から3位までかなりそろっています。好みや価値観がびっくりするほど近いです。";
  }

  if (rate >= 85) {
    return "かなり高いシンクロ率です。順位の感覚まで近く、同じものを大事にしている可能性が高そうです。";
  }

  if (rate >= 70) {
    return "しっかり気が合っています。順位違いも含めて、似たものを選ぶことが多いです。";
  }

  if (rate >= 50) {
    return "半分くらいは感覚が近い結果です。合うところと違うところのバランスがちょうどいいです。";
  }

  if (rate >= 30) {
    return "意外な共通点が少し見つかる結果です。答え合わせするとかなり盛り上がりそうです。";
  }

  return "ランキングの個性がかなり分かれました。違いを楽しめる組み合わせです。";
};

const getResultStyle = (rate: number) => {
  if (rate >= 100) {
    return {
      card: "bg-gradient-to-br from-yellow-100 via-white to-violet-100 border-yellow-400",
      text: "text-yellow-600",
      badge: "🌈👑",
    };
  }

  if (rate >= 85) {
    return {
      card: "bg-gradient-to-br from-violet-100 via-fuchsia-100 to-yellow-100 border-violet-400",
      text: "text-violet-600",
      badge: "✨🤝",
    };
  }

  if (rate >= 70) {
    return {
      card: "bg-gradient-to-br from-fuchsia-100 via-white to-yellow-50 border-fuchsia-400",
      text: "text-fuchsia-600",
      badge: "✨",
    };
  }

  if (rate >= 50) {
    return {
      card: "bg-gradient-to-br from-white via-violet-50 to-yellow-50 border-violet-300",
      text: "text-violet-600",
      badge: "🤝",
    };
  }

  return {
    card: "bg-gradient-to-br from-white via-fuchsia-50 to-yellow-50 border-fuchsia-200",
    text: "text-fuchsia-600",
    badge: "🎉",
  };
};

export default function QuizSynchroCodePage() {
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

  const [phase, setPhase] = useState<SynchroPhase>("name");
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const [roomCode, setRoomCode] = useState("");
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(`0/${playerMaxCount}`);
  const [readyToStart, setReadyToStart] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(questionCount);

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentChoices, setCurrentChoices] = useState<SynchroChoice[]>([]);
  const [selectedRanking, setSelectedRanking] = useState<string[]>([]);
  const [submittedAnswer, setSubmittedAnswer] = useState(false);

  const [lastResult, setLastResult] =
    useState<SynchroRoundResultPayload | null>(null);

  const [totalScore, setTotalScore] = useState(0);
  const [maxTotalScore, setMaxTotalScore] = useState(0);
  const [synchroRate, setSynchroRate] = useState(0);
  const [questionResults, setQuestionResults] = useState<
    SynchroRoundResultPayload[]
  >([]);

  const [nextReady, setNextReady] = useState(false);
  const [nextReadyCount, setNextReadyCount] = useState(0);
  const [nextReadyTotal, setNextReadyTotal] = useState(playerMaxCount);

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
  const resultStyle = getResultStyle(synchroRate);

  const myLastRanking =
    lastResult && mySocketId ? lastResult.answers?.[mySocketId] ?? [] : [];

  const getChoiceText = (choiceId: string, choices = currentChoices) => {
    return choices.find((choice) => choice.id === choiceId)?.text || choiceId;
  };

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

    const normalizedRoomCode = `synchro_${code}`;

    setRoomCode(normalizedRoomCode);
    setPhase("waiting");

    joinWithCode(code, String(playerMaxCount), "synchro");
  };

  const handleStartReady = () => {
    if (!socket || !roomCode) return;

    setReadyToStart(true);

    socket.emit("player_ready", {
      roomCode,
      socketId: mySocketId,
      handicap: 0,
      gameType: "synchro",
      questionCount,
      playerMaxCount,
    });
  };

  const handleSelectChoice = (choiceId: string) => {
    if (submittedAnswer) return;
    if (selectedRanking.includes(choiceId)) return;
    if (selectedRanking.length >= 3) return;

    setSelectedRanking((prev) => [...prev, choiceId]);
  };

  const handleRemoveRanking = (choiceId: string) => {
    if (submittedAnswer) return;

    setSelectedRanking((prev) => prev.filter((id) => id !== choiceId));
  };

  const handleClearRanking = () => {
    if (submittedAnswer) return;
    setSelectedRanking([]);
  };

  const handleSubmitRanking = () => {
    if (!socket || !roomCode || submittedAnswer) return;
    if (selectedRanking.length !== 3) return;

    setSubmittedAnswer(true);

    socket.emit("synchro_submit_ranking", {
      roomCode,
      ranking: selectedRanking,
    });
  };

  const resetLocalGame = () => {
    setQuestionIndex(0);
    setTotalQuestions(questionCount);

    setCurrentQuestion("");
    setCurrentChoices([]);
    setSelectedRanking([]);
    setSubmittedAnswer(false);

    setLastResult(null);
    setTotalScore(0);
    setMaxTotalScore(0);
    setSynchroRate(0);
    setQuestionResults([]);
    setFinished(false);
  };

  const handleRematch = () => {
    if (!socket || !roomCode) return;

    resetLocalGame();
    setReadyToStart(false);

    socket.emit("request_rematch", {
      roomCode,
      gameType: "synchro",
    });

    setPhase("waiting");
  };

  const handleShareX = () => {
    const text = [
      "【ひまQ｜シンクロランキング🤝】",
      `シンクロ率：${synchroRate}%`,
      `結果：${getSynchroLabel(synchroRate)}`,
      "",
      "👇ひまQで遊ぶ",
      "#ひまQ #シンクロランキング #ランキングゲーム",
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

    const onQuestionStart = (payload: SynchroQuestionPayload) => {
      setQuestionIndex(payload.questionIndex);
      setTotalQuestions(payload.totalQuestions);
      setCurrentQuestion(payload.question);
      setCurrentChoices(payload.choices);
      setSelectedRanking([]);
      setSubmittedAnswer(false);
      setLastResult(null);
      setPhase("playing");
    };

    const onRoundResult = (payload: SynchroRoundResultPayload) => {
      setLastResult(payload);
      setTotalScore(payload.totalScore ?? 0);
      setMaxTotalScore(payload.maxTotalScore ?? 0);
      setSynchroRate(payload.synchroRate ?? 0);
      setQuestionResults((prev) => [...prev, payload]);
      setSelectedRanking([]);
      setSubmittedAnswer(false);
      setPhase("reveal");
      setNextReady(false);
      setNextReadyCount(0);
      setNextReadyTotal(displayPlayers.length || playerMaxCount);
    };

    const onGameEnd = (payload: SynchroGameEndPayload) => {
      setTotalScore(payload.totalScore ?? 0);
      setMaxTotalScore(payload.maxTotalScore ?? 0);
      setSynchroRate(payload.synchroRate ?? 0);
      setTotalQuestions(payload.totalQuestions ?? questionCount);

      if (payload.questionResults) {
        setQuestionResults(payload.questionResults);
      }

      setFinished(true);
      setPhase("result");
    };

    const onNextReadyUpdate = ({
      readyCount,
      total,
    }: {
      readyCount: number;
      total: number;
    }) => {
      setNextReadyCount(readyCount);
      setNextReadyTotal(total);
    };

    socket.on("update_room_count", onRoomCount);
    socket.on("both_ready_start", onBothReadyStart);
    socket.on("synchro_question_start", onQuestionStart);
    socket.on("synchro_round_result", onRoundResult);
    socket.on("synchro_game_end", onGameEnd);
    socket.on("synchro_next_ready_update", onNextReadyUpdate);

    return () => {
      socket.off("update_room_count", onRoomCount);
      socket.off("both_ready_start", onBothReadyStart);
      socket.off("synchro_question_start", onQuestionStart);
      socket.off("synchro_round_result", onRoundResult);
      socket.off("synchro_game_end", onGameEnd);
      socket.off("synchro_next_ready_update", onNextReadyUpdate);
    };
  }, [socket, phase, playerMaxCount, questionCount]);

  if (phase === "name") {
    return (
      <>
      <OnlineGameNotice />
      <div className={`${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-xl rounded-3xl border-4 border-black bg-white/85 p-5 shadow-xl backdrop-blur">
          <div className="rounded-3xl border-4 border-black bg-gradient-to-r from-violet-100 via-fuchsia-100 to-yellow-100 px-4 py-5 shadow">
            <p className="text-4xl md:text-5xl font-black text-gray-900">
              🤝 シンクロランキング
            </p>
            <p className="mt-2 text-sm md:text-base font-bold text-gray-700">
              みんなのベスト3はどれだけ合う？
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
      </>
    );
  }

  if (phase === "waiting") {
    return (
      <>
      <OnlineGameNotice />
      <div className={`${theme.page} px-4 py-8 text-center`}>
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
      </>
    );
  }

  if (phase === "ready") {
    return (
      <>
      <OnlineGameNotice />
      <div className={`${theme.page} px-4 py-8 text-center`}>
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
            お題に合わせて1位・2位・3位を選ぼう！順位までそろうと高得点！
          </p>

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
      </>
    );
  }

  return (
    <>
    <OnlineGameNotice />
    <div className={`${theme.page} px-4 py-6 text-center`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 rounded-[32px] border-4 border-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-yellow-300 p-1 shadow-[0_8px_0_rgba(0,0,0,1)]">
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
                    className="h-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-yellow-300"
                    style={{
                      width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-center gap-2 md:mt-0 md:justify-end">
                <div className="min-w-[120px] rounded-2xl border-4 border-black bg-violet-500 px-4 py-2 text-white shadow">
                  <p className="text-xs font-black">🤝シンクロ率</p>
                  <p className="text-2xl font-black">{synchroRate}%</p>
                </div>

                <div className="min-w-[120px] rounded-2xl border-4 border-black bg-yellow-400 px-4 py-2 text-gray-900 shadow">
                  <p className="text-xs font-black">⭐スコア</p>
                  <p className="text-2xl font-black">
                    {totalScore}
                    <span className="text-sm">/{maxTotalScore || "-"}</span>
                  </p>
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
                1位・2位・3位の順番で選ぼう！
              </p>

              <div
                className={`mt-4 rounded-3xl border-4 px-4 py-5 shadow ${theme.questionBox}`}
              >
                <p className="text-2xl md:text-4xl font-extrabold">
                  {currentQuestion || "お題を読み込み中…"}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[0, 1, 2].map((index) => {
                  const choiceId = selectedRanking[index];
                  const hasChoice = !!choiceId;

                  return (
                    <div
                      key={index}
                      className={`
                        rounded-3xl border-4 border-black px-4 py-5 shadow
                        ${
                          index === 0
                            ? "bg-yellow-100"
                            : index === 1
                            ? "bg-violet-100"
                            : "bg-fuchsia-100"
                        }
                      `}
                    >
                      <p className="text-3xl font-black text-gray-900">
                        {rankLabels[index]}
                      </p>

                      <p className="mt-2 min-h-[40px] text-xl md:text-2xl font-extrabold text-gray-900">
                        {hasChoice
                          ? getChoiceText(choiceId)
                          : "まだ未選択"}
                      </p>

                      {hasChoice && (
                        <button
                          onClick={() => handleRemoveRanking(choiceId)}
                          disabled={submittedAnswer}
                          className="mt-3 rounded-full border-2 border-black bg-white px-4 py-1 text-sm font-bold text-gray-700 disabled:opacity-50"
                        >
                          外す
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentChoices.map((choice) => {
                  const selectedIndex = selectedRanking.indexOf(choice.id);
                  const active = selectedIndex >= 0;

                  return (
                    <button
                      key={choice.id}
                      onClick={() => handleSelectChoice(choice.id)}
                      disabled={submittedAnswer || active}
                      className={`
                        rounded-3xl border-4 px-4 py-5 text-2xl md:text-3xl font-extrabold shadow-md transition-all
                        ${
                          active
                            ? theme.choiceActive
                            : "border-black bg-white opacity-90 hover:opacity-100 hover:scale-[1.02]"
                        }
                        ${submittedAnswer ? "cursor-not-allowed" : ""}
                      `}
                    >
                      {active && (
                        <span className="mb-2 block text-base font-black text-violet-700">
                          {rankLabels[selectedIndex]}に選択中
                        </span>
                      )}
                      {choice.text}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col md:flex-row gap-3">
                <button
                  onClick={handleClearRanking}
                  disabled={submittedAnswer || selectedRanking.length === 0}
                  className="w-full rounded-full border-4 border-black bg-white px-6 py-3 text-lg md:text-xl font-extrabold text-gray-800 shadow transition-all hover:scale-105 disabled:opacity-50"
                >
                  選び直す
                </button>

                <button
                  onClick={handleSubmitRanking}
                  disabled={selectedRanking.length !== 3 || submittedAnswer}
                  className={`
                    w-full rounded-full border-4 border-black px-6 py-3 text-lg md:text-xl font-extrabold shadow-lg transition-all
                    ${
                      selectedRanking.length === 3 && !submittedAnswer
                        ? theme.button
                        : "bg-gray-200 text-gray-400"
                    }
                  `}
                >
                  {submittedAnswer ? "みんなの回答待ち…" : "このランキングにする！"}
                </button>
              </div>
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
                今回のシンクロ率 {lastResult.roundRate}%
              </h2>

              <div
                className={`mt-5 rounded-3xl border-4 px-4 py-5 ${theme.questionBox}`}
              >
                <p className="text-xl md:text-3xl font-extrabold">
                  {lastResult.question}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border-4 border-black bg-yellow-100 p-4">
                  <p className="text-sm font-bold text-gray-500">
                    順位まで一致
                  </p>
                  <p className="text-3xl md:text-4xl font-black text-yellow-600">
                    {lastResult.sameRankCount}
                  </p>
                </div>

                <div className="rounded-2xl border-4 border-black bg-violet-100 p-4">
                  <p className="text-sm font-bold text-gray-500">
                    選んだもの一致
                  </p>
                  <p className="text-3xl md:text-4xl font-black text-violet-600">
                    {lastResult.sameItemCount}
                  </p>
                </div>
              </div>

              {myLastRanking.length > 0 && (
                <div className="mt-5 rounded-3xl border-4 border-black bg-white px-4 py-4">
                  <p className="text-xl md:text-2xl font-extrabold text-gray-900">
                    あなたのランキング
                  </p>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {myLastRanking.map((choiceId, index) => (
                      <div
                        key={`${choiceId}-${index}`}
                        className="rounded-2xl border-2 border-black bg-gradient-to-br from-violet-50 to-yellow-50 px-3 py-3"
                      >
                        <p className="text-lg font-black text-violet-600">
                          {rankLabels[index]}
                        </p>
                        <p className="text-xl font-black text-gray-900">
                          {getChoiceText(choiceId, lastResult.choices)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-3xl border-4 border-black bg-white/95 p-4 text-left">
                <p className="text-xl md:text-2xl font-extrabold text-gray-900 text-center">
                  みんなのランキング
                </p>

                <div className="mt-4 space-y-3">
                  {Object.entries(lastResult.answers).map(
                    ([socketId, ranking]) => {
                      const name =
                        socketId === mySocketId
                          ? "あなた"
                          : lastResult.playerNames?.[socketId] ||
                            displayPlayers.find((p) => p.socketId === socketId)
                              ?.playerName ||
                            "プレイヤー";

                      return (
                        <div
                          key={socketId}
                          className="rounded-2xl border-4 border-black bg-gradient-to-r from-violet-50 to-yellow-50 px-4 py-3 shadow"
                        >
                          <p className="text-lg font-black text-gray-900">
                            {name}
                          </p>

                          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                            {ranking.map((choiceId, index) => (
                              <p
                                key={`${socketId}-${choiceId}-${index}`}
                                className="rounded-xl bg-white px-3 py-2 text-sm md:text-base font-bold text-gray-700 border-2 border-black"
                              >
                                {rankLabels[index]}：{" "}
                                {getChoiceText(choiceId, lastResult.choices)}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  if (!socket || !roomCode || nextReady) return;

                  setNextReady(true);

                  socket.emit("synchro_next_question", {
                    roomCode,
                  });
                }}
                disabled={nextReady}
                className={`
                  mt-6 w-full rounded-full border-4 border-black px-6 py-4 text-xl md:text-2xl font-extrabold shadow-lg transition-all
                  ${
                    nextReady
                      ? "bg-gray-200 text-gray-400"
                      : theme.button
                  }
                `}
              >
                {nextReady ? "みんなを待っています…" : "次のランキングに行く！"}
              </button>

              <p className="mt-3 text-sm md:text-base font-bold text-gray-600">
                次へ準備：{nextReadyCount} / {nextReadyTotal}
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
                  <p className="text-sm font-bold text-gray-500">合計スコア</p>
                  <p className="text-3xl md:text-4xl font-black text-violet-600">
                    {totalScore}
                  </p>
                </div>

                <div className="rounded-2xl border-4 border-black bg-white p-4">
                  <p className="text-sm font-bold text-gray-500">最大スコア</p>
                  <p className="text-3xl md:text-4xl font-black text-yellow-600">
                    {maxTotalScore}
                  </p>
                </div>
              </div>

              {questionResults.length > 0 && (
                <div className="mt-6 rounded-3xl border-4 border-black bg-white/90 p-4 text-left">
                  <p className="text-xl md:text-2xl font-extrabold text-gray-900 text-center">
                    お題ごとの結果
                  </p>

                  <div className="mt-4 space-y-3">
                    {questionResults.map((result, index) => (
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

                        <div className="mt-2 grid grid-cols-3 gap-2 text-sm md:text-base font-bold text-gray-700 text-center">
                          <p className="rounded-xl bg-yellow-50 px-3 py-2">
                            順位一致：{result.sameRankCount}
                          </p>
                          <p className="rounded-xl bg-violet-50 px-3 py-2">
                            選択一致：{result.sameItemCount}
                          </p>
                          <p className="rounded-xl bg-fuchsia-50 px-3 py-2">
                            {result.roundRate}%
                          </p>
                        </div>
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
                  onClick={() => router.push("/quiz-synchro")}
                  className={`rounded-xl border-4 border-black px-6 py-3 text-xl font-extrabold shadow-md transition-all ${theme.subButton}`}
                >
                  トップに戻る
                </button>
              </div>

              <RecommendedMultiplayerGames
                title="次はどれで遊ぶ？🎮"
                count={4}
                excludeHref="/quiz-synchro"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {finished && phase !== "result" && null}
      </div>
    </div>
    </>
  );
}