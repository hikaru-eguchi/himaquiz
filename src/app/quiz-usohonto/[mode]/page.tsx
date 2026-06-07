"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedMultiplayerGames from "@/app/components/RecommendedMultiplayerGames";

type UsoHontoPhase =
  | "name"
  | "waiting"
  | "ready"
  | "order"
  | "turnIntro"
  | "talking"
  | "voting"
  | "reveal"
  | "result";

type TruthType = "truth" | "lie";
type VoteChoice = "truth" | "lie";

type Player = {
  socketId: string;
  playerName: string;
};

type UsoHontoTurnStartPayload = {
  turnIndex: number;
  totalTurns: number;
  speaker: Player;
  topic: string;
  instruction?: TruthType;
};

type UsoHontoVotingStartPayload = {
  turnIndex: number;
  totalTurns: number;
  speaker: Player;
  topic: string;
};

type UsoHontoVoteUpdatePayload = {
  votedCount: number;
  totalVoters: number;
};

type UsoHontoRoundResultPayload = {
  turnIndex: number;
  totalTurns: number;
  speaker: Player;
  topic: string;
  truthType: TruthType;
  votes: Record<string, VoteChoice>;
  playerNames?: Record<string, string>;
  correctVoterIds: string[];
  wrongVoterIds: string[];
  speakerPoint: number;
  voterPoint: number;
  scores: Record<string, number>;
};

