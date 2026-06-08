"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedMultiplayerGames from "@/app/components/RecommendedMultiplayerGames";

type TimeTalkPhase =
  | "name"
  | "waiting"
  | "ready"
  | "order"
  | "turnIntro"
  | "topicSlot"
  | "target"
  | "countdown"
  | "talking"
  | "turnDone"
  | "result";

type Player = {
  socketId: string;
  playerName: string;
};

type TalkResult = {
  socketId: string;
  playerName: string;
  topic: string;
  mission: string;
  targetSeconds: number;
  actualSeconds: number;
  diffSeconds: number;
  rank: number;
};

type TurnPayload = {
  turnIndex: number;
  totalTurns: number;
  speaker: Player;
};

type TopicPayload = {
  turnIndex: number;
  totalTurns: number;
  speaker: Player;
  topic: string;
  mission: string;
  targetSeconds: number;
};

type TalkStartPayload = {
  startAt?: number;
};

type TurnDonePayload = {
  message?: string;
  nextTurnIndex?: number;
};

type GameEndPayload = {
  results: TalkResult[];
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

const dummyTopics = [
  "最近ちょっと嬉しかったこと",
  "今日ちょっと嫌だったこと",
  "最近笑ったこと",
  "子どもの頃の思い出",
  "もし100万円もらったら",
  "昨日あった小さな事件",
  "好きな食べ物の話",
  "最近びっくりしたこと",
  "人生で一度はやってみたいこと",
  "地味に苦手なもの",
];

const ellipsizeName = (name: string, maxLen = 7) => {
  const chars = Array.from(name);
  if (chars.length <= maxLen) return name;
  return chars.slice(0, maxLen).join("") + "...";
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0.00";
  return seconds.toFixed(2);
};

const getTheme = () => ({
  page: "bg-gradient-to-b from-emerald-300 via-teal-200 to-lime-100",
  mainText: "text-emerald-700",
  button:
    "bg-gradient-to-r from-emerald-500 via-teal-500 to-lime-400 text-white hover:scale-105 hover:brightness-110",
  subButton:
    "bg-gradient-to-r from-emerald-50 via-teal-50 to-lime-50 text-gray-800 hover:scale-105 hover:brightness-105",
  panel: "bg-white/90 border-black",
  accentPanel:
    "bg-gradient-to-br from-emerald-50 via-white to-lime-50 border-emerald-400 text-gray-900",
});

const getStopComment = () => {
  const comments = [
    "なかなかいいタイムだ…！",
    "これは近いかもしれない…！",
    "絶妙なところで止めた！",
    "勝負は結果発表までおあずけ！",
    "今の体感、かなり良さそう！",
  ];

  return comments[Math.floor(Math.random() * comments.length)];
};

export default function QuizTimeTalkCodePage() {
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

  const [phase, setPhase] = useState<TimeTalkPhase>("name");
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
  const [mission, setMission] = useState("");
  const [slotTopic, setSlotTopic] = useState("お題を決めよう！");
  const [targetSeconds, setTargetSeconds] = useState(30);

  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [talkStartAt, setTalkStartAt] = useState<number | null>(null);
  const [stopped, setStopped] = useState(false);
  const [stopComment, setStopComment] = useState("");

  const [results, setResults] = useState<TalkResult[]>([]);
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
  const isMyTurn = currentSpeaker?.socketId === mySocketId;

  const winner = results.length > 0 ? results[0] : null;

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

    const normalizedRoomCode = `timetalk_${code}`;
    setRoomCode(normalizedRoomCode);
    setPhase("waiting");

    joinWithCode(code, String(playerMaxCount), "timetalk");
  };

  const handleStartReady = () => {
    if (!socket || !roomCode) return;

    setReadyToStart(true);

    socket.emit("player_ready", {
      roomCode,
      socketId: mySocketId,
      handicap: 0,
      gameType: "timetalk",
      playerMaxCount,
    });
  };

  const handleDecideTopic = () => {
    if (!socket || !roomCode || !currentSpeaker || !isMyTurn) return;

    socket.emit("timetalk_decide_topic", {
      roomCode,
      turnIndex,
      speakerSocketId: currentSpeaker.socketId,
    });
  };

  const handleTalkReady = () => {
    if (!socket || !roomCode || !isMyTurn) return;

    socket.emit("timetalk_start_talk", {
      roomCode,
      turnIndex,
    });
  };

  const handleStopTalk = () => {
    if (!socket || !roomCode || !isMyTurn || stopped) return;

    setStopped(true);
    setStopComment(getStopComment());

    socket.emit("timetalk_stop_talk", {
      roomCode,
      turnIndex,
      stoppedAt: Date.now(),
    });
  };

  const resetLocalGame = () => {
    setTalkOrder([]);
    setTurnIndex(0);
    setTotalTurns(playerMaxCount);
    setCurrentSpeaker(null);

    setTopic("");
    setSlotTopic("お題を決めよう！");
    setTargetSeconds(30);

    setCountdown(3);
    setElapsed(0);
    setTalkStartAt(null);
    setStopped(false);
    setStopComment("");

    setResults([]);
    setFinished(false);
  };

  const handleRematch = () => {
    if (!socket || !roomCode) return;

    resetLocalGame();
    setReadyToStart(false);

    socket.emit("request_rematch", {
      roomCode,
      gameType: "timetalk",
    });

    setPhase("waiting");
  };

  const handleShareX = () => {
    const text = [
      "【ひまQ｜タイムトーク⏱️】",
      winner
        ? `優勝：${winner.playerName}さん（誤差${formatTime(
            winner.diffSeconds
          )}秒）`
        : "目標タイムぴったりを目指して遊んだよ！",
      "",
      "👇ひまQで遊ぶ",
      "#ひまQ #タイムトーク #トークゲーム",
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

    const onOrderDecided = (payload: { order: Player[] }) => {
      setTalkOrder(payload.order);
      setTotalTurns(payload.order.length);
      setPhase("order");

      setTimeout(() => {
        const first = payload.order[0];

        if (first) {
          setCurrentSpeaker(first);
          setTurnIndex(0);
          setPhase("turnIntro");
        }
      }, 3500);
    };

    const onTurnStart = (payload: TurnPayload) => {
      setTurnIndex(payload.turnIndex);
      setTotalTurns(payload.totalTurns);
      setCurrentSpeaker(payload.speaker);

      setTopic("");
      setSlotTopic("お題を決めよう！");
      setElapsed(0);
      setTalkStartAt(null);
      setStopped(false);
      setStopComment("");
      setCountdown(3);

      setPhase("turnIntro");
    };

    const onTopicDecided = (payload: TopicPayload) => {
      setTurnIndex(payload.turnIndex);
      setTotalTurns(payload.totalTurns);
      setCurrentSpeaker(payload.speaker);
      setTopic(payload.topic);
      setMission(payload.mission);
      setTargetSeconds(payload.targetSeconds);

      setPhase("topicSlot");

      let count = 0;
      const slotTimer = window.setInterval(() => {
        const randomTopic =
          dummyTopics[Math.floor(Math.random() * dummyTopics.length)];

        setSlotTopic(randomTopic);
        count += 1;

        if (count >= 24) {
          window.clearInterval(slotTimer);
          setSlotTopic(payload.topic);

          window.setTimeout(() => {
            setPhase("target");
          }, 900);
        }
      }, 110);
    };

    const onTalkStart = (payload: TalkStartPayload) => {
      setCountdown(3);
      setPhase("countdown");

      let n = 3;
      const countdownTimer = window.setInterval(() => {
        n -= 1;

        if (n <= 0) {
          window.clearInterval(countdownTimer);

          const startAt = payload.startAt ?? Date.now();
          setTalkStartAt(startAt);
          setElapsed(0);
          setStopped(false);
          setPhase("talking");
        } else {
          setCountdown(n);
        }
      }, 1000);
    };

    const onTurnDone = (payload: TurnDonePayload) => {
      setStopped(true);
      setStopComment(payload.message || getStopComment());
      setPhase("turnDone");
    };

    const onGameEnd = (payload: GameEndPayload) => {
      const sorted = [...(payload.results || [])].sort(
        (a, b) => a.diffSeconds - b.diffSeconds
      );

      setResults(
        sorted.map((result, index) => ({
          ...result,
          rank: index + 1,
        }))
      );

      setFinished(true);
      setPhase("result");
    };

    socket.on("update_room_count", onRoomCount);
    socket.on("timetalk_order_decided", onOrderDecided);
    socket.on("timetalk_turn_start", onTurnStart);
    socket.on("timetalk_topic_decided", onTopicDecided);
    socket.on("timetalk_talk_start", onTalkStart);
    socket.on("timetalk_turn_done", onTurnDone);
    socket.on("timetalk_game_end", onGameEnd);

    return () => {
      socket.off("update_room_count", onRoomCount);
      socket.off("timetalk_order_decided", onOrderDecided);
      socket.off("timetalk_turn_start", onTurnStart);
      socket.off("timetalk_topic_decided", onTopicDecided);
      socket.off("timetalk_talk_start", onTalkStart);
      socket.off("timetalk_turn_done", onTurnDone);
      socket.off("timetalk_game_end", onGameEnd);
    };
  }, [socket, phase, playerMaxCount, roomCode]);

  useEffect(() => {
    if (phase !== "talking" || !talkStartAt || stopped) return;

    const timer = window.setInterval(() => {
      setElapsed((Date.now() - talkStartAt) / 1000);
    }, 30);

    return () => window.clearInterval(timer);
  }, [phase, talkStartAt, stopped]);

  if (phase === "name") {
    return (
      <div className={`${theme.page} px-4 py-8 text-center`}>
        <div className="mx-auto max-w-xl rounded-3xl border-4 border-black bg-white/90 p-5 shadow-xl backdrop-blur">
          <div className="rounded-3xl border-4 border-black bg-gradient-to-r from-emerald-100 via-white to-lime-100 px-4 py-5 shadow">
            <p className="text-4xl md:text-5xl font-black text-gray-900">
              ⏱️ タイムトーク
            </p>
            <p className="mt-2 text-sm md:text-base font-bold text-gray-700">
              お題について話して、目標タイムぴったりを目指そう！
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
                const found = bannedWords.some((word) =>
                  lower.includes(word)
                );

                setNameError(found ? "不適切な言葉は使えません" : null);
              }}
              maxLength={10}
              className="mt-4 w-full rounded-xl border-4 border-black px-4 py-3 text-xl font-bold outline-none focus:ring-4 focus:ring-emerald-300"
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
            ランダムで順番とお題が決まります。目標タイムに一番近い人が優勝！
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
    );
  }

  return (
    <div className={`${theme.page} px-4 py-6 text-center`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 rounded-[32px] border-4 border-black bg-gradient-to-r from-emerald-400 via-teal-400 to-lime-300 p-1 shadow-[0_8px_0_rgba(0,0,0,1)]">
          <div className="rounded-[28px] bg-white/95 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-2xl md:text-3xl font-black text-gray-900">
                  ⏱️ タイムトーク
                </p>

                {currentSpeaker && (
                  <p className="mt-2 text-lg md:text-xl font-extrabold text-emerald-700">
                    {turnIndex + 1}人目：{currentSpeaker.playerName}さん
                  </p>
                )}
              </div>

              <div className="mt-4 flex justify-center gap-2 md:mt-0 md:justify-end">
                <div className="min-w-[120px] rounded-2xl border-4 border-black bg-emerald-500 px-4 py-2 text-white shadow">
                  <p className="text-xs font-black">現在</p>
                  <p className="text-2xl font-black">
                    {Math.min(turnIndex + 1, totalTurns)} / {totalTurns}
                  </p>
                </div>

                <div className="min-w-[120px] rounded-2xl border-4 border-black bg-lime-500 px-4 py-2 text-white shadow">
                  <p className="text-xs font-black">目標</p>
                  <p className="text-2xl font-black">{targetSeconds}秒</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {(talkOrder.length > 0 ? talkOrder : displayPlayers).map(
                (p, index) => {
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
                }
              )}
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
              className={`rounded-3xl border-4 ${theme.panel} p-5 shadow-xl`}
            >
              <p className="text-lg font-bold text-gray-500">
                トーク順番はこれ！
              </p>

              <div className="mt-5 space-y-3">
                {talkOrder.map((p, index) => (
                  <div
                    key={p.socketId}
                    className="rounded-2xl border-4 border-black bg-gradient-to-r from-emerald-50 to-lime-50 px-4 py-4 shadow"
                  >
                    <p className="text-2xl md:text-3xl font-black text-gray-900">
                      {index + 1}番：{p.playerName}さん
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-gray-600 font-bold">
                まもなく1人目のトークが始まります…
              </p>
            </motion.div>
          )}

          {phase === "turnIntro" && currentSpeaker && (
            <motion.div
              key="turnIntro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`rounded-3xl border-4 ${theme.panel} p-5 shadow-xl`}
            >
              <p className="text-lg font-bold text-gray-500">
                次に話す人は…
              </p>

              <p className="mt-3 text-4xl md:text-6xl font-black text-emerald-700">
                {currentSpeaker.playerName}さん
              </p>

              <div className={`mt-6 rounded-3xl border-4 px-4 py-5 ${theme.accentPanel}`}>
                <p className="text-2xl md:text-4xl font-black">
                  お題を決めよう！
                </p>
              </div>

              {isMyTurn ? (
                // <button
                //   onClick={handleDecideTopic}
                //   className={`mt-6 rounded-full border-4 border-black px-8 py-4 text-2xl font-extrabold shadow-lg transition-all ${theme.button}`}
                // >
                //   🎰 お題ルーレットを回す！
                // </button>
                <p className="mt-6 text-xl font-bold text-gray-600 animate-pulse">
                  🎰 お題ルーレットが回ります…
                </p>
              ) : (
                <p className="mt-6 text-xl font-bold text-gray-600 animate-pulse">
                  {currentSpeaker.playerName}さんがお題を決めています…
                </p>
              )}
            </motion.div>
          )}

          {phase === "topicSlot" && (
            <motion.div
              key="topicSlot"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`rounded-3xl border-4 ${theme.panel} p-5 shadow-xl`}
            >
              <p className="text-xl md:text-2xl font-black text-emerald-700 animate-pulse">
                🎰 お題ルーレット中！
              </p>

              <div className="mt-6 rounded-3xl border-4 border-black bg-gradient-to-br from-emerald-50 via-white to-lime-50 px-4 py-10 shadow-inner">
                <p className="text-3xl md:text-5xl font-black text-gray-900">
                  {slotTopic}
                </p>
              </div>
            </motion.div>
          )}

          {phase === "target" && (
            <motion.div
              key="target"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`rounded-3xl border-4 ${theme.panel} p-5 shadow-xl`}
            >
              <p className="text-lg font-bold text-gray-500">今回のお題</p>

              <div className={`mt-4 rounded-3xl border-4 px-4 py-5 ${theme.accentPanel}`}>
                <p className="text-2xl md:text-4xl font-black">
                  {topic}
                </p>
              </div>

              <div className="mt-4 rounded-3xl border-4 border-black bg-gradient-to-br from-yellow-50 via-white to-emerald-50 px-4 py-5 shadow">
                <p className="text-lg font-bold text-gray-500">ミッション</p>
                <p className="mt-2 text-2xl md:text-4xl font-black text-orange-600">
                  {mission}
                </p>
              </div>

              <p className="mt-6 text-xl font-bold text-gray-500">
                目標タイムは…
              </p>

              <p className="mt-2 text-6xl md:text-8xl font-black text-emerald-600">
                {targetSeconds}秒
              </p>

              {isMyTurn ? (
                <button
                  onClick={handleTalkReady}
                  className={`mt-6 rounded-full border-4 border-black px-8 py-4 text-2xl font-extrabold shadow-lg transition-all ${theme.button}`}
                >
                  準備OK！スタートする
                </button>
              ) : (
                <p className="mt-6 text-xl font-bold text-gray-600 animate-pulse">
                  トーク開始を待っています…
                </p>
              )}
            </motion.div>
          )}

          {phase === "countdown" && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-3xl border-4 ${theme.panel} p-8 shadow-xl`}
            >
              <p className="text-xl md:text-2xl font-black text-gray-700">
                トークの準備はいい？
              </p>

              <p className="mt-6 text-8xl md:text-9xl font-black text-emerald-600">
                {countdown}
              </p>
            </motion.div>
          )}

          {phase === "talking" && (
            <motion.div
              key="talking"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`rounded-3xl border-4 ${theme.panel} p-5 shadow-xl`}
            >
              <p className="text-2xl md:text-4xl font-black text-emerald-700">
                トークスタート！
              </p>

              <div className={`mt-4 rounded-3xl border-4 px-4 py-5 ${theme.accentPanel}`}>
                <p className="text-lg font-bold text-gray-500">お題</p>
                <p className="mt-2 text-2xl md:text-4xl font-black text-gray-900">
                  {topic}
                </p>
              </div>

              <div className="mt-4 rounded-3xl border-4 border-black bg-gradient-to-br from-yellow-50 via-white to-emerald-50 px-4 py-5 shadow">
                <p className="text-lg font-bold text-gray-500">ミッション</p>
                <p className="mt-2 text-2xl md:text-4xl font-black text-orange-600">
                  {mission}
                </p>
              </div>

              <div className="mt-5 rounded-3xl border-4 border-black bg-white px-4 py-5 shadow">
                <p className="text-sm font-black text-gray-500">
                  目標タイム
                </p>
                <p className="text-4xl md:text-6xl font-black text-lime-600">
                  {targetSeconds}秒
                </p>
              </div>

              <div className="mt-5 rounded-3xl border-4 border-black bg-gray-900 px-4 py-6 text-white shadow">
                {!isMyTurn ? (
                  <>
                    <p className="text-sm font-black text-white/60">
                      聞いている人にはタイマーが見えるよ
                    </p>
                    <p className="mt-2 text-6xl md:text-8xl font-black tabular-nums">
                      {formatTime(elapsed)}
                    </p>
                    <p className="mt-3 text-sm md:text-base font-bold text-white/70">
                      話している人には3秒後から見えていません
                    </p>
                  </>
                ) : elapsed <= 3 ? (
                  <>
                    <p className="text-sm font-black text-white/60">
                      最初の3秒だけタイマーが見えるよ
                    </p>
                    <p className="mt-2 text-6xl md:text-8xl font-black tabular-nums">
                      {formatTime(elapsed)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl md:text-3xl font-black">
                      タイマーは隠れた！
                    </p>
                    <p className="mt-3 text-sm md:text-base font-bold text-white/70">
                      体感で目標タイムを狙おう
                    </p>
                  </>
                )}
              </div>

              {isMyTurn ? (
                <button
                  onClick={handleStopTalk}
                  disabled={stopped}
                  className={`
                    mt-6 w-full rounded-full border-4 border-black px-6 py-5 text-2xl md:text-3xl font-black shadow-lg transition-all
                    ${
                      stopped
                        ? "bg-gray-200 text-gray-400"
                        : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:scale-105"
                    }
                  `}
                >
                  トーク終了！
                </button>
              ) : (
                <p className="mt-6 text-xl font-bold text-gray-600">
                  {currentSpeaker?.playerName}さんのトーク中…
                </p>
              )}
            </motion.div>
          )}

          {phase === "turnDone" && (
            <motion.div
              key="turnDone"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`rounded-3xl border-4 ${theme.panel} p-6 shadow-xl`}
            >
              <p className="text-4xl md:text-6xl font-black text-emerald-700">
                STOP！
              </p>

              <p className="mt-5 rounded-3xl border-4 border-black bg-gradient-to-br from-emerald-50 via-white to-lime-50 px-4 py-5 text-2xl md:text-4xl font-black text-gray-900">
                {stopComment || "なかなかいいタイムだ…！"}
              </p>

              <p className="mt-5 text-base md:text-lg font-bold text-gray-600">
                タイムは最後の結果発表まで秘密です
              </p>

              <p className="mt-3 text-sm md:text-base text-gray-500">
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
              className="rounded-3xl border-4 border-black bg-white/95 p-5 shadow-xl"
            >
              <p className="text-lg md:text-xl font-bold text-gray-500">
                GAME SET！
              </p>

              <h2 className="mt-2 text-4xl md:text-6xl font-black text-emerald-700">
                結果発表
              </h2>

              {winner && (
                <div className="mt-5 rounded-3xl border-4 border-black bg-gradient-to-br from-yellow-100 via-white to-lime-100 px-4 py-5 shadow">
                  <p className="text-xl font-black text-gray-500">優勝</p>
                  <p className="mt-2 text-4xl md:text-6xl font-black text-gray-900">
                    🏆 {winner.playerName}さん
                  </p>
                  <p className="mt-3 text-2xl md:text-3xl font-black text-emerald-700">
                    誤差 {formatTime(winner.diffSeconds)}秒
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-4">
                {results.map((result) => (
                  <div
                    key={result.socketId}
                    className={`
                      rounded-3xl border-4 border-black px-4 py-4 shadow text-left
                      ${
                        result.rank === 1
                          ? "bg-yellow-50"
                          : "bg-gradient-to-r from-emerald-50 to-lime-50"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-2xl md:text-3xl font-black text-gray-900">
                        {result.rank === 1 ? "🏆" : `${result.rank}位`}
                      </p>

                      <p className="text-xl md:text-2xl font-black text-emerald-700">
                        誤差 {formatTime(result.diffSeconds)}秒
                      </p>
                    </div>

                    <p className="mt-2 text-xl md:text-2xl font-black text-gray-900">
                      {result.playerName}さん
                    </p>

                    <p className="mt-2 text-sm md:text-base font-bold text-gray-600">
                      お題：{result.topic}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-2xl border-2 border-black bg-white px-3 py-2">
                        <p className="text-xs font-black text-gray-500">
                          目標
                        </p>
                        <p className="text-xl font-black">
                          {result.targetSeconds}秒
                        </p>
                      </div>

                      <div className="rounded-2xl border-2 border-black bg-white px-3 py-2">
                        <p className="text-xs font-black text-gray-500">
                          実タイム
                        </p>
                        <p className="text-xl font-black">
                          {formatTime(result.actualSeconds)}秒
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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
                  onClick={() => router.push("/quiz-timetalk")}
                  className={`rounded-xl border-4 border-black px-6 py-3 text-xl font-extrabold shadow-md transition-all ${theme.subButton}`}
                >
                  トップに戻る
                </button>
              </div>

              <RecommendedMultiplayerGames
                title="次はどれで遊ぶ？🎮"
                count={4}
                excludeHref="/quiz-timetalk"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {finished && phase !== "result" && null}
      </div>
    </div>
  );
}