type UsoHontoGameEndPayload = {
  scores: Record<string, number>;
  players?: Player[];
  results?: UsoHontoRoundResultPayload[];
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

const getTheme = () => {
  return {
    page: "bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_45%,#e11d48_55%,#fb7185_100%)]",
    mainText: "text-purple-700",
    button:
      "bg-gradient-to-r from-blue-600 via-purple-600 to-rose-500 text-white hover:scale-105 hover:brightness-110",
    subButton:
      "bg-gradient-to-r from-blue-100 via-purple-100 to-rose-100 text-gray-800 hover:scale-105 hover:brightness-105",
    questionBox:
      "bg-gradient-to-br from-blue-50 via-white to-rose-50 border-purple-400 text-gray-900",
    truthCard:
      "bg-gradient-to-br from-blue-100 via-white to-cyan-50 border-blue-500 text-blue-700",
    lieCard:
      "bg-gradient-to-br from-rose-100 via-white to-pink-50 border-rose-500 text-rose-700",
  };
};

const getResultLabel = (rank: number) => {
  if (rank === 1) return "心理戦の王者！";
  if (rank === 2) return "見抜き上手！";
  if (rank === 3) return "かなり健闘！";
  return "まだまだ伸びる！";
};

const getTruthLabel = (truthType: TruthType) => {
  return truthType === "truth" ? "ホント" : "ウソ";
};

const getTruthEmoji = (truthType: TruthType) => {
  return truthType === "truth" ? "🟢" : "🔴";
};

const getVoteLabel = (vote: VoteChoice) => {
  return vote === "truth" ? "ホント" : "ウソ";
};

const getVoteEmoji = (vote: VoteChoice) => {
  return vote === "truth" ? "🟢" : "🔴";
};

export default function QuizUsoHontoCodePage() {
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

  const theme = getTheme();

  const [phase, setPhase] = useState<UsoHontoPhase>("name");
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const [roomCode, setRoomCode] = useState("");
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(`0/${playerMaxCount}`);
  const [readyToStart, setReadyToStart] = useState(false);

  const [talkOrder, setTalkOrder] = useState<Player[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [totalTurns, setTotalTurns] = useState(playerMaxCount);
  const [currentSpeaker, setCurrentSpeaker] = useState<Player | null>(null);

  const [topic, setTopic] = useState("");
  const [myInstruction, setMyInstruction] = useState<TruthType | null>(null);

  const [selectedVote, setSelectedVote] = useState<VoteChoice | null>(null);
  const [submittedVote, setSubmittedVote] = useState(false);
  const [votedCount, setVotedCount] = useState(0);
  const [totalVoters, setTotalVoters] = useState(Math.max(0, playerMaxCount - 1));

  const [lastResult, setLastResult] =
    useState<UsoHontoRoundResultPayload | null>(null);
  const [roundResults, setRoundResults] = useState<UsoHontoRoundResultPayload[]>(
    []
  );
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
  const visibleOrder = talkOrder.length > 0 ? talkOrder : displayPlayers;

  const isMyTurn = currentSpeaker?.socketId === mySocketId;

  const ranking = useMemo(() => {
    return displayPlayers
      .map((p) => ({
        ...p,
        score: scores[p.socketId] ?? 0,
      }))
      .sort((a, b) => b.score - a.score);
  }, [displayPlayers, scores]);

  const myScore = mySocketId ? scores[mySocketId] ?? 0 : 0;

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

    const normalizedRoomCode = `usohonto_${code}`;

    setRoomCode(normalizedRoomCode);
    setPhase("waiting");

    joinWithCode(code, String(playerMaxCount), "usohonto");
  };

  const handleStartReady = () => {
    if (!socket || !roomCode) return;

    setReadyToStart(true);

    socket.emit("player_ready", {
      roomCode,
      socketId: mySocketId,
      handicap: 0,
      gameType: "usohonto",
      playerMaxCount,
    });
  };

  const handleTalkFinished = () => {
    if (!socket || !roomCode || !isMyTurn) return;

    socket.emit("usohonto_talk_done", {
      roomCode,
      turnIndex,
    });
  };

  const handleSubmitVote = () => {
    if (!socket || !roomCode || !selectedVote || submittedVote) return;
    if (isMyTurn) return;

    setSubmittedVote(true);

    socket.emit("usohonto_submit_vote", {
      roomCode,
      turnIndex,
      vote: selectedVote,
    });
  };

  const resetLocalGame = () => {
    setTalkOrder([]);
    setTurnIndex(0);
    setTotalTurns(playerMaxCount);
    setCurrentSpeaker(null);

    setTopic("");
    setMyInstruction(null);

    setSelectedVote(null);
    setSubmittedVote(false);
    setVotedCount(0);
    setTotalVoters(Math.max(0, playerMaxCount - 1));

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
      gameType: "usohonto",
    });

    setPhase("waiting");
  };

  const handleShareX = () => {
    const top = ranking[0];
    const text = [
      "【ひまQ｜ウソ？ホント？ゲーム🎭】",
      top
        ? `優勝：${top.playerName}さん（${top.score}点）`
        : `自分の得点：${myScore}点`,
      "その話、信じていいの？",
      "",
      "👇ひまQで遊ぶ",
      "#ひまQ #ウソホントゲーム #トークゲーム",
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
      setPhase("order");
    };

    const onOrderDecided = (payload: { order: Player[] }) => {
      setTalkOrder(payload.order);
      setTotalTurns(payload.order.length);
      setPhase("order");
    };

    const onTurnStart = (payload: UsoHontoTurnStartPayload) => {
      setTurnIndex(payload.turnIndex);
      setTotalTurns(payload.totalTurns);
      setCurrentSpeaker(payload.speaker);
      setTopic(payload.topic);
      setMyInstruction(payload.instruction ?? null);

      setSelectedVote(null);
      setSubmittedVote(false);
      setVotedCount(0);
      setTotalVoters(Math.max(0, payload.totalTurns - 1));
      setLastResult(null);

      setPhase("turnIntro");

      window.setTimeout(() => {
        setPhase("talking");
      }, 1800);
    };

    const onVotingStart = (payload: UsoHontoVotingStartPayload) => {
      setTurnIndex(payload.turnIndex);
      setTotalTurns(payload.totalTurns);
      setCurrentSpeaker(payload.speaker);
      setTopic(payload.topic);

      setSelectedVote(null);
      setSubmittedVote(false);
      setVotedCount(0);
      setTotalVoters(Math.max(0, payload.totalTurns - 1));

      setPhase("voting");
    };

    const onVoteUpdate = (payload: UsoHontoVoteUpdatePayload) => {
      setVotedCount(payload.votedCount);
      setTotalVoters(payload.totalVoters);
    };

    const onRoundResult = (payload: UsoHontoRoundResultPayload) => {
      setLastResult(payload);
      setScores(payload.scores ?? {});
      setRoundResults((prev) => [...prev, payload]);
      setSelectedVote(null);
      setSubmittedVote(false);
      setPhase("reveal");
    };

    const onGameEnd = (payload: UsoHontoGameEndPayload) => {
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
    socket.on("usohonto_order_decided", onOrderDecided);
    socket.on("usohonto_turn_start", onTurnStart);
    socket.on("usohonto_voting_start", onVotingStart);
    socket.on("usohonto_vote_update", onVoteUpdate);
    socket.on("usohonto_round_result", onRoundResult);
    socket.on("usohonto_game_end", onGameEnd);

    return () => {
      socket.off("update_room_count", onRoomCount);
      socket.off("both_ready_start", onBothReadyStart);
      socket.off("usohonto_order_decided", onOrderDecided);
      socket.off("usohonto_turn_start", onTurnStart);
      socket.off("usohonto_voting_start", onVotingStart);
      socket.off("usohonto_vote_update", onVoteUpdate);
      socket.off("usohonto_round_result", onRoundResult);
      socket.off("usohonto_game_end", onGameEnd);
    };
  }, [socket, phase, playerMaxCount]);

  if (phase === "name") {
    return (
      <div className={`min-h-screen ${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-xl rounded-3xl border-4 border-black bg-white/90 p-5 shadow-xl backdrop-blur">
          <div className="rounded-3xl border-4 border-black bg-gradient-to-r from-blue-100 via-purple-100 to-rose-100 px-4 py-5 shadow">
            <p className="text-4xl md:text-5xl font-black text-gray-900">
              🎭 ウソ？ホント？ゲーム
            </p>
            <p className="mt-2 text-sm md:text-base font-bold text-gray-700">
              その話、信じていいの？
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
              className="mt-4 w-full rounded-xl border-4 border-black px-4 py-3 text-xl font-bold outline-none focus:ring-4 focus:ring-purple-300"
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
      <div className={`min-h-screen ${theme.page} px-4 py-8 text-center`}>
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
            話す人はウソかホントをこっそり指示されます。聞く人は見抜いて得点を狙おう！
          </p>

          {/* <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border-4 border-black bg-blue-500 px-4 py-3 text-white">
              <p className="text-2xl font-black">🟢 ホント</p>
              <p className="text-sm font-bold">本当の話で勝負</p>
            </div>

            <div className="rounded-2xl border-4 border-black bg-rose-500 px-4 py-3 text-white">
              <p className="text-2xl font-black">🔴 ウソ</p>
              <p className="text-sm font-bold">だまして得点ゲット</p>
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
    <div className={`min-h-screen ${theme.page} px-4 py-6 text-center`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 rounded-[32px] border-4 border-black bg-gradient-to-r from-blue-600 via-purple-600 to-rose-500 p-1 shadow-[0_8px_0_rgba(0,0,0,1)]">
          <div className="rounded-[28px] bg-white/95 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-2xl md:text-3xl font-black text-gray-900">
                  🎭 ウソ？ホント？ゲーム
                </p>

                {currentSpeaker && (
                  <p className="mt-2 text-lg md:text-xl font-extrabold text-purple-700">
                    {turnIndex + 1}人目：{currentSpeaker.playerName}さん
                  </p>
                )}
              </div>

              <div className="mt-4 flex justify-center gap-2 md:mt-0 md:justify-end">
                <div className="min-w-[120px] rounded-2xl border-4 border-black bg-purple-600 px-4 py-2 text-white shadow">
                  <p className="text-xs font-black">現在</p>
                  <p className="text-2xl font-black">
                    {Math.min(turnIndex + 1, totalTurns)} / {totalTurns}
                  </p>
                </div>

                <div className="min-w-[120px] rounded-2xl border-4 border-black bg-rose-500 px-4 py-2 text-white shadow">
                  <p className="text-xs font-black">あなた</p>
                  <p className="text-2xl font-black">{myScore}点</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {visibleOrder.map((p, index) => {
                const active = p.socketId === currentSpeaker?.socketId;
                const me = p.socketId === mySocketId;

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
                    {index + 1}. {me ? "あなた" : ellipsizeName(p.playerName)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {phase === "order" && (
            <motion.div
              key="order"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border-4 border-black bg-white/95 p-5 shadow-xl"
            >
              <p className="text-lg font-bold text-gray-500">
                トーク順番
              </p>

              <p className="mt-2 text-3xl md:text-5xl font-black text-purple-700">
                この順番で話します！
              </p>

              <div className="mt-5 space-y-3">
                {visibleOrder.map((p, index) => (
                  <div
                    key={p.socketId}
                    className="rounded-2xl border-4 border-black bg-gradient-to-r from-blue-50 via-white to-rose-50 px-4 py-4 shadow"
                  >
                    <p className="text-2xl md:text-3xl font-black text-gray-900">
                      {index + 1}番：{p.playerName}さん
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-gray-600 font-bold animate-pulse">
                まもなく最初のお題が出ます…
              </p>
            </motion.div>
          )}

          {phase === "turnIntro" && currentSpeaker && (
            <motion.div
              key="turnIntro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border-4 border-black bg-white/95 p-5 shadow-xl"
            >
              <p className="text-lg font-bold text-gray-500">
                次に話す人は…
              </p>

              <p className="mt-3 text-4xl md:text-6xl font-black text-purple-700">
                {currentSpeaker.playerName}さん
              </p>

              <div className={`mt-6 rounded-3xl border-4 px-4 py-5 shadow ${theme.questionBox}`}>
                <p className="text-lg font-bold text-gray-500">お題</p>
                <p className="mt-2 text-2xl md:text-4xl font-black">
                  {topic || "お題を読み込み中…"}
                </p>
              </div>
            </motion.div>
          )}

          {phase === "talking" && currentSpeaker && (
            <motion.div
              key="talking"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border-4 border-black bg-white/95 p-5 shadow-xl"
            >
              <p className="text-2xl md:text-4xl font-black text-purple-700">
                トークタイム！
              </p>

              <div className={`mt-4 rounded-3xl border-4 px-4 py-5 shadow ${theme.questionBox}`}>
                <p className="text-lg font-bold text-gray-500">お題</p>
                <p className="mt-2 text-2xl md:text-4xl font-black text-gray-900">
                  {topic}
                </p>
              </div>

              {isMyTurn ? (
                <>
                  <div
                    className={`
                      mt-5 rounded-3xl border-4 px-4 py-6 shadow
                      ${
                        myInstruction === "truth"
                          ? theme.truthCard
                          : theme.lieCard
                      }
                    `}
                  >
                    <p className="text-lg font-bold text-gray-500">
                      あなたへの指示
                    </p>

                    <p className="mt-2 text-3xl md:text-5xl font-black">
                      {myInstruction === "truth"
                        ? "🟢 本当の話をしてください"
                        : "🔴 ウソの話をしてください"}
                    </p>

                    <p className="mt-3 text-sm md:text-base font-bold text-gray-600">
                      この指示は他の人には見えていません
                    </p>
                  </div>

                  <button
                    onClick={handleTalkFinished}
                    className="mt-6 w-full rounded-full border-4 border-black bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 text-2xl md:text-3xl font-black text-white shadow-lg transition-all hover:scale-105"
                  >
                    話し終わった！
                  </button>
                </>
              ) : (
                <>
                  <div className="mt-5 rounded-3xl border-4 border-black bg-gradient-to-br from-gray-50 via-white to-purple-50 px-4 py-6 shadow">
                    <p className="text-lg font-bold text-gray-500">
                      聞く人のミッション
                    </p>

                    <p className="mt-2 text-2xl md:text-4xl font-black text-gray-900">
                      この話はホント？ウソ？
                    </p>

                    <p className="mt-3 text-sm md:text-base font-bold text-gray-600">
                      話し終わったら投票できます
                    </p>
                  </div>

                  <p className="mt-6 text-xl font-bold text-gray-600 animate-pulse">
                    {currentSpeaker.playerName}さんの話を聞いています…
                  </p>
                </>
              )}
            </motion.div>
          )}

          {phase === "voting" && currentSpeaker && (
            <motion.div
              key="voting"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border-4 border-black bg-white/95 p-5 shadow-xl"
            >
              <p className="text-lg md:text-xl font-bold text-gray-500">
                投票タイム
              </p>

              <h2 className="mt-2 text-2xl md:text-4xl font-black text-gray-900">
                {currentSpeaker.playerName}さんの話は…
              </h2>

              <div className={`mt-5 rounded-3xl border-4 px-4 py-5 shadow ${theme.questionBox}`}>
                <p className="text-lg font-bold text-gray-500">お題</p>
                <p className="mt-2 text-xl md:text-3xl font-black">
                  {topic}
                </p>
              </div>

              {isMyTurn ? (
                <div className="mt-5 rounded-3xl border-4 border-black bg-yellow-50 px-4 py-6 shadow">
                  <p className="text-2xl md:text-4xl font-black text-gray-900">
                    みんなの投票待ち…
                  </p>
                  <p className="mt-3 text-lg font-bold text-gray-600">
                    投票：{votedCount} / {totalVoters}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        if (submittedVote) return;
                        setSelectedVote("truth");
                      }}
                      className={`
                        rounded-3xl border-4 px-4 py-8 text-3xl md:text-5xl font-black shadow-md transition-all
                        ${
                          selectedVote === "truth"
                            ? "border-blue-700 bg-blue-100 ring-4 ring-blue-300 scale-[1.03]"
                            : "border-black bg-white hover:scale-[1.02]"
                        }
                      `}
                    >
                      🟢 ホント
                    </button>

                    <button
                      onClick={() => {
                        if (submittedVote) return;
                        setSelectedVote("lie");
                      }}
                      className={`
                        rounded-3xl border-4 px-4 py-8 text-3xl md:text-5xl font-black shadow-md transition-all
                        ${
                          selectedVote === "lie"
                            ? "border-rose-700 bg-rose-100 ring-4 ring-rose-300 scale-[1.03]"
                            : "border-black bg-white hover:scale-[1.02]"
                        }
                      `}
                    >
                      🔴 ウソ
                    </button>
                  </div>

                  <button
                    onClick={handleSubmitVote}
                    disabled={!selectedVote || submittedVote}
                    className={`
                      mt-6 w-full rounded-full border-4 border-black px-6 py-4 text-xl md:text-2xl font-extrabold shadow-lg transition-all
                      ${
                        selectedVote && !submittedVote
                          ? theme.button
                          : "bg-gray-200 text-gray-400"
                      }
                    `}
                  >
                    {submittedVote ? "みんなの投票待ち…" : "投票する！"}
                  </button>

                  <p className="mt-3 text-sm md:text-base font-bold text-gray-600">
                    投票：{votedCount} / {totalVoters}
                  </p>
                </>
              )}
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
                結果発表
              </p>

              <h2 className="mt-2 text-3xl md:text-5xl font-black text-gray-900">
                正解は {getTruthEmoji(lastResult.truthType)}
                {getTruthLabel(lastResult.truthType)}！
              </h2>

              <div className={`mt-5 rounded-3xl border-4 px-4 py-5 shadow ${theme.questionBox}`}>
                <p className="text-lg font-bold text-gray-500">お題</p>
                <p className="mt-2 text-xl md:text-3xl font-black">
                  {lastResult.topic}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl border-4 border-black bg-blue-50 px-4 py-5 shadow">
                  <p className="text-lg font-bold text-gray-500">
                    見抜いた人
                  </p>
                  <p className="mt-2 text-3xl md:text-4xl font-black text-blue-700">
                    {lastResult.correctVoterIds.length}人
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-600">
                    それぞれ +{lastResult.voterPoint}点
                  </p>
                </div>

                <div className="rounded-3xl border-4 border-black bg-rose-50 px-4 py-5 shadow">
                  <p className="text-lg font-bold text-gray-500">
                    だまされた人
                  </p>
                  <p className="mt-2 text-3xl md:text-4xl font-black text-rose-700">
                    {lastResult.wrongVoterIds.length}人
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-600">
                    話した人に +{lastResult.speakerPoint}点
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border-4 border-black bg-white p-4 text-left shadow">
                <p className="text-xl md:text-2xl font-extrabold text-gray-900 text-center">
                  みんなの投票
                </p>

                <div className="mt-4 space-y-3">
                  {Object.entries(lastResult.votes).map(([socketId, vote]) => {
                    const name =
                      socketId === mySocketId
                        ? "あなた"
                        : lastResult.playerNames?.[socketId] ||
                          displayPlayers.find((p) => p.socketId === socketId)
                            ?.playerName ||
                          "プレイヤー";

                    const correct = vote === lastResult.truthType;

                    return (
                      <div
                        key={socketId}
                        className={`
                          rounded-2xl border-4 border-black px-4 py-3 shadow
                          ${
                            correct
                              ? "bg-gradient-to-r from-blue-50 to-cyan-50"
                              : "bg-gradient-to-r from-rose-50 to-pink-50"
                          }
                        `}
                      >
                        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                          <p className="text-lg font-black text-gray-900">
                            {name}
                          </p>

                          <p className="text-lg font-black">
                            {getVoteEmoji(vote)} {getVoteLabel(vote)}
                            <span className="ml-2 text-sm text-gray-600">
                              {correct ? "正解！" : "ハズレ…"}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="mt-5 text-sm md:text-base text-gray-500">
                次の人に進みます…
              </p>
            </motion.div>
          )}

          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border-4 border-black bg-gradient-to-br from-blue-50 via-white to-rose-50 p-5 shadow-xl"
            >
              <p className="text-lg md:text-xl font-bold text-gray-500">
                GAME SET！
              </p>

              <h2 className="mt-2 text-4xl md:text-6xl font-black text-purple-700">
                最終結果
              </h2>

              {ranking[0] && (
                <div className="mt-5 rounded-3xl border-4 border-black bg-gradient-to-br from-yellow-100 via-white to-rose-100 px-4 py-5 shadow">
                  <p className="text-xl font-black text-gray-500">優勝</p>
                  <p className="mt-2 text-4xl md:text-6xl font-black text-gray-900">
                    🏆 {ranking[0].playerName}さん
                  </p>
                  <p className="mt-3 text-2xl md:text-3xl font-black text-purple-700">
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
                          : "bg-gradient-to-r from-blue-50 to-rose-50"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-2xl md:text-3xl font-black text-gray-900">
                        {index === 0 ? "🏆" : `${index + 1}位`}
                      </p>

                      <p className="text-xl md:text-2xl font-black text-purple-700">
                        {player.score}点
                      </p>
                    </div>

                    <p className="mt-2 text-xl md:text-2xl font-black text-gray-900">
                      {player.playerName}さん
                    </p>

                    <p className="mt-1 text-sm md:text-base font-bold text-gray-600">
                      {getResultLabel(index + 1)}
                    </p>
                  </div>
                ))}
              </div>

              {roundResults.length > 0 && (
                <div className="mt-6 rounded-3xl border-4 border-black bg-white/90 p-4 text-left">
                  <p className="text-xl md:text-2xl font-extrabold text-gray-900 text-center">
                    ラウンドごとの結果
                  </p>

                  <div className="mt-4 space-y-3">
                    {roundResults.map((result, index) => (
                      <div
                        key={`${result.speaker.socketId}-${index}`}
                        className="rounded-2xl border-4 border-black bg-white px-4 py-3 shadow"
                      >
                        <p className="text-sm font-black text-purple-600">
                          {index + 1}人目
                        </p>

                        <p className="mt-1 text-base md:text-lg font-extrabold text-gray-900">
                          {result.speaker.playerName}さん：{result.topic}
                        </p>

                        <div className="mt-2 grid grid-cols-3 gap-2 text-sm md:text-base font-bold text-gray-700 text-center">
                          <p className="rounded-xl bg-blue-50 px-3 py-2">
                            正解：{getTruthLabel(result.truthType)}
                          </p>
                          <p className="rounded-xl bg-cyan-50 px-3 py-2">
                            見抜き：{result.correctVoterIds.length}人
                          </p>
                          <p className="rounded-xl bg-rose-50 px-3 py-2">
                            だまされた：{result.wrongVoterIds.length}人
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
                  onClick={() => router.push("/quiz-usohonto")}
                  className={`rounded-xl border-4 border-black px-6 py-3 text-xl font-extrabold shadow-md transition-all ${theme.subButton}`}
                >
                  トップに戻る
                </button>
              </div>

              <RecommendedMultiplayerGames
                title="次はどれで遊ぶ？🎮"
                count={4}
                excludeHref="/quiz-usohonto"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {finished && phase !== "result" && null}
      </div>
    </div>
  );
}
